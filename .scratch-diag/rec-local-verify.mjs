// scratch: prove the app paints reciter faces from its own origin only, and that
// the hero photo, attribution line and avatar fallback all render.
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4394";
const SETTINGS_KEY = "mushaf-plus-settings";
const m = await import("../src/data/reciters.js");

const TARGETS = [
  { id: "saad_almoqren", riwaya: "hafs" },
  { id: "warsh_rachid_belalaya", riwaya: "warsh" },
  { id: "warsh_yassin", riwaya: "warsh" },
  { id: "warsh_dagous", riwaya: "warsh" },
  { id: "ar.alafasy", riwaya: "hafs" },
];

const browser = await chromium.launch();
const rows = [];
const imageHosts = new Map();

for (const t of TARGETS) {
  const reciter = m.getReciter(t.id, t.riwaya);
  const ctx = await browser.newContext({
    serviceWorkers: "block",
    viewport: { width: 420, height: 880 },
  });
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
  const failures = [];
  page.on("response", (res) => {
    const url = res.url();
    if (/\.(webp|png|jpe?g|svg|gif)(\?|$)/i.test(url) || res.request().resourceType() === "image") {
      const host = new URL(url).host;
      const prev = imageHosts.get(host) || { n: 0, bad: 0 };
      prev.n += 1;
      if (res.status() >= 400) prev.bad += 1;
      imageHosts.set(host, prev);
    }
    if (res.status() >= 400 && /images\/reciters/.test(url)) failures.push(`${res.status()} ${url}`);
  });
  page.on("requestfailed", (r) => {
    if (/\.(webp|png|jpe?g)/i.test(r.url())) failures.push(`failed ${r.url()}`);
  });

  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('.home-content-toolbar [role="tab"]', { timeout: 30000 }).catch(() => {});
  await page.locator('.home-content-toolbar [role="tab"]').nth(2).click().catch(() => {});
  await page.waitForTimeout(2000);

  const labels = [reciter.nameFr, reciter.nameEn, reciter.name].filter(Boolean);
  // The hub window is virtualised: scroll its list container until the card renders.
  const findCard = async () => {
    for (const label of labels) {
      const loc = page.locator(".reciter-card__main", { hasText: label }).first();
      if (await loc.count()) return loc;
    }
    return null;
  };
  let card = await findCard();
  // The hub lists eight reciters per batch behind an "Afficher plus" button.
  for (let step = 0; !card && step < 12; step += 1) {
    const more = page.getByRole("button", { name: /Afficher plus de récitateurs|Show more reciters|المزيد/ }).first();
    if (!(await more.count())) break;
    await more.click().catch(() => {});
    await page.waitForTimeout(320);
    card = await findCard();
  }
  if (!card) {
    failures.push("carte absente du hub");
    rows.push({ id: t.id, expect: reciter.nameFr, title: "-", served: "-", loaded: false, natural: null, box: null, attribution: "", errs: failures.join(",") });
    await ctx.close();
    continue;
  }
  if (card) {
    await card.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(250);
    await card.click().catch(() => {});
  }
  await page.waitForSelector(".reciter-detail", { timeout: 15000 }).catch(() => failures.push("fiche non ouverte"));
  await page.waitForTimeout(2500);

  const info = await page.evaluate(() => {
    const img = document.querySelector(".reciter-hero__avatar--fallback img, img.reciter-hero__avatar");
    const fallback = document.querySelector(".reciter-hero__avatar--fallback");
    return {
      title: (document.querySelector(".reciter-hero__name")?.textContent || "").trim().slice(0, 40),
      imgSrc: img ? img.currentSrc || img.src : null,
      loaded: img ? img.complete && img.naturalWidth > 0 : false,
      natural: img ? `${img.naturalWidth}x${img.naturalHeight}` : null,
      box: img ? `${Math.round(img.getBoundingClientRect().width)}x${Math.round(img.getBoundingClientRect().height)}` : null,
      initialsShown: fallback ? (fallback.textContent || "").trim() : null,
      attribution: [...document.querySelectorAll(".reciter-detail a, .reciter-hero a, a")]
        .map((a) => a.textContent.trim())
        .filter((x) => /Portrait ·/i.test(x))
        .join(" "),
      sources: [...document.querySelectorAll(".reciter-detail__source-links a")].map(
        (a) => `${a.textContent.trim()}→${a.getAttribute("href")}`,
      ),
    };
  });
  await page.screenshot({ path: `.scratch-diag/rec/local-${t.id}.png` }).catch(() => {});
  rows.push({
    id: t.id,
    expect: reciter.nameFr,
    title: info.title,
    served: info.imgSrc ? new URL(info.imgSrc).pathname : `(avatar ${info.initialsShown ?? ""})`,
    loaded: info.loaded,
    natural: info.natural,
    box: info.box,
    attribution: info.attribution,
    errs: failures.slice(0, 2).join(","),
  });
  await ctx.close();
}

console.table(rows);
console.log("image hosts:", [...imageHosts].map(([h, v]) => `${h} ${v.n}${v.bad ? ` BAD:${v.bad}` : ""}`).join(" | "));
await browser.close();
