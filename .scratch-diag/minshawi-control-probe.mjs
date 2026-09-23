import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4187";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const INIT = () => {
  window.__audios = [];
  const Real = window.Audio;
  window.Audio = function (...args) {
    const a = new Real(...args);
    window.__audios.push(a);
    a.addEventListener("timeupdate", () => {
      window.__lastTime = a.currentTime;
      window.__lastSrc = a.currentSrc || a.src;
    });
    a.addEventListener("play", () => {
      window.__played = (window.__played || 0) + 1;
    });
    a.addEventListener("error", () => {
      window.__err = (window.__err || 0) + 1;
    });
    return a;
  };
};

const browser = await chromium.launch();

for (const id of ["ar.alafasy", "ar.minshawi_muallim"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  const requests = [];
  page.on("response", (res) => {
    if (/everyayah\.com|qurancdn/.test(res.url())) {
      requests.push({ file: res.url().split("/data/").pop().split("/").pop(), status: res.status() });
    }
  });
  await page.goto(`${BASE}/?reciter=${id}&play=1&surah=1`, { waitUntil: "domcontentloaded" });
  for (let i = 0; i < 20 && !requests.length; i++) await sleep(1000);

  const labels = await page.evaluate(() =>
    [...document.querySelectorAll("button")]
      .map((b) => (b.getAttribute("aria-label") || b.textContent || "").trim())
      .filter((t) => /^(Lecture|Pause)/.test(t))
      .slice(0, 12),
  );

  // A real click satisfies the autoplay gesture requirement.
  const btn = page.getByRole("button", { name: "Lecture", exact: true }).first();
  let clicked = false;
  if (await btn.count()) {
    await btn.click();
    clicked = true;
  }
  await sleep(6000);
  const state = await page.evaluate(() => {
    const a = window.__audios[window.__audios.length - 1];
    return {
      audios: window.__audios.length,
      played: window.__played || 0,
      errors: window.__err || 0,
      lastTime: window.__lastTime,
      lastSrc: (window.__lastSrc || "").split("/data/").pop(),
      paused: a?.paused,
      currentTime: a?.currentTime,
      duration: a?.duration,
    };
  });
  console.log(JSON.stringify({ id, clicked, labels, requests, state }, null, 1));
  await ctx.close();
}
await browser.close();
