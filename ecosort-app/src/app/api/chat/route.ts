/**
 * POST /api/chat
 *
 * Handles text-based waste disposal queries via the agentic RAG workflow.
 * Supports multi-turn conversation with history context.
 * Can receive classification context from a preceding image scan.
 */

import { NextRequest, NextResponse } from "next/server";
import { runRagAgent } from "@/lib/rag/agent";
import { prisma } from "@/lib/db/prisma";
import { getVaranasiLocalityId } from "@/lib/rag/retrieve";
import {
  ChatRequestSchema,
  createApiError,
} from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  try {
    // ── Step 1: Parse and validate request body ────────────────────────────
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        createApiError("Invalid JSON body"),
        { status: 400 }
      );
    }

    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        createApiError("Invalid request", parsed.error.flatten()),
        { status: 400 }
      );
    }

    const {
      message,
      localityId: requestedLocalityId,
      deviceId,
      history,
      classificationContext,
    } = parsed.data;

    // ── Step 2: Get locality ───────────────────────────────────────────────
    const localityId =
      requestedLocalityId ?? (await getVaranasiLocalityId());

    // ── Step 3: Run agentic RAG ────────────────────────────────────────────
    const agentResult = await runRagAgent({
      userQuery: message,
      classifiedCategory: classificationContext?.category,
      classifiedLabel: classificationContext?.itemLabel,
      localityId,
      conversationHistory: history,
    });

    // ── Step 4: Log to disposal log (if user identified + successful) ──────
    if (
      deviceId &&
      agentResult.matchedRule &&
      !agentResult.requiresClarification
    ) {
      try {
        const user = await prisma.user.upsert({
          where: { deviceId },
          update: {},
          create: { deviceId, localityId },
          select: { id: true },
        });

        await prisma.$transaction([
          prisma.disposalLog.create({
            data: {
              userId: user.id,
              itemLabel: agentResult.matchedRule.itemName,
              category: agentResult.matchedRule.category,
              pointsAwarded: 5, // Chat queries earn fewer points than scans
              source: "chat",
            },
          }),
          prisma.userPoints.upsert({
            where: { userId: user.id },
            update: {
              totalPoints: { increment: 5 },
              lastActivityAt: new Date(),
            },
            create: {
              userId: user.id,
              totalPoints: 5,
              lastActivityAt: new Date(),
            },
          }),
        ]);
      } catch (dbError) {
        console.error("[chat] DB logging error:", dbError);
      }
    }

    // ── Step 5: Return response ────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        response: agentResult.response,
        requiresClarification: agentResult.requiresClarification,
        matchedRule: agentResult.matchedRule,
        isRagGrounded: agentResult.isRagGrounded,
        ragScore: agentResult.ragScore,
      },
    });
  } catch (error) {
    console.error("[api/chat] Unexpected error:", error);
    return NextResponse.json(
      createApiError("Failed to process your message. Please try again."),
      { status: 500 }
    );
  }
}
