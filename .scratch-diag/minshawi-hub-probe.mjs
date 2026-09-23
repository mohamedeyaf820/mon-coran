import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4187";
const SETTINGS_KEY = "mushaf-plus-settings";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1400 } });
const page = await ctx.newPage();

const imgs = [];
page.on("response", (res) => {
  if (/images\/reciters/.test(res.url())) {
    imgs.push({ url: res.url().replace(BASE, ""), status: res.status() });
  }
});
const audio = [];
page.on("response", (res) => {
  if (/everyayah\.com|qurancdn/.test(res.url())) {
    audio.push({ url: res.url(), status: res.status(), type: res.headers()["content-type"] });
  }
});

await page.addInitScript(
  ({ key }) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        skipSplashAnimation: true,
        showHome: true,
        showDuas: false,
        sidebarOpen: false,
        displayMode: "surah",
        mushafLayout: "list",
        lang: "fr",
        riwaya: "hafs",
        fontFamily: "qpc-hafs",
        quranFontSize: 34,
        showTranslation: false,
        reciter: "ar.alafasy",
        lastPosition: { surah: 1, ayah: 1, page: 1, juz: 1 },
      }),
    );
  },
  { key: SETTINGS_KEY },
);

await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForSelector(".app-view-home", { timeout: 40_000 });
await page.getByRole("tab", { name: "Audio", exact: true }).click();
await page.waitForSelector('[data-reciter-card="true"]', { timeout: 20_000 });

const cardNames = async () =>
  page.$$eval('[data-reciter-card="true"]', (nodes) =>
    nodes.map((n) => {
      const t = (n.innerText || "").replace(/\s+/g, " ").trim();
      return t.slice(0, 90);
    }),
  );

const out = {};
out.allCount = (await cardNames()).length;

const search = page.getByLabel(/citateur/);
await search.fill("minshawi");
await page.waitForFunction(
  () => document.querySelectorAll('[data-reciter-card="true"]').length > 0,
  null,
  { timeout: 15_000 },
);
for (let i = 0; i < 6; i++) {
  await sleep(1200);
  const c = await cardNames();
  if (c.length === 3) break;
}
out.minshawiCards = await cardNames();

// Muallim style chip must now reach two voices.
await search.fill("");
await page.getByRole("button", { name: "Muallim", exact: true }).click();
await sleep(2000);
out.muallimCards = await cardNames();
await page.getByRole("button", { name: "Tous", exact: true }).click();
await sleep(1200);

// Open the detail sheet of the new voice: bio, source rows, portrait.
await search.fill("minshawi");
await sleep(1800);
const target = page
  .locator('[data-reciter-card="true"]', { hasText: "Muallim" })
  .first();
await target.locator(".reciter-card__main").click();
await page.waitForSelector(".reciter-detail:not(.reciter-detail--loading)", { timeout: 20_000 });
await sleep(2500);
out.detail = await page.evaluate(() => {
  const d = document.querySelector(".reciter-detail");
  const img = d.querySelector("img");
  return {
    text: (d.innerText || "").replace(/\s+\n/g, "\n").split("\n").slice(0, 26),
    imgSrc: img?.currentSrc || img?.src,
    imgNatural: img ? [img.naturalWidth, img.naturalHeight] : null,
  };
});
await page.screenshot({ path: ".scratch-diag/minshawi-detail.png", fullPage: false });

// Play the first surah row from the sheet and watch the request host.
const playRow = page.locator(".reciter-detail__source-row", { hasText: "Source audio" }).first();
out.sourceRow = (await playRow.count()) ? (await playRow.innerText()).replace(/\s+/g, " ") : null;
const portraitRow = page.locator(".reciter-detail__source-row", { hasText: "Portrait" }).first();
out.portraitRow = (await portraitRow.count()) ? (await portraitRow.innerText()).replace(/\s+/g, " ") : null;
out.audio = audio;
out.imgs = imgs;
console.log(JSON.stringify(out, null, 1));
await browser.close();
