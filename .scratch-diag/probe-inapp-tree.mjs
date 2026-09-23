import { chromium } from "playwright";
const BASE = "http://127.0.0.1:4173";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const page = await ctx.newPage();
page.on("pageerror", (e) => console.log("PAGEERROR", e.message.slice(0, 200)));
page.on("console", (m) => { if (m.type() === "error") console.log("CONSOLE", m.text().slice(0, 200)); });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({ theme: "light", riwaya: "hafs", showTajwid: true, displayMode: "page", mushafLayout: "list", currentPage: 572 })));
await page.goto(`${BASE}/page/572`, { waitUntil: "domcontentloaded" });
const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip/ });
if (await skip.count()) { await skip.first().click().catch(() => {}); }
await page.waitForTimeout(12000);
const tree = await page.evaluate(() => {
  const walk = (el, d = 0, out = []) => {
    if (d > 7) return out;
    for (const c of el.children) {
      out.push("  ".repeat(d) + c.tagName.toLowerCase() + "." + Array.from(c.classList).join("."));
      walk(c, d + 1, out);
    }
    return out;
  };
  const root = document.querySelector(".quran-mode-pane") || document.querySelector(".page-stream") || document.body;
  return { text: walk(root).slice(0, 60), qcm: document.querySelectorAll("[class*=qcm]").length, imgs: document.querySelectorAll("img").length };
});
console.log(tree.qcm, tree.imgs);
console.log(tree.text.join("\n"));
await browser.close();
