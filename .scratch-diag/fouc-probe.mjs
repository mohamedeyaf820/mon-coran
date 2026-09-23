import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const BLOCKING = readFileSync("dist/index.html", "utf8").match(
  /<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"/,
)[1];
const tag = process.argv[2] || "variant";
const DEFER_DELAY = Number(process.argv[3] || 1500);

const configs = [
  { name: "fr-390", w: 390, h: 844, lang: "fr" },
  { name: "ar-390", w: 390, h: 844, lang: "ar" },
  { name: "fr-1280", w: 1280, h: 800, lang: "fr" },
  { name: "ar-1280", w: 1280, h: 800, lang: "ar" },
];

const browser = await chromium.launch();
for (const cfg of configs) {
  const ctx = await browser.newContext({
    viewport: { width: cfg.w, height: cfg.h },
    deviceScaleFactor: 2,
  });
  await ctx.addInitScript(
    ([lang]) => {
      window.localStorage.setItem(
        "mushaf-plus-settings",
        JSON.stringify({
          lang,
          theme: "light",
          riwaya: "hafs",
          showHome: true,
          skipSplashAnimation: true,
        }),
      );
    },
    [cfg.lang],
  );
  const deferred = [];
  await ctx.route("**/*", async (route) => {
    const url = new URL(route.request().url()).pathname;
    if (url.endsWith(".css") && !url.endsWith(BLOCKING)) {
      deferred.push(url);
      await new Promise((r) => setTimeout(r, DEFER_DELAY));
    }
    await route.continue();
  });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:4187/", { waitUntil: "commit" });
  await page.waitForTimeout(450);
  await page.screenshot({ path: `.design-shots/fouc/${tag}-${cfg.name}-flash.png` });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `.design-shots/fouc/${tag}-${cfg.name}-settled.png` });
  console.log(cfg.name, "deferred css:", [...new Set(deferred)].join(",") || "none");
  await ctx.close();
}
await browser.close();
