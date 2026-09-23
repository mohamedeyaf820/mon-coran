import { chromium } from "file:///C:/Users/amirou/Documents/Quran%20App/node_modules/@playwright/test/index.mjs";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => {
  localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({ mushafLayout: "mushaf", language: "fr" }),
  );
});
await page.goto("http://127.0.0.1:4191/surah/2", { waitUntil: "domcontentloaded" });
for (let i = 0; i < 25; i++) {
  if (await page.evaluate(() => !!document.querySelector(".virtual-mushaf-page[data-rendered='true'] [data-ayah-number]"))) break;
  await page.waitForTimeout(2000);
}
await page.waitForTimeout(2000);

const read = () =>
  page.evaluate(() => {
    const h = document.querySelector(".mp-header");
    const shell = document.querySelector(".app-layout-shell");
    const main = document.querySelector("#main-content");
    const cs = getComputedStyle(h);
    const root = document.querySelector(".app-root");
    return {
      cls: h.className,
      headerRect: JSON.stringify(h.getBoundingClientRect()),
      headerPos: cs.position,
      headerMargin: [cs.marginTop, cs.marginBottom],
      headerHeight: cs.height,
      shellTop: Math.round(shell.getBoundingClientRect().top),
      shellH: Math.round(shell.getBoundingClientRect().height),
      rootVar: getComputedStyle(document.documentElement).getPropertyValue("--header-h"),
      rootMarginTop: getComputedStyle(root).marginTop,
      winScrollY: Math.round(window.scrollY),
      mainId: main ? main.className.toString().slice(0, 40) : null,
      mainScrollTop: main ? Math.round(main.scrollTop) : null,
    };
  });

console.log("BEFORE", JSON.stringify(await read(), null, 1));
await page.evaluate(() => { document.querySelector(".app-main").scrollTop = 900; });
await page.waitForTimeout(3000);
console.log("AFTER ", JSON.stringify(await read(), null, 1));
await browser.close();
