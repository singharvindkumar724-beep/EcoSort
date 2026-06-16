/**
 * RAG Retrieval Module
 * Finds the most relevant waste disposal rules using pgvector cosine similarity.
 *
 * Uses raw SQL via Prisma's $queryRaw for the vector <=> operator
 * (pgvector cosine distance, not natively supported in Prisma's query builder yet).
 */

import { prisma } from "@/lib/db/prisma";
import { embedText } from "@/lib/ai/embed";
import { WasteCategory, type WasteRule } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RetrievedRule {
  id: string;
  itemName: string;
  category: WasteCategory;
  disposalInstructions: string;
  tips: string | null;
  isRecyclable: boolean;
  source: string | null;
  /** Cosine similarity score (0.0 = identical, 2.0 = opposite) */
  distance: number;
  /** Normalized similarity (1 - distance/2) for human-readable 0–1 scale */
  similarity: number;
}

export interface RetrievalResult {
  rules: RetrievedRule[];
  /** Whether retrieval found high-confidence results */
  isHighConfidence: boolean;
  /** Query text that was embedded */
  queryText: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOP_K = parseInt(process.env.RAG_TOP_K ?? "5", 10);
// Cosine distance threshold (lower = more similar; 0 = identical)
// Distance < 0.3 is considered high confidence
const HIGH_CONFIDENCE_DISTANCE = 0.3;

// ─── Retrieval Function ───────────────────────────────────────────────────────

/**
 * Retrieves the most relevant waste rules for a given query using
 * pgvector cosine similarity search.
 *
 * @param query - Text query (item name, description, or user message)
 * @param localityId - Filter results to a specific locality
 * @param topK - Number of results to return (defaults to RAG_TOP_K env var)
 */
export async function retrieveRelevantRules(
  query: string,
  localityId: string,
  topK: number = TOP_K
): Promise<RetrievalResult> {
  // Step 1: Embed the query
  const queryEmbedding = await embedText(query);
  const vectorStr = `[${queryEmbedding.join(",")}]`;

  // Step 2: Raw SQL cosine similarity search using pgvector <=> operator
  // <=> = cosine distance (0 = identical, 2 = opposite directions)
  const rawResults = await prisma.$queryRaw<
    Array<{
      id: string;
      itemName: string;
      category: string;
      disposalInstructions: string;
      tips: string | null;
      isRecyclable: boolean;
      source: string | null;
      distance: number;
    }>
  >`
    SELECT
      id,
      "itemName",
      category::text,
      "disposalInstructions",
      tips,
      "isRecyclable",
      source,
      (embedding <=> CAST(${vectorStr} AS vector)) AS distance
    FROM waste_rules
    WHERE
      "localityId" = ${localityId}
      AND embedding IS NOT NULL
    ORDER BY distance ASC
    LIMIT ${topK}
  `;

  // Step 3: Map and normalize results
  const rules: RetrievedRule[] = rawResults.map((row) => ({
    id: row.id,
    itemName: row.itemName,
    category: row.category as WasteCategory,
    disposalInstructions: row.disposalInstructions,
    tips: row.tips,
    isRecyclable: row.isRecyclable,
    source: row.source,
    distance: row.distance,
    // Normalize cosine distance [0, 2] to similarity [0, 1]
    similarity: Math.max(0, 1 - row.distance / 2),
  }));

  // Step 4: Determine if retrieval is high-confidence
  const bestDistance = rules[0]?.distance ?? Infinity;
  const isHighConfidence = bestDistance < HIGH_CONFIDENCE_DISTANCE;

  return {
    rules,
    isHighConfidence,
    queryText: query,
  };
}

/**
 * Retrieves rules by category (non-vector, fallback path).
 * Used when embeddings are not yet generated for rules.
 */
export async function retrieveRulesByCategory(
  category: WasteCategory,
  localityId: string,
  limit = 3
): Promise<WasteRule[]> {
  return prisma.wasteRule.findMany({
    where: { category, localityId },
    take: limit,
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Gets the Varanasi locality ID (cached after first lookup).
 * Convenience function for single-city MVP.
 */
let _varanasiId: string | null = null;

export async function getVaranasiLocalityId(): Promise<string> {
  if (_varanasiId) return _varanasiId;

  const locality = await prisma.locality.findUnique({
    where: { name: "Varanasi" },
    select: { id: true },
  });

  if (!locality) {
    throw new Error(
      "Varanasi locality not found in database. Run `npm run db:seed` first."
    );
  }

  _varanasiId = locality.id;
  return _varanasiId;
}
