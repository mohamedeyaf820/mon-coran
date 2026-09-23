import { webkit, chromium } from "playwright";

const HTML = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<style>
  @font-face { font-family: "QPC Warsh"; src: url("http://127.0.0.1:4173/fonts/kfgqpc-warsh-10.woff2") format("woff2"); }
  body { font-size: 30px; direction: rtl; background: #fff; font-family: "QPC Warsh", serif; }
  .sys { font-family: serif; }
</style>
<p>1. plain: <span>قُلَ اَعُوذُ بِرَبِّ</span></p>
<p>2. word-spans: <span><span style="display:inline">قُلَ</span> <span style="display:inline">اَعُوذُ</span> <span style="display:inline">بِرَبِّ</span></span></p>
<p>3. rule-spans no ZWJ: <span><span style="display:inline;color:red">ق</span><span style="display:inline">ُلَ</span> <span style="display:inline">اَ</span><span style="display:inline;color:blue">عُو</span><span style="display:inline">ذُ</span> <span style="display:inline">بِرَبِّ</span></span></p>
<p>4. rule-spans + ZWJ: <span><span style="display:inline;color:red">ق</span><span style="display:inline">‍ُلَ‍</span> <span style="display:inline">اَ</span><span style="display:inline;color:blue">‍عُو</span><span style="display:inline">‍ذُ</span> <span style="display:inline">بِرَبِّ</span></span></p>
<p>5. highlight-api: <span id="h">قُلَ اَعُوذُ بِرَبِّ</span></p>
<p>6. highlight-api full-word ranges: <span id="h2">قُلَ اَعُوذُ بِرَبِّ</span></p>
<script>
  function mk(id, ranges) {
    const node = document.getElementById(id).firstChild;
    const hl = new Highlight();
    CSS.highlights.set(id, hl);
    for (const [s, e] of ranges) hl.add(new StaticRange({ startContainer: node, startOffset: s, endContainer: node, endOffset: e }));
  }
  mk('h', [[0, 3], [6, 10]]);
  mk('h2', [[0, 3], [4, 10], [11, 16]]);
</script>
<style>::highlight(h) { color: green; } ::highlight(h2) { color: purple; }</style>
`;

for (const [name, mod] of [["webkit", webkit], ["chromium", chromium]]) {
  const browser = await mod.launch();
  const page = await (await browser.newContext({ viewport: { width: 390, height: 500 } })).newPage();
  await page.route("**/microtest", (route) => route.fulfill({ contentType: "text/html; charset=utf-8", body: HTML }));
  await page.goto("http://127.0.0.1:4173/microtest");
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: `.scratch-diag/captures/warsh-diag/font-micro-${name}.png` });
  await browser.close();
}
process.exit(0);
