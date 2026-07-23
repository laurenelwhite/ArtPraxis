import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mediumSchema, tutorialSchema, normalizeTutorial } from "@/lib/tutorial-schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured." }, { status: 500 });
    }

    const body = await request.json();
    const medium = mediumSchema.parse(body.medium);
    const skillLevel = z.enum(["beginner", "intermediate", "advanced"])
      .parse(body.skillLevel || "beginner");
    const imageDataUrl = z.string().parse(body.imageDataUrl);

    if (!imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "A valid image is required." }, { status: 400 });
    }

    const response = await client.responses.parse({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      input: [
        {
          role: "system",
          content: [{
            type: "input_text",
            text: [
              "You are ArtPraxis, an expert studio-art instructor and visual analyst.",
              "Create a practical lesson grounded in visible evidence from the reference image.",
              "Adapt materials, sequencing, cautions, and technique to the chosen medium.",
              "Coordinates are percentages of image width and height, with 0,0 at top-left.",
              "Use rectangles that meaningfully isolate visible regions.",
              "Keep overlay labels short and do not invent unclear details.",
              "Return the structured result only."
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
                "Map the focal point, light direction, major shapes, shadows, midtones, highlights, and useful warm/cool regions.",
                "For each step, provide a focus rectangle when a specific image region matters; otherwise use null.",
                "Palette names in steps must exactly match names in the palette.",
                "Tell the artist what to observe, mix, place, simplify, and check."
              ].join(" ")
            },
            { type: "input_image", image_url: imageDataUrl, detail: "high" }
          ]
        }
      ],
      text: { format: zodTextFormat(tutorialSchema, "artpraxis_visual_tutorial") }
    });

    if (!response.output_parsed) {
      return NextResponse.json({ error: "The model did not return a tutorial." }, { status: 502 });
    }

    // Fill any omitted material fields before persistence / stage generation.
    const tutorial = normalizeTutorial(response.output_parsed);
    return NextResponse.json({ tutorial });
  } catch (error) {
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
