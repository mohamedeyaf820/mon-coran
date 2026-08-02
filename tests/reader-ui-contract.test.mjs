import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

function source(pathname) {
  return fs.readFileSync(new URL(`../${pathname}`, import.meta.url), "utf8");
}

test("healthy reader sources stay out of the reading interface", () => {
  const status = source(
    "src/components/QuranDisplay/ReaderSourceStatus.jsx",
  );

  assert.match(
    status,
    /if \(!textIsDegraded && !translationHasError\) return null;/,
  );
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

test("verse action modal renders a responsive, scrollable action grid", () => {
  const modal = source("src/components/QuranDisplay/AyahActionsModal.jsx");
  const actions = source("src/components/AyahActions.jsx");
  const styles = source("src/styles/ayah-actions-modal.css");

  assert.match(modal, /ayah-actions-modal__body/);
  assert.match(modal, /ayah-actions-modal__ref/);
  assert.match(actions, /quickActions\.map/);
  assert.match(actions, /ayah-actions__surface--modal/);
  assert.match(styles, /\.ayah-actions-modal__body \{[\s\S]*?overflow-y: auto/);
  assert.match(styles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/);
});

test("Mushaf pages keep a compact, theme-aware reading hierarchy", () => {
  const page = source("src/components/Quran/CleanPageView.jsx");
  const readerStyles = source("src/styles/readerStyles.js");
  const styles = source("src/styles/mushaf-page-polish.css");

  assert.match(page, /mushaf-page-wrapper/);
  assert.match(readerStyles, /mushaf-page-polish\.css/);
  assert.match(styles, /--mushaf-paper/);
  assert.match(styles, /font-size: var\(--cpv-font-size/);
  assert.match(styles, /grid-template-columns: minmax\(1\.5rem, 1fr\) auto/);
  assert.match(styles, /@media \(max-width: 640px\)/);
});

test("surah headings use the calligraphic name ligatures accessibly", () => {
  const header = source("src/components/Quran/SurahReaderHeader.jsx");
  const cleanHeader = source("src/components/Quran/CleanPageDecor.jsx");
  const inlineHeader = source("src/components/Quran/MushafInlineHeader.jsx");
  const appHeader = source("src/components/Header.jsx");
  const hero = source("src/components/Home/HeroSection.jsx");
  const session = source("src/components/Home/SessionCard.jsx");
  const surahCards = source("src/components/Home/HomePrimitives.jsx");

  assert.match(header, /const surahLigature = String\(surahNum\)\.padStart\(3, "0"\)/);
  assert.match(header, /aria-label=\{s\.ar\}[\s\S]*?className="font-surah-names"[\s\S]*?dir="ltr" lang="en"/);
  assert.match(cleanHeader, /const accessibleArabicTitle =/);
  assert.match(cleanHeader, /className="cpv-surah-name-ligature"[\s\S]*?dir="ltr"[\s\S]*?lang="en"/);
  assert.match(inlineHeader, /aria-label=\{`سورة \$\{surahNameAr\}`\}/);
  assert.match(appHeader, /getSurahLigature\(activeSurahNum\)/);
  assert.match(appHeader, /className="font-surah-names"[\s\S]*?aria-hidden="true"/);
  assert.match(session, /getSurahLigature\(surahLabel\?\.n\)/);
  assert.match(session, /home-session-card__surah-calligraphy font-surah-names/);
  assert.match(surahCards, /getSurahLigature\(surah\.n\)/);
  assert.match(surahCards, /hp-card-ar font-surah-names/);
  assert.match(hero, /getSurahLigature\(number\)/);
  assert.match(hero, /home-quick-row[\s\S]*?font-surah-names/);
});

test("home quick suggestions stay compact and available responsively", () => {
  const hero = source("src/components/Home/HeroSection.jsx");
  const styles = source("src/styles/domains/search-home-polish.css");

  assert.match(hero, /home-quick-body flex max-h-\[280px\]/);
  assert.match(hero, /grid-cols-\[2\.5rem_minmax\(0,1fr\)_4\.75rem_1\.25rem\]/);
  assert.doesNotMatch(hero, /max-h-\[188px\]/);
  assert.doesNotMatch(
    styles,
    /@media \(max-width: 979px\)[\s\S]{0,500}?home-info-panel[\s\S]{0,100}?display: none/,
  );
});

test("dark karaoke words never inherit the fullscreen analysis overlay", () => {
  const styles = source("src/styles/tailwind.css");

  assert.match(styles, /\.wbw-analysis-overlay \{\s*position: fixed;/);
  assert.doesNotMatch(
    styles,
    /\.wbw-(?:current|read|upcoming),\s*\.wbw-analysis-overlay\s*\{/,
  );
});

test("continuous Mushaf text strips embedded markers before rendering its marker", () => {
  const renderer = source("src/components/Quran/SmartAyahRenderer.jsx");

  assert.match(renderer, /effectiveRiwaya,\s*appendNativeMarker/);
  assert.match(renderer, /return appendNativeAyahMarker\(/);
});

test("continuous Mushaf markers leave a readable gap before the next ayah", () => {
  const css = source("src/styles/domains/reading-platform.css");
  const purgeConfig = source("scripts/cssPurgeConfig.mjs");
  const purgeScript = source("scripts/purge-css.mjs");
  const markerRule = css.match(
    /\.mushaf-text-block \.cpv-ayah-marker\s*\{([\s\S]*?)\}/,
  )?.[1] || "";

  assert.match(markerRule, /margin-inline:\s*0\.12em 0\.72em\s*!important/);
  assert.match(purgeConfig, /\/cpv-ayah-marker\//);
  assert.match(purgeScript, /continuous Mushaf marker spacing/);
});

test("Tajweed legend and Quran.com markup share the same eight rule families", () => {
  const display = source("src/components/QuranDisplay.jsx");
  const legend = source("src/components/Quran/TajweedLegend.jsx");
  const renderer = source("src/components/Quran/TajweedText.jsx");
  const theme = source("src/styles/domains/themes4.css");

  assert.match(display, /showTajwid \? <TajweedLegend lang=\{lang\} riwaya=\{riwaya\}/);
  for (const ruleId of [
    "silent",
    "madd-normal",
    "madd-separated",
    "madd-connected",
    "madd",
    "ghunna",
    "qalqala",
    "tafkhim",
  ]) {
    assert.match(legend, new RegExp(`\\["${ruleId}",`));
  }
  assert.match(renderer, /idgham_ghunnah: 'ghunna'/);
  assert.match(renderer, /idgham_without_ghunnah: 'silent'/);
  assert.match(renderer, /iqlab: 'ghunna'/);
  for (const color of [
    "#999999",
    "#ffc1e0",
    "#ff8e3b",
    "#ff5e8e",
    "#e30000",
    "#26b55d",
    "#00deff",
    "#3c84d5",
  ]) {
    assert.match(theme, new RegExp(color));
  }
});
