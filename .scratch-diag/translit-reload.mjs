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
page.on("console", (msg) => {
  if (/translit|Translit|DB /i.test(msg.text())) console.log("console:", msg.text().slice(0, 160));
});

const read = () =>
  page.evaluate(() => {
    const node = document.querySelector('[data-ayah-number="2"] .qc-ayah-transliteration');
    return node ? node.textContent.trim().slice(0, 40) : null;
  });

await page.goto(`${BASE}/surah/2`, { waitUntil: "domcontentloaded" });
if (await page.locator(".splash-screen").count()) {
  await page.locator(".splash-screen button", { hasText: /Passer|Skip/ }).first().click().catch(() => {});
}
await page.waitForSelector(".qc-ayah-transliteration", { timeout: 25000 });
await page.waitForTimeout(4000);
console.log("load 1:", JSON.stringify(await read()));

const readCache = () =>
  page.evaluate(
    () =>
      new Promise((resolve) => {
        const open = indexedDB.open("mushafplus");
        open.onsuccess = () => {
          const db = open.result;
          const request = db.transaction("cache", "readonly").objectStore("cache").openCursor();
          const out = [];
          request.onsuccess = () => {
            const cursor = request.result;
            if (cursor) {
              if (String(cursor.value.key).startsWith("transliteration-en")) out.push(cursor.value.key);
              cursor.continue();
            } else {
              db.close();
              resolve(out);
            }
          };
          request.onerror = () => resolve(["error"]);
        };
        open.onerror = () => resolve(["open-error"]);
      }),
  );
console.log("cache keys seen by the raw probe:", JSON.stringify(await readCache()));

const urls = [];
page.on("request", (request) => {
  if (request.url().includes("transliteration-en")) urls.push(request.url().split("/").pop().slice(0, 24));
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector(".qc-ayah-transliteration", { timeout: 25000 });
for (const delay of [500, 1000, 2000, 4000, 6000]) {
  await page.waitForTimeout(delay);
  console.log(`load 2 after ${delay}ms more:`, JSON.stringify(await read()), "requests:", JSON.stringify(urls));
}
await browser.close();
