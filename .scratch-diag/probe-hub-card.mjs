import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4187";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.addInitScript(
  ([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)),
  [{ theme: "light", lang: "fr", riwaya: "hafs", showTajwid: false, displayMode: "list", currentPage: 2 }],
);
await p.goto(BASE, { waitUntil: "domcontentloaded" });
await p.locator(".splash-screen button", { hasText: /Passer|Skip/ }).first().click({ timeout: 8000 }).catch(() => {});
await p.waitForSelector('button[role="tab"]', { timeout: 20000 });
await p.locator('button[role="tab"]', { hasText: /Audio/ }).first().click();
await p.waitForTimeout(1200);
await p.locator(".reciter-card").first().scrollIntoViewIfNeeded();
await p.waitForTimeout(500);

const out = await p.evaluate(() => {
  const pick = (el, props) => {
    const c = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    return {
      rect: `${r.width.toFixed(1)}x${r.height.toFixed(1)}`,
      ...Object.fromEntries(props.map((x) => [x, c.getPropertyValue(x)])),
    };
  };
  const card = document.querySelector(".reciter-card");
  const name = card.querySelector(".reciter-card__name, [class*='__title'], [class*='__name']");
  const info = name?.parentElement;
  return {
    rootFont: getComputedStyle(document.documentElement).fontSize,
    card: pick(card, ["display", "grid-template-columns", "transition", "border-radius"]),
    fav: pick(card.querySelector(".reciter-card__favorite"), ["width", "min-width", "height", "min-height", "padding", "flex-shrink"]),
    listen: pick(card.querySelector(".reciter-card__listen"), ["width", "min-width", "height", "min-height", "padding-inline", "flex-shrink"]),
    actions: pick(card.querySelector(".reciter-card__actions"), ["display", "gap", "padding", "flex-shrink", "min-width"]),
    name: name ? pick(name, ["text-align", "font-size", "justify-content", "align-items"]) : null,
    info: info ? pick(info, ["display", "text-align", "justify-content", "align-items", "flex-direction"]) : null,
    infoCls: info?.className,
    nameCls: name?.className,
    cardHtml: card.outerHTML.slice(0, 1200),
  };
});
console.log(JSON.stringify(out, null, 1));
await browser.close();
