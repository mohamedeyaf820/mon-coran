import { test, expect, chromium } from "@playwright/test";
import { build } from "esbuild";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

let bridge;
test.beforeAll(async () => {
  const result = await build({ stdin: { contents: 'export * from "./src/services/downloadService.js"; export * from "./src/services/qrSyncService.js"; export * from "./src/services/storageService.js"; export { getDB } from "./src/services/dbService.js";', resolveDir: process.cwd() }, bundle: true, write: false, format: "iife", globalName: "auditServices", define: { "import.meta.env": "{}" } });
  bridge = result.outputFiles[0].text;
});
function wav() {
  const samples = 16000, data = Buffer.alloc(44 + samples * 2);
  data.write("RIFF", 0); data.writeUInt32LE(data.length - 8, 4); data.write("WAVEfmt ", 8);
  data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(1, 22);
  data.writeUInt32LE(8000, 24); data.writeUInt32LE(16000, 28); data.writeUInt16LE(2, 32); data.writeUInt16LE(16, 34);
  data.write("data", 36); data.writeUInt32LE(samples * 2, 40); return data;
}
test.beforeEach(async ({ page }) => {
  await page.route("**/__audit", route => route.fulfill({ contentType: "text/html", body: '<!doctype html><title>Service integration</title>' }));
  await page.goto("/__audit");
  await page.addScriptTag({ content: bridge });
});
test("download verifies bytes, reuses cache, detects eviction and refuses HTML errors", async ({ page, context }) => {
  let requests = 0;
  await context.route("https://server7.mp3quran.net/**", route => { requests++; return route.fulfill({ contentType: "audio/wav", headers: { "Access-Control-Allow-Origin": "*" }, body: wav() }); });
  const download = () => page.evaluate(async () => {
    const s = window.auditServices;
    return s.downloadSurahForReciter({ surahMeta: { n: 1, ayahs: 7 }, reciter: { id: "audit", cdn: "https://server7.mp3quran.net/audit/", cdnType: "mp3quran-surah" } });
  });
  expect(await download()).toBe("done");
  expect(requests).toBe(1);
  expect(await download()).toBe("done");
  expect(requests).toBe(1);
  const verified = await page.evaluate(async () => {
    const s = window.auditServices, cache = await caches.open(s.OFFLINE_AUDIO_CACHE_NAME);
    const response = await cache.match("https://server7.mp3quran.net/audit/001.mp3");
    const audio = new Audio(URL.createObjectURL(await response.blob()));
    await audio.play();
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Cached audio did not advance")), 5000);
      audio.addEventListener("timeupdate", () => { if (audio.currentTime > 0) { clearTimeout(timeout); resolve(); } });
    });
    const advanced = audio.currentTime > 0; audio.pause(); URL.revokeObjectURL(audio.src);
    await cache.delete("https://server7.mp3quran.net/audit/001.mp3");
    await s.reconcileOfflineAudio();
    return { advanced, status: s.getSurahDownloadStatus(1, "audit", "hafs") };
  });
  expect(verified).toEqual({ advanced: true, status: "error" });
  await context.unroute("https://server7.mp3quran.net/**");
  await context.route("https://server7.mp3quran.net/**", route => route.fulfill({ contentType: "text/html", body: "<html>Unavailable</html>" }));
  expect(await download()).toBe("error");
});

