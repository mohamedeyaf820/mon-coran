import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "warsh",
  fontFamily: "kfgqpc-warsh", quranFontSize: 28, showTajwid: false, warshStrictMode: true,
})));
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
const reqs = [];
page.on("request", (r) => { if (r.url().includes("kfgqpc-warsh")) reqs.push(r.url()); });
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 25000 });
await page.waitForTimeout(2500);
const info = await page.evaluate(() => {
  const faces = [...document.fonts].filter((f) => /warsh/i.test(f.family)).map((f) => `${f.family}:${f.status}`);
  const el = document.querySelector(".qc-ayah-text-ar");
  const cs = el ? getComputedStyle(el) : null;
  const r = el?.getBoundingClientRect();
  return { faces, family: cs?.fontFamily, text: el?.textContent?.slice(0, 40), w: r?.width, h: r?.height };
});
console.log(JSON.stringify(info, null, 1));
console.log("font requests:", reqs);
await page.screenshot({ path: ".scratch-diag/p21-warsh-v21.png" });
console.log("pageerrors:", errors.length ? errors : "none");
await browser.close();
