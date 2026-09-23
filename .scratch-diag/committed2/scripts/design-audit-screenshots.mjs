/**
 * Design audit screenshots — captures all major views in light, dark, sepia.
 * Run: node scripts/design-audit-screenshots.mjs
 * Requires: vite preview running on port 4173 OR 4174.
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = path.resolve("design-audit");
await mkdir(OUT_DIR, { recursive: true });

const THEMES = ["light", "dark", "sepia"];
const SETTINGS_KEY = "mushaf-plus-settings";

const VIEWS = [
  { name: "home", path: "/", waitFor: ".hp-hero, .app-home" },
  { name: "surah-reader", path: "/surah/2", waitFor: ".quran-display--platform, .rd-surah-header" },
  { name: "mushaf-mode", path: "/surah/1", waitFor: ".cpv-container, .quran-display--platform", extra: async (page) => {
    // Switch to mushaf view if possible
    const mushafBtn = page.locator('[aria-label*="Mushaf"], [aria-label*="mushaf"], [data-view-toggle="mushaf"]').first();
    if (await mushafBtn.isVisible().catch(() => false)) await mushafBtn.click().catch(() => {});
    await page.waitForTimeout(500);
  }},
  { name: "settings", path: "/", waitFor: ".settings-drawer, [role=dialog]", extra: async (page) => {
    await page.waitForTimeout(800);
    const settingsBtn = page.locator('[aria-label*="Paramètres"], [aria-label*="Settings"], [aria-label*="réglages"]').first();
    if (await settingsBtn.isVisible().catch(() => false)) await settingsBtn.click().catch(() => {});
    await page.waitForTimeout(600);
  }},
  { name: "sidebar", path: "/", waitFor: ".mp-sidebar, .sidebar", extra: async (page) => {
    await page.waitForTimeout(800);
    const menuBtn = page.locator('[aria-label*="Menu"], button[aria-label*="sidebar"], [aria-label*="liste"]').first();
    if (await menuBtn.isVisible().catch(() => false)) await menuBtn.click().catch(() => {});
    await page.waitForTimeout(600);
  }},
  { name: "audio-player", path: "/surah/1", waitFor: ".mp-audio-player, .ap-simple" },
  { name: "search", path: "/", waitFor: ".search-modal, [role=dialog]", extra: async (page) => {
    await page.waitForTimeout(800);
    const searchBtn = page.locator('[aria-label*="Recherche"], [aria-label*="Search"]').first();
    if (await searchBtn.isVisible().catch(() => false)) await searchBtn.click().catch(() => {});
    await page.waitForTimeout(600);
  }},
];

const VIEWPORTS = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

// Try both preview ports
const BASE_URLS = ["http://127.0.0.1:4173", "http://127.0.0.1:4174"];

let baseUrl = null;
{
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  for (const url of BASE_URLS) {
    try {
      const res = await page.goto(url, { timeout: 4000, waitUntil: "domcontentloaded" });
      if (res && res.ok()) { baseUrl = url; break; }
    } catch {}
  }
  await browser.close();
}

if (!baseUrl) {
  console.error("No preview server found on 4173 or 4174. Run: npm run preview");
  process.exit(1);
}
console.log(`Using base URL: ${baseUrl}`);

const browser = await chromium.launch({ headless: true });

let total = 0;
for (const vp of VIEWPORTS) {
  for (const theme of THEMES) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
    });
    const page = await ctx.newPage();

    // Inject settings before each page load
    await page.addInitScript(({ key, theme }) => {
      window.localStorage.setItem(key, JSON.stringify({
        lang: "fr",
        theme,
        riwaya: "hafs",
        reciter: "ar.alafasy",
        showHome: true,
        splashDone: true,
      }));
    }, { key: SETTINGS_KEY, theme });

    for (const view of VIEWS) {
      try {
        await page.goto(`${baseUrl}${view.path}`, { waitUntil: "domcontentloaded", timeout: 12000 });
        await page.waitForTimeout(900);
        if (view.waitFor) {
          await page.waitForSelector(view.waitFor, { timeout: 5000 }).catch(() => {});
        }
        if (view.extra) await view.extra(page).catch(() => {});
        await page.waitForTimeout(400);

        const filename = `${vp.name}_${theme}_${view.name}.png`;
        await page.screenshot({ path: path.join(OUT_DIR, filename), fullPage: false });
        console.log(`  ✓ ${filename}`);
        total++;
      } catch (e) {
        console.warn(`  ✗ ${vp.name}/${theme}/${view.name}: ${e.message}`);
      }
    }
    await ctx.close();
  }
}

await browser.close();
console.log(`\nDone — ${total} screenshots in ${OUT_DIR}/`);
