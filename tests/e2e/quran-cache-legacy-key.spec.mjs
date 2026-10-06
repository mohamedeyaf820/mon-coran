import { expect, test } from "@playwright/test";
import { buildSync } from "esbuild";
import { fileURLToPath } from "node:url";

const moduleCode = buildSync({
  stdin: {
    contents: `export { fetchJson } from './src/services/quranComTransport.js'; export { dbGet, dbSet } from './src/services/dbService.js';`,
    resolveDir: fileURLToPath(new URL("../../", import.meta.url)),
  },
  bundle: true,
  format: "esm",
  platform: "browser",
  write: false,
}).outputFiles[0].text;

const BASE = "https://api.quran.com/api/v4/verses/by_chapter/112?mushaf=1&per_page=50&page=1&words=true";
const LEGACY_URL = `${BASE}&fields=id,ruku_number,text_uthmani&word_fields=id,text_imlaei`;
const CURRENT_URL = `${BASE}&fields=id,text_uthmani&word_fields=id`;
const PAYLOAD = { verses: [{ id: 1, verse_key: "112:1", text_uthmani: "قُلْ هُوَ ٱللَّهُ أَحَدٌ" }], pagination: { total_pages: 1 } };

// A blank page on the app origin keeps the application out of the way.
test.beforeEach(async ({ page }) => {
  await page.route("**/qa-transport.js", (route) => route.fulfill({ body: moduleCode, contentType: "text/javascript" }));
  await page.route("**/qa-blank.html", (route) =>
    route.fulfill({ body: "<!doctype html><title>qa</title>", contentType: "text/html" }),
  );
  await page.goto("/qa-blank.html");
});

test("a page cached by the previous release under its full URL is served offline and re-filed", async ({ page }) => {
  const result = await page.evaluate(
    async ([legacyUrl, currentUrl, payload]) => {
      const transport = await import("/qa-transport.js");
      const stamp = Date.now() - 3 * 24 * 60 * 60 * 1000;
      await transport.dbSet("cache", { key: "qcom-api:" + legacyUrl, data: payload, ts: stamp });
      window.fetch = async () => {
        throw new TypeError("offline");
      };
      const served = await transport.fetchJson(currentUrl, undefined, legacyUrl);
      await new Promise((resolve) => setTimeout(resolve, 150));
      const canonicalKey = Object.keys(await (async () => {
        const out = {};
        const db = await new Promise((resolve, reject) => {
          const request = indexedDB.open("mushafplus");
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        const keys = await new Promise((resolve) => {
          const request = db.transaction("cache").objectStore("cache").getAllKeys();
          request.onsuccess = () => resolve(request.result);
        });
        keys.forEach((key) => { out[key] = true; });
        return out;
      })());
      const filed = (await transport.dbGet("cache", canonicalKey.find((key) => !key.includes("fields="))))?.ts;
      return { served, keys: canonicalKey, filedTs: filed, stamp };
    },
    [LEGACY_URL, CURRENT_URL, PAYLOAD],
  );
  expect(result.served).toEqual(PAYLOAD);
  // The data is now also under the field-free key, with its original age.
  expect(result.keys.some((key) => !key.includes("fields="))).toBe(true);
  expect(result.filedTs).toBe(result.stamp);
});

test("two releases asking for different fields share one cache entry", async ({ page }) => {
  const served = await page.evaluate(
    async ([currentUrl, otherFields, payload]) => {
      const transport = await import("/qa-transport.js");
      window.fetch = async () => new Response(JSON.stringify(payload), { status: 200 });
      await transport.fetchJson(currentUrl);
      window.fetch = async () => {
        throw new TypeError("offline");
      };
      return transport.fetchJson(otherFields);
    },
    [CURRENT_URL, `${BASE}&fields=id,text_indopak&word_fields=id,audio_url`, PAYLOAD],
  );
  expect(served).toEqual(PAYLOAD);
});
