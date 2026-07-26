/**
 * Capture stability-preview screenshots at required viewports.
 * Usage: node scripts/stability-viewport-shots.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.ARTPRAXIS_BASE_URL || "http://localhost:3000";
const OUT = path.resolve("docs/stability-shots");

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900 },
  { name: "desktop-1280x800", width: 1280, height: 800 },
  { name: "compact-1024x768", width: 1024, height: 768 },
  { name: "tablet-768x1024", width: 768, height: 1024 },
  { name: "mobile-390x844", width: 390, height: 844 },
  { name: "mobile-375x667", width: 375, height: 667 },
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

async function capture(routeKey, setup) {
  await page.goto(`${BASE}/stability-preview`, {
    waitUntil: "networkidle",
    timeout: 180000,
  });
  await page.waitForTimeout(1200);
  if (setup) await setup();
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(400);
    const file = path.join(OUT, `${routeKey}--${vp.name}.png`);
    await page.screenshot({ path: file, fullPage: true });
    console.log("wrote", file);
  }
}

try {
  await capture("overview", async () => {
    await page.getByRole("tab", { name: "Overview" }).click();
    await page.waitForTimeout(400);
  });

  await capture("lesson", async () => {
    await page.getByRole("tab", { name: "Lesson" }).click();
    await page.waitForTimeout(800);
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/stability-preview`, {
    waitUntil: "networkidle",
    timeout: 180000,
  });
  await page.getByRole("tab", { name: "Lesson" }).click();
  await page.waitForTimeout(800);

  const audit = await page.evaluate(() => {
    const q = (sel) => document.querySelectorAll(sel).length;
    const textButtons = Array.from(document.querySelectorAll("button")).map(
      (el) => (el.textContent || "").trim(),
    );
    return {
      lessonHeaders: q(".lesson-shell-head"),
      titleCount: q(".lesson-shell-title"),
      tablists: q('[role="tablist"]'),
      stageNav: q(".stage-scroll-nav"),
      processRail: q(".stage-process, .stage-journey, .stage-process-rail"),
      modeSwitch: q(".mode-switch"),
      stageSections: q(".study-stage-section"),
      resumeCtas: textButtons.filter((t) =>
        /Begin lesson|Resume lesson|Review lesson/i.test(t),
      ).length,
      stickyStageNav: (() => {
        const nav = document.querySelector(".stage-scroll-nav");
        return nav ? getComputedStyle(nav).position : null;
      })(),
      stickyTabs: (() => {
        const tabs = document.querySelector(".project-tabs");
        return tabs ? getComputedStyle(tabs).position : null;
      })(),
    };
  });
  fs.writeFileSync(path.join(OUT, "dom-audit.json"), JSON.stringify(audit, null, 2));
  console.log("audit", audit);

  if (audit.processRail > 0) throw new Error("Legacy process rail still in DOM");
  if (audit.modeSwitch > 0) throw new Error("Study/Paint mode switch still present");
  if (audit.stageNav !== 1) throw new Error(`Expected 1 stage nav, got ${audit.stageNav}`);
  if (audit.stickyStageNav !== "static") {
    throw new Error(`Expected static stage nav, got ${audit.stickyStageNav}`);
  }
} finally {
  await browser.close();
}
