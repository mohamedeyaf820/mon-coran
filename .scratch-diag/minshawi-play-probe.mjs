import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4187";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const audioRequests = [];
page.on("request", (req) => {
  if (/everyayah\.com|qurancdn|quranpedia/.test(req.url())) {
    audioRequests.push({ url: req.url(), at: Date.now() });
  }
});
const audioResponses = [];
page.on("response", (res) => {
  if (/everyayah\.com|qurancdn|quranpedia/.test(res.url())) {
    audioResponses.push({
      url: res.url(),
      status: res.status(),
      type: res.headers()["content-type"],
      len: res.headers()["content-length"],
    });
  }
});
const errors = [];
page.on("pageerror", (e) => errors.push(String(e).slice(0, 300)));
page.on("console", (m) => {
  if (m.type() === "error") errors.push("console: " + m.text().slice(0, 200));
});

// Deep link: play Al-Fatiha with the new Minshawi Muallim voice.
await page.goto(`${BASE}/?reciter=ar.minshawi_muallim&play=1&surah=1`, {
  waitUntil: "domcontentloaded",
});

for (let i = 0; i < 12; i++) {
  await sleep(2000);
  if (audioResponses.length) break;
}

const playerState = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll("audio")].map((a) => ({
    src: a.currentSrc || a.src,
    readyState: a.readyState,
    duration: a.duration,
    currentTime: a.currentTime,
    paused: a.paused,
  }));
  const text = document.body.innerText;
  return {
    nodes,
    hasMuallim: /Muallim/i.test(text),
    playerSnippet: (text.match(/[^\n]*Muallim[^\n]*/g) || []).slice(0, 6),
    loader: /Chargement en cours/.test(text),
  };
});

console.log(JSON.stringify({ audioRequests, audioResponses, playerState, errors }, null, 1));

// Second sample after playback has had time to advance.
await sleep(4000);
const advanced = await page.evaluate(() => {
  const nodes = [...document.querySelectorAll("audio")].map((a) => ({
    src: (a.currentSrc || a.src).slice(0, 120),
    duration: a.duration,
    currentTime: a.currentTime,
    paused: a.paused,
  }));
  return { nodes, body: (document.body.innerText.match(/[^\n]*(Al-Fatiha|Ouverture|1 : 1|verset)[^\n]*/g) || []).slice(0, 6) };
});
console.log("AFTER", JSON.stringify(advanced, null, 1));

await page.screenshot({ path: ".scratch-diag/minshawi-muallim-play.png", fullPage: false });
await browser.close();
