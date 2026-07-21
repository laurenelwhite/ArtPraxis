import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_PROTOCOLS = new Set(["https:", "http:"]);

function isPrivateHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase();

  return (
    normalized === "localhost" ||
    normalized === "127.0.0.1" ||
    normalized === "0.0.0.0" ||
    normalized === "::1" ||
    normalized.endsWith(".local") ||
    normalized.startsWith("10.") ||
    normalized.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(normalized)
  );
}

export async function GET(request: NextRequest) {
  const source = request.nextUrl.searchParams.get("url");

  if (!source) {
    return NextResponse.json(
      { error: "Missing image URL." },
      { status: 400 },
    );
  }

  let sourceUrl: URL;

  try {
    sourceUrl = new URL(source);
  } catch {
    return NextResponse.json(
      { error: "Invalid image URL." },
      { status: 400 },
    );
  }

  if (
    !ALLOWED_PROTOCOLS.has(sourceUrl.protocol) ||
    isPrivateHostname(sourceUrl.hostname)
  ) {
    return NextResponse.json(
      { error: "Image URL is not permitted." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(sourceUrl, {
      cache: "no-store",
      redirect: "follow",
      headers: {
        Accept: "image/*",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Upstream image request failed: ${response.status}` },
        { status: 502 },
      );
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (!contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "The requested resource is not an image." },
        { status: 415 },
      );
    }

    const image = await response.arrayBuffer();

    return new NextResponse(image, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[image-proxy] Failed to fetch image", {
      source,
      error,
    });

    return NextResponse.json(
      { error: "Could not fetch the upstream image." },
      { status: 502 },
    );
  }
}