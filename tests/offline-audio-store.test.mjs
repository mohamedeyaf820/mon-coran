import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { inspectAudioResponse, resolveAudioSource, OFFLINE_AUDIO_CACHE_NAME } from "../src/services/offlineAudioStore.js";
const clip = readFileSync(new URL("./fixtures/silent-2s.mp3", import.meta.url));
const response = (body = clip, headers = {}) => new Response(body, { headers: { "content-type": "audio/mpeg", ...headers } });
const url = "https://everyayah.com/data/Husary_128kbps/001001.mp3";

test("valid full MP3 returns exact bytes and a playable MIME", async () => {
  const checked = await inspectAudioResponse(response());
  assert.equal(checked.bytes, clip.length);
  assert.equal(checked.blob.type, "audio/mpeg");
});

test("opaque, partial, empty, HTML, truncated, and length-mismatched files cannot be downloads", async () => {
  for (const invalid of [
    { type: "opaque", status: 0 },
    new Response(clip, { status: 206, headers: { "content-type": "audio/mpeg" } }),
    response(new Uint8Array()), response("<html>error</html>"),
    response(clip.subarray(0, clip.length - 11)),
    response(clip, { "content-length": String(clip.length + 1) }),
    new Response(clip, { headers: { "content-type": "text/html" } }),
  ]) assert.equal(await inspectAudioResponse(invalid), null);
});

test("cached fallback wins offline and online without a network request or service worker", async () => {
  let fetches = 0;
  const fetch = globalThis.fetch;
  globalThis.fetch = () => { fetches++; throw new Error("Network must not run"); };
  globalThis.caches = { open: async name => {
    assert.equal(name, OFFLINE_AUDIO_CACHE_NAME);
    return { match: async candidate => candidate === url ? response() : undefined };
  } };
  try {
    for (const online of [false, true]) {
      Object.defineProperty(navigator, "onLine", { configurable: true, value: online });
      const source = await resolveAudioSource(["https://everyayah.com/data/missing.mp3", url]);
      assert.equal(source.local, true);
      assert.equal(source.originalUrl, url);
      assert.match(source.url, /^blob:/);
      URL.revokeObjectURL(source.url);
    }
    assert.equal(fetches, 0);
  } finally { globalThis.fetch = fetch; delete navigator.onLine; delete globalThis.caches; }
});

test("offline missing audio fails explicitly; unavailable Cache Storage still permits online streaming", async () => {
  Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
  await assert.rejects(resolveAudioSource([url]), error => error.code === "OFFLINE_AUDIO_MISSING");
  Object.defineProperty(navigator, "onLine", { configurable: true, value: true });
  globalThis.caches = { open: async () => { throw new Error("Storage denied"); } };
  assert.deepEqual(await resolveAudioSource([url]), { url, originalUrl: url, local: false });
  delete navigator.onLine;
  delete globalThis.caches;
});
