import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  cleanShareText,
  createVerseSharePayload,
  createVerseShareTargets,
  getVerseShareUrl,
} from "../src/services/verseShareService.js";

test("verse sharing: builds a stable MushafPlus deep link", () => {
  assert.equal(
    getVerseShareUrl(2, 16, "http://127.0.0.1:3002"),
    "https://mon-coran.vercel.app/surah/2/16",
  );
  assert.equal(
    getVerseShareUrl(8, 74, "https://preview.example.com"),
    "https://preview.example.com/surah/8/74",
  );
});

test("verse sharing: creates clean localized content", () => {
  const payload = createVerseSharePayload({
    surah: 2,
    ayah: 16,
    arabicText: "  ذَٰلِكَ  ",
    translationText: "<strong>Voici</strong>&nbsp;le verset",
    surahName: "La Vache",
    lang: "fr",
    origin: "http://localhost:3002",
  });

  assert.equal(payload.title, "La Vache (2:16) · MushafPlus");
  assert.match(payload.text, /ذَٰلِكَ/);
  assert.match(payload.text, /Voici le verset/);
  assert.match(payload.text, /La Vache · verset 16/);
  assert.equal(payload.text.includes("<strong>"), false);
  assert.match(payload.fullText, /https:\/\/mon-coran.vercel.app\/surah\/2\/16$/);
});

test("verse sharing: provides valid destinations for every supported network", () => {
  const payload = createVerseSharePayload({
    surah: 8,
    ayah: 74,
    arabicText: "وَالَّذِينَ آمَنُوا",
    surahName: "Le Butin",
    lang: "fr",
    origin: "https://mon-coran.vercel.app",
  });
  const targets = createVerseShareTargets(payload);

  const whatsapp = new URL(targets.whatsapp);
  assert.equal(whatsapp.hostname, "wa.me");
  assert.match(whatsapp.searchParams.get("text"), /surah\/8\/74/);

  const telegram = new URL(targets.telegram);
  assert.equal(telegram.hostname, "t.me");
  assert.equal(telegram.searchParams.get("url"), payload.url);

  const x = new URL(targets.x);
  assert.equal(x.hostname, "x.com");
  assert.equal(x.searchParams.get("url"), payload.url);

  const facebook = new URL(targets.facebook);
  assert.equal(facebook.hostname, "www.facebook.com");
  assert.equal(facebook.searchParams.get("u"), payload.url);

  assert.match(targets.email, /^mailto:\?subject=/);
  assert.match(decodeURIComponent(targets.email), /Le Butin \(8:74\)/);
});

test("verse sharing: strips markup and normalizes whitespace", () => {
  assert.equal(cleanShareText("  <p>Une&nbsp;ligne</p>  "), "Une ligne");
});

