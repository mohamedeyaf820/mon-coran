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
    return c.toDataURL("image/png");
  };
  return { embedded: await render(svg), plain: await render(bare) };
});


fs.writeFileSync(".scratch-diag/rev1/card-embedded.png", Buffer.from(out.embedded.split(",")[1], "base64"));
fs.writeFileSync(".scratch-diag/rev1/card-plain.png", Buffer.from(out.plain.split(",")[1], "base64"));
console.log("written");
await browser.close();
