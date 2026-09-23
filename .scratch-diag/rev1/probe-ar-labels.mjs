import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";
import fs from "node:fs";

// Read the Arabic label out of the source instead of retyping it: combining
// marks do not survive tool arguments reliably.
const src = fs.readFileSync("src/components/AyahActions.jsx", "utf8");
const arLabel = /lang === "ar" \? "([^"]+)"/.exec(src)?.[1];
console.log("expected trigger label:", arLabel);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.addInitScript((label) => {
  localStorage.setItem("mushaf-plus-settings", JSON.stringify({ lang: "ar" }));
  window.__label = label;
}, arLabel);
await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 25; i++) {
  if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(1500);

const found = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find(
    (x) => x.getAttribute("aria-label") === window.__label,
  );
  if (!b) return { ok: false, dir: document.documentElement.dir };
  b.scrollIntoView();
  const r = b.getBoundingClientRect();
  return { rect: [r.x, r.y, r.width, r.height] };
  return { ok: true, dir: document.documentElement.dir };
});
console.log('trigger:', JSON.stringify(found));
if (found.rect) { const [x,y,w,h]=found.rect; await page.mouse.click(x+w/2, y+h/2); }
await page.waitForTimeout(900);
await page.screenshot({ path: ".scratch-diag/rev1/ar-verse-options.png" });

const labels = await page.evaluate(() => {
  const menu = document.querySelector("[role=menu]");
  const scope = menu || document.body;
  return [...scope.querySelectorAll("button, [role=menuitem]")]
    .map((x) => (x.textContent || x.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 16);
});
console.log("menu labels:", JSON.stringify(labels));
const aria = await page.evaluate(() => [...document.querySelectorAll("button")].map((b)=>b.getAttribute("aria-label")).filter(Boolean));
console.log("aria labels:", JSON.stringify([...new Set(aria)].slice(0, 24)));
await browser.close();
