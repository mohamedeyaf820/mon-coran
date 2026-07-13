import test from "node:test";
import assert from "node:assert/strict";
import { filterLibraryItems, normalizeSearchMatches } from "../src/modern/library/libraryModel.js";

test("normalizes search matches into stable verse links", () => {
  assert.deepEqual(normalizeSearchMatches({ matches: [{ surah: { number: 2 }, numberInSurah: 255, text: "Texte" }] }), [
    { surah: 2, ayah: 255, text: "Texte", href: "/surah/2/255" },
  ]);
});

test("filters library items by reference and content", () => {
  const items = [{ surah: 2, ayah: 255, text: "Le Trone" }, { surah: 1, ayah: 1, text: "Ouverture" }];
  assert.equal(filterLibraryItems(items, "2:255").length, 1);
  assert.equal(filterLibraryItems(items, "trone").length, 1);
});
