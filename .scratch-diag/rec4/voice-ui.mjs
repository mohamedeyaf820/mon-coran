// scratch: verify the search dialog voice panel renders
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4394";
const br = await chromium.launch();

for (const [lang, width, theme] of [["fr", 360, "light"], ["ar", 360, "light"], ["fr", 1280, "dark"]]) {
  const c = await br.newContext({ serviceWorkers: "block", viewport: { width, height: 800 } });
  await c.addInitScript((a) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true, showHome: true, sidebarOpen: false,
      homeSection: "surah", riwaya: "hafs", fontFamily: "qpc-hafs", lang: a.lang, theme: a.theme,
    }));
    localStorage.setItem("mushaf-plus-onboarded", "1");
  }, { lang, theme });
  const p = await c.newPage();
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForSelector("body", { timeout: 20000 });
  // open the search dialog
  await p.keyboard.press("Control+k").catch(() => {});
  await p.waitForTimeout(800);
  let opened = await p.locator(".search-pro__voice-btn").count();
  if (!opened) {
    const btn = p.locator('[aria-label*="echercher"], button:has-text("Rechercher")').first();
    if (await btn.count()) { await btn.click().catch(() => {}); await p.waitForTimeout(900); }
  }
  const info = await p.evaluate(() => {
    const badge = document.querySelector(".search-pro__voice-lang");
    const mic = document.querySelector(".search-pro__voice-btn");
    return {
      dialog: Boolean(document.querySelector(".search-pro__header")),
      micLabel: mic?.getAttribute("aria-label"),
      badge: badge?.textContent,
      badgeVisible: badge ? getComputedStyle(badge).display !== "none" : null,
    };
  });
  console.log(`\n${lang}/${width}/${theme}:`, JSON.stringify(info));
  if (info.dialog) {
    await p.locator(".search-pro__voice-btn").click();
    await p.waitForTimeout(900);
    const panel = await p.evaluate(() => {
      const el = document.querySelector(".search-pro__voice-panel");
      if (!el) return null;
      return {
        text: el.innerText.replace(/\s+/g, " ").trim().slice(0, 120),
        options: [...el.querySelectorAll(".search-pro__voice-lang-option")].map((b) => ({
          label: b.textContent.trim(),
          pressed: b.getAttribute("aria-pressed"),
          h: Math.round(b.getBoundingClientRect().height),
          w: Math.round(b.getBoundingClientRect().width),
        })),
      };
    });
    console.log("  panel:", JSON.stringify(panel));
    await p.screenshot({ path: `.scratch-diag/rec4/search-${lang}-${width}-${theme}.png` });
  }
  await c.close();
}
await br.close();
