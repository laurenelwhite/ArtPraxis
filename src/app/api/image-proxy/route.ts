import { NextRequest, NextResponse } from "next/server";
import { ApiError, apiErrorJson } from "@/lib/server/api-errors";
import { authenticateRequest } from "@/lib/server/api-auth";
import { fetchStorageImage } from "@/lib/server/safe-image-fetch";
import { allowedStorageBuckets, validateStorageImageUrl } from "@/lib/server/storage-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin fallback for reading the caller's own Firebase Storage images
 * when a direct browser fetch is blocked by CORS.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);

    const source = request.nextUrl.searchParams.get("url");
    if (!source) {
      return NextResponse.json({ error: "Missing image URL." }, { status: 400 });
    }

    const check = validateStorageImageUrl(source, {
      uid: user.uid,
      allowedBuckets: allowedStorageBuckets(),
    });
    if (!check.ok) {
      console.warn("[image-proxy] rejected", { reason: check.reason });
      return NextResponse.json(
        {
          error:
            check.status === 403
              ? "You don't have access to that image."
              : "Image URL is not permitted.",
          code: check.code,
        },
        { status: check.status },
      );
    }

    const { buffer, contentType } = await fetchStorageImage(check.url.toString());
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    if (error instanceof ApiError) return apiErrorJson(error);
    console.error("[image-proxy] Failed to fetch image", {
      message: error instanceof Error ? error.message : String(error),
    });
    return NextResponse.json({ error: "Could not fetch the upstream image." }, { status: 502 });
  }
}
