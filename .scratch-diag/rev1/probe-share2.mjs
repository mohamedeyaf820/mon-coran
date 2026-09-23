import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

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

const r = await page.evaluate(async () => {
  const img = [...document.querySelectorAll("img")].find((x) => (x.getAttribute("src") || "").startsWith("data:image/svg"));
  const svg = decodeURIComponent(img.getAttribute("src").replace("data:image/svg+xml;charset=utf-8,", ""));
  const bare = svg.replace(/<style>@font-face[\s\S]*?<\/style>/, "");
  const render = async (markup, file) => {
    const im = new Image();
    await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup); });
    const c = document.createElement("canvas");
    c.width = im.naturalWidth; c.height = im.naturalHeight;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(im, 0, 0);
    const d = ctx.getImageData(0, 0, c.width, c.height).data;
    let ink = 0;
    let hash = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] < 160 && d[i + 1] < 160) { ink++; hash = (hash * 131 + i) % 2147483647; }
    }
    return { ink, hash, w: c.width, h: c.height };
  };
  return {
    svgBytes: svg.length,
    bareBytes: bare.length,
    stripped: svg.length - bare.length,
    embedded: await render(svg),
    plain: await render(bare),
  };
});
console.log(JSON.stringify(r));
await browser.close();
