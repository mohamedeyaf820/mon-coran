import { chromium } from "playwright";

const BASE = "http://127.0.0.1:4173";
const seed = {
  displayMode: "surah",
  mushafLayout: "list",
  showTranslation: false,
  showTransliteration: true,
  showTajwid: false,
  showHome: false,
  lang: "fr",
  riwaya: "hafs",
  currentSurah: 2,
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await ctx.addInitScript((value) => localStorage.setItem("mushaf-plus-settings", JSON.stringify(value)), seed);
const page = await ctx.newPage();

const readCache = () =>
  page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const open = indexedDB.open("mushafplus");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction("cache", "readonly");
          const store = tx.objectStore("cache");
          const out = [];
          const request = store.openCursor();
          request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
              if (String(cursor.value.key).startsWith("transliteration-en")) {
                out.push({
                  key: cursor.value.key,
                  sha256: cursor.value.sha256?.slice(0, 12),
                  version: cursor.value.version,
                  ayahs: cursor.value.data?.ayahs?.length,
                });
              }
              cursor.continue();
            } else {
              db.close();
              resolve(out);
            }
          };
          request.onerror = () => reject(request.error);
        };
      }),
  );

await page.goto(`${BASE}/surah/2`, { waitUntil: "domcontentloaded" });
if (await page.locator(".splash-screen").count()) {
  await page.locator(".splash-screen button", { hasText: /Passer|Skip/ }).first().click().catch(() => {});
}
await page.waitForSelector(".qc-ayah-transliteration", { timeout: 25000 });
await page.waitForTimeout(4000);
const line = await page.evaluate(() => {
  const node = document.querySelector('[data-ayah-number="2"] .qc-ayah-transliteration');
  return node ? node.textContent.trim() : null;
});
console.log("first load line 2:2 =", JSON.stringify(line?.slice(0, 50)));
console.log("cache records:", JSON.stringify(await readCache()));

await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-transliteration", { timeout: 25000 });
await page.waitForTimeout(3500);
const again = await page.evaluate(() => {
  const node = document.querySelector('[data-ayah-number="2"] .qc-ayah-transliteration');
  return node ? node.textContent.trim() : null;
});
console.log("reload line 2:2 =", JSON.stringify(again?.slice(0, 50)));
console.log("cache records after reload:", JSON.stringify(await readCache()));
await browser.close();
