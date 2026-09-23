import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));

await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) {
  if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(2500);

const trigger = page.locator('button[aria-label="Options du verset"]').first();
await trigger.scrollIntoViewIfNeeded();
await trigger.click();
await page.waitForTimeout(1200);
const items = await page.evaluate(() => [...document.querySelectorAll("[role=menu] [role=menuitem], [role=menu] button")]
  .map((x) => (x.textContent || "").trim().replace(/\s+/g, " ")).filter(Boolean));
console.log("menu items:", JSON.stringify(items.slice(0, 16)));

const share = page.locator("[role=menuitem], [role=menu] button").filter({ hasText: /art/ }).first();
console.log("share visible:", await share.isVisible().catch(() => false));
await share.click({ timeout: 5000 }).catch((e) => console.log("share click failed:", e.message.split("\n")[0]));
await page.waitForTimeout(3500);

const info = await page.evaluate(() => {
  const img = [...document.querySelectorAll("img")].find((x) => (x.getAttribute("src") || "").startsWith("data:image/svg"));
  const svg = img ? decodeURIComponent(img.getAttribute("src").replace("data:image/svg+xml;charset=utf-8,", "")) : "";
  return {
    hasImg: !!img,
    hasStyle: /<style>@font-face/.test(svg),
    family: (svg.match(/font-family:'([^']+)'/) || [])[1] || null,
    dataUri: (svg.match(/url\(data:font\/[a-z0-9]+;base64,/) || [])[0] || null,
    svgBytes: svg.length,
  };
});
console.log("card svg:", JSON.stringify(info));

if (info.hasImg) {
  const diff = await page.evaluate(async () => {
    const img = [...document.querySelectorAll("img")].find((x) => (x.getAttribute("src") || "").startsWith("data:image/svg"));
    const svg = decodeURIComponent(img.getAttribute("src").replace("data:image/svg+xml;charset=utf-8,", ""));
    const bare = svg.replace(/<style>@font-face[\s\S]*?<\/style>/, "");
    const render = async (markup) => {
      const im = new Image();
      await new Promise((res, rej) => { im.onload = res; im.onerror = rej; im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(markup); });
      const c = document.createElement("canvas");
      c.width = im.naturalWidth || 900;
      c.height = im.naturalHeight || 900;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(im, 0, 0);
      const d = ctx.getImageData(0, 0, c.width, c.height).data;
      let ink = 0;
      let minX = 1e9, minY = 1e9, maxX = 0, maxY = 0;
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) {
          const i = (y * c.width + x) * 4;
          if (d[i] < 200 || d[i + 1] < 200 || d[i + 2] < 200) {
            ink++;
            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
          }
        }
      }
      return { ink, box: [minX, minY, maxX, maxY] };
    };
    return { embedded: await render(svg), plain: await render(bare) };
  });
  console.log("raster:", JSON.stringify(diff));
  await page.screenshot({ path: ".scratch-diag/rev1/share-card.png" });
}
await browser.close();
