import assert from "node:assert/strict";
import test from "node:test";
import { fetchQuranComText } from "../src/services/quranComAPI.js";

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
