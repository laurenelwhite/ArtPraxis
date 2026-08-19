import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mediumSchema, tutorialSchema, normalizeTutorial } from "@/lib/tutorial-schema";
import {
  approximateIncomingImageBytes,
  parseTutorialImageDetail,
  resolveTutorialModel,
} from "@/lib/tutorial-generation-config";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function jsonByteLength(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}

export async function POST(request: NextRequest) {
  const requestStartedAt = Date.now();
  let requestParseMs = 0;
  let modelRequestMs = 0;
  let normalizationMs = 0;
  let incomingImageDataUrlChars = 0;
  let approximateIncomingImageBytesEst = 0;
  let medium: string | null = null;
  let skillLevel: string | null = null;
  const model = resolveTutorialModel();
  const imageDetail = parseTutorialImageDetail(process.env.OPENAI_TUTORIAL_IMAGE_DETAIL);

  const logTiming = (extra: Record<string, unknown>) => {
    console.warn(JSON.stringify({
      scope: "generate-tutorial",
      event: "tutorial_generation_timing",
      requestParseMs,
      incomingImageDataUrlChars,
      approximateIncomingImageBytes: approximateIncomingImageBytesEst,
      modelRequestMs,
      normalizationMs,
      totalMs: Date.now() - requestStartedAt,
      model,
      imageDetail,
      medium,
      skillLevel,
      ...extra,
      t: Date.now(),
    }));
  };

  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
    }

    const parseStarted = Date.now();
    const body = await request.json();
    medium = mediumSchema.parse(body.medium);
    skillLevel = z.enum(["beginner", "intermediate", "advanced"])
      .parse(body.skillLevel || "beginner");
    const imageDataUrl = z.string().parse(body.imageDataUrl);
    requestParseMs = Date.now() - parseStarted;

    if (!imageDataUrl.startsWith("data:image/")) {
      logTiming({ success: false, reason: "invalid_image" });
      return NextResponse.json({ error: "A valid image is required." }, { status: 400 });
    }

    const imageSize = approximateIncomingImageBytes(imageDataUrl);
    incomingImageDataUrlChars = imageSize.incomingImageDataUrlChars;
    approximateIncomingImageBytesEst = imageSize.approximateIncomingImageBytes;

    const modelStarted = Date.now();
    const response = await client.responses.parse({
      model,
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text: [
              "You are ArtPraxis, a studio teacher.",
              "Write concise, actionable, medium-specific instruction from visible evidence only.",
              "Do not write essays or repeat the same observation across fields.",
              "Overlay labels: 1–4 words. Coordinates are % of width/height, origin top-left.",
              "Use rectangles that isolate visible regions. Do not invent unseen details.",
              "Return the structured result only.",
            ].join(" ")
          }]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: [
                `Create a ${skillLevel} ${medium} lesson with 6–10 ordered steps.`,
                "Map focal point, light, major shapes, and value masses once — do not restate them in every field.",
                "Each text field: one or two short sentences. Steps: what to observe, mix, place, and check.",
                "Focus rectangle only when a specific region matters; otherwise null.",
                "Palette step names must exactly match palette[].name.",
              ].join(" ")
            },
            { type: "input_image", image_url: imageDataUrl, detail: imageDetail }
          ]
        }
      ],
      text: { format: zodTextFormat(tutorialSchema, "artpraxis_visual_tutorial") }
    });
    modelRequestMs = Date.now() - modelStarted;

    if (!response.output_parsed) {
      logTiming({ success: false, reason: "empty_parse" });
      return NextResponse.json({ error: "The model did not return a tutorial." }, { status: 502 });
    }

    const normalizeStarted = Date.now();
    const tutorial = normalizeTutorial(response.output_parsed);
    normalizationMs = Date.now() - normalizeStarted;

    const tutorialTiming = {
      requestParseMs,
      incomingImageDataUrlChars,
      approximateIncomingImageBytes: approximateIncomingImageBytesEst,
      modelRequestMs,
      normalizationMs,
      totalMs: Date.now() - requestStartedAt,
      model,
      imageDetail,
      medium,
      skillLevel,
      stepCount: tutorial.steps.length,
      paletteCount: tutorial.palette.length,
      materialCount: tutorial.materials.length,
      responseJsonBytes: jsonByteLength(tutorial),
    };

    logTiming({
      success: true,
      stepCount: tutorialTiming.stepCount,
      paletteCount: tutorialTiming.paletteCount,
      materialCount: tutorialTiming.materialCount,
      responseJsonBytes: tutorialTiming.responseJsonBytes,
    });

    return NextResponse.json({ tutorial, tutorialTiming });
  } catch (error) {
    logTiming({
      success: false,
      reason: error instanceof Error ? error.name : "unknown",
    });
    console.error("Tutorial generation failed", error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: error.code === "insufficient_quota"
            ? "OpenAI API billing or quota is unavailable."
            : "The art analysis service could not complete this request." },
        { status: error.status || 500 }
      );
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "The tutorial request contained invalid information." }, { status: 400 });
    }

    return NextResponse.json({ error: "Could not generate the tutorial. Check the server logs." }, { status: 500 });
  }
}
