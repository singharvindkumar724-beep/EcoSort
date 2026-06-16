/**
 * Embeddings Module
 * Generates text embeddings via IBM watsonx for RAG vector search.
 * Model: ibm/slate-125m-english-rtrvr → 768-dimensional vectors
 *
 * DIMENSION LOCK: vector(768) is hardcoded in schema.prisma.
 * DO NOT change WATSONX_EMBED_MODEL_ID to a model with different output
 * dimensions without running a full re-migration + re-embedding of all rules.
 */

import { generateEmbeddings } from "./watsonxClient";

const EMBED_MODEL_ID =
  process.env.WATSONX_EMBED_MODEL_ID ?? "ibm/slate-125m-english-rtrvr";

const EMBED_DIMENSION = parseInt(
  process.env.WATSONX_EMBED_DIMENSION ?? "768",
  10
);

/**
 * Embeds a single text string.
 * @returns 768-dimensional float array
 */
export async function embedText(text: string): Promise<number[]> {
  const results = await generateEmbeddings({
    modelId: EMBED_MODEL_ID,
    inputs: [text],
  });

  const embedding = results[0];
  if (!embedding || embedding.length !== EMBED_DIMENSION) {
    throw new Error(
      `Embedding dimension mismatch: expected ${EMBED_DIMENSION}, got ${embedding?.length ?? 0}. ` +
        `Check WATSONX_EMBED_MODEL_ID and WATSONX_EMBED_DIMENSION env vars.`
    );
  }

  return embedding;
}

/**
 * Embeds multiple texts in a single API call (batch).
 * More efficient than calling embedText() in a loop.
 * @returns Array of 768-dimensional float arrays
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const results = await generateEmbeddings({
    modelId: EMBED_MODEL_ID,
    inputs: texts,
  });

  if (results.length !== texts.length) {
    throw new Error(
      `Embedding batch size mismatch: sent ${texts.length} inputs, got ${results.length} embeddings`
    );
  }

  return results;
}

/**
 * Formats text for embedding — combines item name and disposal instructions
 * for richer semantic search matching.
 */
export function formatRuleForEmbedding(
  itemName: string,
  disposalInstructions: string,
  aliases: string[] = []
): string {
  const aliasText = aliases.length > 0 ? ` (also known as: ${aliases.join(", ")})` : "";
  return `Item: ${itemName}${aliasText}\nDisposal: ${disposalInstructions}`.trim();
}
