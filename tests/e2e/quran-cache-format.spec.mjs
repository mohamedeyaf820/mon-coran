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

const URL_A = "https://api.quran.com/api/v4/verses/by_chapter/112?page=1";
const URL_B = "https://api.quran.com/api/v4/verses/by_chapter/113?page=1";
const PAYLOAD = { verses: [{ id: 1, verse_key: "112:1", text_uthmani: "قُلْ هُوَ ٱللَّهُ أَحَدٌ" }], pagination: { total_pages: 1 } };

// A blank page on the app origin keeps the application out of the way.
test.beforeEach(async ({ page }) => {
  await page.route("**/qa-transport.js", (route) => route.fulfill({ body: moduleCode, contentType: "text/javascript" }));
  await page.route("**/qa-blank.html", (route) =>
    route.fulfill({ body: "<!doctype html><title>qa</title>", contentType: "text/html" }),
  );
  await page.goto("/qa-blank.html");
});

test("a Quran.com response is stored as text and read back as the same object", async ({ page }) => {
  const result = await page.evaluate(
    async ([url, payload]) => {
      const transport = await import("/qa-transport.js");
      window.fetch = async () => new Response(JSON.stringify(payload), { status: 200 });
      const first = await transport.fetchJson(url);
      const stored = await transport.dbGet("cache", "qcom-api:" + url);
      return { first, storedType: typeof stored.data, storedMatches: JSON.parse(stored.data) };
    },
    [URL_A, PAYLOAD],
  );
  expect(result.storedType).toBe("string");
  expect(result.first).toEqual(PAYLOAD);
  expect(result.storedMatches).toEqual(PAYLOAD);

  // Fresh module instance (no memory cache) with the network gone: the text record serves it.
  await page.reload();
  const offline = await page.evaluate(
    async (url) => {
      const transport = await import("/qa-transport.js");
      window.fetch = async () => {
        throw new TypeError("offline");
      };
      return transport.fetchJson(url);
    },
    URL_A,
  );
  expect(offline).toEqual(PAYLOAD);
});

test("a record written by an earlier version (parsed object) is still served offline", async ({ page }) => {
  const served = await page.evaluate(
    async ([url, payload]) => {
      const transport = await import("/qa-transport.js");
      await transport.dbSet("cache", { key: "qcom-api:" + url, data: payload, ts: Date.now() });
      window.fetch = async () => {
        throw new TypeError("offline");
      };
      return transport.fetchJson(url);
    },
    [URL_B, PAYLOAD],
  );
  expect(served).toEqual(PAYLOAD);
});

test("a corrupt cached text falls through to the network instead of crashing", async ({ page }) => {
  const served = await page.evaluate(
    async ([url, payload]) => {
      const transport = await import("/qa-transport.js");
      await transport.dbSet("cache", { key: "qcom-api:" + url, data: "{not json", ts: Date.now() });
      window.fetch = async () => new Response(JSON.stringify(payload), { status: 200 });
      return transport.fetchJson(url);
    },
    ["https://api.quran.com/api/v4/verses/by_chapter/114?page=1", PAYLOAD],
  );
  expect(served).toEqual(PAYLOAD);
});
