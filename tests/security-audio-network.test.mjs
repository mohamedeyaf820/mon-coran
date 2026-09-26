/**
 * Security/network/observability contracts (audit wave 1B):
 * - the downloader enforces the player's audio URL allow-list (no fetch, no cache.put),
 * - metadata fetches go through fetchWithTimeout so a hung response cannot pin
 *   the inflight/dedupe promises forever,
 * - the local error log ships capped, scrubbed text (it leaves the device in
 *   the diagnostics export).
 */
import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const realSetTimeout = globalThis.setTimeout.bind(globalThis);
const realClearTimeout = globalThis.clearTimeout.bind(globalThis);
const wait = (ms) => new Promise((resolve) => realSetTimeout(resolve, ms));

const storedValues = new Map();
const cachedResponses = new Map();
const fetchLog = [];

globalThis.Audio = class {
  constructor() {
    this.paused = true;
  }
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
  removeAttribute() {}
  pause() {}
  load() {}
};
globalThis.localStorage = {
  getItem: (key) => storedValues.get(key) ?? null,
  setItem: (key, value) => storedValues.set(key, String(value)),
  removeItem: (key) => storedValues.delete(key),
};
globalThis.window = globalThis;
globalThis.addEventListener = () => {};
globalThis.removeEventListener = () => {};
globalThis.dispatchEvent = () => true;
globalThis.CustomEvent = class {
  constructor(type, options) {
    this.type = type;
    this.detail = options?.detail;
  }
};
globalThis.location = { href: "https://mushafplus.test/" };
globalThis.caches = {
  open: async () => ({
    match: async (key) => cachedResponses.get(String(key)),
    keys: async () => [...cachedResponses.keys()].map((url) => ({ url })),
    put: async (key, response) => cachedResponses.set(String(key), response),
    delete: async (key) => cachedResponses.delete(String(key)),
  }),
};
globalThis.fetch = async (url) => {
  fetchLog.push(String(url));
  return new Response(new Uint8Array([73, 68, 51]), {
    status: 200,
    headers: { "Content-Type": "audio/mpeg" },
  });
};
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: {
    connection: { effectiveType: "4g", saveData: false },
    storage: {
      estimate: async () => ({ usage: 0, quota: 10 * 1024 ** 3 }),
      persisted: async () => true,
      persist: async () => true,
    },
  },
});

const { downloadSurahForReciter } = await import(
  "../src/services/downloadService.js"
);
const { default: SURAHS } = await import("../src/data/surahs.js");
const { logError, getErrorReport } = await import(
  "../src/services/errorAnalytics.js"
);

// Same shape as the synthetic surah-stream voices in full-quran-download.test,
// but hosted outside every allow-listed CDN.
const EVIL_STREAM_RECITER = {
  id: "synthetic_evil_stream",
  nameEn: "Synthetic Evil Stream",
  cdn: "https://evil.example.com/audio/",
  cdnType: "mp3quran-surah",
  riwaya: "hafs",
  audioMode: "surah",
};
const TRUSTED_STREAM_RECITER = {
  id: "synthetic_trusted_stream",
  nameEn: "Synthetic Trusted Stream",
  cdn: "https://server6.mp3quran.net/abkr/",
  cdnType: "mp3quran-surah",
  riwaya: "hafs",
  audioMode: "surah",
};

test("security: the downloader never fetches or caches a URL outside the audio allow-list", async () => {
  storedValues.clear();
  cachedResponses.clear();
  fetchLog.length = 0;

  const result = await downloadSurahForReciter({
    surahMeta: SURAHS[0],
    reciter: EVIL_STREAM_RECITER,
  });

  assert.equal(result, "error");
  assert.deepEqual(fetchLog, [], "untrusted candidates must not be fetched");
  assert.equal(cachedResponses.size, 0, "untrusted candidates must not be cached");
});

test("security: the allow-listed download path still fetches and caches", async () => {
  storedValues.clear();
  cachedResponses.clear();
  fetchLog.length = 0;

  const result = await downloadSurahForReciter({
    surahMeta: SURAHS[0],
    reciter: TRUSTED_STREAM_RECITER,
  });

  assert.equal(result, "done");
  assert.ok(fetchLog.length >= 1);
  assert.equal(cachedResponses.size, 1);
});

test("security: downloadService shares the player's isTrustedAudioUrl check", () => {
  const source = readFileSync("src/services/downloadService.js", "utf8");
  assert.match(source, /from "\.\/audioSources\.js"/);
  assert.match(source, /isTrustedAudioUrl/);
  // Both fetch/cache.put loops (per-ayah and surah-stream repair) consume the
  // trusted candidate list, not the raw one.
  const downloadOne = source.slice(
    source.indexOf("const downloadOne"),
    source.indexOf("let nextIndex = 0"),
  );
  assert.match(downloadOne, /getTrustedAudioUrlCandidates/);
  assert.doesNotMatch(downloadOne, /(?<!Trusted)getAudioUrlCandidates\(/);
});

async function withHangingFetch(run) {
  let captured = null;
  globalThis.setTimeout = (fn, ms) => {
    captured = { fn, ms };
    return 1;
  };
  globalThis.clearTimeout = () => {};
  const previousFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    fetchLog.push(String(url));
    return new Promise((_resolve, reject) => {
      options?.signal?.addEventListener?.("abort", () =>
        reject(options.signal.reason || new Error("aborted")),
      );
    });
  };
  try {
    return await run(() => captured, () => captured.fn());
  } finally {
    globalThis.fetch = previousFetch;
    globalThis.setTimeout = realSetTimeout;
    globalThis.clearTimeout = realClearTimeout;
  }
}

