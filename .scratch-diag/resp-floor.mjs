// Scratch probe: why do targeted controls report heights below the 44px floor?
import { chromium } from "@playwright/test";

const BASE = "http://127.0.0.1:4187";
const KEY = "mushaf-plus-settings";
const SEL = process.env.PROBE_SEL || ".reader-toolbar-btn";
const W = Number(process.env.PROBE_W || 768);
const PATH = "/" + (process.env.PROBE_PATH || "surah/2");

function seedFn() {
  return (args) => {
    localStorage.setItem(
      args.key,
      JSON.stringify({
        language: "fr",
        theme: "light",
        fontScale: 1,
        skipSplashAnimation: true,
        duasMode: false,
      }),
    );
  };
}

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: 900 }, deviceScaleFactor: 1 });
await ctx.addInitScript({ content: `(${seedFn.toString()})({key:${JSON.stringify(KEY)}})` });
const p = await ctx.newPage();
await p.goto(BASE + PATH, { waitUntil: "networkidle" });
await p.waitForSelector('html[data-deferred-styles="ready"]', { timeout: 20000 }).catch(() => {});
await p.waitForTimeout(1200);

const out = await p.evaluate((sel) => {
  const rootPx = getComputedStyle(document.documentElement).fontSize;
  const list = [...document.querySelectorAll(sel)].slice(0, 4);
  return {
    rootPx,
    count: list.length,
    items: list.map((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const transforms = [];
      let a = el;
      while (a) {
        const t = getComputedStyle(a);
        if (t.transform !== "none" || t.zoom !== "1")
          transforms.push(`${a.className || a.tagName} => ${t.transform} zoom:${t.zoom}`);
        a = a.parentElement;
      }
      return {
        cls: el.className,
        rect: `${r.width.toFixed(1)}x${r.height.toFixed(1)}`,
        offset: `${el.offsetWidth}x${el.offsetHeight}`,
        minH: cs.minHeight,
        height: cs.height,
        boxSizing: cs.boxSizing,
        display: cs.display,
        inAppRoot: !!el.closest(".app-root"),
        appRootClasses: el.closest(".app-root")?.className,
        hasRootId: !!el.closest("#root"),
        transforms,
      };
    }),
  };
}, SEL);

console.log(JSON.stringify(out, null, 2));
await b.close();
