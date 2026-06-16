/**
 * GET /api/user/stats?deviceId=xxx
 * Returns gamification stats for a device ID.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createApiError } from "@/lib/validation/schemas";

export async function GET(request: NextRequest) {
  const deviceId = request.nextUrl.searchParams.get("deviceId");

  if (!deviceId) {
    return NextResponse.json(
      createApiError("deviceId query parameter is required"),
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { deviceId },
      include: {
        points: true,
        _count: {
          select: { classificationEvents: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({
        success: true,
        data: {
          totalPoints: 0,
          currentStreak: 0,
          longestStreak: 0,
          level: 1,
          totalScans: 0,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalPoints:   user.points?.totalPoints   ?? 0,
        currentStreak: user.points?.currentStreak ?? 0,
        longestStreak: user.points?.longestStreak ?? 0,
        level:         user.points?.level         ?? 1,
        totalScans:    user._count.classificationEvents,
      },
    });
  } catch (error) {
    console.error("[api/user/stats] Error:", error);
    return NextResponse.json(
      createApiError("Failed to fetch user stats"),
      { status: 500 }
    );
  }
}
