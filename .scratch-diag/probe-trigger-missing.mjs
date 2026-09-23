import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
const p = await ctx.newPage();
p.on("console", (m) => {
  if (m.type() === "error") console.log("CONSOLE-ERR:", m.text().slice(0, 300));
});
p.on("pageerror", (e) => console.log("PAGEERROR:", String(e).slice(0, 500)));
await p.addInitScript(() =>
  localStorage.setItem(
    "mushaf-plus-settings",
    JSON.stringify({ theme: "light", riwaya: "warsh", showTajwid: true, displayMode: "page", mushafLayout: "mushaf", currentPage: 1 }),
  ),
);
await p.goto(`${BASE}/page/1`, { waitUntil: "domcontentloaded" });
await p.waitForTimeout(6000);
const info = await p.evaluate(() => ({
  url: location.href,
  splash: !!document.querySelector(".splash-screen"),
  text: document.body.innerText.slice(0, 400),
  triggers: Array.from(document.querySelectorAll("button")).map((b) => b.className).slice(0, 40),
  fs: !!document.querySelector(".reader-fullscreen-trigger"),
  srh: !!document.querySelector(".srh-fullscreen-btn"),
}));
console.log(JSON.stringify(info, null, 1));
await p.screenshot({ path: ".scratch-diag/captures/debug-trigger.png" });
await browser.close();
