/**
 * Image Classification Module
 *
 * PRIVACY POLICY — ZERO IMAGE RETENTION:
 * ════════════════════════════════════════
 * Images are processed ENTIRELY in-memory as ArrayBuffer/base64.
 * They are NEVER:
 *   - Written to disk (no temp files)
 *   - Stored in the database (ClassificationEvent stores NO image data)
 *   - Passed to any persistence layer
 *   - Logged (only a SHA-256 hash is optionally stored for deduplication)
 *
 * The image bytes exist only within the scope of the classifyImage() call.
 * Once the function returns, the ArrayBuffer is eligible for GC.
 */

import crypto from "node:crypto";
import { generateText } from "./watsonxClient";
import { WasteCategory } from "@prisma/client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ClassificationResult {
  /** Human-readable label for the identified item */
  itemLabel: string;
  /** Waste category enum value */
  category: WasteCategory;
  /** Confidence score 0.0–1.0 */
  confidence: number;
  /**
   * SHA-256 hash of original image bytes.
   * Used ONLY for deduplication — cannot reconstruct image.
   * Stored in ClassificationEvent.imageHash.
   */
  imageHash: string;
  /** Whether the AI needs clarification before giving disposal advice */
  requiresClarification: boolean;
  /** Clarifying question (if requiresClarification is true) */
  clarifyingQuestion?: string;
  /** Raw model response (for debugging) */
  rawResponse?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const VISION_MODEL_ID =
  process.env.WATSONX_VISION_MODEL_ID ?? "ibm/granite-vision-3-2-2b";

const CONFIDENCE_THRESHOLD = parseFloat(
  process.env.CLASSIFICATION_CONFIDENCE_THRESHOLD ?? "0.75"
);

// Mapping from AI text output → WasteCategory enum
const CATEGORY_MAP: Record<string, WasteCategory> = {
  wet_organic: WasteCategory.WET_ORGANIC,
  wet: WasteCategory.WET_ORGANIC,
  organic: WasteCategory.WET_ORGANIC,
  food: WasteCategory.WET_ORGANIC,
  dry_recyclable: WasteCategory.DRY_RECYCLABLE,
  dry: WasteCategory.DRY_RECYCLABLE,
  recyclable: WasteCategory.DRY_RECYCLABLE,
  recycle: WasteCategory.DRY_RECYCLABLE,
  hazardous: WasteCategory.HAZARDOUS,
  ewaste: WasteCategory.HAZARDOUS,
  "e-waste": WasteCategory.HAZARDOUS,
  dangerous: WasteCategory.HAZARDOUS,
  sanitary: WasteCategory.SANITARY,
  construction: WasteCategory.CONSTRUCTION,
  inert: WasteCategory.INERT,
  general: WasteCategory.INERT,
  e_waste: WasteCategory.E_WASTE,
  electronic: WasteCategory.E_WASTE,
  electronics: WasteCategory.E_WASTE,
  biomedical: WasteCategory.BIOMEDICAL,
  medical: WasteCategory.BIOMEDICAL,
  bulky: WasteCategory.BULKY,
  furniture: WasteCategory.BULKY,
  large: WasteCategory.BULKY,
  textile: WasteCategory.TEXTILE,
  clothes: WasteCategory.TEXTILE,
  clothing: WasteCategory.TEXTILE,
  fabric: WasteCategory.TEXTILE,
  metal_scrap: WasteCategory.METAL_SCRAP,
  metal: WasteCategory.METAL_SCRAP,
  scrap: WasteCategory.METAL_SCRAP,
  unknown: WasteCategory.UNKNOWN,
};

// ─── Classification Prompt ────────────────────────────────────────────────────

/**
 * Builds the classification prompt for Granite Vision.
 * Uses a structured output format for reliable JSON parsing.
 */
function buildClassificationPrompt(): string {
  return `<|system|>
You are EcoSort, an expert waste classification assistant trained on Indian municipal solid waste management guidelines.

Your task is to analyze the image and classify the waste item into exactly one of these categories:
- WET_ORGANIC: Food scraps, vegetable peels, cooked food, garden waste, flowers
- DRY_RECYCLABLE: Paper, cardboard, glass bottles, plastic bottles (PET/HDPE)
- HAZARDOUS: Batteries, chemicals, paint, medicine
- SANITARY: Diapers, sanitary pads, used tissues
- CONSTRUCTION: Bricks, tiles, debris, plaster
- INERT: Styrofoam/thermocol, multi-layer plastic, broken ceramics
- E_WASTE: Electronic waste, phones, laptops, cables, appliances, bulbs
- BIOMEDICAL: Syringes, medical waste, bandages, clinical items
- BULKY: Large furniture, mattresses, big appliances
- TEXTILE: Clothes, fabrics, shoes, rags
- METAL_SCRAP: Scrap metal, iron, aluminum cans, hardware, tools
- UNKNOWN: Image too blurry, item not identifiable, or multiple mixed items

Respond ONLY with a valid JSON object matching this exact schema:
{
  "item_label": "string (descriptive name of the item)",
  "category": "WET_ORGANIC | DRY_RECYCLABLE | HAZARDOUS | SANITARY | CONSTRUCTION | INERT | E_WASTE | BIOMEDICAL | BULKY | TEXTILE | METAL_SCRAP | UNKNOWN",
  "confidence": number (0.0 to 1.0),
  "reasoning": "string (brief 1-sentence explanation)"
}

Do not include any text outside the JSON object.
<|user|>
Classify the waste item in this image:
[IMAGE]
<|assistant|>`;
}

