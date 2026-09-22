import assert from "node:assert/strict";
import test from "node:test";

import {
  prepareSearchQuery,
  terminateSearchWorker,
} from "../src/services/searchWorkerService.js";
import {
  filterSurahDirectory,
  foldSearchText,
  parseSearchReference,
  toLatinDigits,
} from "../src/utils/searchIntelligence.js";

test("search preparation sanitizes input and resolves candidates without a worker", async () => {
  const result = await prepareSearchQuery(
    "  bismillah <script>  ",
    "phonetic",
  );
  assert.equal(result.sanitized.includes("<"), false);
  assert.equal(result.effectiveMode, "phonetic");
  assert.ok(result.candidates.length > 0);
});

test("search preparation falls back when worker messaging is unavailable", async () => {
  const originalWorker = globalThis.Worker;
  globalThis.Worker = class BrokenWorker {
    addEventListener() {}
    postMessage() {
      throw new Error("worker unavailable");
    }
    terminate() {}
  };

  try {
    const result = await prepareSearchQuery("miséricorde", "fr");
    assert.equal(result.sanitized, "miséricorde");
    assert.equal(result.effectiveMode, "fr");
  } finally {
    terminateSearchWorker();
    if (originalWorker === undefined) delete globalThis.Worker;
    else globalThis.Worker = originalWorker;
  }
});

test("a positional query is read as a jump target in every supported form", () => {
  assert.deepEqual(parseSearchReference("36"), { kind: "surah", surah: 36, ayah: 1 });
  assert.deepEqual(parseSearchReference("2:10"), { kind: "ayah", surah: 2, ayah: 10 });
  assert.deepEqual(parseSearchReference("sourate 36"), { kind: "surah", surah: 36, ayah: 1 });
  assert.deepEqual(parseSearchReference("surah 2"), { kind: "surah", surah: 2, ayah: 1 });
  assert.deepEqual(parseSearchReference("سورة ٣٦"), { kind: "surah", surah: 36, ayah: 1 });
  assert.deepEqual(parseSearchReference("juz 5"), { kind: "juz", juz: 5 });
  assert.deepEqual(parseSearchReference("الجزء ٥"), { kind: "juz", juz: 5 });
});

test("out-of-range and textual queries stay on the text search path", () => {
  for (const query of ["115", "0", "2:287", "999", "2:", "bismillah", "الرَّحْمَن", "juz 31"]) {
    assert.equal(parseSearchReference(query), null, query);
  }
});

test("Arabic-Indic digits are folded to the digits the rest of the app uses", () => {
  assert.equal(toLatinDigits("٢:١٠"), "2:10");
  assert.equal(toLatinDigits("۳۶"), "36");
  assert.equal(toLatinDigits("سورة 36"), "سورة 36");
});

test("the shared fold collapses accents, tashkeel and letter variants", () => {
  assert.equal(foldSearchText("Miséricorde"), "misericorde");
  assert.equal(foldSearchText("الرَّحْمَن"), "الرحمن");
  assert.equal(foldSearchText("الأنعام"), foldSearchText("الانعام"));
  assert.equal(foldSearchText("البقرة"), foldSearchText("البقره"));
  assert.equal(foldSearchText("يوسف"), foldSearchText("يؤسف"));
  // Readers double a letter to mark a sound they heard, not a spelling they
  // saw; queries and records must land on the same form.
  assert.equal(foldSearchText("Minshawwi"), foldSearchText("Minshawi"));
  assert.equal(foldSearchText("Abdulbassit"), foldSearchText("Abdulbasit"));
  assert.equal(foldSearchText("Shaatiri"), "shatiri");
  // The collapse is Latin-only: a written shaddah stays in the Arabic text.
  assert.equal(foldSearchText("الشدّة"), "الشده");
});

test("every surah search box resolves the same query to the same surahs", () => {
  const numbers = (query) => filterSurahDirectory(query).map((surah) => surah.n);

  assert.deepEqual(numbers(""), numbers("   "));
  assert.equal(numbers("").length, 114);

  for (const query of ["الفاتحة", "  al  fatihah ", "Al-Fatihah"]) {
    assert.deepEqual(numbers(query), [1], query);
  }
  // The mushaf spells these with a hamza alef and a round ta marbuta; readers
  // type the plain forms, and each search box has to accept both.
  assert.deepEqual(numbers("الانعام"), numbers("الأنعام"));
  assert.deepEqual(numbers("البقره"), numbers("البقرة"));
  // A digits-only query narrows by number prefix, so "3" keeps 3, 30-39, 30+.
  assert.deepEqual(numbers("36"), [36]);
  assert.deepEqual(numbers("٣٦"), [36]);
  assert.deepEqual(numbers("3"), [3, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39]);
  // Two terms both have to match, in any field.
  assert.deepEqual(numbers("famille imran"), [3]);
  // Readers type the aspirated spelling the dataset does not store.
  assert.deepEqual(numbers("Al-Fatihah"), [1]);
  assert.deepEqual(numbers("Baqarah"), [2]);
  assert.deepEqual(numbers("zzzq"), []);
});
