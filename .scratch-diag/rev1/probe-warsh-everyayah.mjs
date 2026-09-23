import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));
const mp3s = [];
page.on("request", (r) => { if (/\.mp3(\?|$)/.test(r.url())) mp3s.push(r.url()); });

await page.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
await page.waitForTimeout(2500);
await page.evaluate(() => document.querySelector('button[aria-label^="Changer de riwaya"]').click());
await page.waitForTimeout(5000);
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
log("riwaya:", await page.evaluate(() => document.querySelector('button[aria-label^="Changer de riwaya"]')?.getAttribute("aria-label")));

await page.click('header button[aria-label="Plus d\'options"]');
await page.waitForTimeout(900);
const item = await page.evaluate(() => {
  const m = [...document.querySelectorAll("[role='menuitem'],[role='menuitemradio'],button")].find((x) => x.offsetParent && /réglages?|paramètres?/i.test(x.textContent || ""));
  if (!m) return null;
  m.setAttribute("data-probe-s", "1");
  return m.textContent.trim();
});
log("settings item:", item);
await page.click("[data-probe-s]");
await page.waitForTimeout(1800);

const opts = await page.evaluate(() => [...document.querySelectorAll(".settings-reciter-option, [class*='reciter-option']")].map((x) => x.textContent.trim().slice(0, 40)).slice(0, 12));
log("reciter options visible:", JSON.stringify(opts));
const picked = await page.evaluate(() => {
  const el = [...document.querySelectorAll(".settings-reciter-option, [class*='reciter-option'], button, label")].find((x) => x.offsetParent && /Dosari|Dossari|Jazaery|Yassin/i.test(x.textContent || ""));
  if (!el) return null;
  el.setAttribute("data-probe-v", "1");
  return el.textContent.trim().slice(0, 50);
});
log("picked voice:", picked);
if (picked) {
  await page.click("[data-probe-v]");
  await page.waitForTimeout(1500);
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1200);
}

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Écouter/.test(x.getAttribute("aria-label") || x.textContent));
  b?.click();
});
await page.waitForTimeout(11000);
log("cdn:", mp3s[0]?.replace(/\/002\d{3}\.mp3.*/, "/"));
log("files:", JSON.stringify(mp3s.map((u) => u.match(/(\d{6})\.mp3/)?.[1]).filter(Boolean).slice(0, 10)));
await browser.close();