test("verse sharing: the product flow is image-first", () => {
  const panel = fs.readFileSync(
    new URL("../src/components/AyahSharePanel.jsx", import.meta.url),
    "utf8",
  );
  const card = fs.readFileSync(
    new URL("../src/components/share/verseCardSvg.js", import.meta.url),
    "utf8",
  );
  const actions = fs.readFileSync(
    new URL("../src/components/AyahActions.jsx", import.meta.url),
    "utf8",
  );

  assert.match(panel, /VERSE_CARD_FORMATS[\s\S]*?square[\s\S]*?portrait[\s\S]*?story/);
  assert.match(panel, /VERSE_CARD_PRESETS[\s\S]*?fajr[\s\S]*?mushaf[\s\S]*?madinah/);
  assert.match(panel, /navigator\.share\(\{ files: \[file\], title:/);
  assert.match(panel, /ClipboardItem\(\{ "image\/png": blob \}\)/);
  assert.match(panel, /share-studio__quick-setting/);
  assert.doesNotMatch(panel, /share-editor|share-textarea/);
  assert.match(card, /LE CORAN · SIMPLEMENT/);
  assert.match(actions, /openShareStudio[\s\S]*?shareImageOpen: true/);
  assert.doesNotMatch(actions, /createVerseShareTargets|shareWhatsApp|shareTelegram/);
});

test("verse sharing: every card palette keeps the Quran text and the translation readable", () => {
  const panel = fs.readFileSync(
    new URL("../src/components/share/verseCardSvg.js", import.meta.url),
    "utf8",
  );
  const block = panel.slice(
    panel.indexOf("export const VERSE_CARD_PRESETS"),
    panel.indexOf("export const VERSE_CARD_FRAMES"),
  );
  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5]
      .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
      .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const contrast = (a, b) => {
    const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
    return (high + 0.05) / (low + 0.05);
  };
  const presets = [
    ...block.matchAll(
      /id: "([\w-]+)"[\s\S]*?background: "(#\w+)",\s*surface: "(#\w+)",\s*ink: "(#\w+)",\s*arabic: "(#\w+)",\s*accent: "(#\w+)",\s*muted: "(#\w+)"/g,
    ),
  ];

  assert.equal(presets.length, 18);
  for (const [, id, background, surface, ink, , , muted] of presets) {
    assert.ok(contrast(ink, background) >= 7, `${id}: Quran text contrast`);
    assert.ok(contrast(muted, surface) >= 4.5, `${id}: translation on its panel`);
    assert.ok(contrast(muted, background) >= 4.5, `${id}: translation on the paper`);
  }
});

test("verse sharing: every frame and pattern the picker offers is drawn", () => {
  const panel = fs.readFileSync(
    new URL("../src/components/share/verseCardSvg.js", import.meta.url),
    "utf8",
  );
  const ornaments = fs.readFileSync(
    new URL("../src/components/share/cardOrnaments.js", import.meta.url),
    "utf8",
  );
  for (const frame of ["classic", "fine", "corners", "frieze", "arch", "ogee", "zellige", "ribbon", "scrolls", "none"]) {
    assert.match(panel, new RegExp(`id: "${frame}", label:`), `frame ${frame} is offered`);
  }
  for (const frame of ["fine", "corners", "frieze", "arch"]) {
    assert.match(panel, new RegExp(`geometry === "${frame}"`), `frame ${frame} is drawn`);
  }
  for (const frame of ["ogee", "zellige", "ribbon", "scrolls"]) {
    assert.match(ornaments, new RegExp(`geometry === "${frame}"`), `frame ${frame} is drawn`);
  }
  for (const motif of ["star", "lattice", "dunes"]) {
    assert.match(panel, new RegExp(`motif === "${motif}"`), `motif ${motif} is drawn`);
  }
  for (const motif of ["flowers", "arabesque", "skyline", "night"]) {
    assert.match(panel, new RegExp(`id: "${motif}", label:`), `motif ${motif} is offered`);
    assert.match(ornaments, new RegExp(`motif === "${motif}"`), `motif ${motif} is drawn`);
  }
});

test("verse sharing: every palette, frame, motif and format draws a complete card", async () => {
  const card = await import("../src/components/share/verseCardSvg.js");
  const samples = [
    { arabic: "قُلْ هُوَ ٱللَّهُ أَحَدٌ", translation: "Dis : « Il est Allah, Unique." },
    {
      arabic: Array.from({ length: 70 }, () => "ٱلْحَمْدُ لِلَّهِ").join(" "),
      translation: Array.from({ length: 90 }, () => "louange").join(" "),
    },
  ];
  let drawn = 0;
  for (const preset of card.VERSE_CARD_PRESETS) {
    for (const frame of card.VERSE_CARD_FRAMES) {
      for (const motif of card.VERSE_CARD_MOTIFS) {
        const format = card.VERSE_CARD_FORMATS[drawn % card.VERSE_CARD_FORMATS.length];
        const sample = samples[drawn % samples.length];
        drawn += 1;
        const svg = card.buildVerseCardSvg({
          arabicText: sample.arabic,
          translationText: sample.translation,
          includeTranslation: true,
          surahNameAr: "البقرة",
          surahNameLabel: "La Vache",
          surahNumber: 2,
          ayahNumber: 152,
          presetId: preset.id,
          formatId: format.id,
          frameId: frame.id,
          motifId: motif.id,
        });
        const label = `${preset.id}/${frame.id}/${motif.id}/${format.id}`;
        assert.doesNotMatch(svg, /NaN|undefined|Infinity/, `${label}: no broken number`);
        assert.match(svg, new RegExp(`viewBox="0 0 ${format.width} ${format.height}"`), label);
        // Every gradient the card points at is defined in the same SVG.
        for (const [, id] of svg.matchAll(/url\(#(\w+)\)/g)) {
          assert.ok(svg.includes(`id="${id}"`), `${label}: #${id} is defined`);
        }
        // Only primitives the sanitiser keeps.
        for (const [, tag] of svg.matchAll(/<(\w+)[\s>/]/g)) {
          assert.ok(
            ["svg", "g", "defs", "radialGradient", "linearGradient", "stop", "rect", "circle", "path", "line", "polyline", "polygon", "text", "tspan"].includes(tag),
            `${label}: <${tag}> survives the sanitiser`,
          );
        }
      }
    }
  }
  assert.ok(drawn >= 18 * 10 * 9);
});

test("verse sharing: gold foil and sky gradients belong to the palettes that declare them", async () => {
  const card = await import("../src/components/share/verseCardSvg.js");
  const render = (presetId) =>
    card.buildVerseCardSvg({
      arabicText: "ٱللَّهُ",
      translationText: "",
      includeTranslation: false,
      surahNumber: 112,
      ayahNumber: 1,
      presetId,
    });
  assert.match(render("kiswa"), /id="foil"/);
  assert.match(render("kiswa"), /fill="url\(#foil\)"/);
  assert.doesNotMatch(render("fajr"), /id="foil"/);
  assert.match(render("crepuscule"), /<linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">/);
});
