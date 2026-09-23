import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required", "--mute-audio"] });
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));

const card = () => page.evaluate(() => {
  const el = [...document.querySelectorAll(".audio-settings-card")].find((c) => /R.p .tion A-B|A-B/.test(c.textContent || ""));
  if (!el) return null;
  return {
    hint: el.querySelector("p")?.textContent?.trim().replace(/\s+/g, " "),
    buttons: [...el.querySelectorAll("button")].map((b) => ({ t: b.textContent.trim(), disabled: b.disabled })),
  };
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
  await page.waitForTimeout(900);
  return true;
};

await page.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
await page.waitForTimeout(2000);

await openOptions();
log("1. no playback:", JSON.stringify(await card()));
await page.keyboard.press("Escape");
await page.waitForTimeout(800);

await page.evaluate(() => {
  const b = [...document.querySelectorAll("button")].find((x) => x.offsetParent && /Écouter/.test(x.getAttribute("aria-label") || x.textContent));
  b?.click();
});
await page.waitForTimeout(7000);
await openOptions();
log("2. playing:", JSON.stringify(await card()));
log("3. Départ A:", await clickPill("Départ A"), JSON.stringify(await card()));
log("4. Fin B:", await clickPill("Fin B"), JSON.stringify(await card()));
await page.screenshot({ path: ".scratch-diag/rev1/ab-repeat.png" });
log("5. Effacer:", await clickPill("Effacer A-B"), JSON.stringify(await card()));
await browser.close();
