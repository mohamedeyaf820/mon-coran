import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4187";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
const seen = [];
page.on("response", (res) => {
  if (/everyayah\.com/.test(res.url())) {
    seen.push({ url: res.url().split("/data/")[1], status: res.status(), t: Date.now() });
  }
});
const t0 = Date.now();

await page.goto(`${BASE}/?reciter=ar.minshawi_muallim&play=1&surah=1`, {
  waitUntil: "domcontentloaded",
});
for (let i = 0; i < 15 && !seen.length; i++) await sleep(1000);

const readPlayer = () =>
  page.evaluate(() => {
    const bar =
      document.querySelector('[class*="player" i]:not([class*="home" i])') || document.body;
    const times = (bar.innerText.match(/\d+:\d{2}\s*\/\s*\d+:\d{2}|\d+:\d{2}/g) || []).slice(0, 4);
    const names = (document.body.innerText.match(/[^\n]*Muallim[^\n]*/g) || []).slice(0, 3);
    return { times, names };
  });

const a = await readPlayer();
await sleep(7000);
const b = await readPlayer();
console.log(
  JSON.stringify(
    {
      first: a,
      after7s: b,
      requests: seen.map((s) => ({ ...s, t: s.t - t0 })),
    },
    null,
    1,
  ),
);
await page.screenshot({ path: ".scratch-diag/minshawi-playing.png" });
await browser.close();
