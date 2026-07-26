/**
 * Phase 6 E2E via Chrome CDP on the dedicated sign-in profile.
 * Does not kill an already-authenticated session mid-flight when possible.
 */
import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { setTimeout as sleep } from "timers/promises";

// Use localhost (not 127.0.0.1): Firebase Auth only authorizes `localhost` by default.
const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const EXISTING = "z18kzOR6So0eV1xCQQRc";
const OUT = path.resolve("docs/stability-shots");
const PROFILE = path.resolve("docs/stability-shots/chrome-signin-profile-localhost");
const CDP_PORT = Number(process.env.E2E_CDP_PORT || 9222);
const CDP = `http://127.0.0.1:${CDP_PORT}`;
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(PROFILE, { recursive: true });

function log(obj) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...obj }));
}

function findChrome() {
  const candidates = [
    process.env.PROGRAMFILES && path.join(process.env.PROGRAMFILES, "Google/Chrome/Application/chrome.exe"),
    process.env["PROGRAMFILES(X86)"] && path.join(process.env["PROGRAMFILES(X86)"], "Google/Chrome/Application/chrome.exe"),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "Google/Chrome/Application/chrome.exe"),
  ].filter(Boolean);
  return candidates.find((p) => fs.existsSync(p));
}

async function cdpUp() {
  try {
    const res = await fetch(`${CDP}/json/version`);
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureChrome() {
  if (await cdpUp()) {
    log({ event: "cdp_already_up", cdp: CDP });
    return;
  }
  const chrome = findChrome();
  if (!chrome) throw new Error("Google Chrome not found");
  log({ event: "launch_chrome_cdp", chrome, profile: PROFILE, port: CDP_PORT });
  spawn(
    chrome,
    [
      `--remote-debugging-port=${CDP_PORT}`,
      `--user-data-dir=${PROFILE}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-session-crashed-bubble",
      "--hide-crash-restore-bubble",
      "--start-maximized",
      `${BASE}/studio`,
    ],
    { detached: true, stdio: "ignore" },
  ).unref();
  for (let i = 0; i < 40; i++) {
    if (await cdpUp()) return;
    await sleep(500);
  }
  throw new Error("Chrome CDP did not become ready");
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
  if (await lessonTab.count() && !(await lessonTab.isDisabled().catch(() => true))) {
    await lessonTab.click().catch(() => null);
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
    if (last.studyMode && last.stageSections >= 6 && !last.preparing && !last.lessonLoading) return last;
    if (last.notFound) return last;
    await page.waitForTimeout(3000);
  }
  return last;
}

async function auditLesson(page, lessonId, label, waitForReady) {
  const targetPath = `/studio/lessons/${lessonId}`;
  const alreadyOnLesson = page.url().includes(targetPath);
  // Do not reload when already on the lesson — a mid-generation reload orphans the
  // Firestore lease for up to ~2 minutes and races LessonView retries.
  if (!alreadyOnLesson) {
    await page.goto(`${BASE}${targetPath}`, { waitUntil: "domcontentloaded", timeout: 60_000 });
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
  // Only refresh-test when ready — reloading mid-generation orphans the lease.
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

  await ensureChrome();
  const browser = await chromium.connectOverCDP(CDP);
  const context = browser.contexts()[0] || (await browser.newContext());
  let page =
    context.pages().find((p) => /localhost|127\.0\.0\.1/.test(p.url())) ||
    context.pages()[0] ||
    (await context.newPage());

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
  await page.waitForTimeout(2000);
  await shot(page, "e2e-studio-entry.png");

  if (!(await isSignedIn(page))) {
    log({
      event: "awaiting_sign_in_in_cdp_chrome",
      message: "Sign in with Google in the Chrome window (debugging profile), then keep this script running.",
    });
    // Poll without a hard short fail — user said they signed in; give time to finish popup.
    const start = Date.now();
    while (Date.now() - start < 180_000) {
      if (await isSignedIn(page)) break;
      await page.waitForTimeout(2000);
    }
  }

  if (!(await isSignedIn(page))) {
    log({ event: "not_signed_in", url: page.url() });
    process.exit(2);
  }
  log({ event: "auth_ok" });
  await shot(page, "e2e-studio-authed.png");

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
    await page.waitForTimeout(1200);
    await page.locator("#creator-reference-input, input[type='file']").first().setInputFiles(fixture);
    await page.waitForTimeout(1000);
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
      });
    }
  }

  const okExisting =
    !!existing.probe.studyMode &&
    existing.probe.stageSections === 6 &&
    !existing.probe.preparing &&
    !existing.probe.lessonLoading &&
    !existing.probe.finalPaintingPlaceholder &&
    existing.afterRefresh.studyMode &&
    existing.afterRefresh.stageSections === 6 &&
    existingGenNoise.length === 0;

  const okNew = created
    ? !!created.probe.studyMode &&
      created.probe.stageSections === 6 &&
      !created.probe.preparing &&
      // One soft lease retry is normal under React Strict Mode / brief races.
      // Fail only on a stuck lease loop.
      (created.orchestration?.leaseLoops ?? 0) <= 2 &&
      created.afterRefresh.studyMode &&
      created.afterRefresh.stageSections === 6
    : false;

  const report = {
    okExisting,
    okNew,
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
  process.exit(okExisting && okNew ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
