import { webkit } from "playwright";
const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/warsh-diag";

const browser = await webkit.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();

async function toWarshList() {
  await page.goto(`${BASE}/surah/113`, { waitUntil: "domcontentloaded" });
  if (await page.locator(".splash-screen").count()) {
    await page.locator(".splash-screen button", { hasText: /Passer|Skip/ }).first().click().catch(() => {});
    await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
  }
  await page.waitForTimeout(1200);
  await page.locator('button[aria-label*="Plus"], .mp-header-more').last().click().catch(() => {});
  await page.waitForTimeout(300);
  await page.locator(".mp-header-menu button").filter({ hasText: /^Liste$/ }).first().click().catch(() => {});
  await page.mouse.click(195, 820).catch(() => {});
  await page.waitForTimeout(400);
  await page.locator('button[aria-label*="Plus"], .mp-header-more').last().click().catch(() => {});
  await page.waitForTimeout(300);
  await page.locator(".mp-header-menu button").filter({ hasText: /^Warsh$/ }).first().click().catch(() => {});
  await page.waitForTimeout(2500);
  await page.mouse.click(195, 820).catch(() => {});
  await page.waitForTimeout(600);
}

const snapAndReapply = () => page.evaluate(() => {
  // Collect current ranges per highlight name, snap boundaries away from
  // combining marks (never split base+mark clusters), re-register.
  const COMBINING = /\p{M}/u;
  let moved = 0;
  for (const [name, highlight] of [...CSS.highlights.entries()]) {
    if (!name.startsWith("tajwid-")) continue;
    const old = [...highlight];
    if (!old.length) continue;
    const fresh = new Highlight();
    for (const r of old) {
      const node = r.startContainer;
      if (!node || typeof node.data !== "string") { fresh.add(r); continue; }
      let s = r.startOffset, e = r.endOffset;
      // if char at s is a mark, the base is at s-1 → include it (move left)
      if (s > 0 && COMBINING.test(node.data[s] || "")) { while (s > 0 && COMBINING.test(node.data[s] || "")) s -= 1; moved += 1; }
      // if char before e is base but e points after base with marks following, extend to cover marks
      while (e < node.data.length && COMBINING.test(node.data[e] || "")) { e += 1; moved += 1; }
      fresh.add(new StaticRange({ startContainer: node, startOffset: s, endContainer: node, endOffset: e }));
    }
    CSS.highlights.set(name, fresh);
  }
  return { moved };
});

const shot = async (f) => { await page.waitForTimeout(600); await page.screenshot({ path: `${OUT}/${f}.png` }); };

await toWarshList();
await shot("snap-0-before");
console.log("snap:", JSON.stringify(await snapAndReapply()));
await shot("snap-1-after");

// T2: fresh load, override ::highlight colors with concrete literals
await toWarshList();
await page.evaluate(() => {
  const st = document.createElement("style");
  let css = "";
  for (const [name] of CSS.highlights) if (name.startsWith("tajwid-")) css += `::highlight(${name}) { color: green !important; }\n`;
  st.textContent = css;
  document.head.appendChild(st);
});
await shot("var-override");
await browser.close();
process.exit(0);
