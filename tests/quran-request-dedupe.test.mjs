import assert from "node:assert/strict";
import test from "node:test";
import {
  fetchQuranComSurahInfo,
  fetchQuranComText,
} from "../src/services/quranComAPI.js";

test("surah information is normalized before reaching the UI", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    const isInfo = /\/chapters\/114\/info\?language=en$/.test(String(url));
    return new Response(
      JSON.stringify(isInfo ? {
        chapter_info: {
          language_name: "english",
          short_text: "<p>A concise <strong>overview</strong>&nbsp;for readers.</p>",
          text: "<p>First paragraph.</p><p>Second <em>paragraph</em>.</p>",
          source: "Quran.com &amp; verified source",
        },
      } : {
        chapter: {
          revelation_order: 21,
          revelation_place: "makkah",
          pages: [604, 604],
          translated_name: { name: "Mankind" },
        },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    );
  };

  try {
    const info = await fetchQuranComSurahInfo(114);
    assert.equal(info.shortText, "A concise overview for readers.");
    assert.equal(info.text, "First paragraph.\n\nSecond paragraph.");
    assert.equal(info.source, "Quran.com & verified source");
    assert.equal(info.revelationOrder, 21);
    assert.deepEqual(info.pages, [604, 604]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("an aborted reader does not cancel a shared Quran.com request", async () => {
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  let releaseNetwork;
  let requestStarted;
  const started = new Promise((resolve) => {
    requestStarted = resolve;
  });

  globalThis.fetch = (_url, options = {}) => {
    fetchCount += 1;
    requestStarted();

    return new Promise((resolve, reject) => {
      const onAbort = () =>
        reject(new DOMException("Request aborted", "AbortError"));
      options.signal?.addEventListener("abort", onAbort, { once: true });
      releaseNetwork = () => {
        options.signal?.removeEventListener("abort", onAbort);
        resolve(
          new Response(
            JSON.stringify({
              verses: [
                {
                  id: 6222,
                  chapter_id: 113,
                  verse_key: "113:1",
                  verse_number: 1,
                  page_number: 604,
                  juz_number: 30,
                  text_uthmani: "قُلْ أَعُوذُ بِرَبِّ ٱلْفَلَقِ",
                },
              ],
              pagination: { total_pages: 1 },
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
      };
    });
  };

  try {
    const firstController = new AbortController();
    const firstReader = fetchQuranComText(
      "surah/113",
      firstController.signal,
    );
    await started;

    firstController.abort();
    await assert.rejects(firstReader, { name: "AbortError" });

    const secondReader = fetchQuranComText("surah/113");
    assert.equal(fetchCount, 1);

    releaseNetwork();
    const result = await secondReader;
    assert.equal(fetchCount, 1);
    assert.equal(result.ayahs.length, 1);
    assert.equal(result.ayahs[0].numberInSurah, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a slow body is not cut off by the header deadline", async (t) => {
  const originalFetch = globalThis.fetch;
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const payload = {
    verses: [
      {
        id: 6221,
        chapter_id: 112,
        verse_key: "112:1",
        verse_number: 1,
        page_number: 604,
        juz_number: 30,
        text_uthmani: "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
      },
    ],
    pagination: { total_pages: 1 },
  };

  // Headers arrive at once, the body only after 4.5 s: longer than the 4 s a
  // server is given to answer, shorter than the 30 s a download is given.
  globalThis.fetch = async (_url, options = {}) => ({
    ok: true,
    status: 200,
    json: () =>
      new Promise((resolve, reject) => {
        options.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Request aborted", "AbortError")),
          { once: true },
        );
        setTimeout(() => resolve(payload), 4500);
      }),
  });

  try {
    const reader = fetchQuranComText("surah/112");
    for (let i = 0; i < 20; i += 1) await Promise.resolve();
    t.mock.timers.tick(4500);
    const result = await reader;
    assert.equal(result.ayahs.length, 1);
    assert.equal(result.ayahs[0].numberInSurah, 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a server that never answers is still given up on after the header deadline", async (t) => {
  const originalFetch = globalThis.fetch;
  t.mock.timers.enable({ apis: ["setTimeout"] });
  globalThis.fetch = (_url, options = {}) =>
    new Promise((_resolve, reject) => {
      options.signal?.addEventListener(
        "abort",
        () => reject(new DOMException("Request aborted", "AbortError")),
        { once: true },
      );
    });

  try {
    const reader = fetchQuranComText("surah/111");
    const outcome = assert.rejects(reader, /timed out after 4000ms/);
    for (let i = 0; i < 20; i += 1) await Promise.resolve();
    t.mock.timers.tick(4000);
    await outcome;
  } finally {
    globalThis.fetch = originalFetch;
  }
});

function versePage(chapter, from, to, totalPages) {
  return {
    verses: Array.from({ length: to - from + 1 }, (_, index) => ({
      id: 1000 * chapter + from + index,
      chapter_id: chapter,
      verse_key: `${chapter}:${from + index}`,
      verse_number: from + index,
      page_number: 2,
      juz_number: 1,
      text_uthmani: "ٱلْحَمْدُ لِلَّهِ",
    })),
    pagination: { total_pages: totalPages },
  };
}

test("every page of a long surah is requested at once, not after page 1", async () => {
  const originalFetch = globalThis.fetch;
  const requested = [];
  const gates = [];
  globalThis.fetch = (url) => {
    const page = Number(new URL(String(url)).searchParams.get("page"));
    requested.push(page);
    return new Promise((resolve) => {
      gates.push(() =>
        resolve(
          new Response(
            JSON.stringify(versePage(2, (page - 1) * 50 + 1, Math.min(page * 50, 286), 6)),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        ),
      );
    });
  };

  try {
    const loading = fetchQuranComText("surah/2");
    for (let i = 0; i < 20; i += 1) await Promise.resolve();
    // Nothing has answered yet and the six pages are already on the wire.
    assert.deepEqual([...requested].sort(), [1, 2, 3, 4, 5, 6]);
    gates.forEach((release) => release());
    const result = await loading;
    assert.equal(result.ayahs.length, 286);
    assert.deepEqual(
      result.ayahs.map((ayah) => ayah.numberInSurah),
      Array.from({ length: 286 }, (_, index) => index + 1),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("pages guessed beyond what the API reports are discarded, not duplicated", async () => {
  const originalFetch = globalThis.fetch;
  // A source that answers every page with the same single page of 50 verses.
  globalThis.fetch = async () =>
    new Response(JSON.stringify(versePage(3, 1, 50, 1)), {
      status: 200,
      headers: { "content-type": "application/json" },
    });

  try {
    const result = await fetchQuranComText("surah/3");
    assert.equal(result.ayahs.length, 50);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a constrained link keeps the short cap so the small fallback text arrives sooner", async (t) => {
  const originalFetch = globalThis.fetch;
  const navigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator");
  t.mock.timers.enable({ apis: ["setTimeout"] });
  Object.defineProperty(globalThis, "navigator", {
    value: { onLine: true, connection: { effectiveType: "3g", downlink: 0.7 } },
    configurable: true,
  });
  globalThis.fetch = async (_url, options = {}) => ({
    ok: true,
    status: 200,
    json: () =>
      new Promise((_resolve, reject) => {
        options.signal?.addEventListener(
          "abort",
          () => reject(new DOMException("Request aborted", "AbortError")),
          { once: true },
        );
      }),
  });

  try {
    const reader = fetchQuranComText("surah/110");
    const outcome = assert.rejects(reader, /timed out after 4000ms/);
    for (let i = 0; i < 20; i += 1) await Promise.resolve();
    t.mock.timers.tick(4000);
    await outcome;
  } finally {
    globalThis.fetch = originalFetch;
    if (navigatorDescriptor) Object.defineProperty(globalThis, "navigator", navigatorDescriptor);
    else delete globalThis.navigator;
  }
});

test("the requested fields can change without changing the cache identity", async () => {
  const { canonicalCacheUrl } = await import("../src/services/quranComTransport.js");
  const base = "https://api.quran.com/api/v4/verses/by_chapter/2?mushaf=1&per_page=50&page=3&words=true";
  const old = `${base}&fields=id,text_uthmani,ruku_number&word_fields=id,text_imlaei`;
  const current = `${base}&fields=id,text_uthmani&word_fields=id`;
  assert.equal(canonicalCacheUrl(old), canonicalCacheUrl(current));
  // Same page, another parameter: another identity.
  assert.notEqual(canonicalCacheUrl(current), canonicalCacheUrl(current.replace("page=3", "page=4")));
  // No field parameter: the exact string, so the keys written before stay valid.
  const plain = "https://api.quran.com/api/v4/chapters/2/info?language=en";
  assert.equal(canonicalCacheUrl(plain), plain);
});

test("verse requests no longer ask for fields the reader never reads", async () => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(new URL(String(url)));
    return new Response(JSON.stringify({ verses: [], pagination: { total_pages: 1 } }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  };
  try {
    await fetchQuranComText("surah/105").catch(() => {});
    const request = urls.find((url) => url.pathname.endsWith("/by_chapter/105"));
    assert.ok(request, "a verses request was sent");
    const verseFields = request.searchParams.get("fields").split(",");
    const wordFields = request.searchParams.get("word_fields").split(",");
    for (const dropped of ["text_uthmani_simple", "text_qpc_nastaleeq_hafs", "v1_page", "v2_page", "ruku_number", "manzil_number"]) {
      assert.equal(verseFields.includes(dropped), false, dropped);
    }
    for (const dropped of ["text_imlaei", "verse_id", "v1_page", "v2_page"]) {
      assert.equal(wordFields.includes(dropped), false, dropped);
    }
    // Every field a renderer reads is still requested.
    for (const kept of ["text_uthmani", "text_uthmani_tajweed", "text_indopak", "text_qpc_hafs", "code_v1", "code_v2"]) {
      assert.equal(verseFields.includes(kept), true, kept);
    }
    for (const kept of ["audio_url", "position", "line_number", "char_type_name", "text_qpc_hafs", "code_v2"]) {
      assert.equal(wordFields.includes(kept), true, kept);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("the page cache gives room back as the storage quota fills", async () => {
  const { cachedPageBudget } = await import("../src/services/quranComTransport.js");
  const MIB = 1024 * 1024;
  const snap = (usageRatio, availableMiB) => ({
    supported: true,
    quota: 1000 * MIB,
    usage: usageRatio * 1000 * MIB,
    usageRatio,
    available: availableMiB * MIB,
  });
  assert.equal(cachedPageBudget(snap(0.3, 700)), 360);
  assert.equal(cachedPageBudget(snap(0.82, 180)), 120);
  assert.equal(cachedPageBudget(snap(0.5, 100)), 120);
  assert.equal(cachedPageBudget(snap(0.93, 70)), 60);
  assert.equal(cachedPageBudget(snap(0.5, 30)), 60);
  // Browsers without the Storage API keep the full allowance.
  assert.equal(cachedPageBudget({ supported: false }), 360);
  assert.equal(cachedPageBudget(null), 360);
});
