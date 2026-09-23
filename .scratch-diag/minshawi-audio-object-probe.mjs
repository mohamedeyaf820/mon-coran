import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4187";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

await page.addInitScript(() => {
  window.__audios = [];
  const Real = window.Audio;
  window.Audio = function (...args) {
    const a = new Real(...args);
    window.__audios.push(a);
    a.addEventListener("timeupdate", () => {
      window.__lastTime = a.currentTime;
      window.__lastSrc = a.currentSrc || a.src;
    });
    a.addEventListener("ended", () => {
      window.__ended = (window.__ended || 0) + 1;
    });
    return a;
  };
  window.Audio.prototype = Real.prototype;
});

const requests = [];
page.on("response", (res) => {
  if (/everyayah\.com/.test(res.url())) {
    requests.push({ file: res.url().split("/data/")[1], status: res.status() });
  }
});

const t0 = Date.now();
await page.goto(`${BASE}/?reciter=ar.minshawi_muallim&play=1&surah=1`, {
  waitUntil: "domcontentloaded",
});
for (let i = 0; i < 20 && !requests.length; i++) await sleep(1000);

const samples = [];
for (let i = 0; i < 8; i++) {
  await sleep(2500);
  samples.push(
    await page.evaluate(() => ({
      t: Math.round(performance.now()),
      count: window.__audios.length,
      lastTime: window.__lastTime,
      ended: window.__ended || 0,
      src: (window.__lastSrc || "").split("/data/")[1],
      paused: window.__audios[window.__audios.length - 1]?.paused,
      duration: window.__audios[window.__audios.length - 1]?.duration,
    })),
  );
}

console.log(JSON.stringify({ requests, samples, wall: Date.now() - t0 }, null, 1));
await browser.close();
