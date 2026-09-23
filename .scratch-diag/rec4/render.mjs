// scratch: prove both voices are reachable in the built app
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4394";
const br = await chromium.launch();

async function open(lang = "fr") {
  const c = await br.newContext({ serviceWorkers: "block", viewport: { width: 390, height: 844 } });
  await c.addInitScript((a) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true, showHome: true, sidebarOpen: false,
      homeSection: "audio", riwaya: "hafs", fontFamily: "qpc-hafs", lang: a, theme: "light",
    }));
    localStorage.setItem("mushaf-plus-onboarded", "1");
  }, lang);
  const p = await c.newPage();
  await p.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
  await p.waitForSelector('.home-content-toolbar [role="tab"]', { timeout: 30000 });
  await p.locator('.home-content-toolbar [role="tab"]').nth(2).click();
  await p.waitForSelector(".home-style-filter", { timeout: 20000 });
  return { c, p };
}

const search = async (p, q) => {
  const box = p.locator(".home-audio-browser input, input[placeholder*='récitateur'], input[placeholder*='reciter']").first();
  await box.fill(q);
  await p.waitForTimeout(1500);
  return p.evaluate(() =>
    [...document.querySelectorAll(".reciter-card__main")].map((el) =>
      el.textContent.replace(/\s+/g, " ").trim().slice(0, 44),
    ),
  );
};

for (const q of ["albanna", "kalbanni", "kalbani", "banna"]) {
  const { c, p } = await open();
  const hits = await search(p, q);
  console.log(`search "${q}" ->`, hits.length ? hits.join(" | ") : "NO RESULT");
  await c.close();
}

// Open Kalbani's sheet: portrait must be local, and the surah-only mode visible.
{
  const { c, p } = await open();
  await search(p, "kalbani");
  await p.locator(".reciter-card__main").first().click();
  await p.waitForSelector(".reciter-hero__name", { timeout: 20000 });
  await p.waitForTimeout(1500);
  const info = await p.evaluate(() => {
    const img = document.querySelector(".reciter-hero__avatar img, img[class*='avatar']");
    return {
      name: document.querySelector(".reciter-hero__name")?.textContent?.trim(),
      portrait: img?.getAttribute("src"),
      badge: document.querySelector(".reciter-detail__sheet, .reciter-detail")?.innerText
        ?.replace(/\s+/g, " ")
        .slice(0, 300),
    };
  });
  console.log("\nsheet:", JSON.stringify(info, null, 1));
  await p.screenshot({ path: ".scratch-diag/rec4/kalbani-sheet.png" });
  await c.close();
}
await br.close();
