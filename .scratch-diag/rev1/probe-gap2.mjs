import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));
await page.addInitScript(() => {
  window.__toasts = [];
  window.addEventListener("quran-toast", (e) => window.__toasts.push(e.detail));
});
const clickWhere = async (re) => page.evaluate((src) => {
  const rx = new RegExp(src, "i");
  const el = [...document.querySelectorAll("button,[role=button]")]
    .find((x) => x.offsetParent && rx.test((x.getAttribute("aria-label") || "") + " " + x.textContent));
  if (!el) return false;
  el.click();
  return true;
}, re.source);
const playerText = () => page.evaluate(() => document.querySelector(".simple-player")?.innerText?.replace(/\s+/g, " ").slice(0, 200) ?? null);

const inspect = (n) => page.evaluate((num) => {
  const m = document.querySelector(`[data-ayah-number="${num}"]`);
  if (!m) return { missing: true };
  const inMarker = [...m.querySelectorAll("button")].filter((x) => /couter/.test(x.getAttribute("aria-label") || "")).length;
  const card = m.closest("[class*=ayah],[class*=verse],[data-ayah-card]") || m.parentElement;
  return { tag: m.tagName, cls: String(m.className).slice(0, 60), buttonsInMarker: inMarker, cardButtons: [...(card?.querySelectorAll("button") || [])].length };
}, n);

const playVerse = (n) => page.evaluate((num) => {
  const m = document.querySelector(`[data-ayah-number="${num}"]`);
  if (!m) return "no-verse";
  const btn = [...m.querySelectorAll("button")].find((x) => /couter/.test(x.getAttribute("aria-label") || ""));
  if (!btn) return "no-button";
  btn.click();
  return "clicked-" + num;
}, n);

await page.goto(BASE + "/surah/14", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
await page.waitForTimeout(1500);
await clickWhere(/Changer de riwaya/i);
await page.waitForTimeout(4000);
const pickReciter = async (needle) => {
  if (!(await clickWhere(/Options et r/i))) { await clickWhere(/Agrandir/i); await page.waitForTimeout(1200); await clickWhere(/Options et r/i); }
  await page.waitForTimeout(1200);
  for (let attempt = 0; attempt < 8; attempt++) {
    await page.evaluate(() => { const b = [...document.querySelectorAll("[role=tab],button")].find((x) => x.offsetParent && x.textContent.trim() === "Récitateurs"); if (b) b.click(); });
    await page.waitForTimeout(700);
    const found = await page.evaluate((n) => {
      const i = [...document.querySelectorAll("input")].find((x) => /citateur/.test(x.getAttribute("aria-label") || ""));
      if (!i) return "no-input";
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
      setter.call(i, n);
      i.dispatchEvent(new Event("input", { bubbles: true }));
      return "typed";
    }, needle);
    if (found !== "no-input") {
      await page.waitForTimeout(1200);
      const rows = await page.evaluate((n) => [...document.querySelectorAll("button")].filter((x) => x.offsetParent && new RegExp(n, "i").test(x.textContent)).length, needle);
      if (rows > 0) {
        const clicked = await clickWhere(new RegExp(needle, "i"));
        return `rows=${rows} clicked=${clicked}`;
      }
    }
  }
  return "failed";
};
log("pick reciter:", await pickReciter("Belalaya"));
await page.waitForTimeout(2500);
await page.keyboard.press("Escape");
await page.waitForTimeout(800);
log("baseline player:", await playerText(), "| toasts:", JSON.stringify(await page.evaluate(() => window.__toasts.map((t) => t.message))));

await page.evaluate(() => { document.querySelector('[data-ayah-number="53"]')?.scrollIntoView({ block: "center" }); });
await page.waitForTimeout(600);
log("dom 53:", JSON.stringify(await inspect(53)), await playVerse(53));
await page.waitForTimeout(2500);
log("player after 53:", await playerText());

await page.evaluate(() => { document.querySelector('[data-ayah-number="54"]')?.scrollIntoView({ block: "center" }); });
await page.waitForTimeout(600);
log("dom 54:", JSON.stringify(await inspect(54)), await playVerse(54));
await page.waitForTimeout(3000);
log("player after 54:", await playerText());
await page.screenshot({ path: ".scratch-diag/rev1/gap-verses.png" });
await browser.close();
