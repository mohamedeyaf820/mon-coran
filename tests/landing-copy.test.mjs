import test from "node:test";
import assert from "node:assert/strict";
import COPY from "../src/components/landing/landingCopy.js";
import { storeUrl, TINTS, tintForTheme, tintSequence } from "../src/components/landing/landingData.js";

const LANGS = ["fr", "en", "ar"];

const shape = (value) =>
  Array.isArray(value)
    ? (value.every((item) => typeof item === "string") ? "string[]" : value.map(shape))
    : value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, shape(inner)]))
      : typeof value;

test("French, English and Arabic carry exactly the same copy keys", () => {
  for (const lang of ["en", "ar"]) assert.deepEqual(shape(COPY[lang]), shape(COPY.fr), lang);
});

test("every string is filled and nothing unverified is claimed", () => {
  const forbidden = /android auto|carplay|testflight|lorem|elevate|seamless|écran verrouillé|lock screen/i;
  const walk = (value, trail) => {
    if (typeof value === "string") {
      assert.ok(value.trim().length > 0, `${trail} is empty`);
      assert.ok(!forbidden.test(value), `${trail} claims something unverified: ${value}`);
    } else if (value && typeof value === "object") {
      for (const [key, inner] of Object.entries(value)) walk(inner, `${trail}.${key}`);
    }
  };
  for (const lang of LANGS) walk(COPY[lang], lang);
});

test("the verified figures are the ones on the page", () => {
  for (const lang of LANGS) {
    const colophon = COPY[lang].colophon.join(" ");
    for (const figure of lang === "ar" ? ["٥٤", "٢٦٧"] : ["54", "267"]) assert.match(colophon, new RegExp(figure), `${lang} ${figure}`);
  }
});

test("a store button needs a real https address on a store host", () => {
  const play = "https://play.google.com/store/apps/details?id=x";
  const apple = "https://apps.apple.com/app/id123";
  assert.equal(storeUrl(play), play);
  assert.equal(storeUrl(apple), apple);
  for (const bad of [
    "", undefined, null, 42, "http://play.google.com/x", "//play.google.com/x", "javascript:alert(1)",
    " https://play.google.com/x", "https:/play.google.com/x", "ftp://apps.apple.com/x",
    "https://example.com/app", "https://play.google.com.evil.example/x", "https://evil.example/play.google.com/",
    "https://play.google.com@evil.example/x", "https://user:pw@apps.apple.com/x", "https://play.google.com:8443/x",
  ]) {
    assert.equal(storeUrl(bad), "", String(bad));
  }
});

test("the page starts in the reader's theme and rotates through the three web themes", () => {
  assert.equal(tintForTheme("light"), "fajr");
  assert.equal(tintForTheme("sepia"), "parchemin");
  assert.equal(tintForTheme("dark"), "medine");
  assert.equal(tintForTheme("anything-else"), "fajr");
  assert.deepEqual(tintSequence("medine"), ["medine", "fajr", "parchemin"]);
  assert.deepEqual(tintSequence("fajr"), ["fajr", "parchemin", "medine"]);
  assert.deepEqual(Object.keys(TINTS), ["fajr", "parchemin", "rose", "medine", "ocean"]);
});
