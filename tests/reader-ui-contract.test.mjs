import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function source(pathname) {
  return fs.readFileSync(new URL(`../${pathname}`, import.meta.url), "utf8");
}

test("healthy reader sources stay out of the reading interface", () => {
  const status = source("src/components/QuranDisplay/ReaderSourceStatus.jsx");

  assert.match(status, /if \(!textIsDegraded && !translationHasError\) return null;/);
  assert.doesNotMatch(status, /dataSource\?\.label/);
  assert.doesNotMatch(status, /translationSource/);
});

test("reader typography controls remain explicit and mobile-accessible", () => {
  const header = source("src/components/Quran/SurahReaderHeader.jsx");
  const controls = source("src/components/ArabicFontControls.jsx");
  const styles = source("src/styles/surah-reader-header.css");

  assert.match(header, /aria-expanded=\{typographyOpen\}/);
  assert.match(header, /Texte et taille/);
  assert.match(controls, /step="1"/);
  assert.match(styles, /\.srh-typography-disclosure\.open \.srh-typography-panel/);
});

test("reciter cards keep technical providers in the detail view", () => {
  const cards = source("src/components/Home/ContentSection.jsx");
  const details = source("src/components/recitation/ReciterDetailPage.jsx");

  assert.doesNotMatch(cards, /getReciterSourceInfo/);
  assert.match(details, /getReciterSourceInfo/);
  assert.match(details, /reciter-detail__sources/);
});

test("Mushaf pages keep a compact, theme-aware reading hierarchy", () => {
  const page = source("src/components/Quran/CleanPageView.jsx");
  const decor = source("src/components/Quran/CleanPageDecor.jsx");
  const readerStyles = source("src/styles/readerStyles.js");
  const styles = source("src/styles/mushaf-page-polish.css");

  assert.match(page, /mushaf-page-wrapper/);
  assert.match(readerStyles, /mushaf-page-polish\.css/);
  assert.match(styles, /--mushaf-paper/);
  assert.match(styles, /font-size: var\(--cpv-font-size/);
  assert.match(styles, /grid-template-columns: minmax\(1\.5rem, 1fr\) auto/);
  assert.match(decor, /function TitleFlourish/);
  assert.match(decor, /<TitleFlourish mirrored \/>/);
  assert.match(styles, /background: linear-gradient\(145deg, #224a42, #153832 60%, #102e29\)/);
  assert.match(styles, /font-family: "surahnames", serif !important/);
  assert.match(styles, /@media \(max-width: 640px\)/);
});

test("Mushaf headings use accessible calligraphic ligatures", () => {
  const cleanHeader = source("src/components/Quran/CleanPageDecor.jsx");
  const inlineHeader = source("src/components/Quran/MushafInlineHeader.jsx");
  const surahs = source("src/data/surahs.js");

  assert.match(cleanHeader, /const accessibleArabicTitle =/);
  assert.match(cleanHeader, /getSurahLigature\(surahNum\)/);
  assert.match(
    cleanHeader,
    /cpv-surah-name-ligature[\s\S]*?dir=\{surahLigature \? "ltr" : "rtl"\}[\s\S]*?lang=\{surahLigature \? "en" : "ar"\}/,
  );
  assert.match(inlineHeader, /aria-label=\{`سورة \$\{surahNameAr\}`\}/);
  assert.match(inlineHeader, /getSurahLigature\(surahNum\)/);
  assert.doesNotMatch(cleanHeader, /cpv-surah-prefix/);
  assert.doesNotMatch(inlineHeader, /mp-surah-prefix/);
  assert.match(surahs, /export function getSurahLigature/);
});
