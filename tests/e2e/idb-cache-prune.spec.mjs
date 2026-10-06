import { expect, test } from "@playwright/test";
import { buildSync } from "esbuild";
import { fileURLToPath } from "node:url";

const moduleCode = buildSync({
  stdin: {
    contents: `export { getDB, dbSet, dbGet, dbGetAll, dbPruneByPrefix } from './src/services/dbService.js';`,
    resolveDir: fileURLToPath(new URL("../../", import.meta.url)),
  },
  bundle: true,
  format: "esm",
  platform: "browser",
  write: false,
}).outputFiles[0].text;

// A blank page on the app origin: the application itself must not hold the
// database open while the test opens it at an older version.
test.beforeEach(async ({ page }) => {
  await page.route("**/qa-db-module.js", (route) =>
    route.fulfill({ body: moduleCode, contentType: "text/javascript" }),
  );
  await page.route("**/qa-blank.html", (route) =>
    route.fulfill({ body: "<!doctype html><title>qa</title>", contentType: "text/html" }),
  );
  await page.goto("/qa-blank.html");
});

test("a version 3 database upgrades to version 4 with its cache indexes and keeps every record", async ({ page }) => {
  const result = await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("mushafplus", 3);
      request.onupgradeneeded = () => {
        const db = request.result;
        db.createObjectStore("cache", { keyPath: "key" });
        db.createObjectStore("notes", { keyPath: "id" });
        db.createObjectStore("bookmarks", { keyPath: "id" });
        db.createObjectStore("playlists", { keyPath: "id" });
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(["cache", "notes"], "readwrite");
        tx.objectStore("cache").put({ key: "qcom-api:legacy", ts: Date.now(), data: { ok: 1 } });
        tx.objectStore("notes").put({ id: "1:1", text: "kept" });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
      request.onerror = () => reject(request.error);
    });

    const service = await import("/qa-db-module.js");
    const db = await service.getDB();
    return {
      version: db.version,
      indexes: [...db.transaction("cache").store.indexNames],
      cached: await service.dbGet("cache", "qcom-api:legacy"),
      note: await service.dbGet("notes", "1:1"),
    };
  });
  expect(result.version).toBe(4);
  expect(result.indexes.sort()).toEqual(["expiryAt", "ts"]);
  expect(result.cached.data).toEqual({ ok: 1 });
  expect(result.note.text).toBe("kept");
});

test("pruning removes expired and surplus entries of its prefix only", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const service = await import("/qa-db-module.js");
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    // Eight fresh entries, one past the maximum age, one past its own expiry.
    for (let i = 0; i < 8; i += 1) {
      await service.dbSet("cache", { key: `qcom-api:fresh-${i}`, ts: now - i * 1000, data: { i } });
    }
    await service.dbSet("cache", { key: "qcom-api:too-old", ts: now - 9 * day, data: {} });
    await service.dbSet("cache", { key: "qcom-api:expired", ts: now - 1000, expiryAt: now - 500, data: {} });
    // Other consumers of the same store: never touched.
    await service.dbSet("cache", { key: "warsh:index", data: { keep: true } });
    await service.dbSet("cache", { key: "other-prefix:old", ts: now - 30 * day, data: {} });

    await service.dbPruneByPrefix("cache", "qcom-api:", {
      maxEntries: 5,
      maxAgeMs: 7 * day,
      throttleMs: 0,
    });
    const keys = (await service.dbGetAll("cache")).map((record) => record.key).sort();
    return keys;
  });
  expect(result).toEqual([
    "other-prefix:old",
    "qcom-api:fresh-0",
    "qcom-api:fresh-1",
    "qcom-api:fresh-2",
    "qcom-api:fresh-3",
    "qcom-api:fresh-4",
    "warsh:index",
  ]);
});

test("a version 3 database without its cache store still upgrades", async ({ page }) => {
  const result = await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("mushafplus", 3);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("notes", { keyPath: "id" });
        request.result.createObjectStore("bookmarks", { keyPath: "id" });
      };
      request.onsuccess = () => { request.result.close(); resolve(); };
      request.onerror = () => reject(request.error);
    });
    const service = await import("/qa-db-module.js");
    const db = await service.getDB();
    await service.dbSet("cache", { key: "qcom-api:x", ts: Date.now(), data: 1 });
    return {
      version: db.version,
      stores: [...db.objectStoreNames].sort(),
      indexes: [...db.transaction("cache").store.indexNames].sort(),
      cached: (await service.dbGet("cache", "qcom-api:x"))?.data,
    };
  });
  expect(result.version).toBe(4);
  expect(result.stores).toEqual(["bookmarks", "cache", "notes"]);
  expect(result.indexes).toEqual(["expiryAt", "ts"]);
  expect(result.cached).toBe(1);
});
