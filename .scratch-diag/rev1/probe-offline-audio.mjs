import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 950 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => log("PAGEERROR", e.message));
const mp3s = [];
page.on("request", (r) => { if (/\.mp3(\?|$)/.test(r.url())) mp3s.push(r.url().split("/").pop()); });

await page.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
await page.waitForTimeout(2000);

const errText = () => page.evaluate(() => {
  const hits = [...document.querySelectorAll("body *")].filter((x) => x.children.length === 0 && x.offsetParent && /connexion|atlas|rcitateur/i.test(x.textContent || "") && x.textContent.trim().length < 160);
  return hits.map((h) => `${h.tagName}.${String(h.className).slice(0, 28)}=${h.textContent.trim()}`).slice(0, 4);
});

await ctx.setOffline(true);
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Écouter/.test(x.getAttribute("aria-label") || x.textContent));
  b?.click();
});
const seen = new Set();
for (let i = 0; i < 24; i++) {
  await page.waitForTimeout(500);
  for (const line of await errText()) seen.add(line);
}
log("offline messages seen:", JSON.stringify([...seen]));
log("mp3 attempts while offline:", mp3s.length);
const avail = await page.evaluate(() => {
  for (const k of Object.keys(localStorage)) {
    if (/settings|state|player/i.test(k)) {
      const v = localStorage.getItem(k) || "";
      if (/cooldownUntil|failCount/.test(v)) return `${k}: ${v.match(/cooldownUntil/g)?.length} cooldown entries`;
    }
  }
  return "no persisted availability";
});
log("availability:", avail);

await ctx.setOffline(false);
await page.waitForTimeout(1500);
mp3s.length = 0;
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Écouter|Lecture|Play/.test(x.getAttribute("aria-label") || x.textContent));
  b?.click();
});
await page.waitForTimeout(8000);
log("after coming back online, mp3 requests:", JSON.stringify(mp3s.slice(0, 4)));
await browser.close();
