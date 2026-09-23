import { chromium } from "playwright";

const browser = await chromium.launch();
for (const w of [390, 700, 1100]) {
  const page = await browser.newPage({ viewport: { width: w, height: 844 } });
  await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
    splashCompleted: true, skipSplashAnimation: true, showHome: false,
    displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "hafs",
    fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
  })));
  await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
  const s = page.locator(".splash-screen button").filter({ hasText: /Passer|Skip/ }).first();
  if (await s.count()) await s.click({ force: true }).catch(() => {});
  await page.waitForSelector("[data-stream-page]", { timeout: 20000 }); await page.waitForTimeout(800);
  const out = await page.evaluate(() => {
    const deck = document.querySelector(".reader-control-deck");
    if (!deck) return { deck: false, bars: document.querySelectorAll(".reader-command-bar").length, toolbars: document.querySelectorAll("[role=toolbar]").length };
    const t = document.querySelector(".reader-command-bar");
    if (!t) return { present: false };
    const cs = getComputedStyle(t);
    const btns = Array.from(t.querySelectorAll("button")).map((b) => {
      const r = b.getBoundingClientRect();
      return `${(b.getAttribute("aria-label") || b.title || b.textContent?.trim().slice(0, 10))} ${Math.round(r.width)}x${Math.round(r.height)}`;
    });
    return { present: true, display: cs.display, visible: cs.visibility, rect: t.getBoundingClientRect().height, btns };
  });
  console.log(w, JSON.stringify(out));
  await page.close();
}
await browser.close();
