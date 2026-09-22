import assert from "node:assert/strict";
import test from "node:test";

import {
  prepareSearchQuery,
  terminateSearchWorker,
} from "../src/services/searchWorkerService.js";
import SURAHS from "../src/data/surahs.js";
import {
  buildSearchCandidates,
  filterSurahDirectory,
  findSurahByName,
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

test("naming a surah resolves to that surah in every supported spelling", () => {
  const named = (query) => findSurahByName(query)?.n ?? null;

  assert.equal(named("La Vache"), 2);
  assert.equal(named("vache"), 2, "the stored name carries an article");
  assert.equal(named("sourate La Vache"), 2);
  assert.equal(named("Al-Baqara"), 2);
  assert.equal(named("Baqara"), 2);
  assert.equal(named("الفاتحة"), 1);
  assert.equal(named("Fatiha"), 1);
  assert.equal(named("Ya Sin"), 36);
  assert.equal(named("rahman"), 55);
  assert.equal(named("\u0633\u0648\u0631\u0629 \u0627\u0644\u0625\u062e\u0644\u0627\u0635"), 112);
  assert.equal(named("\u0627\u0644\u0628\u0642\u0631\u0647"), 2, "typed without the round ta marbuta");
});

test("naming a surah reaches every surah in at least one language", () => {
  const missed = SURAHS.filter((surah) => {
    const forms = [surah.ar, surah.en, surah.fr];
    return !forms.some((name) => findSurahByName(name)?.n === surah.n);
  });
  assert.deepEqual(missed, []);

  // The two exceptions are known and honest: 1 and 94 share the French name
  // "L'Ouverture", and 38/50 are named by a single letter too short to tell
  // apart from a keystroke.
  assert.deepEqual(
    SURAHS.filter((s) => findSurahByName(s.fr)?.n !== s.n).map((s) => s.n),
    [1, 94],
  );
  assert.deepEqual(
    SURAHS.filter((s) => findSurahByName(s.ar)?.n !== s.n).map((s) => s.n),
    [38, 50],
  );
  assert.equal(findSurahByName("Saad")?.n, 38);
  assert.equal(findSurahByName("Qaf")?.n, 50);
});

test("a query that is not a surah name stays a word search", () => {
  assert.equal(findSurahByName("mis\u00E9ricorde"), null);
  assert.equal(findSurahByName("\u0628\u0642\u0631\u0629")?.n, 2, "a cow is also the surah");
  assert.equal(findSurahByName("36"), null, "a number is a reference, not a name");
  assert.equal(findSurahByName("a"), null);
  assert.equal(findSurahByName(""), null);
  assert.equal(
    findSurahByName("L'Ouverture"),
    null,
    "two surahs carry this name: guessing would send the reader to the wrong one",
  );
});

test("a long query stops widening once the shortened phrase means less", () => {
  const candidates = buildSearchCandidates("Ain solde rien du tout de ma vie", "fr");

  // Each candidate is a request to the search API, and a query that matches
  // nothing pays for all of them.
  assert.equal(candidates.length, 5);
  assert.equal(candidates[0], "Ain solde rien du tout de ma vie");
  assert.equal(candidates.at(-1), "Ain solde");
});
