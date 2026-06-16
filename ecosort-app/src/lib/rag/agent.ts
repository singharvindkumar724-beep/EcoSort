/**
 * Agentic RAG Workflow
 *
 * Implements the two-step agentic flow described in the architecture:
 *
 * 1. RETRIEVE: Find relevant waste rules via pgvector similarity search
 * 2. EVALUATE: Granite text model evaluates retrieved context quality
 *    - High confidence → structured disposal recommendation
 *    - Low confidence → clarifying question back to user
 *
 * This trades a simple RAG pass-through for an agent that can
 * autonomously decide when it needs more information.
 */

import { generateText } from "@/lib/ai/watsonxClient";
import {
  retrieveRelevantRules,
  retrieveRulesByCategory,
  type RetrievedRule,
} from "./retrieve";
import { WasteCategory } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentInput {
  /** The user's query (text message or item description from image classification) */
  userQuery: string;
  /** Optional: pre-classified category from image scan */
  classifiedCategory?: WasteCategory;
  /** Optional: pre-classified item label from image scan */
  classifiedLabel?: string;
  /** Varanasi locality ID */
  localityId: string;
  /** Conversation history for multi-turn chat */
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
}

export interface AgentOutput {
  /** Final response to show the user */
  response: string;
  /** Whether the agent is asking a clarifying question */
  requiresClarification: boolean;
  /** The matched waste rule (if found) */
  matchedRule?: {
    id: string;
    itemName: string;
    category: WasteCategory;
    disposalInstructions: string;
    tips?: string | null;
    isRecyclable: boolean;
  };
  /** Whether the response was grounded in retrieved rules */
  isRagGrounded: boolean;
  /** Similarity score of best matched rule */
  ragScore?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TEXT_MODEL_ID =
  process.env.WATSONX_TEXT_MODEL_ID ?? "ibm/granite-3-3-8b-instruct";

// ─── Prompt Builders ──────────────────────────────────────────────────────────

function buildRagPrompt(
  userQuery: string,
  rules: RetrievedRule[],
  conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = []
): string {
  const rulesContext = rules
    .map(
      (r, i) =>
        `[Rule ${i + 1}] Item: ${r.itemName}\nCategory: ${r.category}\nInstructions: ${r.disposalInstructions}${r.tips ? `\nTips: ${r.tips}` : ""}`
    )
    .join("\n\n");

  const historyText =
    conversationHistory.length > 0
      ? conversationHistory
          .map((m) => `${m.role === "user" ? "User" : "EcoSort"}: ${m.content}`)
          .join("\n")
      : "";

  return `<|system|>
You are EcoSort, a helpful and knowledgeable waste management assistant focused on Varanasi, India.
You help residents correctly segregate and dispose of household waste following Varanasi Nagar Nigam guidelines.

Your response style:
- Friendly and encouraging, never judgmental
- Concise (2-4 sentences max for simple queries)
- Actionable (always tell the user exactly what to do)
- Locally accurate (reference Varanasi-specific rules)
- If relevant, mention points earned for correct disposal

RETRIEVED KNOWLEDGE BASE RULES:
${rulesContext}

INSTRUCTIONS:
- Base your answer ONLY on the retrieved rules above
- If the rules clearly answer the question, give a direct, confident answer
- If the rules are ambiguous or don't fully match, ask ONE clarifying question
- Always end disposal instructions by mentioning which bin colour to use (GREEN for wet, BLUE for dry)
- Respond in English. If user writes in Hindi, respond in both Hindi and English.
<|user|>
${historyText ? `Previous conversation:\n${historyText}\n\n` : ""}Current question: ${userQuery}
<|assistant|>`;
}

function buildClarifyingPrompt(
  userQuery: string,
  classifiedLabel?: string
): string {
  return `<|system|>
You are EcoSort, a waste management assistant for Varanasi, India.
You need to ask the user ONE specific clarifying question to better classify their waste item.
Keep the question short and specific. Do not give disposal instructions yet.
<|user|>
The user asked: "${userQuery}"
${classifiedLabel ? `The AI identified this as possibly: "${classifiedLabel}" but is not confident.` : ""}

Ask one targeted clarifying question to determine the correct waste category.
<|assistant|>`;
}

// ─── Main Agent Function ──────────────────────────────────────────────────────

/**
 * Runs the agentic RAG workflow.
 *
 * Flow:
 * 1. Build query from user input + classified label
 * 2. Retrieve relevant rules via pgvector
 * 3. If high confidence → generate grounded response
 * 4. If low confidence → ask clarifying question
 */
export async function runRagAgent(input: AgentInput): Promise<AgentOutput> {
  const {
    userQuery,
    classifiedCategory,
    classifiedLabel,
    localityId,
    conversationHistory = [],
  } = input;

  // Step 1: Compose the search query
  // Combine user query + classified label for richer vector search
  const searchQuery = classifiedLabel
    ? `${classifiedLabel}: ${userQuery}`
    : userQuery;

  // Step 2: Vector similarity retrieval
  let retrievalResult;
  try {
    retrievalResult = await retrieveRelevantRules(searchQuery, localityId);
  } catch (error) {
    // If vector search fails (e.g., embeddings not yet generated),
    // fall back to category-based retrieval
    console.warn("[rag/agent] Vector search failed, falling back to category retrieval:", error);

    if (classifiedCategory && classifiedCategory !== WasteCategory.UNKNOWN) {
      const fallbackRules = await retrieveRulesByCategory(
        classifiedCategory,
        localityId
      );

      if (fallbackRules.length > 0) {
        const rule = fallbackRules[0];
        return {
          response: `Based on your item, here's the disposal guidance:\n\n**${rule.itemName}** — ${rule.disposalInstructions}${rule.tips ? `\n\n💡 *Tip: ${rule.tips}*` : ""}`,
          requiresClarification: false,
          matchedRule: rule,
          isRagGrounded: true,
          ragScore: 0.5,
        };
      }
    }

    // Total fallback
    return {
      response:
        "I'm having trouble finding specific disposal rules right now. For Varanasi: use the **GREEN bin** for wet/organic waste and the **BLUE bin** for dry recyclables. For hazardous items like batteries or electronics, please contact Varanasi Nagar Nigam.",
      requiresClarification: false,
      isRagGrounded: false,
    };
  }

  const { rules, isHighConfidence } = retrievalResult;

  // Step 3: If no rules retrieved or low confidence → fallback to category match
  if (!isHighConfidence && classifiedCategory && classifiedCategory !== WasteCategory.UNKNOWN) {
    console.warn(`[rag/agent] Low confidence for vector search. Falling back to category: ${classifiedCategory}`);
    const fallbackRules = await retrieveRulesByCategory(
      classifiedCategory,
      localityId
    );

    if (fallbackRules.length > 0) {
      const bestRule = fallbackRules[0];
      return {
        response: `Based on your item, here's the disposal guidance:\n\n**${bestRule.itemName}** — ${bestRule.disposalInstructions}${bestRule.tips ? `\n\n💡 *Tip: ${bestRule.tips}*` : ""}`,
        requiresClarification: false,
        matchedRule: {
          id: bestRule.id,
          itemName: bestRule.itemName,
          category: bestRule.category,
          disposalInstructions: bestRule.disposalInstructions,
          tips: bestRule.tips,
          isRecyclable: bestRule.isRecyclable,
        },
        isRagGrounded: true,
        ragScore: 0.5,
      };
    }
  }

  // Step 4: If no rules at all or still low confidence without fallback → clarify
  if (rules.length === 0 || !isHighConfidence) {
    let clarifyText = "I couldn't find specific disposal rules. Could you describe the item more?";
    try {
      const clarifyResult = await generateText({
        modelId: TEXT_MODEL_ID,
        input: buildClarifyingPrompt(userQuery, classifiedLabel),
        parameters: { max_new_tokens: 100, temperature: 0.5 },
      });
      clarifyText = clarifyResult.generated_text.trim();
    } catch (e) {
      console.error("[rag/agent] Clarification text generation failed:", e);
    }

    return {
      response: clarifyText,
      requiresClarification: true,
      isRagGrounded: false,
      ragScore: rules[0]?.similarity,
    };
  }

  // Step 5: High confidence → generate grounded response
  const responseResult = await generateText({
    modelId: TEXT_MODEL_ID,
    input: buildRagPrompt(userQuery, rules, conversationHistory),
    parameters: { max_new_tokens: 300, temperature: 0.3 },
  });

  const bestRule = rules[0];
  return {
    response: responseResult.generated_text.trim(),
    requiresClarification: false,
    matchedRule: {
      id: bestRule.id,
      itemName: bestRule.itemName,
      category: bestRule.category,
      disposalInstructions: bestRule.disposalInstructions,
      tips: bestRule.tips,
      isRecyclable: bestRule.isRecyclable,
    },
    isRagGrounded: true,
    ragScore: bestRule.similarity,
  };
}
