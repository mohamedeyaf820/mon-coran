/**
 * Warsh tafsir/bookmark seam probe on the verse-by-verse (list) layout.
 * This is the regression path: needsHafsSupport is false here, so before the
 * attachWarshHafsMapping fix the Warsh card handed AyahActions the raw Warsh
 * number and Quran.com answered with the neighbouring verse's tafsir.
 *
 * Warsh 2:2 recites Hafs 3 → tapping Tafsir on the "2:2" card must fetch
 * /tafsirs/{id}/by_ayah/2:3 and bookmark 2:3.
 */
import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173";
const SEED = {
  lang: "fr",
  riwaya: "warsh",
  warshStrictMode: false,
  displayMode: "surah",
  currentSurah: 2,
  currentAyah: 1,
  mushafLayout: "list",
  showTranslation: false,
  showTajwid: false,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.addInitScript((seed) => {
  window.localStorage.setItem("mushaf-plus-settings", JSON.stringify(seed));
}, SEED);

const tafsirRequests = [];
page.on("request", (req) => {
  if (/api\.quran\.com\/api\/v4\/tafsirs\//.test(req.url())) {
    tafsirRequests.push(decodeURIComponent(req.url()));
  }
});

await page.goto(`${BASE}/surah/2`, { waitUntil: "domcontentloaded" });
const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip/ });
if (await skip.count()) {
  await skip.first().click().catch(() => {});
  await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
}
await page.waitForSelector(".qc-verse-card", { timeout: 20000 });
await page.waitForTimeout(1500);

const card = page.locator(".qc-verse-card").nth(1);
await card.scrollIntoViewIfNeeded();
await card.locator("button.qc-list-card__reference").click();
await page.waitForTimeout(600);

const tafsirBtn = card.locator('[aria-label*="Options"]').first();
await tafsirBtn.scrollIntoViewIfNeeded();
await tafsirBtn.click();
await page.waitForTimeout(500);
await page.locator('[role="menuitem"]', { hasText: /^Tafsir$/ }).first().click();
await page.waitForSelector("aside#tafsir-sidebar-title, aside", { timeout: 5000 });
await page.waitForFunction(() => /2:3/.test(document.querySelector("#tafsir-sidebar-title")?.textContent || ""), null, { timeout: 10000 });
await page.waitForTimeout(2500);
const sidebarTitle = await page.locator("#tafsir-sidebar-title").textContent();
const tafsirSnippet = await page.locator("aside article").first().textContent().catch(() => null);

await page.keyboard.press("Escape");
await page.waitForTimeout(400);

// Bookmark through the same card seam.
const bookmarkBtn = card.locator('[aria-label*="favori" i], [aria-label*="bookmark" i]').first();
await bookmarkBtn.scrollIntoViewIfNeeded();
await bookmarkBtn.click();
await page.waitForTimeout(1200);
const bookmarks = await page.evaluate(async () => {
  const dbs = await indexedDB.databases();
  const name = dbs.map((d) => d.name).find((n) => /mushaf/i.test(n));
  const db = await new Promise((res, rej) => {
    const open = indexedDB.open(name);
    open.onsuccess = () => res(open.result);
    open.onerror = () => rej(open.error);
  });
  if (!db.objectStoreNames.contains("bookmarks")) return { error: "no store", names: [...db.objectStoreNames] };
  const rows = await new Promise((res, rej) => {
    const tx = db.transaction("bookmarks", "readonly");
    const req = tx.objectStore("bookmarks").getAll();
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
  });
  return rows;
});

console.log(JSON.stringify({
  tafsirRequests,
  sidebarTitle,
  tafsirSnippet: tafsirSnippet ? tafsirSnippet.slice(0, 140) : null,
  bookmarks,
}, null, 2));

const ok =
  tafsirRequests.some((u) => /tafsirs\/\d+\/by_ayah\/2:3($|\?)/.test(u)) &&
  !tafsirRequests.some((u) => /by_ayah\/2:2($|\?)/.test(u)) &&
  Array.isArray(bookmarks) &&
  bookmarks.some((b) => b.id === "2:3");
console.log(ok ? "PASS: Warsh 2:2 attached tafsir+bookmark to Hafs 3" : "FAIL: see dump above");
await browser.close();
process.exit(ok ? 0 : 1);
