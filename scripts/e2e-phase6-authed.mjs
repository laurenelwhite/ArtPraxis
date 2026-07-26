/**
 * Phase 6 authenticated E2E using the dedicated Chrome sign-in profile.
 * Assumes the user has already signed in. Fails fast if not authenticated.
 *
 * Usage: node scripts/e2e-phase6-authed.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

// Use localhost (not 127.0.0.1): Firebase Auth only authorizes `localhost` by default.
const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const EXISTING = "z18kzOR6So0eV1xCQQRc";
const OUT = path.resolve("docs/stability-shots");
const PROFILE = path.resolve("docs/stability-shots/chrome-signin-profile-localhost");
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(PROFILE, { recursive: true });

function log(obj) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...obj }));
}

async function shot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false, timeout: 15_000 }).catch(() => null);
  return file;
}

async function isSignedIn(page) {
  const text = await page.locator("body").innerText().catch(() => "");
  if (/Need an account\? Sign up/i.test(text)) return false;
  if (await page.getByRole("heading", { name: /^Sign in$/i }).count()) return false;
  return (
    (await page.locator(".studio-dashboard, .lesson-shell, .dashboard-title, .app-shell").count()) > 0 ||
    (await page.getByRole("link", { name: /new lesson/i }).count()) > 0 ||
    /New lesson|Your lessons|Open atelier|Create a lesson/i.test(text)
  );
}

async function openLessonTab(page) {
  const lessonTab = page.locator("#lesson-tab-lesson").first();
  if (await lessonTab.count()) {
    if (!(await lessonTab.isDisabled().catch(() => true))) {
      await lessonTab.click().catch(() => null);
    }
  }
  await page.waitForTimeout(800);
}

async function lessonProbe(page) {
  return page.evaluate(() => {
    const body = document.body?.innerText || "";
    const tabs = Array.from(document.querySelectorAll('[role="tab"]')).map((el) => ({
      id: el.id,
      text: (el.textContent || "").trim().replace(/\s+/g, " "),
      disabled: el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true",
      selected: el.getAttribute("aria-selected") === "true",
    }));
    return {
      href: location.href,
      notFound: /Project not found/i.test(body),
      preparing: /Preparing your atelier|Painting your finished inspiration|Creating your lesson/i.test(body),
      studyingComposition: /Studying composition/i.test(body),
      studyMode: !!document.querySelector(".study-mode"),
      stageSections: document.querySelectorAll(".study-stage-section").length,
      stageScrollNav: !!document.querySelector(".stage-scroll-nav"),
      lessonLoading: !!document.querySelector(".lesson-loading-view, .atelier-wait-view"),
      finalPaintingPlaceholder: /Final painting arrives after review/i.test(body),
      hasMasterImg: Array.from(document.querySelectorAll("img")).some((img) =>
        /master\.webp|stages%2Fmaster/i.test(`${img.alt} ${img.currentSrc || img.src}`),
      ),
      tabs,
      lockedTabCount: tabs.filter((t) => t.disabled).length,
      bodySnippet: body.slice(0, 700),
    };
  });
}

async function waitUntilReady(page, timeoutMs = 300_000) {
  const start = Date.now();
  let last = await lessonProbe(page);
  while (Date.now() - start < timeoutMs) {
    await openLessonTab(page);
    last = await lessonProbe(page);
    log({
      event: "ready_poll",
      studyMode: last.studyMode,
      stages: last.stageSections,
      preparing: last.preparing,
      loading: last.lessonLoading,
    });
    if (last.studyMode && last.stageSections >= 6 && !last.preparing && !last.lessonLoading) {
      return last;
    }
    if (last.notFound) return last;
    await page.waitForTimeout(3000);
  }
  return last;
}

async function auditLesson(page, lessonId, label, waitForReady) {
  const targetPath = `/studio/lessons/${lessonId}`;
  const alreadyOnLesson = page.url().includes(targetPath);
  if (!alreadyOnLesson) {
    await page.goto(`${BASE}${targetPath}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForTimeout(2500);
  } else {
    await page.waitForTimeout(800);
  }
  await openLessonTab(page);
  let probe = waitForReady ? await waitUntilReady(page) : await lessonProbe(page);
  if (!waitForReady) {
    await page.waitForTimeout(2500);
    await openLessonTab(page);
    probe = await lessonProbe(page);
  }
  const screenshot = await shot(page, `${label}.png`);

  let afterRefresh = probe;
  let refreshShot = screenshot;
  if (probe.studyMode && probe.stageSections >= 6 && !probe.preparing) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.waitForTimeout(3500);
    await openLessonTab(page);
    afterRefresh = await lessonProbe(page);
    refreshShot = await shot(page, `${label}-refresh.png`);
  }
  return { lessonId, probe, afterRefresh, screenshot, refreshShot };
}

async function main() {
  const consoleErrors = [];
  const pageErrors = [];
  const failedRequests = [];
  const generationLogs = [];

  log({ event: "launch", profile: PROFILE, base: BASE });

  // Close competing Chrome instances using this profile so Playwright can attach.
  // (Best-effort; ignore failures.)
  try {
    const { execSync } = await import("child_process");
    execSync(
      `powershell -NoProfile -Command "Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*chrome-signin-profile*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }"`,
      { stdio: "ignore" },
    );
  } catch {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, 1500));

  const context = await chromium.launchPersistentContext(PROFILE, {
    headless: false,
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = context.pages()[0] || (await context.newPage());

  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error") consoleErrors.push(text.slice(0, 500));
    if (/LessonView|lesson-generation|progression|orchestrate|skipped_lease|hydration/i.test(text)) {
      generationLogs.push({ type: msg.type(), text: text.slice(0, 500) });
    }
  });
  page.on("pageerror", (err) => pageErrors.push(String(err).slice(0, 500)));
  page.on("response", (res) => {
    if (res.status() >= 400 && /\/api\/|generate-/i.test(res.url())) {
      failedRequests.push({ url: res.url().slice(0, 220), status: res.status() });
    }
  });

  await page.goto(`${BASE}/studio`, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(2500);
  await shot(page, "e2e-studio-entry.png");

  if (!(await isSignedIn(page))) {
    log({
      event: "not_signed_in",
      message: "Chrome profile is not authenticated. Sign in in the opened window, then re-run.",
      url: page.url(),
      snippet: (await page.locator("body").innerText().catch(() => "")).slice(0, 240),
    });
    // Leave window open for the user — do not close.
    process.exit(2);
  }
  log({ event: "auth_ok" });

  generationLogs.length = 0;
  const existing = await auditLesson(page, EXISTING, "e2e-existing-z18", false);
  const existingGenNoise = generationLogs.filter((g) =>
    /invoke_orchestrateProgression|generation_request_started|master_generation_started/i.test(g.text),
  );
  log({
    event: "existing_audit",
    studyMode: existing.probe.studyMode,
    stages: existing.probe.stageSections,
    preparing: existing.probe.preparing,
    loading: existing.probe.lessonLoading,
    placeholder: existing.probe.finalPaintingPlaceholder,
    hasMasterImg: existing.probe.hasMasterImg,
    lockedTabs: existing.probe.lockedTabCount,
    refreshStages: existing.afterRefresh.stageSections,
    refreshStudyMode: existing.afterRefresh.studyMode,
    regenAttempts: existingGenNoise.length,
    snippet: existing.probe.bodySnippet?.slice(0, 280),
  });

  const fixture = [
    path.resolve("docs/brand/artpraxis-brand-kit-final.png"),
    path.resolve("docs/forensics/after-desktop-paint.png"),
  ].find((p) => fs.existsSync(p));

  let created = null;
  generationLogs.length = 0;
  if (fixture) {
    log({ event: "new_lesson_start", fixture: path.basename(fixture) });
    await page.goto(`${BASE}/studio/new`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    await page.locator("#creator-reference-input, input[type='file']").first().setInputFiles(fixture);
    await page.waitForTimeout(1200);
    for (const text of ["Pastel", "Beginner"]) {
      const el = page.locator(`button:has-text("${text}"), label:has-text("${text}")`).first();
      if (await el.count()) await el.click().catch(() => null);
    }
    const gen = page.locator("button").filter({ hasText: /generate|create lesson|begin|start/i }).first();
    if (await gen.count()) await gen.click();
    else await page.locator("button.primary, button.btn-branded").first().click();

    await page.waitForURL(/\/studio\/lessons\/[\w-]+/, { timeout: 180_000 });
    const newId = page.url().match(/\/studio\/lessons\/([\w-]+)/)?.[1] ?? null;
    log({ event: "new_lesson_navigated", newId });
    if (newId) {
      created = await auditLesson(page, newId, "e2e-new-lesson", true);
      created.orchestration = {
        leaseLoops: generationLogs.filter((g) => /skipped_lease/i.test(g.text)).length,
        invokeCount: generationLogs.filter((g) =>
          /invoke_orchestrateProgression|generation_request_started/i.test(g.text),
        ).length,
        sample: generationLogs.slice(0, 40),
      };
      log({
        event: "new_audit",
        studyMode: created.probe.studyMode,
        stages: created.probe.stageSections,
        leaseLoops: created.orchestration.leaseLoops,
        invokeCount: created.orchestration.invokeCount,
        placeholder: created.probe.finalPaintingPlaceholder,
      });
    }
  } else {
    log({ event: "new_lesson_skipped", reason: "no_fixture" });
  }

  const okExisting =
    !!existing.probe.studyMode &&
    existing.probe.stageSections === 6 &&
    !existing.probe.preparing &&
    !existing.probe.lessonLoading &&
    !existing.probe.finalPaintingPlaceholder &&
    !existing.probe.notFound &&
    existing.afterRefresh.studyMode &&
    existing.afterRefresh.stageSections === 6 &&
    existingGenNoise.length === 0;

  const okNew = created
    ? !!created.probe.studyMode &&
      created.probe.stageSections === 6 &&
      !created.probe.preparing &&
      !created.probe.finalPaintingPlaceholder &&
      (created.orchestration?.leaseLoops ?? 0) <= 2 &&
      created.afterRefresh.studyMode &&
      created.afterRefresh.stageSections === 6
    : false;

  const report = {
    okExisting,
    okNew,
    commitHint: "a5887c9",
    existing,
    created,
    existingGenNoise,
    errors: {
      consoleErrors: consoleErrors.slice(0, 50),
      pageErrors: pageErrors.slice(0, 20),
      failedRequests: failedRequests.slice(0, 40),
    },
  };
  fs.writeFileSync(path.join(OUT, "e2e-phase6-report.json"), JSON.stringify(report, null, 2));
  log({ event: "done", okExisting, okNew, newId: created?.lessonId ?? null });
  await context.close();
  process.exit(okExisting && okNew ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
