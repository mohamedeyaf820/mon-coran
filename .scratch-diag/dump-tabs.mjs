import { chromium, devices } from "playwright";

const BASE = "http://127.0.0.1:4187";
const browser = await chromium.launch();
const ctx = await browser.newContext(devices["iPhone 12"]);
const p = await ctx.newPage();
await p.addInitScript(
  ([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)),
  [{ theme: "light", lang: "ar", riwaya: "hafs", showTajwid: false, displayMode: "list", currentPage: 2 }],
);
await p.goto(BASE, { waitUntil: "domcontentloaded" });
await p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ }).first().click({ timeout: 8000 }).catch(() => {});
await p.waitForSelector(".splash-screen", { state: "detached", timeout: 15000 }).catch(() => {});
await p.waitForSelector('button[role="tab"]', { timeout: 20000 });
await p.locator('button[role="tab"]', { hasText: /Audio|الصوتيات/ }).first().click();
await p.waitForTimeout(1800);

console.log(JSON.stringify(await p.evaluate(() => {
  const card = document.querySelector(".reciter-card");
  const r = card.getBoundingClientRect();
  const stack = [...document.elementsFromPoint(r.x + r.width / 2, r.y + r.height / 2)].slice(0, 6)
    .map((e) => `${e.tagName}.${(e.className || "").toString().slice(0, 55)}`);
  const btns = [...document.querySelectorAll("button")]
    .filter((b) => { const x = b.getBoundingClientRect(); return x.width > 20 && x.y > 80 && x.y < 300; })
    .map((b) => {
      const x = b.getBoundingClientRect();
      return { txt: b.innerText.replace(/\s+/g, " ").slice(0, 20), aria: b.getAttribute("aria-label"), box: `${x.x.toFixed(0)},${x.y.toFixed(0)} ${x.width.toFixed(0)}x${x.height.toFixed(0)}` };
    });
  return { cardBox: `${r.x.toFixed(0)},${r.y.toFixed(0)} ${r.width.toFixed(0)}x${r.height.toFixed(0)}`, stack, btns };
}), null, 1));
await browser.close();
