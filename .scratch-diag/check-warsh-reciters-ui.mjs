import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "warsh",
  fontFamily: "qpc-hafs", quranFontSize: 28, showTajwid: false, warshStrictMode: true,
})));
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 25000 });
await page.evaluate(() => window.dispatchEvent(new Event("mushafplus-open-audio-options")));
await page.waitForSelector('[data-testid="reciter-option"]', { timeout: 8000 });
const ids = await page.$$eval('[data-testid="reciter-option"]', (els) =>
  els.map((el) => el.getAttribute("data-reciter-id")),
);
const wanted = [
  "warsh_rachid_belalaya",
  "warsh_omar_al_qazabri",
  "warsh_al_qaria_yassen",
  "warsh_mohammad_saayed",
  "warsh_ahmed_diban",
];
const visible = new Set(ids);
console.log("warsh options shown:", ids.filter((i) => i.startsWith("warsh")).length, JSON.stringify(ids));
for (const w of wanted) console.log(w, visible.has(w) ? "OK" : "MISSING");
const names = await page.$$eval(
  '[data-testid="reciter-option"]',
  (els, list) =>
    els
      .filter((el) => list.includes(el.getAttribute("data-reciter-id")))
      .map((el) => el.textContent.replace(/\s+/g, " ").trim().slice(0, 90)),
  wanted,
);
console.log(names.join("\n"));
console.log("pageerrors:", errors.length ? errors : "none");
await browser.close();
