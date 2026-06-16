/**
 * POST /api/classify
 *
 * Accepts a multipart/form-data image upload, classifies the waste item,
 * retrieves disposal instructions via RAG, and returns results.
 *
 * ZERO IMAGE RETENTION:
 * - Image bytes are read into memory (ArrayBuffer) and never persisted.
 * - ClassificationEvent stores only the AI output + SHA-256 hash.
 * - No temp files are created.
 *
 * Rate limiting: 20 requests/min per IP (see middleware.ts)
 */

import { NextRequest, NextResponse } from "next/server";
import { classifyImage } from "@/lib/ai/classify";
import { runRagAgent } from "@/lib/rag/agent";
import { prisma } from "@/lib/db/prisma";
import { getVaranasiLocalityId } from "@/lib/rag/retrieve";
import {
  validateImageFile,
  ClassifyRequestSchema,
  createApiError,
} from "@/lib/validation/schemas";
import { WasteCategory } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    // ── Step 1: Parse multipart form data ──────────────────────────────────
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        createApiError("Invalid request: expected multipart/form-data with an image file"),
        { status: 400 }
      );
    }

    const imageFile = formData.get("image");
    if (!imageFile || !(imageFile instanceof File)) {
      return NextResponse.json(
        createApiError("Missing 'image' field in form data"),
        { status: 400 }
      );
    }

    // ── Step 2: Validate image file (type + size) ──────────────────────────
    const fileValidation = validateImageFile(imageFile);
    if (!fileValidation.valid) {
      return NextResponse.json(
        createApiError(fileValidation.error),
        { status: 400 }
      );
    }

    // ── Step 3: Parse optional fields ─────────────────────────────────────
    const rawParams = {
      localityId: formData.get("localityId") ?? undefined,
      deviceId: formData.get("deviceId") ?? undefined,
    };

    const params = ClassifyRequestSchema.safeParse(rawParams);
    if (!params.success) {
      return NextResponse.json(
        createApiError("Invalid request parameters", params.error.flatten()),
        { status: 400 }
      );
    }

    // ── Step 4: Get locality (MVP: Varanasi) ───────────────────────────────
    const localityId =
      params.data.localityId ?? (await getVaranasiLocalityId());

    // ── Step 5: Read image into memory (ZERO RETENTION — never written to disk) ──
    const imageBuffer = await imageFile.arrayBuffer();

    // ── Step 6: Classify via Granite Vision ───────────────────────────────
    const classification = await classifyImage(imageBuffer, imageFile.type);

    // ── Step 7: Run agentic RAG for disposal instructions ──────────────────
    let agentResult;
    if (!classification.requiresClarification) {
      agentResult = await runRagAgent({
        userQuery: classification.itemLabel,
        classifiedCategory: classification.category,
        classifiedLabel: classification.itemLabel,
        localityId,
      });
    }

    // ── Step 8: Log classification event (NO image stored) ────────────────
    let eventId: string | undefined;
    let userId: string | undefined;

    if (params.data.deviceId) {
      try {
        // Find or create user by deviceId
        const user = await prisma.user.upsert({
          where: { deviceId: params.data.deviceId },
          update: {},
          create: {
            deviceId: params.data.deviceId,
            localityId,
          },
          select: { id: true },
        });
        userId = user.id;

        // Create classification audit event (NEVER stores image)
        const event = await prisma.classificationEvent.create({
          data: {
            userId,
            predictedLabel: classification.itemLabel,
            predictedCategory: classification.category,
            confidenceScore: classification.confidence,
            requiredClarification: classification.requiresClarification,
            imageHash: classification.imageHash, // SHA-256 only
            matchedRuleId: agentResult?.matchedRule?.id,
          },
          select: { id: true },
        });
        eventId = event.id;

        // Award points if classification was successful and not needing clarification
        if (!classification.requiresClarification && classification.category !== WasteCategory.UNKNOWN) {
          const POINTS_PER_SCAN = 10;

          await prisma.$transaction([
            prisma.disposalLog.create({
              data: {
                userId,
                itemLabel: classification.itemLabel,
                category: classification.category,
                pointsAwarded: POINTS_PER_SCAN,
                source: "image_scan",
              },
            }),
            prisma.userPoints.upsert({
              where: { userId },
              update: {
                totalPoints: { increment: POINTS_PER_SCAN },
                lastActivityAt: new Date(),
              },
              create: {
                userId,
                totalPoints: POINTS_PER_SCAN,
                lastActivityAt: new Date(),
              },
            }),
          ]);
        }
      } catch (dbError) {
        // Don't fail the request if DB logging fails
        console.error("[classify] DB logging error:", dbError);
      }
    }

    // ── Step 9: Return response (imageBuffer goes out of scope here — eligible for GC) ──
    return NextResponse.json({
      success: true,
      data: {
        itemLabel: classification.itemLabel,
        category: classification.category,
        confidence: classification.confidence,
        requiresClarification:
          classification.requiresClarification || agentResult?.requiresClarification,
        clarifyingQuestion:
          classification.clarifyingQuestion ?? agentResult?.response,
        disposalInstructions: agentResult?.matchedRule?.disposalInstructions,
        tips: agentResult?.matchedRule?.tips,
        isRecyclable: agentResult?.matchedRule?.isRecyclable,
        pointsEarned:
          !classification.requiresClarification &&
          classification.category !== WasteCategory.UNKNOWN
            ? 10
            : 0,
        ragScore: agentResult?.ragScore,
        eventId,
      },
    });
  } catch (error) {
    console.error("[api/classify] Unexpected error:", error);
    return NextResponse.json(
      createApiError(
        "An unexpected error occurred during classification. Please try again."
      ),
      { status: 500 }
    );
  }
}
