import { chromium } from "@playwright/test";
import fs from "node:fs";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2000, height: 2700 } });
await page.goto("file:///C:/Users/amirou/Documents/Quran App/.scratch-diag/captures/clip-leaf2.png");
await page.waitForLoadState("load");
const data = await page.evaluate(() => {
  const img = document.querySelector("img");
  const c = document.createElement("canvas");
  c.width = 900; c.height = 320;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 950, 120, 900, 320, 0, 0, 900, 320);
  return c.toDataURL("image/png").split(",")[1];
});
fs.writeFileSync(".scratch-diag/captures/clip-zoom.png", Buffer.from(data, "base64"));
await browser.close();
console.log("ok");
