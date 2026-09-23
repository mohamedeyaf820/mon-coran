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
