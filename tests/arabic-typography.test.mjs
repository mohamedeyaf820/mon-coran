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

  assert.deepEqual(sizes, [24, 27, 31, 34]);
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
    30,
  );
  assert.equal(
    getResponsiveArabicFontSize({
      preferredSize: 96,
      viewportWidth: 520,
      mushafLayout: "mushaf",
    }),
    34,
  );
  assert.equal(
    getResponsiveArabicFontSize({
      preferredSize: 96,
      viewportWidth: 1440,
      mushafLayout: "mushaf",
    }),
    52,
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

test("Yusuf 12:11 keeps its Quranic sign without the mobile black-dot fallback glyph", () => {
  const qpcWord = "\u062A\u064E\u0623\u06E1\u0645\u064E\u06EC\u0646\u0651\u064E\u0627";
  const canonicalWord = "\u062A\u064E\u0623\u06E1\u0645\u064E\u06EB\u0646\u0651\u064E\u0627";
  const ayah = {
    text: qpcWord,
    quranCom: {
      textQpcHafs: qpcWord,
      textUthmani: canonicalWord,
    },
  };

  const rendered = getAyahTextForFont(ayah, "qpc-hafs", "hafs");
  assert.equal(rendered, canonicalWord);
  assert.equal(rendered.includes("\u06EC"), false);
  assert.equal(rendered.includes("\u06EB"), true);
});

test("Al-Mulk pause signs stay attached to the preceding Uthmani glyph", () => {
  const qpcText = "\u0639\u064E\u0645\u064E\u0644\u0627\u064B\u200C\u06DA \u0648\u064E\u0647\u064F\u0648\u064E";
  const ayah = {
    text: qpcText,
    quranCom: {
      textQpcHafs: qpcText,
      textUthmani: qpcText,
    },
  };

  for (const fontFamily of [
    "qpc-hafs",
    "qpc-indopak",
    "scheherazade-new",
    "amiri-quran",
    "noto-naskh-arabic",
  ]) {
    const rendered = getAyahTextForFont(ayah, fontFamily, "hafs");
    assert.equal(rendered.includes("\u200C\u06DA"), false, fontFamily);
    assert.equal(rendered.includes("\u06DA"), true, fontFamily);
  }
});
