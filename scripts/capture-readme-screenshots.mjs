// Captures the README gallery from the production build (`npm run build` then
// `npx vite preview --port 4173`). Uses the live Quran.com API so the Quran
// text and the Tajweed colours shown are the real ones. Output: docs/images/raw/*.png
// (convert with scripts/build-readme-images.py).
import fs from "node:fs";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4173";
const OUT = "docs/images/raw";
fs.mkdirSync(OUT, { recursive: true });

const DESKTOP = { width: 1360, height: 860 };
const PHONE = { width: 390, height: 844 };
const TABLET = { width: 820, height: 1180 }; // portrait: bottom navigation layout
const TABLET_WIDE = { width: 1180, height: 820 }; // landscape: desktop header
const base = { skipSplashAnimation: true, lang: "fr", riwaya: "hafs", theme: "light", showTajwid: true, fontFamily: "qpc-hafs" };

const SHOTS = [
  { name: "home-desktop", url: "/", viewport: DESKTOP, settings: { showHome: true } },
  { name: "reader-list-desktop", url: "/surah/2", viewport: DESKTOP, settings: { showHome: false, displayMode: "surah", mushafLayout: "list" }, scrollTo: "#ayah-2" },
  { name: "reader-mushaf-desktop", url: "/surah/2", viewport: DESKTOP, settings: { showHome: false, displayMode: "surah", mushafLayout: "mushaf" } },
  { name: "reader-mushaf-dark", url: "/page/50", viewport: DESKTOP, settings: { showHome: false, displayMode: "page", mushafLayout: "mushaf", theme: "dark" } },
  { name: "reader-warsh", url: "/surah/3", viewport: DESKTOP, settings: { showHome: false, riwaya: "warsh", fontFamily: "qpc-warsh", displayMode: "surah", mushafLayout: "mushaf" } },
  { name: "home-mobile", url: "/", viewport: PHONE, settings: { showHome: true }, mobile: true },
  { name: "reader-mobile", url: "/surah/1", viewport: PHONE, settings: { showHome: false, displayMode: "surah", mushafLayout: "list" }, mobile: true, reveal: true },
  { name: "reader-arabic-mobile", url: "/surah/112", viewport: PHONE, settings: { showHome: false, lang: "ar", displayMode: "surah", mushafLayout: "list", theme: "sepia" }, mobile: true, reveal: true },
  { name: "audio-mobile", url: "/", viewport: PHONE, settings: { showHome: true }, mobile: true, openAudio: true },
  { name: "menu-mobile", url: "/surah/2", viewport: PHONE, settings: { showHome: false, displayMode: "surah", mushafLayout: "list", theme: "dark" }, mobile: true, reveal: true, openMore: true },
  { name: "reader-mushaf-mobile", url: "/surah/2", viewport: PHONE, settings: { showHome: false, displayMode: "surah", mushafLayout: "mushaf" }, mobile: true, reveal: true },
  { name: "search-mobile", url: "/surah/2", viewport: PHONE, settings: { showHome: false, displayMode: "surah", mushafLayout: "list" }, mobile: true, reveal: true, mobileTool: "search" },
  { name: "settings-mobile", url: "/surah/2", viewport: PHONE, settings: { showHome: false, displayMode: "surah", mushafLayout: "list" }, mobile: true, reveal: true, mobileTool: "settings" },
  { name: "home-tablet", url: "/", viewport: TABLET, settings: { showHome: true }, mobile: true },
  { name: "reader-mushaf-tablet", url: "/surah/2", viewport: TABLET, settings: { showHome: false, displayMode: "surah", mushafLayout: "mushaf" }, mobile: true, reveal: true },
  { name: "reader-list-tablet", url: "/surah/2", viewport: TABLET, settings: { showHome: false, displayMode: "surah", mushafLayout: "list", theme: "sepia" }, mobile: true, reveal: true },
  { name: "audio-tablet", url: "/", viewport: TABLET, settings: { showHome: true }, mobile: true, openAudio: true },
  { name: "reader-tablet-wide-dark", url: "/surah/3", viewport: TABLET_WIDE, settings: { showHome: false, displayMode: "surah", mushafLayout: "mushaf", theme: "dark" }, mobile: true },
  { name: "reader-tablet-wide", url: "/surah/2", viewport: TABLET_WIDE, settings: { showHome: false, displayMode: "surah", mushafLayout: "list" }, mobile: true },
  { name: "audio-desktop", url: "/", viewport: DESKTOP, settings: { showHome: true }, openAudioTab: true },
  { name: "search-desktop", url: "/surah/2", viewport: DESKTOP, settings: { showHome: false, displayMode: "surah", mushafLayout: "list" }, openSearch: true },
  { name: "search-auto-desktop", url: "/surah/2", viewport: DESKTOP, settings: { showHome: false, displayMode: "surah", mushafLayout: "list" }, openSearch: true, query: "le tout miséricordieux" },
  { name: "search-auto-mobile", url: "/surah/2", viewport: PHONE, settings: { showHome: false, displayMode: "surah", mushafLayout: "list", theme: "dark" }, mobile: true, reveal: true, mobileTool: "search", query: "Bismillahirrahmanirrahim" },
  { name: "about-desktop", url: "/about", viewport: DESKTOP, settings: { showHome: false } },
  { name: "about-mobile", url: "/privacy", viewport: PHONE, settings: { showHome: false }, mobile: true },
  { name: "splash-mobile", url: "/", viewport: PHONE, settings: { showHome: true, theme: "dark" }, mobile: true, splashFrame: 1100, freshStorage: true },
  { name: "prayers-mobile", url: "/prieres", viewport: PHONE, settings: { showHome: false, prayerTimesEnabled: true, prayerMethod: 12, prayerLocation: { latitude: 48.8566, longitude: 2.3522, label: "Paris" } }, mobile: true },
  { name: "reciter-mobile", url: "/", viewport: PHONE, settings: { showHome: true }, mobile: true, openReciter: true },
  { name: "reciter-tablet", url: "/", viewport: TABLET, settings: { showHome: true }, mobile: true, openReciter: true },
  { name: "duas-mobile", url: "/duas", viewport: PHONE, settings: { showHome: false }, mobile: true },
  { name: "settings-desktop", url: "/surah/2", viewport: DESKTOP, settings: { showHome: false, displayMode: "surah", mushafLayout: "list" }, openSettings: true },
];

