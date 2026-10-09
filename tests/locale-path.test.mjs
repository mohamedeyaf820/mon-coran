import assert from "node:assert/strict";
import test from "node:test";

import { parseRoutePath } from "../src/hooks/useUrlSync.js";
import { localizePath, splitLocale } from "../src/utils/localePath.js";

test("French stays at the root, English and Arabic get a prefix", () => {
  assert.equal(localizePath("/surah/2", "fr"), "/surah/2");
  assert.equal(localizePath("/surah/2", "en"), "/en/surah/2");
  assert.equal(localizePath("/duas/hisn/27", "ar"), "/ar/duas/hisn/27");
  assert.equal(localizePath("/", "fr"), "/");
  assert.equal(localizePath("/", "en"), "/en/");
  assert.equal(localizePath("/", "ar"), "/ar/");
});

test("changing language never stacks prefixes", () => {
  assert.equal(localizePath("/en/surah/2", "ar"), "/ar/surah/2");
  assert.equal(localizePath("/ar/surah/2", "fr"), "/surah/2");
  assert.equal(localizePath("/en/", "fr"), "/");
  assert.equal(localizePath("/surah/2", "de"), "/surah/2");
});

test("only /en and /ar are language prefixes", () => {
  assert.deepEqual(splitLocale("/en/surah/2"), { lang: "en", path: "/surah/2" });
  assert.deepEqual(splitLocale("/ar"), { lang: "ar", path: "/" });
  assert.deepEqual(splitLocale("/ar/"), { lang: "ar", path: "/" });
  assert.deepEqual(splitLocale("/surah/2"), { lang: null, path: "/surah/2" });
  // A path that merely starts with the letters is not a prefix.
  assert.deepEqual(splitLocale("/english"), { lang: null, path: "/english" });
  assert.deepEqual(splitLocale("/arabic/x"), { lang: null, path: "/arabic/x" });
  assert.deepEqual(splitLocale("/fr/surah/2"), { lang: null, path: "/fr/surah/2" });
});

test("a prefixed address resolves to the same route and names its language", () => {
  const surah = parseRoutePath("/surah/2/255");
  assert.deepEqual(parseRoutePath("/en/surah/2/255"), { ...surah, lang: "en" });
  assert.deepEqual(parseRoutePath("/ar/surah/2/255"), { ...surah, lang: "ar" });

  assert.equal(parseRoutePath("/ar/").showHome, true);
  assert.equal(parseRoutePath("/ar/").lang, "ar");
  assert.equal(parseRoutePath("/en/duas/hisn/27").duasRoute, "/hisn/27");
  assert.equal(parseRoutePath("/en/about").legalPage, "about");
  assert.equal(parseRoutePath("/surah/2").lang, undefined);
});

test("invalid routes stay not-found under a prefix, and /fr is not a language path", () => {
  assert.equal(parseRoutePath("/en/surah/115").routeNotFound, true);
  assert.equal(parseRoutePath("/ar/unknown").routeNotFound, true);
  assert.equal(parseRoutePath("/fr/surah/2").routeNotFound, true);
});
