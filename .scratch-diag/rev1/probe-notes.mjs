import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const BASE = "http://127.0.0.1:4191";
const log = (...a) => console.log(...a);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
page.on("pageerror", (e) => log("PAGEERROR", e.message));

const emptyLabel = () => page.evaluate(() => {
  const el = [...document.querySelectorAll(".library-empty span")].find((x) => x.offsetParent);
  return el?.textContent?.trim() ?? null;
});
const clickWhere = (re) => page.evaluate((src) => {
  const rx = new RegExp(src, "i");
  const el = [...document.querySelectorAll("button,[role=button],[role=tab]")]
    .find((x) => x.offsetParent && rx.test((x.getAttribute("aria-label") || "") + " " + x.textContent));
  if (!el) return false;
  el.click();
  return true;
}, re.source);

await page.goto(BASE + "/surah/2", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(4000);
log("more:", await clickWhere(/Plus d.options/));
await page.waitForTimeout(1000);
log("library:", await clickWhere(/Biblioth/i));
await page.waitForTimeout(1500);
log("library trigger:", await page.evaluate(() => !!document.querySelector("[data-probe-lib]")));
log("notes tab:", await clickWhere(/Notes/));
await page.waitForTimeout(900);
log("label with no query:", await emptyLabel());
await page.fill('input[aria-label="Rechercher dans les notes"]', "zzzzz");
await page.waitForTimeout(1200);
log("label with query:", await emptyLabel());
await page.screenshot({ path: ".scratch-diag/rev1/library-note-search.png" });
await browser.close();
