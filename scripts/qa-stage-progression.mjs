/**
 * One-shot six-stage progression QA harness.
 * Calls /api/generate-stage-images for master + each stage in order.
 *
 * Usage: node --env-file=.env.local scripts/qa-stage-progression.mjs
 * Requires a running Next server (default http://localhost:3005).
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const BASE = process.env.QA_BASE_URL || "http://localhost:3005";
const OUT = path.join(process.cwd(), "tmp-stage-qa");

const minimalTutorial = {
  title: "Warm Tone Progression Study",
  overview: "A simple warm-toned watercolor progression for QA.",
  difficulty: "beginner",
  estimatedMinutes: 45,
  composition: {
    focalPoint: "Central warm mass",
    majorShapes: ["Sky band", "Ground band", "Central subject"],
    valuePlan: "Light sky, mid ground, darker accents reserved",
    lightDirection: "From upper left",
  },
  visualGuides: {
    focalPoint: { x: 50, y: 45, label: "Focus" },
    lightArrow: {
      start: { x: 20, y: 15 },
      end: { x: 45, y: 40 },
      label: "Light",
    },
    regions: [
      { x: 10, y: 10, width: 80, height: 30, label: "Sky", type: "highlight" },
      { x: 15, y: 40, width: 70, height: 35, label: "Subject", type: "major-shape" },
      { x: 5, y: 75, width: 90, height: 20, label: "Ground", type: "midtone" },
    ],
    suggestedCrop: null,
  },
  valueMap: {
    lights: "Sky and sunlit edges",
    midtones: "Central subject body",
    darks: "Reserved accents",
    squintTest: "Three big shapes should still read when you squint.",
  },
  materials: [
    {
      item: "Round brush, size 10",
      purpose: "Main washes",
      required: true,
      imageUrl: null,
      specification: "size 10",
      quantity: "1",
      substitution: null,
    },
    {
      item: "140 lb cold-press watercolor paper",
      purpose: "Painting surface",
      required: true,
      imageUrl: null,
      specification: "140 lb cold-press",
      quantity: "1 sheet",
      substitution: null,
    },
  ],
  palette: [
    {
      name: "Yellow Ochre",
      hex: "#C9A227",
      role: "Warm midtone",
      mixingNote: "Keep dilute",
      ratio: "20% pigment · 80% water",
    },
    {
      name: "Burnt Sienna",
      hex: "#8A4B2E",
      role: "Warm accent",
      mixingNote: "Use sparingly",
      ratio: "30% pigment · 70% water",
    },
    {
      name: "Ultramarine Blue",
      hex: "#3A5F8A",
      role: "Cool balance",
      mixingNote: "Pale washes only early",
      ratio: "15% pigment · 85% water",
    },
  ],
  creativeChoices: [
    "Keep early washes pale",
    "Reserve darkest accents for the end",
  ],
  steps: Array.from({ length: 6 }, (_, i) => ({
    order: i + 1,
    title: `Step ${i + 1}`,
    objective: "Build the painting gradually",
    instruction: "Work in large shapes",
    technique: "Transparent washes",
    checkpoint: "Shapes still read simply",
    commonMistake: "Going too dark too soon",
    estimatedMinutes: 7,
    focusBox: null,
    paletteNames: ["Yellow Ochre"],
    visualCue: "Look for the largest shapes first",
  })),
};

const STAGE_ORDER = [
  "pencil-sketch",
  "value-study",
  "first-wash",
  "second-wash",
  "refinement",
  "finished",
];

async function post(body) {
  const res = await fetch(`${BASE}/api/generate-stage-images`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(600_000),
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Non-JSON response ${res.status}: ${text.slice(0, 200)}`);
  }
  return { status: res.status, json };
}

async function saveDataUrl(dataUrl, filePath) {
  const m = /^data:image\/\w+;base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("bad data url");
  fs.writeFileSync(filePath, Buffer.from(m[1], "base64"));
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const png = await sharp({
    create: {
      width: 768,
      height: 768,
      channels: 3,
      background: { r: 190, g: 150, b: 110 },
    },
  })
    .png()
    .toBuffer();

  // Simple compositional bands so the scene is not a flat field.
  const composed = await sharp(png)
    .composite([
      {
        input: await sharp({
          create: {
            width: 768,
            height: 220,
            channels: 3,
            background: { r: 210, g: 195, b: 175 },
          },
        })
          .png()
          .toBuffer(),
        top: 0,
        left: 0,
      },
      {
        input: await sharp({
          create: {
            width: 280,
            height: 320,
            channels: 3,
            background: { r: 150, g: 95, b: 70 },
          },
        })
          .png()
          .toBuffer(),
        top: 240,
        left: 244,
      },
    ])
    .png()
    .toBuffer();

  const referenceDataUrl = `data:image/png;base64,${composed.toString("base64")}`;
  const refPath = path.join(OUT, "00-reference.png");
  fs.writeFileSync(refPath, composed);

  // Persist reference as a temporary local data URL upload isn't available —
  // the API expects a fetchable URL for master mode. Use data URL via a tiny
  // local static file served from /tmp-stage-qa if public-linked, else write
  // into public for the run.
  const publicDir = path.join(process.cwd(), "public", "tmp-stage-qa");
  fs.mkdirSync(publicDir, { recursive: true });
  const publicRef = path.join(publicDir, "reference.png");
  fs.writeFileSync(publicRef, composed);
  const referenceImageUrl = `${BASE}/tmp-stage-qa/reference.png`;

  const publicMaster = path.join(publicDir, "master.png");
  let masterImageUrl;
  let masterRes = { status: 200, json: { generated: true, masterValidation: null } };

  if (fs.existsSync(publicMaster) && process.env.QA_REUSE_MASTER !== "0") {
    console.log("Reusing existing master at public/tmp-stage-qa/master.png");
    masterImageUrl = `${BASE}/tmp-stage-qa/master.png`;
    const masterPath = path.join(OUT, "06-finished-master.png");
    fs.copyFileSync(publicMaster, masterPath);
  } else {
    console.log("Master generation…");
    masterRes = await post({
      mode: "master",
      medium: "watercolor",
      tutorial: minimalTutorial,
      size: "1024x1024",
      referenceImageUrl,
    });
    console.log("master status", masterRes.status, "generated", masterRes.json.generated);

    if (!masterRes.json.generated || !masterRes.json.master?.dataUrl) {
      console.log("Master not generated — check ENABLE_STAGE_IMAGE_GEN and API key.");
      console.log(JSON.stringify(masterRes.json).slice(0, 400));
      process.exit(1);
    }

    const masterPath = path.join(OUT, "06-finished-master.png");
    await saveDataUrl(masterRes.json.master.dataUrl, masterPath);
    await saveDataUrl(masterRes.json.master.dataUrl, publicMaster);
    masterImageUrl = `${BASE}/tmp-stage-qa/master.png`;
  }

  const masterPath = path.join(OUT, "06-finished-master.png");
  if (!fs.existsSync(masterPath)) fs.copyFileSync(publicMaster, masterPath);

  const report = [];
  let precedingImageUrl = null;
  let degraded = false;

  for (const stageId of STAGE_ORDER) {
    console.log(`Stage ${stageId}…`);
    if (stageId === "finished") {
      report.push({
        stageId,
        source: "master",
        fallback: false,
        degraded: false,
        validated: true,
        compositionSeverity: masterRes.json.masterValidation?.severity ?? "pass",
        progressSeverity: null,
        structureScore: null,
        reasons: [],
        file: masterPath,
        url: masterImageUrl,
      });
      continue;
    }

    const stageRes = await post({
      mode: "stage",
      medium: "watercolor",
      tutorial: minimalTutorial,
      size: "1024x1024",
      stageId,
      referenceImageUrl,
      masterImageUrl,
      precedingImageUrl: precedingImageUrl ?? undefined,
    });

    const img = stageRes.json.images?.[0];
    const file = path.join(OUT, `${STAGE_ORDER.indexOf(stageId) + 1}-${stageId}.png`);
    let url = null;
    let source = img?.fallback ? "fallback-flag" : img?.dataUrl ? "ai" : "none";

    if (img?.dataUrl) {
      await saveDataUrl(img.dataUrl, file);
      const pub = path.join(publicDir, `${stageId}.png`);
      await saveDataUrl(img.dataUrl, pub);
      url = `${BASE}/tmp-stage-qa/${stageId}.png`;
      precedingImageUrl = url;
      source = img.fallback ? "degraded-fallback-with-data" : "ai";
    } else if (img?.fallback || stageRes.status === 200) {
      degraded = true;
      console.warn(`DEGRADED: ${stageId} fell back to deterministic transform (AI not accepted).`);
      const basePath = precedingImageUrl
        ? path.join(publicDir, path.basename(new URL(precedingImageUrl).pathname))
        : publicMaster;
      const masterBuf = fs.readFileSync(publicMaster);
      let outBuf;
      if (stageId === "pencil-sketch") {
        outBuf = await sharp(masterBuf)
          .greyscale()
          .blur(1.2)
          .linear(1.8, -120)
          .threshold(200)
          .negate()
          .linear(0.22, 200)
          .png()
          .toBuffer();
      } else if (fs.existsSync(basePath)) {
        const prev = fs.readFileSync(basePath);
        const opacity =
          stageId === "value-study"
            ? 0.28
            : stageId === "first-wash"
              ? 0.32
              : stageId === "second-wash"
                ? 0.45
                : 0.58;
        const tint =
          stageId === "value-study"
            ? await sharp(masterBuf).greyscale().modulate({ brightness: 1.25 }).ensureAlpha(opacity).png().toBuffer()
            : await sharp(masterBuf)
                .modulate({ brightness: 1.15, saturation: stageId === "first-wash" ? 0.55 : 0.85 })
                .ensureAlpha(opacity)
                .png()
                .toBuffer();
        outBuf = await sharp(prev)
          .composite([{ input: tint, blend: "over" }])
          .modulate({ brightness: stageId === "value-study" || stageId === "first-wash" ? 1.12 : 1.02 })
          .png()
          .toBuffer();
      } else {
        outBuf = masterBuf;
      }
      fs.writeFileSync(file, outBuf);
      const pub = path.join(publicDir, `${stageId}.png`);
      fs.writeFileSync(pub, outBuf);
      url = `${BASE}/tmp-stage-qa/${stageId}.png`;
      precedingImageUrl = url;
      source = "deterministic-fallback-qa";
    }

    if (img?.fallback || source.includes("fallback")) degraded = true;

    report.push({
      stageId,
      httpStatus: stageRes.status,
      source,
      fallback: Boolean(img?.fallback) || source.includes("fallback"),
      degraded: Boolean(img?.fallback) || source.includes("fallback"),
      validated: Boolean(img?.validated),
      compositionSeverity: img?.validation?.severity ?? null,
      progressSeverity: img?.stageProgress?.severity ?? null,
      structureScore: img?.structureSimilarity?.score ?? null,
      priorMarks: img?.stageProgress?.checks?.priorMarksRetained ?? null,
      prematureDetail: img?.stageProgress?.checks?.prematureDetail ?? null,
      reasons: [
        ...(img?.validation?.reasons ?? []),
        ...(img?.stageProgress?.reasons ?? []),
      ],
      file: url ? file : null,
      url,
    });
  }

  const reportPath = path.join(OUT, "report.json");
  const mustBeAi = ["value-study", "first-wash", "second-wash", "refinement"];
  const aiOk = mustBeAi.every((id) => {
    const row = report.find((r) => r.stageId === id);
    return row && row.source === "ai" && !row.fallback;
  });

  fs.writeFileSync(
    reportPath,
    JSON.stringify({ base: BASE, degraded: !aiOk || degraded, pipelineSuccess: aiOk, report }, null, 2),
  );
  console.log("\n=== STAGE QA REPORT ===");
  for (const row of report) {
    console.log(
      `${row.stageId}: source=${row.source} degraded=${row.degraded} validated=${row.validated} comp=${row.compositionSeverity} progress=${row.progressSeverity} structure=${row.structureScore ?? "n/a"} priorMarks=${row.priorMarks ?? "n/a"} premature=${row.prematureDetail ?? "n/a"} url=${row.url ?? "(none)"}`,
    );
    if (row.reasons?.length) console.log("  reasons:", row.reasons.join("; "));
  }
  console.log("Wrote", reportPath);
  console.log(aiOk ? "PIPELINE SUCCESS: Values→Refine are accepted AI edits." : "PIPELINE DEGRADED: Values→Refine must be AI-accepted (fallbacks do not count as success).");
  process.exit(aiOk ? 0 : 2);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
