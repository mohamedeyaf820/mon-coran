import assert from "node:assert/strict";
import test from "node:test";

import {
  clampArabicFontSize,
  getArabicReadingLineHeight,
  getResponsiveArabicFontSize,
} from "../src/utils/arabicTypography.js";
import {
  appendNativeAyahMarker,
  getAyahTextForFont,
  getQuranWordTextForFont,
} from "../src/data/fonts.js";

test("Arabic typography clamps unsafe preferences", () => {
  assert.equal(clampArabicFontSize(-10), 12);
  assert.equal(clampArabicFontSize(25), 25);
  assert.equal(clampArabicFontSize(400), 96);
  assert.equal(clampArabicFontSize("invalid"), 25);
});

test("Arabic typography scales progressively with the connected device", () => {
  const widths = [390, 820, 1280, 1440];
  const sizes = widths.map((viewportWidth) =>
    getResponsiveArabicFontSize({
      preferredSize: 25,
      viewportWidth,
      mushafLayout: "list",
    }),
  );

  assert.deepEqual(sizes, [21, 27, 31, 34]);
  for (let index = 1; index < sizes.length; index += 1) {
    assert.ok(sizes[index] > sizes[index - 1]);
  }
});

test("Arabic typography preserves user reductions and increases on every device", () => {
  for (const viewportWidth of [390, 820, 1440]) {
    const small = getResponsiveArabicFontSize({
      preferredSize: 20,
      viewportWidth,
      mushafLayout: "list",
    });
    const regular = getResponsiveArabicFontSize({
      preferredSize: 25,
      viewportWidth,
      mushafLayout: "list",
    });
    const large = getResponsiveArabicFontSize({
      preferredSize: 40,
      viewportWidth,
      mushafLayout: "list",
    });

    assert.ok(small < regular);
    assert.ok(regular < large);
  }
});

test("Mushaf typography stays responsive without exceeding layout safety caps", () => {
  assert.equal(
    getResponsiveArabicFontSize({
      preferredSize: 96,
      viewportWidth: 390,
      mushafLayout: "mushaf",
    }),
    40,
  );
  assert.equal(
    getResponsiveArabicFontSize({
      preferredSize: 96,
      viewportWidth: 1440,
      mushafLayout: "mushaf",
    }),
    72,
  );
});

test("continuous Mushaf line height stays compact for every exposed Quran font", () => {
  const fonts = [
    ["qpc-hafs", "hafs"],
    ["qpc-indopak", "hafs"],
    ["scheherazade-new", "hafs"],
    ["amiri-quran", "hafs"],
    ["noto-naskh-arabic", "hafs"],
    ["qpc-warsh", "warsh"],
    ["kfgqpc-warsh", "warsh"],
    ["scheherazade-new-warsh", "warsh"],
  ];

  for (const [fontFamily, riwaya] of fonts) {
    const lineHeight = getArabicReadingLineHeight({
      displayMode: "surah",
      fontFamily,
      mushafLayout: "mushaf",
      riwaya,
    });
    assert.ok(lineHeight >= 1.85, `${fontFamily} must preserve Arabic marks`);
    assert.ok(lineHeight <= 2.1, `${fontFamily} must keep Mushaf lines connected`);
  }
});

test("every exposed Hafs text path removes internal dotted-circle anchors", () => {
  const anchoredWord = "\u0623\u064E\u0646\u064E\u0627\u25CC\u06E0";
  const ayah = {
    text: anchoredWord,
    quranCom: {
      textQpcHafs: anchoredWord,
      textIndopak: anchoredWord,
      textUthmani: anchoredWord,
    },
  };
  const word = {
    text: anchoredWord,
    textQpcHafs: anchoredWord,
    textIndopak: anchoredWord,
    textUthmani: anchoredWord,
  };

  for (const fontFamily of [
    "qpc-hafs",
    "qpc-indopak",
    "scheherazade-new",
    "amiri-quran",
    "noto-naskh-arabic",
  ]) {
    assert.equal(getAyahTextForFont(ayah, fontFamily, "hafs").includes("\u25CC"), false);
    assert.equal(getQuranWordTextForFont(word, fontFamily, "hafs").includes("\u25CC"), false);
  }

  const withMarker = appendNativeAyahMarker(anchoredWord, 52, "qpc-hafs", "hafs");
  assert.equal(withMarker.includes("\u25CC"), false);
  assert.equal(withMarker.includes("\u06E0"), true);
});
