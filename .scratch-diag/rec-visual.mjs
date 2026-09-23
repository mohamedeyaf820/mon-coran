// scratch: rendered check of reciter portraits — does the hero <img> actually load,
// what does the attribution link say, and does an avatar-only reciter stay graceful?
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4394";
const SETTINGS_KEY = "mushaf-plus-settings";
const m = await import("../src/data/reciters.js");

const TARGETS = [
  { id: "warsh_yassin", riwaya: "warsh" },
  { id: "warsh_mohamed_abdulkarim", riwaya: "warsh" },
  { id: "warsh_rachid_belalaya", riwaya: "warsh" },
  { id: "warsh_dagous", riwaya: "warsh" },
  { id: "saad_almoqren", riwaya: "hafs" },
];

const browser = await chromium.launch();
const rows = [];

for (const t of TARGETS) {
  const reciter = m.getReciter(t.id, t.riwaya);
  const ctx = await browser.newContext({ serviceWorkers: "block", viewport: { width: 420, height: 880 } });
  await ctx.addInitScript(
    (a) => {
      localStorage.setItem(
        a.key,
        JSON.stringify({
          skipSplashAnimation: true,
          showHome: true,
          sidebarOpen: false,
          homeSection: "audio",
          riwaya: a.riwaya,
          fontFamily: "qpc-hafs",
          lang: "fr",
          theme: "light",
        }),
      );
      localStorage.setItem("mushaf-plus-onboarded", "1");
    },
    { key: SETTINGS_KEY, riwaya: t.riwaya },
  );
  const page = await ctx.newPage();
  const errs = [];
  page.on("requestfailed", (r) => {
    if (/media|assabile|qurancdn|way2quran/.test(r.url())) errs.push(r.url().split("/").pop());
  });
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('.home-content-toolbar [role="tab"]', { timeout: 30000 }).catch(() => {});
  await page.locator('.home-content-toolbar [role="tab"]').nth(2).click().catch(() => {});
  await page.waitForTimeout(1800);

  const list = m.getRecitersByRiwaya(t.riwaya);
  const idx = list.findIndex((r) => r.id === t.id);
  const labels = [reciter.nameFr, reciter.nameEn, reciter.name].filter(Boolean);
  let card = null;
  for (const label of labels) {
    const loc = page.locator(".reciter-card__main", { hasText: label }).first();
    if (await loc.count()) {
      card = loc;
      break;
    }
  }
  if (!card) {
    const byIndex = page.locator(".reciter-card__main").nth(idx);
    if (await byIndex.count()) card = byIndex;
  }
  if (card) {
    await card.click().catch(() => {});
  } else {
    errs.push(`carte introuvable (idx ${idx})`);
  }
  await page.waitForSelector(".reciter-detail", { timeout: 15000 }).catch(() => errs.push("fiche non ouverte"));
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => {
    const img = document.querySelector(".reciter-hero__photo img, .reciter-hero img, .recitation-library__avatar img");
    const att = [...document.querySelectorAll(".reciter-detail__source-row a, .reciter-detail a")].map((a) => a.textContent.trim());
    const srcs = [...document.querySelectorAll(".reciter-detail__source-links a")].map((a) => `${a.textContent.trim()}→${a.getAttribute("href")}`);
    return {
      imgSrc: img ? img.currentSrc || img.src : null,
      loaded: img ? img.complete && img.naturalWidth > 0 : false,
      natural: img ? `${img.naturalWidth}x${img.naturalHeight}` : null,
      box: img ? `${Math.round(img.getBoundingClientRect().width)}x${Math.round(img.getBoundingClientRect().height)}` : null,
      initials: !!document.querySelector(".reciter-hero__avatar, [class*=avatar]:not(img)"),
      sources: srcs,
      attribution: att.filter((x) => /Portrait/i.test(x)),
      title: (document.querySelector(".reciter-hero h1, .rd-sticky-head h1")?.textContent || "").trim().slice(0, 40),
    };
  });
  await page
    .screenshot({ path: `.scratch-diag/rec/render-${t.id}.png` })
    .catch(() => {});
  rows.push({ id: t.id, title: info.title, loaded: info.loaded, natural: info.natural, box: info.box, attribution: info.attribution.join(" "), sources: info.sources.join(" | "), errs: errs.slice(0, 3).join(",") });
  await ctx.close();
}
console.table(rows);
await browser.close();
