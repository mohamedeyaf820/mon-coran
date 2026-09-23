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

const texts = (re) => page.evaluate((src) => {
  const rx = new RegExp(src, "i");
  return [...document.querySelectorAll("body *")]
    .filter((x) => x.children.length === 0 && x.offsetParent && rx.test(x.textContent || ""))
    .map((x) => x.textContent.trim().replace(/\s+/g, " ").slice(0, 120));
}, re.source);

const clickWhere = async (re) => page.evaluate((src) => {
  const rx = new RegExp(src, "i");
  const el = [...document.querySelectorAll("button,[role=button],input,label")]
    .find((x) => x.offsetParent && rx.test((x.getAttribute("aria-label") || "") + " " + (x.value || "") + " " + x.textContent));
  if (!el) return false;
  el.click();
  return true;
}, re.source);

await page.goto(BASE + "/surah/14", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 20; i++) { if (await page.evaluate(() => !!document.querySelector("[data-ayah-number]"))) break; await page.waitForTimeout(2000); }
await page.waitForTimeout(1500);
log("Hafs verse nodes:", await page.evaluate(() => document.querySelectorAll("[data-ayah-number]").length));
log("clicked riwaya:", await clickWhere(/Changer de riwaya/i));
await page.waitForTimeout(4000);
log("Warsh verse nodes:", await page.evaluate(() => document.querySelectorAll("[data-ayah-number]").length));

log("opened options:", await clickWhere(/Options et r/i) || (await clickWhere(/Agrandir/) && (await clickWhere(/Options et r/i))));
await page.waitForTimeout(1500);
await page.evaluate(() => { const b=[...document.querySelectorAll("[role=tab],button")].find(x=>x.offsetParent && x.textContent.trim()==="Récitateurs"); if(b) b.click(); });
await page.waitForTimeout(1200);
log("inputs:", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll("input")].filter((x) => x.offsetParent).map((x) => ({ type: x.type, al: x.getAttribute("aria-label") })))));

await page.evaluate(() => {
  const i = [...document.querySelectorAll("input")].find((x) => x.offsetParent && x.type === "text");
  if (!i) return;
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  setter.call(i, "Belalaya");
  i.dispatchEvent(new Event("input", { bubbles: true }));
});
await page.waitForTimeout(1500);
log("rows:", JSON.stringify((await texts(/belalaya/i)).slice(0, 5)));
log("selected belalaya:", await page.evaluate(() => {
  const rows = [...document.querySelectorAll("button")].filter((x) => x.offsetParent && /Belalaya/.test(x.textContent));
  const b = rows[rows.length - 1];
  if (!b) return "no-row";
  b.click();
  return "clicked:" + b.textContent.trim().slice(0, 30) + "|pressed=" + b.getAttribute("aria-pressed");
}));
await page.waitForTimeout(2500);
await page.keyboard.press("Escape");
await page.waitForTimeout(1000);
log("player text:", JSON.stringify(await page.evaluate(() => document.querySelector(".simple-player")?.innerText?.replace(/\s+/g," ").slice(0,160))));
log("toasts before play:", JSON.stringify(await page.evaluate(() => window.__toasts)));
await clickWhere(/Écouter/);
await page.waitForTimeout(4000);
log("toasts after play:", JSON.stringify(await page.evaluate(() => window.__toasts)));
await page.screenshot({ path: ".scratch-diag/rev1/gap-toast.png" });
await browser.close();