const only = process.env.ONLY?.split(",");
const browser = await chromium.launch();
for (const shot of SHOTS) {
  if (only && !only.includes(shot.name)) continue;
  const context = await browser.newContext({ viewport: shot.viewport, deviceScaleFactor: shot.mobile ? 2 : 1.5, serviceWorkers: "block", reducedMotion: shot.splashFrame ? "no-preference" : "reduce", locale: "fr-FR", timezoneId: "Europe/Paris" });
  const page = await context.newPage();
  const settings = { ...base, ...shot.settings };
  if (shot.splashFrame) {
    // Hold the splash and freeze its animations at a given moment of the sequence.
    delete settings.skipSplashAnimation;
    await page.addInitScript(() => { const st = window.setTimeout; window.setTimeout = (f, d, ...a) => st(f, d >= 400 ? d * 40 : d, ...a); });
  }
  await page.addInitScript((s) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(s)), settings);
  await page.goto(BASE + shot.url, { waitUntil: "domcontentloaded" });
  if (shot.splashFrame) {
    await page.waitForSelector(".sp-root", { timeout: 20000 });
    await page.evaluate((t) => { for (const a of document.getAnimations()) { a.pause(); const d = a.effect.getComputedTiming(); a.currentTime = Math.min(t, d.endTime === Infinity ? t : d.endTime); } }, shot.splashFrame);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}/${shot.name}.png`, animations: "allow" });
    console.log("captured", shot.name);
    await context.close();
    continue;
  }
  await page.waitForSelector("#main-content", { timeout: 40000 });
  await page.waitForTimeout(shot.url === "/" ? 3500 : 7000);
  if (shot.scrollTo) await page.locator(shot.scrollTo).scrollIntoViewIfNeeded().catch(() => {});
  if (shot.reveal) await page.locator("#main-content").click({ position: { x: 4, y: 180 } }).catch(() => {});
  try {
    if (shot.openAudio) {
      await page.locator('.mobile-navigation [data-destination="audio"]').click({ timeout: 4000 });
      await page.waitForTimeout(2500);
    }
    if (shot.openReciter) {
      if (shot.viewport.width <= 1024) await page.locator('.mobile-navigation [data-destination="audio"]').click({ timeout: 4000 });
      await page.waitForTimeout(2000);
      await page.locator(".reciter-card__main").first().click({ timeout: 4000 });
      await page.waitForTimeout(2500);
    }
    if (shot.openAudioTab) {
      await page.getByRole("tab", { name: "Audio", exact: true }).click({ timeout: 4000 });
      await page.waitForTimeout(2500);
    }
    if (shot.mobileTool) {
      await page.locator('.mobile-navigation [data-destination="more"]').click({ timeout: 4000 });
      await page.locator(`.mobile-navigation-menu [data-tool="${shot.mobileTool}"]`).click({ timeout: 4000 });
      await page.waitForTimeout(1500);
    }
    if (shot.openMore) await page.locator('.mobile-navigation [data-destination="more"]').click({ timeout: 4000 });
    if (shot.openSearch) await page.locator(".mp-header__search").first().click({ timeout: 4000 });
    if (shot.openSettings) {
      const direct = page.locator(".mp-header__settings").first();
      if (await direct.isVisible().catch(() => false)) await direct.click({ timeout: 4000 });
      else {
        await page.locator(".mp-header__more").first().click({ timeout: 4000 });
        await page.locator('.mp-header-menu__item[data-key="settings"]').click({ timeout: 4000 });
      }
    }
  } catch (error) {
    console.error(`[shot] ${shot.name}: overlay not opened (${error.message.split("\n")[0]})`);
  }
  if (shot.query) {
    await page.locator("#quran-search-input").fill(shot.query).catch(() => {});
    await page.waitForTimeout(4500);
  }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${shot.name}.png`, animations: "disabled" });
  console.log("captured", shot.name);
  await context.close();
}
await browser.close();
