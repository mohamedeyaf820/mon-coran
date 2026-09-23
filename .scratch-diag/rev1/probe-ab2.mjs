import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));
page.on("console", (m) => { if (m.text().includes("abprobe")) log("CONSOLE", m.text()); });

const abCards = () => page.evaluate(() => {
  const titles = [...document.querySelectorAll("body *")].filter((x) => x.children.length === 0 && /Répétition A-B/.test(x.textContent || ""));
  return titles.map((el) => {
    const card = el.closest(".audio-settings-card");
    return { text: card?.textContent?.trim().replace(/\s+/g, " ").slice(0, 140), buttons: [...(card?.querySelectorAll("button") || [])].map((b) => b.textContent.trim()) };
  });
});

await page.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
await page.waitForTimeout(2000);

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Écouter/.test(x.getAttribute("aria-label") || x.textContent));
  b?.click();
});
await page.waitForTimeout(7000);
await page.evaluate(() => { const b=[...document.querySelectorAll("button")].find(x=>x.offsetParent&&/Agrandir/.test(x.getAttribute("aria-label")||x.textContent||"")); b?.click(); });
await page.waitForTimeout(1500);
await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Options et r/i.test((x.getAttribute("aria-label") || "") + x.textContent)); b?.setAttribute("data-probe-o", "1"); });
await page.click("button[data-probe-o]");
await page.waitForTimeout(1500);
log("before:", JSON.stringify(await abCards()));

const clickPill = async (label) => {
  const ok = await page.evaluate((l) => {
    const card = [...document.querySelectorAll(".audio-settings-card")].find((c) => /Répétition A-B/.test(c.textContent || ""));
    const b = [...(card?.querySelectorAll("button") || [])].find((x) => x.textContent.trim() === l);
    if (!b) return false;
    b.setAttribute("data-probe-pill", l);
    return true;
  }, label);
  if (!ok) return false;
  await page.click(`button[data-probe-pill="${label}"]`);
  await page.waitForTimeout(900);
  return true;
};
log("clicked Départ A:", await clickPill("Départ A"));
log("cards A:", JSON.stringify(await abCards()));
log("clicked Fin B:", await clickPill("Fin B"));
log("cards B:", JSON.stringify(await abCards()));
await page.screenshot({ path: ".scratch-diag/rev1/ab-repeat.png" });
await browser.close();
