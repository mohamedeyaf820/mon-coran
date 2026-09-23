import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4187";
const OUT = ".scratch-diag/captures/recitation";
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function open({ label, width = 390, height = 844, lang = "fr", theme = "light" }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 2,
    permissions: ["notifications"],
  });
  const p = await ctx.newPage();
  await p.addInitScript(
    ([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)),
    [{ theme, lang, riwaya: "hafs", showTajwid: false, displayMode: "list", currentPage: 2 }],
  );
  await p.goto(BASE, { waitUntil: "domcontentloaded" });
  const skip = p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
  await skip.first().click({ timeout: 8000 }).catch(() => {});
  await p.waitForSelector(".splash-screen", { state: "detached", timeout: 15000 }).catch(() => {});
  await p.waitForSelector('button[role="tab"]', { timeout: 20000 });
  return { ctx, p, label };
}

async function audioTab({ p, label }) {
  await p.locator('button[role="tab"]', { hasText: /Audio|الصوتيات/ }).first().click();
  await p.waitForTimeout(1200);
}

async function probeReciters({ p }) {
  return p.evaluate(() => {
    const cards = [...document.querySelectorAll(".reciter-card")];
    const first = cards[0];
    const rect = (el) => {
      const b = el.getBoundingClientRect();
      return { w: Math.round(b.width), h: Math.round(b.height) };
    };
    return {
      cardCount: cards.length,
      firstCard: first ? rect(first) : null,
      bodyNodes: document.querySelectorAll("*").length,
    };
  });
}

async function motionAudit({ p, scope }) {
  return p.evaluate((sel) => {
    const root = document.querySelector(sel) || document;
    const out = { hoverUngated: [], transitions: [], animations: [], focusVisible: 0, smallTargets: [] };
    const seen = new Set();
    for (const sheet of document.styleSheets) {
      let rules;
      try {
        rules = sheet.cssRules;
      } catch {
        continue;
      }
      const walk = (list, mediaText) => {
        for (const r of list) {
          if (r.type === CSSRule.MEDIA_RULE) walk(r.cssRules, r.conditionText || r.media.mediaText);
          if (r.type !== CSSRule.STYLE_RULE) continue;
          const sr = r.style;
          const isRec = /\.reciter|\.recitation|\.simple-player|\.audio-player|\.rd-|\.rc-|\.fq-|\.sap-|\.audio-options/.test(
            r.selectorText || "",
          );
          if (!isRec) continue;
          const hover = /:hover/.test(r.selectorText);
          if (hover && !/hover:\s*hover/.test(mediaText || "")) {
            out.hoverUngated.push(`${mediaText || "(no media)"} ${r.selectorText}`);
          }
          const tr = sr.getPropertyValue("transition") || "";
          const an = sr.getPropertyValue("animation") || "";
          if (tr && !seen.delete(`t${r.selectorText}`)) continue;
          if (tr) out.transitions.push(`${r.selectorText} { ${tr}${sr.getPropertyValue("transition-duration") ? ` / ${sr.getPropertyValue("transition-duration")}` : ""} }`);
          if (an) out.animations.push(`${r.selectorText} { ${an}${sr.getPropertyValue("animation-duration") ? ` / ${sr.getPropertyValue("animation-duration")}` : ""}${sr.getPropertyValue("animation-iteration-count") ? ` / iter ${sr.getPropertyValue("animation-iteration-count")}` : ""} }`);
          if (/focus-visible/.test(r.selectorText)) out.focusVisible += 1;
        }
      };
      walk(rules, "");
    }
    const buttons = [...root.querySelectorAll("button,[role='button'],a[href]")];
    for (const b of buttons.slice(0, 400)) {
      const r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) continue;
      if (Math.min(r.width, r.height) < 44) {
        out.smallTargets.push(`${(b.className || "").toString().slice(0, 48)} ${Math.round(r.width)}x${Math.round(r.height)}`);
      }
    }
    out.buttons = buttons.length;
    return out;
  }, scope);
}

async function shot({ ctx, p, label, name }) {
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`### ${label} :: ${name}`);
}

// ── Hub mobile ────────────────────────────────────────────────────────────
{
  const s = await open({ label: "hub-390" });
  await audioTab(s);
  console.log(JSON.stringify(await probeReciters(s)));
  console.log(JSON.stringify(await motionAudit(s), null, 1));
  await shot({ ...s, label: "hub", name: "01-hub-390" });

  // detail
  await s.p.locator(".reciter-card").first().click();
  await s.p.waitForSelector(".reciter-detail", { timeout: 10000 }).catch(() => {});
  await s.p.waitForTimeout(1500);
  await shot({ ...s, label: "detail", name: "02-detail-390" });
  console.log(
    "detail:",
    JSON.stringify(
      await s.p.evaluate(() => {
        const d = document.querySelector(".reciter-detail");
        return {
          exists: !!d,
          rows: document.querySelectorAll(".recitation-row").length,
          nodes: document.querySelectorAll("*").length,
          scrollH: d?.scrollHeight ?? null,
          focusables: d ? d.querySelectorAll("button,a,[tabindex]").length : 0,
        };
      }),
    ),
  );
  await s.ctx.close();
}

// ── Hub desktop ───────────────────────────────────────────────────────────
{
  const s = await open({ label: "hub-1280", width: 1280, height: 900 });
  await audioTab(s);
  await shot({ ...s, label: "hub", name: "03-hub-1280" });
  await s.ctx.close();
}

// ── Arabic / RTL ──────────────────────────────────────────────────────────
{
  const s = await open({ label: "hub-ar", lang: "ar" });
  await audioTab(s);
  await shot({ ...s, label: "hub-ar", name: "04-hub-390-ar" });
  await s.p.locator(".reciter-card").first().click();
  await s.p.waitForSelector(".reciter-detail", { timeout: 10000 }).catch(() => {});
  await s.p.waitForTimeout(1200);
  await shot({ ...s, label: "detail-ar", name: "05-detail-390-ar" });
  await s.ctx.close();
}

// ── Dark + player/options ─────────────────────────────────────────────────
{
  const s = await open({ label: "dark", theme: "dark" });
  await audioTab(s);
  await s.p.locator(".reciter-card").first().click();
  await s.p.waitForSelector(".reciter-detail", { timeout: 10000 }).catch(() => {});
  await s.p.waitForTimeout(1200);
  await shot({ ...s, label: "detail-dark", name: "06-detail-390-dark" });
  await s.ctx.close();
}

await browser.close();
