import { spawn } from "node:child_process";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const baseURL = "http://127.0.0.1:4173";
await mkdir(publicDir, { recursive: true });

const preview = spawn(
  process.execPath,
  ["node_modules/vite/bin/vite.js", "preview", "--host", "127.0.0.1", "--port", "4173"],
  { cwd: rootDir, stdio: "ignore", windowsHide: true },
);

async function waitForPreview() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(baseURL);
      if (response.ok) return;
    } catch {
      // Preview is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Vite preview did not start in time");
}

const seed = {
  splashDone: true,
  showHome: true,
  showDuas: false,
  lang: "fr",
  theme: "light",
  riwaya: "hafs",
};

let browser;
try {
  await waitForPreview();
  browser = await chromium.launch({ headless: true });
  for (const target of [
    { name: "pwa-home-wide.png", width: 1440, height: 900, isMobile: false },
    { name: "pwa-home-mobile.png", width: 390, height: 844, isMobile: true },
  ]) {
    const context = await browser.newContext({
      viewport: { width: target.width, height: target.height },
      isMobile: target.isMobile,
      hasTouch: target.isMobile,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.addInitScript((settings) => {
      localStorage.setItem("mushaf-plus-settings", JSON.stringify(settings));
    }, seed);
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.locator(".app-view-home").waitFor({ state: "visible" });
    await page.screenshot({
      path: path.join(publicDir, target.name),
      fullPage: false,
      animations: "disabled",
    });
    await context.close();
  }
  console.log("[pwa] Captures wide et mobile générées dans public/.");
} finally {
  await browser?.close();
  preview.kill();
}