// ─── JSON Parser ──────────────────────────────────────────────────────────────

interface RawClassificationOutput {
  item_label: string;
  category: string;
  confidence: number;
  reasoning: string;
}

function parseClassificationResponse(
  raw: string
): RawClassificationOutput | null {
  try {
    // Extract JSON from the response (model may add surrounding text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as RawClassificationOutput;

    // Validate required fields
    if (
      typeof parsed.item_label !== "string" ||
      typeof parsed.category !== "string" ||
      typeof parsed.confidence !== "number"
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

// ─── Main Classification Function ─────────────────────────────────────────────

/**
 * Classifies a waste item from an image.
 *
 * ZERO IMAGE RETENTION:
 * - imageBytes is processed in-memory only
 * - Never written to disk or database
 * - Only SHA-256 hash is returned for dedup
 *
 * @param imageBytes - Raw image bytes (ArrayBuffer or Buffer)
 * @param mimeType - Image MIME type (e.g., 'image/jpeg')
 * @returns ClassificationResult
 */
export async function classifyImage(
  imageBytes: ArrayBuffer | Buffer,
  mimeType: string = "image/jpeg"
): Promise<ClassificationResult> {
  // Step 1: Compute SHA-256 hash BEFORE any processing
  // This is the ONLY image-derived data we retain
  const buffer = Buffer.isBuffer(imageBytes)
    ? imageBytes
    : Buffer.from(imageBytes);
  const imageHash = crypto
    .createHash("sha256")
    .update(buffer)
    .digest("hex");

  // Step 2: Convert to base64 for the API call (in-memory only)
  const base64Image = buffer.toString("base64");
  const dataUri = `data:${mimeType};base64,${base64Image}`;

  // Step 3: Build the prompt with image
  const prompt = buildClassificationPrompt().replace("[IMAGE]", dataUri);

  let rawResponse = "";
  let parsed: RawClassificationOutput | null = null;

  try {
    // Step 4: Call watsonx Granite Vision
    const result = await generateText({
      modelId: VISION_MODEL_ID,
      input: prompt,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.1, // Low temperature for deterministic classification
        stop_sequences: ["}"],
      },
    });

    rawResponse = result.generated_text + "}"; // Restore stop sequence
    parsed = parseClassificationResponse(rawResponse);
  } catch (error) {
    // If the vision model call fails, return UNKNOWN with low confidence
    console.error("[classify] Vision model error:", error);
    return {
      itemLabel: "Unidentifiable Item",
      category: WasteCategory.UNKNOWN,
      confidence: 0,
      imageHash,
      requiresClarification: true,
      clarifyingQuestion:
        "I couldn't analyse the image. Could you describe the item in words? (e.g., 'plastic bottle', 'old newspaper')",
    };
  }

  // Step 5: Handle parse failure
  if (!parsed) {
    return {
      itemLabel: "Unidentifiable Item",
      category: WasteCategory.UNKNOWN,
      confidence: 0,
      imageHash,
      requiresClarification: true,
      clarifyingQuestion:
        "The image wasn't clear enough. Could you tell me more about the item?",
      rawResponse,
    };
  }

  // Step 6: Map category string to enum
  const categoryKey = parsed.category.toLowerCase().replace(/[^a-z_-]/g, "");
  const category = CATEGORY_MAP[categoryKey] ?? WasteCategory.UNKNOWN;

  // Step 7: Check confidence threshold
  const confidence = Math.max(0, Math.min(1, parsed.confidence));
  const requiresClarification = confidence < CONFIDENCE_THRESHOLD;

  const clarifyingQuestion = requiresClarification
    ? buildClarifyingQuestion(parsed.item_label, parsed.reasoning)
    : undefined;

  // Step 8: Clear base64 reference (GC hint)
  // The buffer and base64Image variables go out of scope here

  return {
    itemLabel: parsed.item_label,
    category,
    confidence,
    imageHash,
    requiresClarification,
    clarifyingQuestion,
    rawResponse: process.env.NODE_ENV === "development" ? rawResponse : undefined,
  };
}

// ─── Clarifying Question Generator ────────────────────────────────────────────

function buildClarifyingQuestion(itemLabel: string, reasoning: string): string {
  const questions: Record<string, string> = {
    WET_ORGANIC: `Is the "${itemLabel}" food waste or organic material (like peels, leftovers, or flowers)?`,
    DRY_RECYCLABLE: `Is the "${itemLabel}" clean and dry? If it has food residue, it may need to go in wet waste.`,
    HAZARDOUS: `Is the "${itemLabel}" a battery, electronic device, or chemical product?`,
    INERT: `Does the "${itemLabel}" have any food stains or contaminants?`,
  };

  // Try to infer a useful question from the reasoning
  for (const [keyword, question] of Object.entries(questions)) {
    if (reasoning?.toLowerCase().includes(keyword.toLowerCase())) {
      return question;
    }
  }

  return `I can see what appears to be a "${itemLabel}" but I'm not fully certain. Could you confirm: is it made primarily of plastic, paper, metal, glass, or food material?`;
}
