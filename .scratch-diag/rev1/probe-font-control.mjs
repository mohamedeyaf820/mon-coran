import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) {
  if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(2500);

const out = await page.evaluate(async () => {
  const face = await fetch("/fonts/uthmanic-hafs-v18.woff2")
    .then((r) => r.arrayBuffer())
    .then((buf) => {
      const bytes = new Uint8Array(buf);
      let binary = "";
      for (let i = 0; i < bytes.length; i += 0x8000) {
        binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      }
      return btoa(binary);
    });
  const text = "\u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062d\u0645\u0646 \u0627\u0644\u0631\u062d\u064a\u0645";
  const svg = (family, style) => `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200">${style}<text x="20" y="120" font-family="${family}" font-size="60" direction="rtl" fill="#000">${text}</text></svg>`;
  const embedded = `<style>@font-face{font-family:'QPC Hafs';src:url(data:font/woff2;base64,${face}) format('woff2');}</style>`;
  const cases = {
    embedded: svg("'QPC Hafs', serif", embedded),
    namedNoFace: svg("'QPC Hafs', serif", ""),
    nonsense: svg("'Totally Missing Font', serif", ""),
  };
  const render = async (markup) => {
    const im = new Image();
    await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup); });
    const c = document.createElement("canvas");
    c.width = 600; c.height = 200;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, 600, 200);
    ctx.drawImage(im, 0, 0);
    const d = ctx.getImageData(0, 0, 600, 200).data;
    let ink = 0;
    let hash = 0;
    let maxX = 0;
    for (let y = 0; y < 200; y++) {
      for (let x = 0; x < 600; x++) {
        const i = (y * 600 + x) * 4;
        if (d[i] < 160) { ink++; if (x > maxX) maxX = x; hash = (hash * 31 + i) % 2147483647; }
      }
    }
    return { ink, maxX, hash };
  };
  const results = {};
  for (const [key, markup] of Object.entries(cases)) results[key] = await render(markup);
  return { faceBytes: Math.round(face.length / 1024), results };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
