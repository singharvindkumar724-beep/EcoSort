/**
 * Zod Validation Schemas
 * Validates all API inputs/outputs at runtime.
 * Pairs with TypeScript for compile-time + runtime safety.
 */

import { z } from "zod";

// ─── Shared ───────────────────────────────────────────────────────────────────

export const WasteCategorySchema = z.enum([
  "WET_ORGANIC",
  "DRY_RECYCLABLE",
  "HAZARDOUS",
  "SANITARY",
  "CONSTRUCTION",
  "INERT",
  "E_WASTE",
  "BIOMEDICAL",
  "BULKY",
  "TEXTILE",
  "METAL_SCRAP",
  "UNKNOWN",
]);

// ─── /api/classify ────────────────────────────────────────────────────────────

export const ClassifyRequestSchema = z.object({
  // Image is sent as multipart/form-data — validated separately
  // Optional locality override (defaults to Varanasi in MVP)
  localityId: z.string().cuid().optional(),
  // Optional device ID for user tracking
  deviceId: z.string().min(1).max(128).optional(),
});

export const ClassifyResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      itemLabel: z.string(),
      category: WasteCategorySchema,
      confidence: z.number().min(0).max(1),
      requiresClarification: z.boolean(),
      clarifyingQuestion: z.string().optional(),
      disposalInstructions: z.string().optional(),
      tips: z.string().nullable().optional(),
      isRecyclable: z.boolean().optional(),
      pointsEarned: z.number().int().min(0).optional(),
      ragScore: z.number().min(0).max(1).optional(),
      eventId: z.string().cuid().optional(),
    })
    .optional(),
  error: z.string().optional(),
});

export type ClassifyResponse = z.infer<typeof ClassifyResponseSchema>;

// ─── /api/chat ────────────────────────────────────────────────────────────────

export const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(2000),
});

export const ChatRequestSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(500, "Message too long (max 500 characters)"),
  localityId: z.string().cuid().optional(),
  deviceId: z.string().min(1).max(128).optional(),
  // Previous messages for context (last 10 max)
  history: z.array(ChatMessageSchema).max(10).optional().default([]),
  // If coming from an image scan, include classification context
  classificationContext: z
    .object({
      itemLabel: z.string(),
      category: WasteCategorySchema,
      confidence: z.number(),
    })
    .optional(),
});

export const ChatResponseSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      response: z.string(),
      requiresClarification: z.boolean(),
      matchedRule: z
        .object({
          id: z.string(),
          itemName: z.string(),
          category: WasteCategorySchema,
          disposalInstructions: z.string(),
          tips: z.string().nullable().optional(),
          isRecyclable: z.boolean(),
        })
        .optional(),
      isRagGrounded: z.boolean(),
      ragScore: z.number().min(0).max(1).optional(),
    })
    .optional(),
  error: z.string().optional(),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
export type ChatResponse = z.infer<typeof ChatResponseSchema>;

// ─── /api/rules ──────────────────────────────────────────────────────────────

export const GetRulesRequestSchema = z.object({
  localityId: z.string().cuid().optional(),
  category: WasteCategorySchema.optional(),
  search: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type GetRulesRequest = z.infer<typeof GetRulesRequestSchema>;

// ─── File Upload Validation ────────────────────────────────────────────────────

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
] as const;

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function validateImageFile(file: File): { valid: true } | { valid: false; error: string } {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_TYPES)[number])) {
    return {
      valid: false,
      error: `Unsupported file type: ${file.type}. Please upload JPEG, PNG, WebP, or HEIC.`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum size is 10 MB.`,
    };
  }

  return { valid: true };
}

// ─── API Error Helper ─────────────────────────────────────────────────────────

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}

export function createApiError(
  message: string,
  details?: unknown
): ApiError {
  return { success: false, error: message, details };
}
