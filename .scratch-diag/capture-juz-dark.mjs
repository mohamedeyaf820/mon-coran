import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/juz-medallion-dark";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function shot({ riwaya, page, label }) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.addInitScript(
    ([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)),
    [{ theme: "dark", riwaya, showTajwid: false, displayMode: "page", mushafLayout: "mushaf", currentPage: page }],
  );
  await p.goto(`${BASE}/page/${page}`, { waitUntil: "domcontentloaded" });
  await p.waitForTimeout(1500);
  const skip = p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
  if (await skip.count()) await skip.first().click().catch(() => {});
  await p.waitForSelector(".splash-screen", { state: "detached", timeout: 15000 }).catch(() => {});
  await p.waitForFunction((n) => document.body.innerText.includes(`Page ${n}`), page, { timeout: 25000 }).catch(() => {});
  await p.waitForTimeout(2500);
  await p.locator(".reader-fullscreen-trigger, .srh-fullscreen-btn").first().click();
  await p.waitForFunction(() => {
    const el = document.querySelector(".mfp-portal-root .qcm-lines");
    return !!el && el.textContent.trim().length > 20;
  }, { timeout: 30000 });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(3000);

  const info = await p.evaluate(() => {
    const root = document.querySelector(".mfp-portal-root");
    const juz = root.querySelector(".qcm-ayah-marker--juz");
    const leaf = root.querySelector(".qcm-page").getBoundingClientRect();
    let box = null;
    if (juz) {
      const b = juz.getBoundingClientRect();
      box = { x: Math.round(b.left - leaf.left), y: Math.round(b.top - leaf.top), w: Math.round(b.width), h: Math.round(b.height) };
    }
    return {
      markers: root.querySelectorAll(".qcm-ayah-marker").length,
      juzMarkers: root.querySelectorAll(".qcm-ayah-marker--juz").length,
      box,
      abs: juz
        ? (() => {
            const b = juz.getBoundingClientRect();
            return { x: Math.round(b.left), y: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) };
          })()
        : null,
      color: juz ? getComputedStyle(juz).color : null,
      ring: juz ? getComputedStyle(juz, "::after").borderColor : null,
    };
  });
  console.log(`### ${label}`, JSON.stringify(info));
  await p.locator(".mfp-portal-root .qcm-page").first().screenshot({ path: `${OUT}/${label}.png` });
  if (info.abs) {
    const zoom = await ctx.newCDPSession(p);
    await zoom.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 8,
      mobile: true,
    });
    await p.screenshot({
      path: `${OUT}/${label}-crop.png`,
      clip: { x: info.abs.x - 26, y: info.abs.y - 26, width: 70, height: 70 },
    });
  }
  await ctx.close();
}

await shot({ riwaya: "hafs", page: 22, label: "hafs-22-juz2-dark" });
await shot({ riwaya: "hafs", page: 582, label: "hafs-582-juz30-dark" });
await shot({ riwaya: "warsh", page: 22, label: "warsh-22-juz2-dark" });
await shot({ riwaya: "hafs", page: 23, label: "hafs-23-control-dark" });
await browser.close();
