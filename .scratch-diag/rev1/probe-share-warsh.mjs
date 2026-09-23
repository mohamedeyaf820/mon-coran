import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
await page.addInitScript(() => {
  localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({ riwaya: "warsh", language: "fr" }),
  );
});
await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 25; i++) {
  if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(2000);
const trigger = page.locator('button[aria-label="Options du verset"]').first();
await trigger.scrollIntoViewIfNeeded();
await trigger.click();
await page.waitForTimeout(1000);
await page.locator("[role=menuitem], [role=menu] button").filter({ hasText: /art/ }).first().click();
await page.waitForTimeout(4000);

const out = await page.evaluate(async () => {
  const img = [...document.querySelectorAll("img")].find((x) => (x.getAttribute("src") || "").startsWith("data:image/svg"));
  if (!img) return { error: "no svg img" };
  const svg = decodeURIComponent(img.getAttribute("src").replace("data:image/svg+xml;charset=utf-8,", ""));
  const style = /<style>([\s\S]*?)<\/style>/.exec(svg);
  const face = style ? /font-family:'[^']*'/.exec(style[1])?.[0] : null;
  const render = (markup) =>
    new Promise((res) => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement("canvas");
        c.width = im.naturalWidth; c.height = im.naturalHeight;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(im, 0, 0);
        const d = ctx.getImageData(0, 0, c.width, c.height).data;
        let ink = 0, hash = 0;
        for (let i = 0; i < d.length; i += 4) if (d[i] < 160 && d[i + 1] < 160) { ink++; hash = (hash * 131 + i) % 2147483647; }
        res({ ink, hash });
      };
      im.onerror = () => res({ error: "render failed" });
      im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup);
    });
  const declared = await render(svg);
  const strippedRender = await render(svg.replace(/<style>@font-face[\s\S]*?<\/style>/, ""));
  return {
    label: /Warsh|Hafs/.exec(svg)?.[0],
    face,
    styleBytes: style ? style[1].length : 0,
    mime: /url\(data:([\w/]+);/.exec(svg)?.[1],
    declared,
    strippedRender,
  };
});
console.log(JSON.stringify(out));
await browser.close();
