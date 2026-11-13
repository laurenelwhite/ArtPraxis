import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildLessonDocumentSteps } from "../src/lib/lesson-document.ts";

const ROOT = process.cwd();

async function source(path: string) {
  return readFile(`${ROOT}/${path}`, "utf8");
}

test("public metadata and private indexing boundaries stay explicit", async () => {
  const [rootLayout, appLayout, robots] = await Promise.all([
    source("src/app/layout.tsx"),
    source("src/app/(app)/layout.tsx"),
    source("src/app/robots.ts"),
  ]);

  assert.match(rootLayout, /Personalized art lessons from any reference/);
  assert.match(rootLayout, /NEXT_PUBLIC_SITE_URL/);
  assert.match(appLayout, /index:\s*false/);
  assert.match(appLayout, /follow:\s*false/);
  assert.match(robots, /"\/api\/"/);
  assert.match(robots, /"\/studio\/"/);
  assert.match(robots, /"\/stability-preview"/);
});

test("baseline response security headers remain configured", async () => {
  const config = await source("next.config.ts");

  for (const header of [
    "X-Content-Type-Options",
    "X-Frame-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ]) {
    assert.match(config, new RegExp(header));
  }
  assert.match(config, /Cache-Control/);
  assert.match(config, /private, no-store/);
  assert.match(config, /Vary/);
  assert.match(config, /Authorization/);
});

test("keyboard users retain a direct path to primary content", async () => {
  const [landing, shell] = await Promise.all([
    source("src/components/LandingMasthead.tsx"),
    source("src/components/shell/AppShell.tsx"),
  ]);

  assert.match(landing, /Skip to main content/);
  assert.match(landing, /#main-content/);
  assert.match(shell, /Skip to main content/);
  assert.match(shell, /#app-main/);
});

test("lesson tabs retain roving keyboard navigation", async () => {
  const tabs = await source("src/components/shell/LessonShell.tsx");

  assert.match(tabs, /ArrowRight/);
  assert.match(tabs, /ArrowLeft/);
  assert.match(tabs, /Home/);
  assert.match(tabs, /End/);
  assert.match(tabs, /onKeyDown/);
});

test("production template references a secret instead of embedding an OpenAI key", async () => {
  const production = await source("apphosting.production.example.yaml");

  assert.match(production, /variable:\s*OPENAI_API_KEY\s*\r?\n\s*secret:/);
  assert.doesNotMatch(production, /variable:\s*OPENAI_API_KEY\s*\r?\n\s*value:/);
  assert.match(production, /GEN_QUOTA_TUTORIALS_PER_DAY/);
  assert.match(production, /GEN_QUOTA_MAX_CONCURRENT/);
});

test("production rollout has an explicit placeholder and quota guard", async () => {
  const [packageJson, validator] = await Promise.all([
    source("package.json"),
    source("scripts/validate-production-config.mjs"),
  ]);

  assert.match(packageJson, /validate:production/);
  assert.match(validator, /CHANGE_ME/);
  assert.match(validator, /OPENAI_API_KEY/);
  assert.match(validator, /NEXT_PUBLIC_SITE_URL/);
  assert.match(validator, /GEN_QUOTA_TUTORIALS_PER_DAY/);
  assert.match(validator, /GEN_QUOTA_MAX_CONCURRENT/);
});

test("learner-facing source avoids perfection language and legacy AI Coach naming", async () => {
  const files = await Promise.all([
    source("src/components/dashboard/EmptyState.tsx"),
    source("src/app/(app)/studio/coach/page.tsx"),
    source("src/components/project/ProjectOverview.tsx"),
    source("src/components/progression/LessonPlanSection.tsx"),
  ]);
  const combined = files.join("\n");

  assert.doesNotMatch(combined, /masterpiece/i);
  assert.doesNotMatch(combined, /AI Coach/);
  assert.match(combined, /finished study/i);
  assert.match(combined, /Skills practiced/);
});

test("drawing lessons omit the paint-only Color chapter", () => {
  const watercolor = buildLessonDocumentSteps("watercolor");
  const charcoal = buildLessonDocumentSteps("charcoal");

  assert.ok(watercolor.some((step) => step.id === "color"));
  assert.ok(!charcoal.some((step) => step.id === "color"));
  assert.deepEqual(
    charcoal.map((step) => step.number),
    charcoal.map((_, index) => index + 1),
  );
});
