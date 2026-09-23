import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));
page.on("console", (m) => { if (m.text().includes("abprobe")) log("CONSOLE", m.text()); });

await page.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
await page.waitForTimeout(2000);

// start playback so a playlist index exists
await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Écouter/.test(x.getAttribute("aria-label") || x.textContent));
  b?.click();
});
await page.waitForTimeout(7000);

// open the audio options modal
await page.evaluate(() => { const b=[...document.querySelectorAll("button")].find(x=>x.offsetParent&&/Agrandir/.test(x.getAttribute("aria-label")||x.textContent||"")); b?.click(); });
await page.waitForTimeout(1500);
const opened = await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Options et r/i.test((x.getAttribute("aria-label") || "") + x.textContent));
  if (!b) return null;
  b.setAttribute("data-probe-o", "1");
  return b.getAttribute("aria-label") || b.textContent.trim();
});
log("options trigger:", opened);
if (opened) { await page.click("button[data-probe-o]"); await page.waitForTimeout(1500); }

const card = await page.evaluate(() => {
  const el = [...document.querySelectorAll("body *")].filter((x) => x.children.length === 0 && /Répétition A-B/.test(x.textContent || ""))[0];
  if (!el) return null;
  const section = el.closest("div");
  return { hint: section?.parentElement?.textContent?.trim().slice(0, 160), buttons: [...(section?.parentElement?.querySelectorAll("button") || [])].map((b) => b.textContent.trim()) };
});
log("A-B card:", JSON.stringify(card));

const clickPill = async (label) => {
  const ok = await page.evaluate((l) => {
    const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && x.textContent.trim() === l);
    if (!b) return false;
    b.setAttribute("data-probe-pill", "1");
    return true;
  }, label);
  if (!ok) return false;
  await page.click("button[data-probe-pill]");
  await page.waitForTimeout(900);
  return true;
};
log("clicked Départ A:", await clickPill("Départ A"));
log("clicked Fin B:", await clickPill("Fin B"));
log("card after:", JSON.stringify(await page.evaluate(() => {
  const el = [...document.querySelectorAll("body *")].filter((x) => x.children.length === 0 && /Actif|Inactif/.test(x.textContent || ""))[0];
  return el?.textContent?.trim().slice(0, 90) ?? null;
})));
log("clear button:", await page.evaluate(() => !![...document.querySelectorAll("button")].find((x) => x.offsetParent && /Effacer A-B/.test(x.textContent))));
await page.screenshot({ path: ".scratch-diag/rev1/ab-repeat.png" });
await browser.close();
