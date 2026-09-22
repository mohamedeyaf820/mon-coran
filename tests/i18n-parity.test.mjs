import assert from "node:assert/strict";
import test from "node:test";

import ar from "../src/i18n/ar.js";
import en from "../src/i18n/en.js";
import fr from "../src/i18n/fr.js";
import { t } from "../src/i18n/index.js";

function flattenLocale(value, prefix = "", output = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === "object" && !Array.isArray(child)) {
      flattenLocale(child, path, output);
    } else {
      output.set(path, child);
    }
  }
  return output;
}

const locales = { fr, en, ar };
const flattened = Object.fromEntries(
  Object.entries(locales).map(([lang, locale]) => [lang, flattenLocale(locale)]),
);

test("French, English and Arabic locale trees expose exactly the same keys", () => {
  const referenceKeys = [...flattened.fr.keys()].sort();

  for (const lang of ["en", "ar"]) {
    assert.deepEqual(
      [...flattened[lang].keys()].sort(),
      referenceKeys,
      `${lang} locale keys must match the French reference locale`,
    );
  }
});

test("all translated leaf values are usable strings or plural maps", () => {
  for (const [lang, entries] of Object.entries(flattened)) {
    for (const [key, value] of entries) {
      assert.notEqual(value, null, `${lang}.${key} must not be null`);
      assert.notEqual(value, undefined, `${lang}.${key} must not be undefined`);
      if (typeof value === "string") {
        assert.ok(value.trim(), `${lang}.${key} must not be empty`);
      }
    }
  }
});

test("new accessibility labels resolve without falling back to their keys", () => {
  for (const lang of Object.keys(locales)) {
    for (const key of ["duas.categoriesLabel", "quran.sajda"]) {
      assert.notEqual(t(key, lang), key);
      assert.ok(t(key, lang).trim());
    }
  }
});

// A language name is written in the language it names ("Français" in Arabic too),
// and the product name has no Arabic form. Everything else an Arabic reader sees
// has to be Arabic: nine of these strings shipped as English sentences, one of
// them with a literal "[AR]" placeholder left in the copy.
const ARABIC_AUTONYMS = new Set([
  "app.name",
  "search.voiceLang.fr",
  "search.voiceLang.en",
  "search.voiceLangFull.fr",
  "search.voiceLangFull.en",
]);

test("every Arabic value is written in Arabic", () => {
  for (const [key, value] of flattened.ar) {
    if (typeof value !== "string" || ARABIC_AUTONYMS.has(key)) continue;
    assert.match(
      value,
      /[؀-۽]/,
      `ar.${key} is shown to Arabic readers but holds no Arabic script: ${value}`,
    );
  }
});
