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

test("the unified reader header remains available in mobile QCF4 Mushaf mode", () => {
  const surahMode = source("src/components/QuranDisplay/SurahMode.jsx");
  const styles = source("src/styles/surah-reader-header.css");

  assert.match(surahMode, /<div className="qc-surah-header-wrap animate-in">[\s\S]*?<SurahReaderHeader/);
  assert.doesNotMatch(surahMode, /isQCF4\s*&&\s*mushafLayout\s*===\s*["']mushaf["']/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*?\.srh-mobile-bar\s*\{[\s\S]*?display: grid/);
  assert.match(styles, /\.srh-mobile-bar :is\(\.srh-play-btn, \.srh-info-btn\)[\s\S]*?min-height: 44px/);
});

test("surah information opens as an accessible responsive dossier", () => {
  const header = source("src/components/Quran/SurahReaderHeader.jsx");
  const panel = source("src/components/QuranDisplay/SurahInfoPanel.jsx");
  const modal = source("src/components/ui/modal.jsx");
  const styles = source("src/styles/surah-info-panel.css");

  assert.match(header, /aria-haspopup="dialog"/);
  assert.match(header, /<Modal[\s\S]*?portal[\s\S]*?<SurahInfoPanel/);
  assert.match(panel, /fetchQuranComSurahInfo/);
  assert.match(panel, /Repères essentiels/);
  assert.match(panel, /Dossier complet/);
  assert.match(panel, /aria-expanded=\{expanded\}/);
  assert.match(panel, /revelationOrder/);
  assert.match(panel, /dossierBlocks\.map/);
  assert.match(panel, /<h4 key=\{block\}>/);
  assert.match(modal, /createPortal\(modalContent, document\.body\)/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*?align-items: flex-end/);
  assert.match(styles, /grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.sip-dossier__copy h4/);
  assert.match(styles, /\.surah-info-modal > div:last-child[\s\S]*?overflow-y: auto/);
  assert.match(styles, /overscroll-behavior: contain/);
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

test("Tajweed legend groups rules without compressing their labels", () => {
  const styles = source("src/styles/experience-polish.css");
  assert.match(styles, /tajweed-legend__rules[\s\S]*?repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /grid-template-rows: repeat\(2, minmax\(2rem, auto\)\)/);
  assert.match(styles, /tajwid-rule-tooltip[\s\S]*?background: var\(--bg-card\)/);
});

test("mobile reader shell follows the Tajweed card and keeps an explicit home logo", () => {
  const header = source("src/components/Header.jsx");
  const styles = source("src/styles/device-responsive.css");

  assert.match(header, /data-testid="mobile-home-logo"/);
  assert.match(header, /onClick=\{goHome\}/);
  assert.match(header, /mp-header__home-badge/);
  assert.match(styles, /quran-display\.quran-display--platform[\s\S]*?background: transparent !important/);
  assert.match(styles, /quran-display\.quran-display--platform > \.tajweed-legend[\s\S]*?margin-top: 0 !important/);
  assert.match(styles, /@media \(max-width: 380px\)[\s\S]*?grid-template-columns: 88px minmax\(0, 1fr\) 88px/);
  assert.doesNotMatch(styles, /@media \(max-width: 380px\)\s*\{\s*html body \.app-root > \.mp-header \.mp-header__brand\s*\{\s*display: none/);
});

test("verse reference and primary actions keep one production-safe row", () => {
  const view = source("src/components/QuranDisplay/QCVerseByVerseView.jsx");
  const styles = source("src/styles/device-responsive.css");

  assert.match(view, /className="qc-list-card__start"[\s\S]*?display: "flex"[\s\S]*?flexWrap: "nowrap"/);
  assert.match(view, /className="qc-list-card__end"[\s\S]*?display: "flex"[\s\S]*?flexWrap: "nowrap"/);
  assert.match(styles, /@media \(max-width: 320px\)[\s\S]*?\.srh-controls[\s\S]*?minmax\(0, 1\.12fr\)/);
  assert.match(styles, /:is\(\.srh-pill, \.srh-toggle\) svg[\s\S]*?display: none !important/);
});

test("home mobile hierarchy progressively discloses secondary content", () => {
  const hero = source("src/components/Home/HeroSection.jsx");
  const styles = source("src/styles/device-responsive.css");
  const constants = source("src/components/Home/homeConstants.js");
  const session = source("src/components/Home/SessionCard.jsx");

  assert.match(hero, /<details[\s\S]*?className="home-mobile-quick-disclosure/);
  assert.match(hero, /<summary[\s\S]*?className="home-mobile-quick-toggle/);
  assert.match(hero, /matchMedia\("\(min-width: 641px\)"\)/);
  assert.match(styles, /home-mobile-quick-disclosure:not\(\[open\]\) > \.home-info-panel[\s\S]*?display: none/);
  assert.match(session, /home-session-card[^"\n]*max-\[640px\]:order-1/);
  assert.match(constants, /Sincérité pure/);
  assert.match(constants, /Médinoise/);
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

test("surah headings use the calligraphic name ligatures accessibly", () => {
  const header = source("src/components/Quran/SurahReaderHeader.jsx");
  const headerStyles = source("src/styles/surah-reader-header.css");
  const cleanHeader = source("src/components/Quran/CleanPageDecor.jsx");
  const inlineHeader = source("src/components/Quran/MushafInlineHeader.jsx");
  const appHeader = source("src/components/Header.jsx");
  const hero = source("src/components/Home/HeroSection.jsx");
  const session = source("src/components/Home/SessionCard.jsx");
  const surahCards = source("src/components/Home/HomePrimitives.jsx");

  assert.match(header, /const surahLigature = String\(surahNum\)\.padStart\(3, "0"\)/);
  assert.match(header, /aria-label=\{s\.ar\}[\s\S]*?className="font-surah-names"[\s\S]*?dir="ltr" lang="en"/);
  assert.doesNotMatch(headerStyles, /\.srh-arabic\s*\{[^}]*\b(?:border|background|box-shadow)\s*:/);
  assert.doesNotMatch(headerStyles, /\.srh-mobile-bar__name\s*\{[^}]*\b(?:border|background|border-radius)\s*:/);
  assert.match(cleanHeader, /const accessibleArabicTitle =/);
  assert.match(cleanHeader, /getSurahLigature\(surahNum\)/);
  assert.match(cleanHeader, /cpv-surah-name-ligature[\s\S]*?dir=\{surahLigature \? "ltr" : "rtl"\}[\s\S]*?lang=\{surahLigature \? "en" : "ar"\}/);
  assert.match(inlineHeader, /aria-label=\{`سورة \$\{surahNameAr\}`\}/);
  assert.match(inlineHeader, /getSurahLigature\(surahNum\)/);
  assert.doesNotMatch(cleanHeader, /cpv-surah-prefix/);
  assert.doesNotMatch(inlineHeader, /mp-surah-prefix/);
  assert.match(appHeader, /getSurahLigature\(activeSurahNum\)/);
  assert.match(appHeader, /className="font-surah-names"[\s\S]*?aria-hidden="true"/);
  assert.match(session, /getSurahLigature\(surahLabel\?\.n\)/);
  assert.match(session, /home-session-card__surah-calligraphy font-surah-names/);
  assert.match(surahCards, /getSurahLigature\(surah\.n\)/);
  assert.match(surahCards, /hp-card-ar font-surah-names/);
  assert.match(hero, /getSurahLigature\(number\)/);
  assert.match(hero, /home-quick-row[\s\S]*?font-surah-names/);
});

test("the active surah name keeps its meaning animated without harming accessibility", () => {
  const header = source("src/components/Header.jsx");
  const styles = source("src/styles/header-enhanced.css");

  assert.match(header, /surahMeta\?\.en \|\| surahMeta\?\.fr/);
  assert.match(header, /aria-label=\{centerTitleLabel\}/);
  assert.match(header, /mp-header__title-sub-track/);
  assert.match(header, /mp-header__title-meaning/);
  assert.match(styles, /@keyframes mh-title-in/);
  assert.match(styles, /@keyframes mh-meaning-cycle/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*?mp-header__title-sub-track/);
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

test("home surah play controls expose and toggle the real playback state", () => {
  const home = source("src/components/HomePage.jsx");
  const cards = source("src/components/Home/HomePrimitives.jsx");
  const styles = source("src/styles/home-audio-ux-refonte.css");

  assert.match(home, /audioService\.currentAyah\?\.surah === surahNum[\s\S]*?audioService\.pause\(\)/);
  assert.match(home, /await audioService\.play\(\)[\s\S]*?isPlaying: true/);
  assert.match(cards, /isPlaying && "playing/);
  assert.match(cards, /aria-pressed=\{isPlaying\}/);
  assert.match(styles, /\.hp-card--surah\.playing[\s\S]*?hp-audio-pulse/);
  assert.match(styles, /prefers-reduced-motion: reduce[\s\S]*?animation: none/);
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

test("ayah numbers use the marker supplied by the active Quran font", () => {
  const marker = source("src/components/Quran/AyahMarker.jsx");

  assert.match(marker, /getNativeAyahMarker\(markerNumber, activeFont, activeRiwaya\)/);
  assert.match(marker, /resolveFontFamily\(activeFont, activeRiwaya\)/);
  assert.match(marker, /data-marker-font=\{activeFont\}/);
  assert.doesNotMatch(marker, /ayat-marker__medallion/);
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
