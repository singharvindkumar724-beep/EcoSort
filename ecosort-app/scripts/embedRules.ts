/**
 * Embed Rules Script
 * Generates pgvector embeddings for all waste rules that don't yet have one.
 *
 * Run with: npm run embed:rules
 *
 * This must be run AFTER:
 * 1. `npm run db:push` (schema deployed)
 * 2. `npm run db:seed` (rules inserted)
 * 3. WATSONX_API_KEY and WATSONX_PROJECT_ID are set in .env.local
 */

import { config } from "dotenv";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Load environment
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const DATABASE_URL = process.env.DATABASE_URL;
const WATSONX_API_KEY = process.env.WATSONX_API_KEY;
const WATSONX_PROJECT_ID = process.env.WATSONX_PROJECT_ID;
const WATSONX_BASE_URL =
  process.env.WATSONX_BASE_URL ?? "https://us-south.ml.cloud.ibm.com";
const WATSONX_IAM_URL =
  process.env.WATSONX_IAM_URL ?? "https://iam.cloud.ibm.com/identity/token";
const EMBED_MODEL_ID =
  process.env.WATSONX_EMBED_MODEL_ID ?? "ibm/slate-125m-english-rtrvr";
const EMBED_DIMENSION = parseInt(process.env.WATSONX_EMBED_DIMENSION ?? "768", 10);

// ── Validation ────────────────────────────────────────────────────────────────

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in .env.local");
  process.exit(1);
}
if (!WATSONX_API_KEY || !WATSONX_PROJECT_ID) {
  console.error("❌ WATSONX_API_KEY and WATSONX_PROJECT_ID must be set in .env.local");
  process.exit(1);
}

// ── Prisma Setup ──────────────────────────────────────────────────────────────

const pool = new Pool({ connectionString: DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ── IAM Token ─────────────────────────────────────────────────────────────────

async function getToken(): Promise<string> {
  const res = await fetch(WATSONX_IAM_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: WATSONX_API_KEY!,
    }),
  });
  if (!res.ok) throw new Error(`IAM error: ${await res.text()}`);
  const data = await res.json() as { access_token: string };
  return data.access_token;
}

// ── Batch Embeddings ──────────────────────────────────────────────────────────

async function embedBatch(texts: string[], token: string): Promise<number[][]> {
  const url = new URL(`${WATSONX_BASE_URL}/ml/v1/text/embeddings`);
  url.searchParams.set("version", "2023-05-29");

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model_id: EMBED_MODEL_ID,
      project_id: WATSONX_PROJECT_ID,
      inputs: texts,
      parameters: { truncate_input_tokens: 512 },
    }),
  });

  if (!res.ok) throw new Error(`Embedding error: ${await res.text()}`);
  const data = await res.json() as { results: Array<{ embedding: number[] }> };
  return data.results.map((r) => r.embedding);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔢 EcoSort — Generating pgvector Embeddings for Waste Rules\n");

  // Fetch all rules without embeddings using raw SQL since Unsupported types can't be queried natively
  const rawMissing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM waste_rules WHERE embedding IS NULL
  `;

  if (rawMissing.length === 0) {
    console.log("✅ All waste rules already have embeddings.");
    return;
  }

  const unembeddedRules = await prisma.wasteRule.findMany({
    where: { id: { in: rawMissing.map((r) => r.id) } },
    select: {
      id: true,
      itemName: true,
      aliases: true,
      disposalInstructions: true,
    },
  });

  console.log(`📋 Found ${unembeddedRules.length} rules without embeddings.\n`);

  // Get IAM token
  const token = await getToken();
  console.log("✅ IBM IAM token acquired.\n");

  // Process in batches of 10 (watsonx API limit)
  const BATCH_SIZE = 10;
  let processed = 0;
  let failed = 0;

  for (let i = 0; i < unembeddedRules.length; i += BATCH_SIZE) {
    const batch = unembeddedRules.slice(i, i + BATCH_SIZE);
    const texts = batch.map((r) => {
      const aliasText =
        r.aliases.length > 0 ? ` (also known as: ${r.aliases.join(", ")})` : "";
      return `Item: ${r.itemName}${aliasText}\nDisposal: ${r.disposalInstructions}`;
    });

    try {
      const embeddings = await embedBatch(texts, token);

      // Validate dimension
      for (const emb of embeddings) {
        if (emb.length !== EMBED_DIMENSION) {
          throw new Error(
            `Dimension mismatch: expected ${EMBED_DIMENSION}, got ${emb.length}`
          );
        }
      }

      // Update each rule with its embedding using raw SQL (pgvector type)
      for (let j = 0; j < batch.length; j++) {
        const rule = batch[j];
        const embedding = embeddings[j];
        const vectorStr = `[${embedding.join(",")}]`;

        await prisma.$executeRaw`
          UPDATE waste_rules
          SET embedding = ${vectorStr}::vector
          WHERE id = ${rule.id}
        `;

        processed++;
        console.log(
          `  ✅ [${processed}/${unembeddedRules.length}] ${rule.itemName}`
        );
      }
    } catch (error) {
      failed += batch.length;
      console.error(`  ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error);
    }

    // Small delay between batches to respect rate limits
    if (i + BATCH_SIZE < unembeddedRules.length) {
      await new Promise((r) => setTimeout(r, 500));
    }
  }

  console.log(`\n🎉 Embedding complete!`);
  console.log(`   ✅ Processed: ${processed}`);
  if (failed > 0) console.log(`   ❌ Failed: ${failed}`);
  console.log(`\nYour RAG knowledge base is ready for vector similarity search.`);
}

main()
  .catch((e) => {
    console.error("❌ Embedding script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
