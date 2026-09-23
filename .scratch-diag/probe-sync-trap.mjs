import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
  splashCompleted: true, skipSplashAnimation: true, showHome: false,
  displayMode: "page", mushafLayout: "list", lang: "fr", riwaya: "hafs",
  fontFamily: "qpc-hafs", quranFontSize: 30, showTajwid: false,
})));
await page.goto("http://127.0.0.1:4173/page/3", { waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-text-ar", { timeout: 20000 });
await page.waitForTimeout(2000);
// 1) toolbar pill vs header menu sync
const state1 = await page.evaluate(() => {
  const pill = Array.from(document.querySelectorAll(".qc-reader-toolbar__modes button")).find(b => /Mushaf/.test(b.textContent));
  return { pill: pill?.getAttribute("aria-pressed") };
});
await page.evaluate(() => {
  Array.from(document.querySelectorAll(".qc-reader-toolbar__modes button")).find(b => /Mushaf/.test(b.textContent))?.click();
});
await page.waitForTimeout(2500);
const state2 = await page.evaluate(() => {
  const pill = Array.from(document.querySelectorAll(".qc-reader-toolbar__modes button")).find(b => /Mushaf/.test(b.textContent));
  // header menu button (may be inside a collapsed menu)
  const hdr = Array.from(document.querySelectorAll("button")).find(b => /mushaf/i.test(b.textContent) && b.closest("header, .app-header, nav"));
  return { pill: pill?.getAttribute("aria-pressed"), headerBtn: hdr ? hdr.getAttribute("aria-pressed") || hdr.className : "none" };
});
console.log("sync:", JSON.stringify(state1), JSON.stringify(state2));
// 2) focus trap re-fire: open verse actions twice via marker tap
await page.waitForTimeout(1500);
const openAndCheck = async () => {
  await page.evaluate(() => document.querySelector("[data-stream-page] .qcm-ayah-marker")?.click());
  await page.waitForTimeout(700);
  const dlg = page.locator("[role='dialog']").first();
  const present = await dlg.count();
  if (!present) return "no-dialog";
  // Tab 12 times: focus must stay inside the dialog
  let escaped = false;
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(() => {
      const d = document.querySelector("[role='dialog']");
      return d ? d.contains(document.activeElement) : false;
    });
    if (!inside) { escaped = true; break; }
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);
  return escaped ? "ESCAPED" : "trapped";
};
console.log("trap 1st open:", await openAndCheck());
console.log("trap 2nd open:", await openAndCheck());
console.log("trap 3rd open:", await openAndCheck());
await browser.close();
