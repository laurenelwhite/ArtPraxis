import { NextRequest, NextResponse } from "next/server";
import { ApiError, apiErrorJson } from "@/lib/server/api-errors";
import { authenticateRequest } from "@/lib/server/api-auth";
import { tutorialGenerationAvailable } from "@/lib/server/generation-availability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Authenticated read of whether lesson writing can start.
 * The body is only `{ available: true | false }`.
 */
export async function GET(request: NextRequest) {
  try {
    await authenticateRequest(request);
    return NextResponse.json(
      { available: tutorialGenerationAvailable() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof ApiError) return apiErrorJson(error);
    console.error("[generation-availability] check failed");
    return NextResponse.json(
      { error: "Lesson writing could not be checked." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