test("QR import preserves local conflicts and rolls back settings when IndexedDB aborts", async ({ page }) => {
  const result = await page.evaluate(async () => {
    const s = window.auditServices;
    s.saveSettings({ theme: "light", quranFontSize: 31 });
    await s.saveNote(1, 1, "original");
    const payload = { app: "MushafPlus", v: 1, t: 1, pos: { s: 1, a: 1, p: 1, j: 1 }, rw: "hafs", th: "dark", rc: "ar.alafasy", fs: 32, dm: "surah", bm: [], nt: [{ s: 1, a: 1, t: "imported conflict", u: 2 }] };
    await s.applySyncPayload(payload);
    const kept = (await s.getNote(1, 1)).text;
    const originalAdd = IDBObjectStore.prototype.add;
    IDBObjectStore.prototype.add = function () { this.transaction.abort(); throw new DOMException("quota", "QuotaExceededError"); };
    let rejected = false;
    try { await s.applySyncPayload({ ...payload, th: "sepia", nt: [{ s: 1, a: 2, t: "new", u: 3 }] }); } catch { rejected = true; }
    finally { IDBObjectStore.prototype.add = originalAdd; }
    return { kept, rejected, theme: s.getSettings().theme, absent: !(await s.getNote(1, 2)) };
  });
  expect(result).toEqual({ kept: "original", rejected: true, theme: "dark", absent: true });
});

test("cached media plays after the browser closes and reopens offline", async ({ baseURL }) => {
  // Keep the Chromium profile path short on Windows (its internal paths grow).
  const profile = mkdtempSync(join(tmpdir(), "mp-pwa-"));
  let context = await chromium.launchPersistentContext(profile, { headless: true, serviceWorkers: "allow" });
  try {
    let page = context.pages()[0];
    await page.goto(baseURL || "http://127.0.0.1:4173/");
    await expect(page.locator(".mp-header")).toBeVisible({ timeout: 30000 });
    await page.evaluate(bridge + '\n;globalThis.auditServices = auditServices;');
    await page.evaluate(async () => {
      await navigator.serviceWorker.register("/sw.js");
      await Promise.race([navigator.serviceWorker.ready, new Promise((_, reject) => setTimeout(() => reject(new Error("Service worker installation timed out")), 15000))]);
    });
    await expect.poll(() => page.evaluate(async () => (await navigator.serviceWorker.ready).active?.state)).toBe('activated');
    await context.route('https://server7.mp3quran.net/audit/**', route => route.fulfill({ contentType: 'audio/wav', headers: { 'Access-Control-Allow-Origin': '*' }, body: wav() }));
    expect(await page.evaluate(() => window.auditServices.downloadSurahForReciter({
      surahMeta: { n: 1, ayahs: 7 }, reciter: { id: 'audit', cdn: 'https://server7.mp3quran.net/audit/', cdnType: 'mp3quran-surah' },
    }))).toBe('done');
    await context.close();
    context = await chromium.launchPersistentContext(profile, { headless: true, offline: true, serviceWorkers: "allow" });
    page = context.pages()[0];
    page.on('pageerror', error => console.log('Offline page error:', error.message));
    page.on('requestfailed', request => console.log('Offline request failed:', request.url()));
    await page.goto(baseURL || "http://127.0.0.1:4173/");
    await expect(page.locator(".mp-header")).toBeVisible({ timeout: 30000 });
    await page.evaluate(bridge + '\n;globalThis.auditServices = auditServices;');
    expect(await page.evaluate(async () => { await window.auditServices.reconcileOfflineAudio(); return window.auditServices.getSurahDownloadStatus(1, 'audit', 'hafs'); })).toBe('done');
    const playback = await page.evaluate(async () => {
      const url = "https://server7.mp3quran.net/audit/001.mp3";
      const audio = new Audio(url);
      await Promise.race([audio.play(), new Promise((_, reject) => setTimeout(() => reject(new Error("Offline media did not start")), 5000))]);
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error("Offline media did not advance")), 5000);
        audio.addEventListener("timeupdate", () => { if (audio.currentTime > 0) { clearTimeout(timeout); resolve(); } });
      });
      const advanced = audio.currentTime > 0; audio.pause();
      const suffix = await fetch(url, { headers: { Range: "bytes=-4" } });
      return { advanced, status: suffix.status, bytes: (await suffix.arrayBuffer()).byteLength };
    });
    expect(playback).toEqual({ advanced: true, status: 206, bytes: 4 });
  } finally { await context.close(); }
});
