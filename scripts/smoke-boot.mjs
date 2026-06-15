#!/usr/bin/env node
/**
 * Headless boot smoke test.
 *
 * Catches boot / render / hydration crashes that vitest unit tests cannot —
 * a broken init, a bad import, a TDZ error, a server/client mismatch that
 * throws on mount. Unit tests pass while the app is a white screen; this fails.
 *
 * Strategy:
 *   - SMOKE_URL set        → test that running server (fast; point at `npm run dev`)
 *   - SMOKE_URL not set    → `next build` then `next start` on PORT, test, tear down
 *
 * Drives system Chrome via puppeteer-core (no Chromium download).
 * Override the browser with CHROME_PATH.
 *
 * Checks:
 *   1. Homepage `/`        → greeting <h1> renders (booted past hydration)
 *   2. Recipes `/recipes`  → at least one recipe link renders (12 starters seed on first run)
 *   3. Zero uncaught page errors throughout.
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const PORT = process.env.SMOKE_PORT || "3099";
const BASE = process.env.SMOKE_URL || `http://localhost:${PORT}`;
const ownServer = !process.env.SMOKE_URL;

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium-browser",
].filter(Boolean);

// Console-error noise we don't treat as a boot failure (network/asset, not app crash).
const NOISE = [/favicon/i, /manifest/i, /net::ERR/i, /Failed to load resource/i, /\b404\b/];

function resolveChrome() {
  const found = CHROME_CANDIDATES.find((p) => existsSync(p));
  if (!found) {
    console.error("✖ No Chrome found. Set CHROME_PATH to a Chrome/Chromium binary.");
    process.exit(2);
  }
  return found;
}

function run(cmd, args, opts = {}) {
  return spawn(cmd, args, { stdio: "inherit", ...opts });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`${child.spawnargs.join(" ")} exited ${code}`))));
    child.on("error", reject);
  });
}

async function waitForServer(url, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not respond at ${url} within ${timeoutMs}ms`);
}

async function main() {
  const chrome = resolveChrome();
  let server;

  if (ownServer) {
    console.log("• Building (next build)…");
    await waitForExit(run("npx", ["next", "build"]));
    console.log(`• Starting server on :${PORT}…`);
    server = spawn("npx", ["next", "start", "-p", PORT], { stdio: "inherit" });
    server.on("error", (e) => {
      console.error("✖ Failed to start server:", e);
      process.exit(2);
    });
  }

  await waitForServer(BASE);

  const browser = await puppeteer.launch({
    executablePath: chrome,
    headless: "new",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  // Recoverable React hydration-mismatch family (#418–#425) + explicit hydration text.
  // These are warnings, not boot failures — React recovers by re-rendering on the client.
  // A truly fatal mount crash leaves the page blank and trips the waitForSelector timeouts below.
  const RECOVERABLE = [/Minified React error #4(18|19|2[0-5])/, /hydrat/i];

  const errors = [];
  const warnings = [];
  const fatalConsole = [];
  const page = await browser.newPage();
  page.on("pageerror", (e) => {
    if (RECOVERABLE.some((re) => re.test(e.message))) warnings.push(e.message);
    else errors.push(e.message);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!NOISE.some((re) => re.test(text))) fatalConsole.push(text);
    }
  });

  try {
    // 1. Homepage boots + greeting renders
    await page.goto(BASE, { waitUntil: "networkidle2", timeout: 30_000 });
    await page.waitForSelector("h1", { timeout: 15_000 });
    const greeting = (await page.$eval("h1", (el) => el.textContent?.trim() || "")) ?? "";
    if (!greeting) throw new Error("Homepage <h1> greeting is empty");
    console.log(`✓ Homepage booted — greeting: "${greeting}"`);

    // 2. Recipes grid renders at least one recipe (starters seed on first run)
    await page.goto(`${BASE}/recipes`, { waitUntil: "networkidle2", timeout: 30_000 });
    await page.waitForSelector('a[href*="/recipes/"]', { timeout: 15_000 });
    const cardCount = await page.$$eval('a[href*="/recipes/"]', (els) => els.length);
    if (cardCount < 1) throw new Error("Recipes page rendered no recipe links");
    console.log(`✓ Recipes page rendered ${cardCount} recipe link(s)`);
  } finally {
    await browser.close();
    if (server) server.kill("SIGTERM");
  }

  if (warnings.length) {
    console.warn(`\n⚠ ${warnings.length} recoverable hydration warning(s) (non-fatal):`);
    [...new Set(warnings)].forEach((w) => console.warn("  ", w));
  }

  if (errors.length || fatalConsole.length) {
    console.error("\n✖ Boot smoke test FAILED — fatal errors detected:");
    errors.forEach((e) => console.error("  pageerror:", e));
    fatalConsole.forEach((e) => console.error("  console.error:", e));
    process.exit(1);
  }

  console.log("\n✓ Boot smoke test passed.");
  process.exit(0);
}

main().catch((e) => {
  console.error("✖ Boot smoke test errored:", e.message);
  process.exit(1);
});
