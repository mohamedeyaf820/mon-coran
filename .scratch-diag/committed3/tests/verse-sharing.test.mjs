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
    "https://mushafplus.netlify.app/surah/2/16",
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
  assert.match(payload.fullText, /https:\/\/mushafplus\.netlify\.app\/surah\/2\/16$/);
});

test("verse sharing: provides valid destinations for every supported network", () => {
  const payload = createVerseSharePayload({
    surah: 8,
    ayah: 74,
    arabicText: "وَالَّذِينَ آمَنُوا",
    surahName: "Le Butin",
    lang: "fr",
    origin: "https://mushafplus.netlify.app",
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
  assert.match(panel, /LE CORAN · SIMPLEMENT/);
  assert.match(actions, /openShareStudio[\s\S]*?shareImageOpen: true/);
  assert.doesNotMatch(actions, /createVerseShareTargets|shareWhatsApp|shareTelegram/);
});
