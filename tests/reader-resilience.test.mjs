/**
 * Reader resilience and verse-labelling contracts.
 *
 * Covers the audit fixes: the offline-and-not-stored reader state (previously
 * an unclassified throw that surfaced as the generic crash boundary), the
 * translation strip's missing recovery action, one riwaya-correct verse number
 * per surface, and the verse-action labels moving to src/i18n.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import {
  READER_LOAD,
  classifyBoundaryError,
  classifyReaderLoadError,
  createReaderDataError,
  isChunkLoadError,
} from "../src/components/QuranDisplay/readerLoadError.js";
import locales from "../src/i18n/index.js";

const readSource = (relativePath) =>
  fs
    .readFileSync(new URL(`../${relativePath}`, import.meta.url), "utf8")
    .replace(/\r\n/g, "\n");

const AYAH_ACTIONS = "src/components/AyahActions.jsx";

/* ── 1. offline navigation must not reach the crash boundary ─────────────── */

test("reader load: offline and unstored is its own state, not a crash", () => {
  const raw = new TypeError("Failed to fetch");
  const state = classifyReaderLoadError(raw, { online: false });

  assert.equal(state.code, READER_LOAD.OFFLINE_NOT_STORED);
  assert.equal(state.boundary, false, "the reader answers it, the boundary does not");
  assert.equal(state.retryable, false, "a reload of bytes that are not on the device is not recovery");
});

test("reader load: online failures keep their own retryable answer", () => {
  const cases = [
    [new Error("API request timed out after 15000ms"), READER_LOAD.TIMEOUT, true],
    [new Error("Request timed out (8000ms)"), READER_LOAD.TIMEOUT, true],
    [new Error("API error 503: https://api.alquran.cloud/v1/juz/29"), READER_LOAD.SERVER, true],
    [new Error("API error 404: https://api.quran.com/x"), READER_LOAD.SERVER, false],
    [new Error("Failed to load Warsh surah JSON: 404"), READER_LOAD.SERVER, false],
    [new Error("Failed to fetch"), READER_LOAD.NETWORK, true],
  ];
  for (const [error, code, retryable] of cases) {
    const state = classifyReaderLoadError(error, { online: true });
    assert.equal(state.code, code, error.message);
    assert.equal(state.retryable, retryable, error.message);
    assert.equal(state.boundary, false, error.message);
  }
});

test("reader load: an empty payload is distinguishable from an outage", () => {
  const empty = classifyReaderLoadError(
    createReaderDataError(READER_LOAD.EMPTY, "Empty payload for the requested reading"),
    { online: false },
  );
  assert.equal(empty.code, READER_LOAD.EMPTY);
  assert.equal(empty.boundary, false);

  const warsh = classifyReaderLoadError(
    createReaderDataError(READER_LOAD.WARSH_TEXT, "Warsh text unavailable"),
    { online: true },
  );
  assert.equal(warsh.code, READER_LOAD.WARSH_TEXT);
  assert.notEqual(warsh.code, empty.code, "blocked Warsh fallback is not an empty surah");
});

test("reader load: an aborted request stays silent and a real defect reaches the boundary", () => {
  const abort = new Error("signal aborted");
  abort.name = "AbortError";
  const aborted = classifyReaderLoadError(abort, { online: true });
  assert.equal(aborted.code, READER_LOAD.ABORTED);
  assert.equal(aborted.silent, true);

  const unexpected = classifyReaderLoadError(new RangeError("cannot read x"), { online: true });
  assert.equal(unexpected.code, READER_LOAD.UNEXPECTED);
  assert.equal(unexpected.boundary, true, "an unclassified failure must stay visible");
});

