// scratch: do the hub style chips and the search now behave?
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL || "http://127.0.0.1:4394";

async function hub({ riwaya = "hafs", width = 420, height = 880, lang = "fr" } = {}) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    serviceWorkers: "block",
    viewport: { width, height },
  });
  await ctx.addInitScript((a) => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        skipSplashAnimation: true, showHome: true, sidebarOpen: false,
        homeSection: "audio", riwaya: a.riwaya, fontFamily: "qpc-hafs",
        lang: a.lang, theme: "light",
      }),
    );
    localStorage.setItem("mushaf-plus-onboarded", "1");
  }, { riwaya, lang });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForSelector('.home-content-toolbar [role="tab"]', { timeout: 30000 });
  await page.locator('.home-content-toolbar [role="tab"]').nth(2).click();
  await page.waitForTimeout(2000);
  return { browser, page };
}

const chips = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll(".home-style-filter")].map((el) => ({
      label: el.textContent.replace(/\s+/g, " ").trim(),
      pressed: el.getAttribute("aria-pressed"),
      visible: el.getBoundingClientRect().width > 0,
    })),
  );

const cardCount = (page) =>
  page.evaluate(() => document.querySelectorAll(".reciter-card__main").length);

for (const riwaya of ["hafs", "warsh"]) {
  const { browser, page } = await hub({ riwaya });
  console.log(`\n### ${riwaya}`);
  console.log("chips:", JSON.stringify(await chips(page)));
  console.log("cards on first page:", await cardCount(page));
  console.log(
    "hint:",
    await page.evaluate(
      () => document.querySelector(".home-audio-browser__hint")?.textContent?.trim() || null,
    ),
  );
  // The Muallim chip is the one that used to be dead.
  const muallim = page.locator('.home-style-filter', { hasText: "Muallim" });
  if (await muallim.count()) {
    await muallim.first().click();
    await page.waitForTimeout(700);
    console.log(
      "after Muallim:",
      await cardCount(page),
      JSON.stringify(
        await page.evaluate(() =>
          [...document.querySelectorAll(".reciter-card__main")].map((el) =>
            el.textContent.replace(/\s+/g, " ").trim().slice(0, 40),
          ),
        ),
      ),
    );
  } else {
    console.log("after Muallim: chip not offered for this riwaya");
  }
  await browser.close();
}

// The hint line must describe only the chips actually on screen.
for (const riwaya of ["hafs", "warsh"]) {
  for (const lang of ["fr", "ar", "en"]) {
    for (const width of [360, 1440]) {
      const { browser, page } = await hub({ riwaya, lang, width });
      const r = await page.evaluate(() => {
        const hint = document.querySelector(".home-audio-browser__hint");
        const strip = document.querySelector(".home-style-filters");
        const box = strip?.getBoundingClientRect();
        return {
          hint: hint?.textContent?.replace(/\s+/g, " ").trim() || null,
          dir: document.documentElement.dir,
          chips: [...document.querySelectorAll(".home-style-filter")].map(
            (el) => el.textContent.replace(/\s+/g, " ").trim(),
          ),
          overflow: strip ? strip.scrollWidth > strip.clientWidth + 1 : null,
          chipHeight: box ? Math.round(box.height) : null,
        };
      });
      console.log(
        `\nhint ${riwaya}/${lang}/${width}: ${r.hint}\n  chips=${JSON.stringify(r.chips)} dir=${r.dir} overflowX=${r.overflow} stripH=${r.chipHeight}`,
      );
      if (width === 360) await page.screenshot({ path: `.scratch-diag/rec3/chips-${riwaya}-${lang}-360.png` });
      await browser.close();
    }
  }
}

// Search reachability, in the rendered app, for the spellings the user typed.
{
  const { browser, page } = await hub({});
  for (const q of ["minshawwi", "Minshawy", "kalbanni"]) {
    await page.fill('input[type="search"], .home-audio-browser input, input[placeholder*="ateur"]', q).catch(async () => {
      const inp = page.locator("input").first();
      await inp.fill(q);
    });
    await page.waitForTimeout(1400);
    const names = await page.evaluate(() =>
      [...document.querySelectorAll(".reciter-card__main")].map((el) =>
        el.textContent.replace(/\s+/g, " ").trim().slice(0, 34),
      ),
    );
    const empty = await page.evaluate(
      () => document.body.innerText.includes("Aucun récitateur"),
    );
    console.log(`search "${q}" ->`, names.length ? names.join(" | ") : empty ? "EMPTY STATE" : "no cards/no empty state");
  }
  await browser.close();
}
