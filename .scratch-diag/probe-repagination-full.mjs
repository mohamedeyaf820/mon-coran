import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
const s = page.locator(".splash-screen button").filter({ hasText: /Passer|Skip/ }).first();
if (await s.count()) await s.click({ force: true }).catch(() => {});
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 15000 });
await page.waitForTimeout(1200);

const sections = () => page.evaluate(() => {
  const c = document.querySelector(".app-main");
  const cr = c.getBoundingClientRect();
  return Array.from(document.querySelectorAll("[data-stream-page]")).map((el) =>
    `${el.getAttribute("data-stream-page")}@${Math.round(el.getBoundingClientRect().top - cr.top)}h${Math.round(el.getBoundingClientRect().height)}`).join(" ");
});
const toggle = (label) => page.evaluate((l) => {
  if (l === "Mushaf" || l === "Liste") {
    const pill = Array.from(document.querySelectorAll(".qc-reader-toolbar__modes button")).find((b) => b.textContent?.trim() === l);
    pill?.click();
    return;
  }
  const btns = Array.from(document.querySelectorAll('button[aria-label*="Plus"], .mp-header-more'));
  btns[btns.length - 1]?.click();
  setTimeout(() => {
    Array.from(document.querySelectorAll(".mp-header-menu button")).find((b) => b.textContent?.includes(l))?.click();
  }, 200);
}, label);
const layoutState = () => page.evaluate(() => {
  const pills = Array.from(document.querySelectorAll(".qc-reader-toolbar__modes button"));
  return pills.map((b) => `${b.textContent?.trim()}:${b.getAttribute("aria-pressed")}`).join(" ");
});

// 1) list -> mushaf at page 3 mid-scroll
await page.evaluate(() => { document.querySelector(".app-main").scrollTop = 1500; });
await page.waitForTimeout(300);
await toggle("Mushaf");
await page.waitForTimeout(2500);
console.log("list->mushaf:", await sections(), "pills:", await layoutState());

// 2) mushaf -> list back
await page.evaluate(() => { document.querySelector(".app-main").scrollTop += 900; });
await page.waitForTimeout(300);
await toggle("Liste");
await page.waitForTimeout(2500);
console.log("mushaf->list:", await sections(), "pills:", await layoutState());

// 3) riwaya switch hafs -> warsh (page 3 area)
await toggle("Warsh");
await page.waitForTimeout(4000);
console.log("hafs->warsh:", await sections());

// 4) stream still works: scroll to bottom, pages append; scroll up, prepend keeps viewport
await page.waitForTimeout(1000);
for (let i = 0; i < 6; i++) {
  await page.evaluate(() => { document.querySelector(".app-main").scrollTop += 2000; });
  await page.waitForTimeout(700);
}
const late = await sections();
console.log("after scrolling down:", late);
const beforeUp = await page.evaluate(() => {
  const c = document.querySelector(".app-main");
  c.scrollTop -= 400;
  return c.scrollTop;
});
await page.waitForTimeout(1200);
const afterUp = await page.evaluate(() => document.querySelector(".app-main").scrollTop);
console.log("upward prepend: scrollTop", beforeUp, "->", afterUp, "| sections:", await sections());
await browser.close();
