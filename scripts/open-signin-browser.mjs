/**
 * Open a visible headed Chromium window for manual sign-in.
 * Keeps the window open indefinitely — no E2E, no auth timeout.
 *
 * Usage: node scripts/open-signin-browser.mjs
 */
import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const BASE = process.env.E2E_BASE_URL || "http://localhost:3000";
const PROFILE = path.resolve("docs/stability-shots/pw-signin-profile");
fs.mkdirSync(PROFILE, { recursive: true });

const context = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  // Prefer installed Google Chrome so the window is visible on Windows.
  channel: "chrome",
  viewport: null,
  args: [
    "--start-maximized",
    "--disable-blink-features=AutomationControlled",
    "--new-window",
  ],
});

const page = context.pages()[0] || (await context.newPage());
await page.bringToFront();
await page.goto(`${BASE}/studio`, { waitUntil: "domcontentloaded", timeout: 90_000 });
await page.bringToFront();

console.log(
  JSON.stringify({
    event: "signin_browser_ready",
    url: page.url(),
    profile: PROFILE,
    message: "Window is open at /studio. Sign in, then tell the agent you are signed in. E2E will not start until then.",
  }),
);

await new Promise(() => {});
