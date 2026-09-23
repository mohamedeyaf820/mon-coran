import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));

const card = () => page.evaluate(() => {
  const el = [...document.querySelectorAll(".audio-settings-card")].find((c) => /A-B/.test(c.textContent || ""));
  if (!el) return null;
  return { hint: el.querySelector("p")?.textContent?.trim().replace(/\s+/g, " "), buttons: [...el.querySelectorAll("button")].map((b) => b.textContent.trim()) };
});
const openOptions = async () => {
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Agrandir/.test(x.getAttribute("aria-label") || x.textContent || "")); b?.click(); });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Options et r/i.test((x.getAttribute("aria-label") || "") + x.textContent)); b?.setAttribute("data-probe-o", "1"); });
  await page.click("button[data-probe-o]");
  await page.waitForTimeout(1200);
};
const clickPill = async (label) => {
  const ok = await page.evaluate((l) => {
    const c = [...document.querySelectorAll(".audio-settings-card")].find((x) => /A-B/.test(x.textContent || ""));
    const b = [...(c?.querySelectorAll("button") || [])].find((x) => x.textContent.trim() === l);
    if (!b || b.disabled) return false;
    b.setAttribute("data-probe-pill", l);
    return true;
  }, label);
  if (!ok) return false;
  await page.click(`button[data-probe-pill="${label}"]`);
  await page.waitForTimeout(700);
  return true;
};
const playFirst = async () => {
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Écouter/.test(x.getAttribute("aria-label") || x.textContent)); b?.click(); });
  await page.waitForTimeout(6000);
};

await page.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
await page.waitForTimeout(1500);
await playFirst();
await openOptions();
await clickPill("Départ A");
await clickPill("Fin B");
log("range set on surah 2:", JSON.stringify(await card()));
await page.keyboard.press("Escape");
await page.waitForTimeout(600);

await page.goto(BASE + "/surah/103", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(3000);
await playFirst();
await openOptions();
log("after switching surah:", JSON.stringify(await card()));
await browser.close();
