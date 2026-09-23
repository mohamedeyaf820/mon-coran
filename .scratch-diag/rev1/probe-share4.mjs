import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";
import fs from "node:fs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) {
  if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(2000);
const trigger = page.locator('button[aria-label="Options du verset"]').first();
await trigger.scrollIntoViewIfNeeded();
await trigger.click();
await page.waitForTimeout(1000);
await page.locator("[role=menuitem], [role=menu] button").filter({ hasText: /art/ }).first().click();
await page.waitForTimeout(3500);

const out = await page.evaluate(async () => {
  const img = [...document.querySelectorAll("img")].find((x) => (x.getAttribute("src") || "").startsWith("data:image/svg"));
  const svg = decodeURIComponent(img.getAttribute("src").replace("data:image/svg+xml;charset=utf-8,", ""));
  const bare = svg.replace(/<style>@font-face[\s\S]*?<\/style>/, "");
  const render = async (markup) => {
    const im = new Image();
    await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup); });
    const c = document.createElement("canvas");
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(im, 0, 0);
    return ctx.getImageData(0, 0, c.width, c.height).data;
  };
  const a = await render(svg);
  const b = await render(bare);
  const W = 1080;
  const rows = [];
  for (let y = 0; y < 1080; y++) {
    let diff = 0;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (Math.abs(a[i] - b[i]) > 30) diff++;
    }
    rows.push(diff);
  }
  let top = 0;
  let topSum = 0;
  for (let y = 0; y + 200 <= 1080; y++) {
    let sum = 0;
    for (let k = 0; k < 200; k++) sum += rows[y + k];
    if (sum > topSum) { topSum = sum; top = y; }
  }
  const crop = (data) => {
    const c = document.createElement("canvas");
    c.width = W; c.height = 200;
    const ctx = c.getContext("2d");
    const id = ctx.createImageData(W, 200);
    for (let y = 0; y < 200; y++)
      for (let x = 0; x < W; x++) {
        const i = (y * W + x) * 4;
        const j = ((y + top) * W + x) * 4;
        id.data[i] = data[j]; id.data[i + 1] = data[j + 1]; id.data[i + 2] = data[j + 2]; id.data[i + 3] = 255;
      }
    ctx.putImageData(id, 0, 0);
    return c.toDataURL("image/png");
  };
  return { top, topSum, embedded: crop(a), plain: crop(b) };
});

fs.writeFileSync(".scratch-diag/rev1/crop-embedded.png", Buffer.from(out.embedded.split(",")[1], "base64"));
fs.writeFileSync(".scratch-diag/rev1/crop-plain.png", Buffer.from(out.plain.split(",")[1], "base64"));
console.log(JSON.stringify({ top: out.top, topSum: out.topSum }));
await browser.close();
