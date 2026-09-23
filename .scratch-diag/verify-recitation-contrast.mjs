import { chromium, devices } from "playwright";

const BASE = "http://127.0.0.1:4187";
const browser = await chromium.launch();

function lum(rgb) {
  const [r, g, b] = rgb.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function parse(s) {
  const srgb = s.match(/color\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)/);
  if (srgb) return srgb.slice(1, 4).map((v) => Number(v) * 255);
  const m = s.match(/(\d+(?:\.\d+)?)/g);
  return m ? m.slice(0, 3).map(Number) : null;
}
function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.addInitScript(
    ([seed]) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed)),
    [{ theme, lang: "fr", riwaya: "hafs", showTajwid: false, displayMode: "mushaf", currentPage: 2 }],
  );
  await p.goto(BASE, { waitUntil: "domcontentloaded" });
  await p.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ }).first().click({ timeout: 8000 }).catch(() => {});
  await p.waitForSelector(".splash-screen", { state: "detached", timeout: 15000 }).catch(() => {});
  await p.waitForSelector('button[role="tab"]', { timeout: 20000 });
  await p.locator('button[role="tab"]', { hasText: /Audio|الصوتيات/ }).first().click();
  await p.waitForTimeout(1800);
  const data = await p.evaluate(() => {
    const sels = [
      ["listen", ".reciter-card__listen"],
      ["tab-selected", '.home-content-toolbar [role="tab"][aria-selected="true"]'],
      ["filter-chip", ".home-style-filter[aria-pressed='true']"],
      ["load-more", ".home-reciter-load-more"],
    ];
    const out = {};
    for (const [k, sel] of sels) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const cs = getComputedStyle(el);
      out[k] = { bg: cs.backgroundColor, color: cs.color, fs: cs.fontSize, fw: cs.fontWeight };
    }
    return out;
  });
  for (const [k, d] of Object.entries(data)) {
    const bg = parse(d.bg), fg = parse(d.color);
    const r = bg && fg ? ratio(bg, fg) : null;
    const large = parseFloat(d.fs) >= 24 || (parseFloat(d.fs) >= 18.66 && +d.fw >= 700);
    console.log(`${theme} ${k.padEnd(13)} fg=${d.color} bg=${d.bg} = ${r ? r.toFixed(2) : "n/a"} (${d.fs}/${d.fw}) ${r ? (r >= (large ? 3 : 4.5) ? "AA" : "FAIL") : ""}`);
  }
  await ctx.close();
}
await browser.close();
