/**
 * GET /api/rules — List waste rules for a locality
 * POST /api/rules/embed — Trigger embedding generation (protected)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getVaranasiLocalityId } from "@/lib/rag/retrieve";
import { GetRulesRequestSchema, createApiError } from "@/lib/validation/schemas";
import type { WasteCategory } from "@prisma/client";

// ── GET /api/rules ────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const rawParams = {
      localityId: searchParams.get("localityId") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      page: searchParams.get("page") ?? undefined,
      pageSize: searchParams.get("pageSize") ?? undefined,
    };

    const parsed = GetRulesRequestSchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        createApiError("Invalid query parameters", parsed.error.flatten()),
        { status: 400 }
      );
    }

    const { localityId: requestedLocalityId, category, search, page, pageSize } =
      parsed.data;

    const localityId =
      requestedLocalityId ?? (await getVaranasiLocalityId());
    const skip = (page - 1) * pageSize;

    const [rules, total] = await Promise.all([
      prisma.wasteRule.findMany({
        where: {
          localityId,
          ...(category && { category: category as WasteCategory }),
          ...(search && {
            OR: [
              { itemName: { contains: search, mode: "insensitive" } },
              { disposalInstructions: { contains: search, mode: "insensitive" } },
              { aliases: { has: search } },
            ],
          }),
        },
        select: {
          id: true,
          itemName: true,
          aliases: true,
          category: true,
          disposalInstructions: true,
          tips: true,
          isRecyclable: true,
          source: true,
        },
        skip,
        take: pageSize,
        orderBy: { itemName: "asc" },
      }),
      prisma.wasteRule.count({
        where: {
          localityId,
          ...(category && { category: category as WasteCategory }),
          ...(search && {
            OR: [
              { itemName: { contains: search, mode: "insensitive" } },
              { aliases: { has: search } },
            ],
          }),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        rules,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error("[api/rules] GET error:", error);
    return NextResponse.json(
      createApiError("Failed to fetch waste rules"),
      { status: 500 }
    );
  }
}