test("security: a hung timing-metadata fetch times out and releases the inflight entry", async () => {
  const { getSurahAudioTimings } = await import(
    "../src/services/quranComAudioTimingService.js"
  );
  fetchLog.length = 0;
  await withHangingFetch(async (getCaptured, fireTimeout) => {
    const pending = getSurahAudioTimings("ar.alafasy", 2);
    // fetchWithTimeout is reached after the (stub-less) IndexedDB probe rejects.
    for (let i = 0; i < 50 && !getCaptured(); i += 1) await wait(5);
    const captured = getCaptured();
    assert.ok(captured, "timing fetch must arm a timeout");
    assert.ok(captured.ms <= 8000, `TTL ${captured.ms}ms must be bounded`);
    fireTimeout();
    await assert.rejects(pending, /timed out/);
    assert.equal(captured.fn && true, true);
  });

  // A subsequent call retries instead of reusing the pinned promise.
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ audio_files: [], pagination: { total_pages: 1 } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  const timings = await getSurahAudioTimings("ar.alafasy", 2);
  assert.ok(timings instanceof Map);
  assert.equal(timings.size, 0);
});

test("security: a hung reciter-profile catalogue fetch rejects and allows a retry", async () => {
  const { preloadReciterProfiles } = await import(
    "../src/hooks/useReciterProfile.js"
  );
  await withHangingFetch(async (getCaptured, fireTimeout) => {
    const pending = preloadReciterProfiles();
    await wait(5);
    const captured = getCaptured();
    assert.ok(captured, "profile fetch must arm a timeout");
    assert.ok(captured.ms <= 8000, `TTL ${captured.ms}ms must be bounded`);
    fireTimeout();
    assert.equal(await pending, null);
  });

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ "ar.alafasy": { nameEn: "Mishary Alafasy" } }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  const catalogue = await preloadReciterProfiles();
  assert.equal(catalogue?.["ar.alafasy"]?.nameEn, "Mishary Alafasy");
});

test("security: LegalPage routes the editorial copy fetch through fetchWithTimeout", () => {
  const source = readFileSync("src/components/LegalPage.jsx", "utf8");
  assert.match(source, /from "\.\.\/services\/fetchWithTimeout\.js"/);
  assert.match(source, /fetchWithTimeout\("\/data\/editorial-copy\.json", \{\}, 8000\)/);
  assert.doesNotMatch(source, /(?<!WithTimeout)\bfetch\("\/data\/editorial-copy/);
});

test("security: the error log caps messages and scrubs plaintext secrets", () => {
  storedValues.delete("mp_error_log");
  logError(
    new Error(
      `GET https://api.quran.com/v4/x?access_token=SEKRITabcDEF failed for me@example.com ${"A".repeat(400)}`,
    ),
    `audio:${"t".repeat(200)}`,
  );
  const [entry] = getErrorReport();
  assert.ok(entry, "entry must be stored");
  assert.ok(entry.msg.length <= 300, `msg capped: ${entry.msg.length}`);
  assert.ok(entry.context.length <= 120, "context capped");
  assert.ok(entry.stack === "" || entry.stack.length <= 240, "stack capped");
  assert.doesNotMatch(entry.msg, /SEKRITabcDEF/, "query strings stripped");
  assert.doesNotMatch(entry.msg, /me@example\.com/, "emails scrubbed");
  assert.doesNotMatch(entry.msg, /AAAA/, "long token-like blobs scrubbed");
  assert.doesNotMatch(JSON.stringify(entry), /SEKRIT|example\.com/);
});

test("security: the error log scrubs bearer credentials and keeps its 50-entry ring", () => {
  const bearer = new Error("401 with Authorization: Bearer SUPERsecret456 for user");
  bearer.stack = "    at fail (https://app.example/assets/index-abcdefghijklmnop.js:1:1)";
  logError(bearer, "audioFailover");
  const report = getErrorReport();
  const entry = report[0];
  assert.doesNotMatch(JSON.stringify(entry), /SUPERsecret456/);
  assert.ok(report.length <= 50);

  for (let i = 0; i < 60; i += 1) logError(new Error(`storm ${i}`), "reciter404");
  const capped = getErrorReport();
  assert.equal(capped.length, 50);
  assert.equal(capped[0].msg, "storm 59");
});

test("security: download failures reach the diagnostics export, not only console.error", () => {
  const source = readFileSync("src/services/downloadService.js", "utf8");
  assert.match(source, /from "\.\/errorAnalytics\.js"/);
  assert.match(source, /logError\(error, `download:\$\{normalized\.key\}`\)/);
});
