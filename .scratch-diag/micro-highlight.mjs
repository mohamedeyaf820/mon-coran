import { webkit, chromium } from "playwright";
const browser = await webkit.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await page.setContent(`
<style>
  body { font-size: 30px; direction: rtl; background: #fff; }
  .t span { }
</style>
<p>1. plain: <span class="t">قُلَ اَعُوذُ بِرَبِّ</span></p>
<p>2. word-spans: <span class="t"><span style="display:inline">قُلَ</span> <span style="display:inline">اَعُوذُ</span> <span style="display:inline">بِرَبِّ</span></span></p>
<p>3. rule-spans no ZWJ: <span class="t"><span style="display:inline;color:red">ق</span><span style="display:inline">ُلَ</span> <span style="display:inline">اَ</span><span style="display:inline;color:blue">عُو</span><span style="display:inline">ذُ</span> <span style="display:inline">بِرَبِّ</span></span></p>
<p>4. rule-spans + ZWJ: <span class="t"><span style="display:inline;color:red">ق</span><span style="display:inline">‍ُلَ‍</span> <span style="display:inline">اَ</span><span style="display:inline;color:blue">‍عُو</span><span style="display:inline">‍ذُ</span> <span style="display:inline">بِرَبِّ</span></span></p>
<p>5. highlight-api: <span class="t" id="h">قُلَ اَعُوذُ بِرَبِّ</span></p>
<script>
  const node = document.getElementById('h').firstChild;
  const hl = new Highlight();
  CSS.highlights.set('tajwid-test', hl);
  hl.add(new StaticRange({ startContainer: node, startOffset: 0, endContainer: node, endOffset: 2 }));
  hl.add(new StaticRange({ startContainer: node, startOffset: 6, endContainer: node, endOffset: 9 }));
</script>
<style>::highlight(tajwid-test) { color: green; }</style>
`);
await page.waitForTimeout(500);
await page.screenshot({ path: ".scratch-diag/captures/warsh-diag/micro-webkit.png" });
const b2 = await chromium.launch();
const p2 = await (await b2.newContext({ viewport: { width: 390, height: 844 } })).newPage();
await p2.goto(page.url());
await p2.setContent(await page.content());
await p2.screenshot({ path: ".scratch-diag/captures/warsh-diag/micro-chromium.png" });
await browser.close(); await b2.close();
process.exit(0);
