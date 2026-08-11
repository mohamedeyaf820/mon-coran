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
  const header = source("src/components/Quran/SurahReaderHeader.jsx");
  const surahMode = source("src/components/QuranDisplay/SurahMode.jsx");
  const styles = source("src/styles/surah-reader-header.css");

  assert.match(surahMode, /<div className="qc-surah-header-wrap animate-in">[\s\S]*?<SurahReaderHeader/);
  assert.doesNotMatch(surahMode, /isQCF4\s*&&\s*mushafLayout\s*===\s*["']mushaf["']/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*?\.srh-mobile-bar\s*\{[\s\S]*?display: grid/);
  assert.match(styles, /\.srh-mobile-bar :is\(\.srh-play-btn, \.srh-info-btn\)[\s\S]*?min-height: 44px/);
  assert.match(header, /aria-controls="srh-reader-tools"/);
  assert.match(header, /READER_TOOLS_SESSION_KEY/);
  assert.match(header, /onClick=\{toggleReaderTools\}/);
  assert.match(header, /className="srh-identity__disclosure"/);
  assert.match(styles, /\.srh-reader-tools\s*\{[\s\S]*?grid-template-rows: 0fr/);
  assert.match(styles, /\.srh-reader-tools--open\s*\{[\s\S]*?grid-template-rows: 1fr/);
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
  assert.doesNotMatch(styles, /\.sip-header__ornament\s*\{[^}]*\b(?:border|background|box-shadow|border-radius)\s*:/);
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

test("verse action modal renders a reduced, responsive action grid", () => {
  const modal = source("src/components/QuranDisplay/AyahActionsModal.jsx");
  const actions = source("src/components/AyahActions.jsx");
  const styles = source("src/styles/ayah-actions-modal.css");

  assert.match(modal, /ayah-actions-modal__body/);
  assert.match(modal, /ayah-actions-modal__ref/);
  assert.match(actions, /ayah-action-card--play/);
  assert.match(actions, /Plus d’actions/);
  assert.match(actions, /ayah-actions__surface--modal/);
  assert.match(styles, /\.ayah-actions-modal__body \{[\s\S]*?overflow-y: auto/);
  assert.match(styles, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*?repeat\(2, minmax\(0, 1fr\)\)/);
});

test("Tajweed legend groups rules without compressing their labels", () => {
  const styles = source("src/styles/experience-polish.css");
  assert.match(styles, /tajweed-legend__rules[\s\S]*?repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /grid-template-rows: repeat\(2, minmax\(1\.8rem, auto\)\)/);
  assert.match(styles, /tajwid-rule-tooltip[\s\S]*?background: var\(--bg-card\)/);
});

test("page atmospheres remain contextual, theme-aware and asset-free", () => {
  const app = source("src/App.jsx");
  const styles = source("src/styles/domains/premium-plus.css");

  assert.match(app, /data-home-section=\{showHome \? state\.homeSection \|\| "surah"/);
  assert.match(styles, /data-view="home"\]\s+\.app-view-home::before/);
  assert.match(styles, /data-home-section="audio"/);
  assert.match(styles, /data-view="reading"\]\s+\.app-view-reading::before/);
  assert.match(styles, /data-view="duas"\]\s+\.app-view-duas::before/);
  assert.match(styles, /\[data-theme="sepia"\][\s\S]*?--context-glow/);
  assert.match(styles, /\[data-theme="dark"\][\s\S]*?--context-glow/);
  assert.match(styles, /-webkit-mask-image:/);

  const contextualBlock = styles.slice(styles.indexOf("/* Contextual atmosphere"));
  assert.doesNotMatch(contextualBlock, /url\s*\(/);
});

test("mobile reader shell follows the Tajweed card and keeps an explicit home logo", () => {
  const header = source("src/components/Header.jsx");
  const styles = source("src/styles/device-responsive.css");

  assert.match(header, /data-testid="mobile-home-logo"/);
  assert.match(header, /onClick=\{goHome\}/);
  assert.match(header, /mp-header__home-badge/);
  assert.match(styles, /quran-display\.quran-display--platform[\s\S]*?padding-top: 0 !important/);
  assert.match(styles, /quran-display\.quran-display--platform > \.tajweed-legend[\s\S]*?margin-top: 0 !important/);
  assert.match(styles, /@media \(max-width: 380px\)[\s\S]*?--mp-header-control: 40px/);
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
  const styles = source("src/styles/app-system.css");
  const constants = source("src/components/Home/homeConstants.js");

  assert.match(hero, /className="home-overview"/);
  assert.match(hero, /className="home-resume-panel"/);
  assert.match(hero, /className="home-today-panel"/);
  assert.match(hero, /suggestionSet\.surahs\.slice\(0, 5\)/);
  assert.match(styles, /@media \(max-width: 700px\)[\s\S]*?home-today-suggestion:nth-child\(n \+ 4\)/);
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

test("immersive Mushaf keeps a three-page window and separates zoom from page swipes", () => {
  const display = source("src/components/QuranDisplay.jsx");
  const overlay = source("src/components/QuranDisplay/FullscreenMushafOverlay.jsx");
  const prefetch = source("src/components/QuranDisplay/useQuranDisplayPrefetch.js");
  const storage = source("src/services/storageService.js");

  assert.match(display, /openImmersiveMushaf/);
  assert.match(display, /await prepareReadingTarget\("page", targetPage\)/);
  assert.match(overlay, /\[currentPage - 1, currentPage, currentPage \+ 1\]/);
  assert.match(overlay, /preloadQuranDisplayData/);
  assert.match(overlay, /const MAX_ZOOM = 3\.2/);
  assert.match(overlay, /zoom > 1\.01 \|\| !event\.changedTouches\[0\]/);
  assert.match(overlay, /mfp-page-container--immersive/);
  assert.match(prefetch, /currentPage \+ 1/);
  assert.match(prefetch, /currentPage - 1/);
  assert.match(storage, /mushafPageFlow: "vertical"/);
});

test("immersive Mushaf is edge-to-edge on mobile and theme-aware on desktop", () => {
  const styles = source("src/styles/domains/reading-platform.css");

  assert.match(styles, /@media \(max-width: 1024px\)[\s\S]*?width: 100vw;[\s\S]*?height: 100dvh/);
  assert.match(styles, /\.mfp-viewport[\s\S]*?overflow: auto/);
  assert.match(styles, /touch-action: pan-x pan-y/);
  assert.match(styles, /\.mfp-page-container--immersive \.mfp-reader-bar/);
  assert.match(styles, /data-theme="dark"\] \.mfp-page-sheet/);
  assert.match(styles, /env\(safe-area-inset-bottom\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test("surah headings use the calligraphic name ligatures accessibly", () => {
  const header = source("src/components/Quran/SurahReaderHeader.jsx");
  const headerStyles = source("src/styles/surah-reader-header.css");
  const cleanHeader = source("src/components/Quran/CleanPageDecor.jsx");
  const inlineHeader = source("src/components/Quran/MushafInlineHeader.jsx");
  const appHeader = source("src/components/Header.jsx");
  const hero = source("src/components/Home/HeroSection.jsx");
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
  assert.match(hero, /getSurahLigature\(surahLabel\?\.n\)/);
  assert.match(hero, /home-resume-panel__target[\s\S]*?font-surah-names/);
  assert.match(surahCards, /getSurahLigature\(surah\.n\)/);
  assert.match(surahCards, /hp-card-ar font-surah-names/);
  assert.match(hero, /getSurahLigature\(surah\.n\)/);
  assert.match(hero, /home-today-suggestion__arabic font-surah-names/);
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
  const styles = source("src/styles/app-system.css");

  assert.match(hero, /suggestionSet\.surahs\.slice\(0, 5\)/);
  assert.match(hero, /className="home-today-suggestion"/);
  assert.match(styles, /grid-template-columns: 2rem minmax\(0, 1fr\) 4\.25rem 1\.5rem/);
  assert.match(styles, /home-today-suggestion:nth-child\(n \+ 4\)[\s\S]*?display: none/);
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

test("retired word analysis CSS is absent from the application shell", () => {
  const styles = source("src/styles/tailwind.css");

  assert.doesNotMatch(styles, /\.wbw-(?:analysis-overlay|current|read|upcoming)/);
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

test("the visual system separates brand, gold, Warsh and transliteration roles", () => {
  const theme = source("src/styles/domains/themes4.css");
  const fonts = source("src/styles/riwaya-fonts.css");
  const reader = source("src/styles/domains/reading-platform.css");
  const readingPolish = source("src/styles/reading-ux-refonte.css");
  const verseView = source("src/components/QuranDisplay/QCVerseByVerseView.jsx");
  const supplement = source("src/components/Quran/AyahBlockSupplement.jsx");

  assert.equal((theme.match(/--brand-gold:/g) || []).length, 3);
  assert.match(theme, /--gold: var\(--brand-gold, var\(--theme-accent\)\)/);
  assert.match(fonts, /--font-quran-warsh: "KFGQPC Warsh"/);
  assert.match(fonts, /font-synthesis: none/);
  assert.match(reader, /\.qcm-word--warsh \{[\s\S]*?font-size: 1em !important;[\s\S]*?line-height: inherit !important;/);
  assert.match(readingPolish, /"Iowan Old Style", "Palatino Linotype", Georgia, serif/);
  assert.match(verseView, /className="qc-ayah-transliteration"/);
  assert.match(supplement, /className="ayah-transliteration" dir="ltr"/);
});

test("the application-wide design system owns themes, surfaces and responsive fallbacks", () => {
  const imports = source("src/main.jsx");
  const system = source("src/styles/app-system.css");

  assert.match(imports, /import "\.\/styles\/app-system\.css";/);
  for (const theme of ["light", "sepia", "dark"]) {
    assert.match(system, new RegExp(`\\[data-theme="${theme}"\\]`));
  }
  assert.match(system, /--mp-content-max: 90rem/);
  assert.match(system, /\.app-root :is\(\.hp-wrapper, \.duas-page, \.legal-page, \.not-found-page, \.reciter-detail\)/);
  assert.match(system, /@media \(max-width: 720px\)[\s\S]*?--mp-page-gutter/);
  assert.match(system, /@media \(max-width: 480px\)[\s\S]*?\.library-overlay[\s\S]*?align-items: end/);
  assert.match(system, /@media \(max-width: 340px\)[\s\S]*?\.library-tabs small[\s\S]*?display: none/);
  assert.match(system, /@media \(prefers-reduced-motion: reduce\)/);
});
