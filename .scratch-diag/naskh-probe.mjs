import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4188/";
const configs = [
  { name: "fr-390", w: 390, h: 844, lang: "fr", route: "/" },
  { name: "ar-390", w: 390, h: 844, lang: "ar", route: "/" },
  { name: "ar-1280", w: 1280, h: 800, lang: "ar", route: "/" },
  { name: "ar-duas", w: 390, h: 844, lang: "ar", route: "/duas" },
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
  const fonts = [];
  ctx.on("response", (res) => {
    const u = new URL(res.url());
    if (u.pathname.endsWith(".woff2")) fonts.push(u.pathname);
  });
  const page = await ctx.newPage();
  await page.goto(BASE + cfg.route.replace(/^\//, ""), { waitUntil: "load" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
  const used = await page.evaluate(() => {
    const arabic = [...document.querySelectorAll("*")].filter((el) => {
      const own = [...el.childNodes]
        .filter((n) => n.nodeType === 3)
        .map((n) => n.textContent)
        .join("");
      return /[؀-ۿ]/.test(own);
    });
    const seen = new Map();
    for (const el of arabic.slice(0, 400)) {
      const cs = getComputedStyle(el);
      const range = document.createRange();
      range.selectNodeContents(el);
      let face = "";
      try {
        face = document.fonts.check(cs.fontFamily, "الله")
          ? [...document.fonts]
              .filter((f) => f.family.replace(/["']/g, "") === cs.fontFamily.split(",")[0].trim().replace(/["']/g, "") && f.status === "loaded")
              .map((f) => f.unicodeRange || "all")
              .join(" | ")
          : "not-loaded";
      } catch {}
      const key = cs.fontFamily.split(",")[0].trim();
      if (!seen.has(key)) seen.set(key, { face, sample: el.textContent.trim().slice(0, 24) });
    }
    return { arabicNodes: arabic.length, families: [...seen] };
  });
  await page.screenshot({ path: `.design-shots/naskh/${cfg.name}.png` });
  console.log(
    `\n## ${cfg.name}  arabic text nodes: ${used.arabicNodes}`,
    "\n   fetched woff2:",
    [...new Set(fonts)].join(", ") || "none",
    "\n   families:",
    used.families.map(([k, v]) => `${k} -> ${v.face}`).join("; "),
  );
  await ctx.close();
}
await browser.close();