test("reader data hook classifies at the source and re-exposes the state", () => {
  const hook = readSource("src/components/QuranDisplay/useQuranDisplayData.js");
  assert.match(hook, /classifyReaderLoadError\(err, \{/);
  assert.match(hook, /online: typeof navigator === "undefined" \|\| navigator\.onLine !== false/);
  assert.match(hook, /setLoadState\(loadState\)/);
  assert.match(hook, /loadState,/);
  assert.doesNotMatch(hook, /setError\(err\.message\)/, "never forward a raw provider message");

  const display = readSource("src/components/QuranDisplay.jsx");
  assert.match(display, /loadState\?\.boundary/);
  assert.match(display, /<ReaderDataState/);
  assert.doesNotMatch(display, /isNetworkFailure/);
});

test("offline-and-not-stored state offers the one action that works offline", () => {
  const state = readSource("src/components/QuranDisplay/ReaderDataState.jsx");
  assert.match(
    state,
    /\[READER_LOAD\.OFFLINE_NOT_STORED\][\s\S]*?homeOnly: true/,
    "the offline gap must not present a retry as its primary answer",
  );
  assert.match(state, /const offerRetry = !copy\.homeOnly \|\| online/);
  assert.match(state, /errors\.notStoredTitle/);
  assert.match(state, /errors\.notStoredBody/);
  assert.match(state, /errors\.backHome/);
  assert.match(state, /addEventListener\("online"/, "retry appears when the connection returns");
});

test("a route chunk the network cannot deliver is an offline content gap", () => {
  const chunkError = new Error(
    "Failed to fetch dynamically imported module: /assets/JuzMode-Cx7p2.js",
  );
  assert.equal(isChunkLoadError(chunkError), true);

  // Bundlers and engines word the same failure differently, and React.lazy
  // wraps it: prove the classifier on the wrapped and the URL-only shapes too.
  const wrapped = new Error("error loading dynamically imported module");
  wrapped.cause = new TypeError("Failed to fetch");
  wrapped.cause.message = "Importing a module script failed.";
  assert.equal(isChunkLoadError(wrapped), true);

  const urlOnly = new Error('Unable to preload CSS for "/assets/D-j2EOD_.css"');
  assert.equal(isChunkLoadError(urlOnly), true, "an asset URL in the message is enough");

  const bare = new Error("could not load /assets/JuzMode-Cx7p2.js");
  assert.equal(isChunkLoadError(bare), true);

  assert.equal(
    isChunkLoadError(new TypeError("undefined is not a function")),
    false,
    "a real defect must not be relabelled as a content gap",
  );

  const offline = classifyBoundaryError(chunkError, { online: false });
  assert.equal(offline.chunkLoad, true);
  assert.equal(offline.offline, true);
  assert.equal(offline.retryable, false, "reloading the same missing file is not a recovery");

  const online = classifyBoundaryError(chunkError, { online: true });
  assert.equal(online.retryable, true);

  const realBug = classifyBoundaryError(new TypeError("x is not a function"), { online: false });
  assert.equal(realBug.chunkLoad, false, "a genuine defect keeps the crash copy");

  const boundary = readSource("src/components/ErrorBoundary.jsx");
  assert.match(boundary, /classifyBoundaryError/);
  assert.match(boundary, /errors\.notStoredTitle/);
  assert.match(boundary, /claimChunkReload\(\)/);
  assert.match(boundary, /CHUNK_RELOAD_COOLDOWN_MS/, "the auto reload must not loop");
  // navigator.onLine stays true behind a captive portal, so keying the honest
  // copy off `kind.offline` sent those readers to the generic crash screen with
  // a reload button for bytes the device does not have.
  assert.match(boundary, /const offlineGap = kind\.chunkLoad;/);
  assert.match(
    boundary,
    /reloadLabel: kind\.retryable \? t\("errors\.boundaryReload", lang\) : null/,
    "the retry only appears where a retry can work",
  );
});

/* ── 2. the translation strip gets a way out ─────────────────────────────── */

test("translation failure exposes a retry that re-runs the fetch", () => {
  const hook = readSource("src/components/QuranDisplay/useQuranTranslations.js");
  assert.match(hook, /const retryTranslations = useCallback/);
  assert.match(hook, /retryToken,\n\s*showTranslation,/);
  assert.match(hook, /if \(!signal\.aborted\)/);
  assert.match(hook, /controller\.abort\(\)/, "the abort guard still owns the request");
  assert.match(hook, /error\?\.name !== "AbortError"/);

  const strip = readSource("src/components/QuranDisplay/ReaderSourceStatus.jsx");
  assert.match(strip, /onRetryTranslation/);
  assert.match(strip, /onClick=\{onRetryTranslation\}/);
  assert.match(strip, /t\("actions\.retry", lang\)/);
  assert.match(
    strip,
    /if \(!textIsDegraded && !translationHasError\) return null;/,
    "a healthy reader still shows no strip",
  );

  const display = readSource("src/components/QuranDisplay.jsx");
  assert.match(display, /onRetryTranslation=\{retryTranslations\}/);
});

/* ── 3. one verse number per surface, in the riwaya on screen ───────────── */

test("verse action surfaces print the riwaya display number, never the Hafs key", () => {
  const actions = readSource(AYAH_ACTIONS);
  assert.match(
    actions,
    /const displayAyahNumber = Number\(ayahData\?\.numberInSurah \?\? ayah\);/,
  );
  assert.doesNotMatch(
    actions,
    /\{surah\}:\{ayah\}/,
    "a visible 16:123 next to the reader's 16:120 reads as a data error",
  );
  assert.equal(
    (actions.match(/\{surah\}:\{displayAyahNumber\}/g) || []).length,
    2,
    "the compact sheet and the note preview both use the display number",
  );
  // The Hafs coordinate survives only where it is a storage or cache key.
  assert.match(actions, /getNote\(surah, ayah\)/);
  assert.match(actions, /addBookmark\(\s*surah,\s*ayah\s*\)/m);
  assert.match(actions, /sheetIdBase = `ayah-action-\$\{surah\}-\$\{ayah\}`/);
  assert.match(actions, /displayAyah: Number\(ayahData\?\.numberInSurah \?\? ayah\)/);
  assert.match(actions, /const audioAyah = riwaya === "warsh" \? \(ayahData\?\.numberInSurah \?\? ayah\) : ayah;/);

  const modal = readSource("src/components/QuranDisplay/AyahActionsModal.jsx");
  assert.match(modal, /const verseNumber = ayahData\?\.numberInSurah \?\? activeAyah;/);
  assert.match(modal, /const storageVerseNumber = ayahData\?\.hafsNumber \?\? verseNumber;/);
  assert.match(modal, /\{surah\}:\{verseNumber\}/, "the header stays on the display number");
  assert.match(modal, /ayah=\{storageVerseNumber\}/, "persistence stays on the Hafs coordinate");

  const wrapper = readSource("src/components/QuranDisplay/QCVerseActions.jsx");
  assert.match(wrapper, /ayah=\{ayahData\?\.hafsNumber \?\? ayah\}/);
});

test("the reader column numbers verses the same way the sheets do", () => {
  const view = readSource("src/components/QuranDisplay/QCVerseByVerseView.jsx");
  assert.match(view, /referenceLabel=\{displayMode === "surah" \? String\(ayah\.numberInSurah\)/);
  assert.match(view, /ayah=\{ayah\.numberInSurah\}/, "the action row receives the display number");
});

/* ── 4. verse-action labels live in src/i18n ─────────────────────────────── */

test("AyahActions carries no hand-rolled label ternary or bare literal", () => {
  const actions = readSource(AYAH_ACTIONS);
  const labelTernary = /lang === "fr"[" \t\r\n]*\?[" \t\r\n]*"/;
  assert.equal(
    labelTernary.test(actions),
    false,
    "user-visible labels must come from t(); only data selection may branch on lang",
  );
  assert.doesNotMatch(actions, /lang === "ar"[\s]*\?[\s]*"[^"]*"[\s]*:[\s]*"[A-Za-z]/);
  assert.doesNotMatch(actions, /toastText/, "the three-argument literal helper is retired");
  assert.doesNotMatch(actions, /<span>Playlists<\/span>/);
  assert.doesNotMatch(actions, /title="Options"/);
  // The one surviving ternary picks the surah name column, not a label.
  assert.equal((actions.match(/lang === "fr"/g) || []).length, 1);
  assert.match(actions, /lang === "fr"\n\s*\? surahInfo\?\.fr \|\| surahInfo\?\.en/);
});

test("every migrated verse-action label resolves in fr, en and ar", () => {
  const keys = [
    "verseOptions", "copyVerse", "copiedShort", "playlists", "more", "moreActions",
    "shareAsImage", "listeningList", "chooseAction", "favorite", "notSaved",
    "audioHub", "addToPlaylist", "playlistEmpty", "copyFailed", "storageError",
  ];
  for (const key of keys) {
    for (const lang of ["fr", "en", "ar"]) {
      const value = locales[lang].actions[key];
      assert.ok(typeof value === "string" && value.trim(), `actions.${key} (${lang})`);
      assert.doesNotMatch(value, /^[a-z]+\.[a-zA-Z]+$/, "a value must not be its own key");
    }
    assert.equal(locales.ar.actions[key] === locales.fr.actions[key], false, `${key} needs Arabic`);
  }
  assert.equal(locales.fr.actions.playlists, "Playlists / Listes", "keep the wording users know");
  assert.equal(locales.fr.actions.moreActions, "Plus d\u2019actions");
  assert.equal(locales.en.actions.favorite, "Favorite", "one English label for the verse action");
});

test("new reader error copy resolves in three languages and is Arabic in ar", () => {
  const expected = {
    // Built from codepoints already verified in this repository's Arabic:
    // "this content is not saved on this device".
    notStoredTitle:
      "647 630 627 20 627 644 645 62d 62a 648 649 20 63a 64a 631 20 645 62d 641 648 638 20 639 644 649 20 647 630 627 20 627 644 62c 647 627 632",
    // "No connection available. Reconnect to download this content."
    notStoredBody:
      "644 627 20 627 62a 635 627 644 20 645 62a 627 62d 2e 20 623 639 62f 20 627 644 627 62a 635 627 644 20 644 62a 62d 645 64a 644 20 647 630 627 20 627 644 645 62d 62a 648 649 2e",
    // "Retry as soon as the connection returns."
    notStoredHint:
      "623 639 62f 20 627 644 645 62d 627 648 644 629 20 639 646 62f 20 639 648 62f 629 20 627 644 627 62a 635 627 644 2e",
    // "Loading the data failed. Try again."
    serverBody:
      "62a 639 630 631 20 62a 62d 645 64a 644 20 627 644 628 64a 627 646 627 62a 2e 20 62d 627 648 644 20 645 631 629 20 623 62e 631 649 2e",
  };
  for (const [key, codepoints] of Object.entries(expected)) {
    const value = locales.ar.errors[key];
    assert.ok(value, `ar.errors.${key} must exist`);
    assert.equal(
      [...value].map((c) => c.codePointAt(0).toString(16)).join(" "),
      codepoints,
      `ar.errors.${key} codepoints drifted`,
    );
    assert.match(value, /[\u0600-\u06ff]/, `ar.errors.${key} must be Arabic`);
    for (const lang of ["fr", "en"]) {
      assert.ok(locales[lang].errors[key]?.trim(), `${lang}.errors.${key}`);
    }
  }
  assert.equal(locales.fr.errors.notStoredTitle.includes("enregistr"), true);
});
