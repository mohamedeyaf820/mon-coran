/**
 * Contract: a control the reader has to hit never gets pinned under 44 px by an
 * accidental size declaration (AGENTS.md: "Preserve … 44 px touch targets").
 *
 * This is a static scan, not a rendering measurement. It walks every shipped
 * stylesheet with a selector stack and reports a rule that names a control class
 * (`btn`, `button`, `trigger`, `close`, `control`, `toolbar`) and pins width,
 * height, min-width or min-height to a literal between 24 and 43 px — the exact
 * shape of the reading-toolbar regression, a rule quietly back to 2rem / 41px.
 * It cannot see padding, line-height or flex growth, so a listed rule is a place
 * to look, not a proven violation. That is why the lists below are frozen rather
 * than judged: the gate's job is that nothing new appears and that fixed entries
 * leave.
 *
 * Two scopes, because a repo-wide sweep measures 313 findings today (250 of them outside the reading surface) (recorded below in
 * `measureFullRepo()` and reported to the owning agents rather than pasted here):
 *   - OWNED_FILES, this agent's three stylesheets: every control class is checked;
 *   - every other stylesheet: the reading surface only (`READING_SURFACE`), which
 *     is where the audited regression lives.
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Stylesheets this agent maintains: findings here are its own debt to pay down. */
const OWNED_FILES = [
  "src/styles/reading-ux-refonte.css",
  "src/styles/domains/mobile-all-versions.css",
  "src/styles/domains/reader-premium.css",
];

/** A class token that marks something the finger has to land on. */
const CONTROL_CLASS = /(?:^|[\s>+~,(])\.[-\w]*(btn|button|trigger|close|control|toolbar)/i;
/** Reading-surface selectors, checked in the files other agents own. */
const READING_SURFACE =
  /(reader-toolbar|rd-toolbar|reading-toolbar|reading-controls|rd-actions|ayah-actions|quran-mode-pane|quran-display--platform)/i;

const SIZE_PROPERTIES = new Set(["min-height", "min-width", "width", "height"]);
const MIN_SUSPECT_PX = 24;
const MAX_SUSPECT_PX = 43;
/** Fluid sizes cannot be measured statically; they are skipped, not assumed safe. */
const DYNAMIC_VALUE = /(var\(|calc\(|clamp\(|min\(|max\(|env\(|attr\()/;

/**
 * Deferred findings in files this agent owns — all of them the compact mobile
 * player/header row in mobile-all-versions.css (32-40 px). Left in place on
 * purpose: enlarging them is a mobile layout change the audit did not ask for,
 * and it needs the rendered screens to verify. Shrink-only: fixing one means
 * deleting its line here, adding one fails the gate.
 */
const OWNED_BASELINE = new Set([
"src/styles/domains/mobile-all-versions.css::.app-root .ayah-action-sheet__btn::min-height::42px",
  "src/styles/domains/mobile-all-versions.css::.app-root .ayah-action-sheet__close::height::36px",
  "src/styles/domains/mobile-all-versions.css::.app-root .ayah-action-sheet__close::width::36px",
  "src/styles/domains/mobile-all-versions.css::.app-root .hdr-v7__action-btn, .app-root .hdr-v7__search-btn, .app-root .hdr-v7__menu-btn::height::32px",
  "src/styles/domains/mobile-all-versions.css::.app-root .hdr-v7__action-btn, .app-root .hdr-v7__search-btn, .app-root .hdr-v7__menu-btn::min-height::32px",
  "src/styles/domains/mobile-all-versions.css::.app-root .hdr-v7__action-btn, .app-root .hdr-v7__search-btn, .app-root .hdr-v7__menu-btn::min-width::32px",
  "src/styles/domains/mobile-all-versions.css::.app-root .hdr-v7__action-btn, .app-root .hdr-v7__search-btn, .app-root .hdr-v7__menu-btn::width::32px",
  "src/styles/domains/mobile-all-versions.css::.app-root .mp-player-mobile-main-controls .mp-player-play-btn::height::40px",
  "src/styles/domains/mobile-all-versions.css::.app-root .mp-player-mobile-main-controls .mp-player-play-btn::width::40px",
  "src/styles/domains/mobile-all-versions.css::.app-root .mp-player-mobile-main-controls > button::height::40px",
  "src/styles/domains/mobile-all-versions.css::.app-root .mp-player-mobile-main-controls > button::width::40px",
  "src/styles/domains/mobile-all-versions.css::.app-root .mp-player-mobile-main-controls button::height::33px",
  "src/styles/domains/mobile-all-versions.css::.app-root .mp-player-mobile-main-controls button::width::33px",
  "src/styles/domains/mobile-all-versions.css::.app-root .mp-player-options-trigger::min-height::29px",
  "src/styles/domains/mobile-all-versions.css::.app-root .mp-player-options-trigger::min-height::31px",
  "src/styles/domains/mobile-all-versions.css::.app-root .mp-player-options-trigger::min-height::32px",
  "src/styles/domains/mobile-all-versions.css::.app-root .mp-player-options-trigger::min-width::29px",
  "src/styles/domains/mobile-all-versions.css::.app-root .mp-player-options-trigger::min-width::31px",
  "src/styles/domains/mobile-all-versions.css::.app-root .quran-display--platform .mushaf-layout-btn::min-height::37px",
  "src/styles/domains/mobile-all-versions.css::.app-root .quran-display--platform :is( .quran-mode-pane--surah, .quran-mode-pane--page, .quran-mode-pane--juz ) .ayah-actions-inline__icon-btn::height::32px",
  "src/styles/domains/mobile-all-versions.css::.app-root .quran-display--platform :is( .quran-mode-pane--surah, .quran-mode-pane--page, .quran-mode-pane--juz ) .ayah-actions-inline__icon-btn::width::32px",
  "src/styles/domains/mobile-all-versions.css::.app-root .quran-display--platform :is(.quran-mode-pane--surah, .quran-mode-pane--page, .quran-mode-pane--juz) .ayah-actions-inline__icon-btn::height::33px",
  "src/styles/domains/mobile-all-versions.css::.app-root .quran-display--platform :is(.quran-mode-pane--surah, .quran-mode-pane--page, .quran-mode-pane--juz) .ayah-actions-inline__icon-btn::width::33px",
]);


/**
 * Deferred findings on the reading surface in files another agent owns. Not one
 * of them was judged safe; they are reported, and the first entry is the audit's
 * P1 shape itself: `.reader-toolbar { min-height: 41px }`.
 */
const BASELINE = new Set([
"src/styles/ayah-actions-modal.css::.ayah-actions-modal .ayah-actions__utility-btn::min-height::42px",
  "src/styles/ayah-actions-modal.css::.ayah-actions-modal__close::height::36px",
  "src/styles/ayah-actions-modal.css::.ayah-actions-modal__close::height::40px",
  "src/styles/ayah-actions-modal.css::.ayah-actions-modal__close::width::36px",
  "src/styles/ayah-actions-modal.css::.ayah-actions-modal__close::width::40px",
  "src/styles/domains/audio-legacy.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::height::33px",
  "src/styles/domains/audio-legacy.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::min-height::33px",
  "src/styles/domains/audio-legacy.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::min-width::33px",
  "src/styles/domains/audio-legacy.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::width::33px",
  "src/styles/domains/audio-legacy.css::.app-root .quran-display--platform .qcom-verse-card-footer-btn, .app-root .quran-display--platform .ayah-actions-inline__link::min-height::32px",
  "src/styles/domains/audio-legacy.css::.app-root .quran-display--platform .qcom-verse-card-footer-btn, .app-root .quran-display--platform .ayah-actions-inline__link::min-height::34px",
  "src/styles/domains/premium-platform.css::.ayah-action-sheet .share-btn, .ayah-action-sheet .ayah-actions__playlist-btn::min-height::36px",
  "src/styles/domains/premium-platform.css::.ayah-action-sheet .share-btn, .ayah-action-sheet .ayah-actions__playlist-btn::min-height::43px",
  "src/styles/domains/premium-platform.css::.ayah-actions__utility-btn::min-height::30px",
  "src/styles/domains/premium-plus.css::.app-root.premium-plus .app-view-reading .quran-display--platform .ayah-actions-inline__icon-btn::height::30px",
  "src/styles/domains/premium-plus.css::.app-root.premium-plus .app-view-reading .quran-display--platform .ayah-actions-inline__icon-btn::height::32px",
  "src/styles/domains/premium-plus.css::.app-root.premium-plus .app-view-reading .quran-display--platform .ayah-actions-inline__icon-btn::width::30px",
  "src/styles/domains/premium-plus.css::.app-root.premium-plus .app-view-reading .quran-display--platform .ayah-actions-inline__icon-btn::width::32px",
  "src/styles/domains/premium-plus.css::.app-root.premium-plus .ayah-action-sheet .share-btn, .app-root.premium-plus .ayah-action-sheet .ayah-actions__playlist-btn::min-height::30px",
  "src/styles/domains/premium-plus.css::.app-root.premium-plus .ayah-action-sheet .share-btn, .app-root.premium-plus .ayah-action-sheet .ayah-actions__playlist-btn::min-height::35px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::height::25px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::height::26px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::width::25px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::width::26px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform .rd-actions .ayah-actions-inline__icon-btn::height::28px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform .rd-actions .ayah-actions-inline__icon-btn::height::30px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform .rd-actions .ayah-actions-inline__icon-btn::width::28px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform .rd-actions .ayah-actions-inline__icon-btn::width::30px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform .reader-toolbar-btn::height::34px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform .reader-toolbar-btn::width::34px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform .reader-toolbar__font-stepper button::height::29px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform .reader-toolbar__font-stepper button::width::29px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform :is(.quran-mode-pane--surah, .quran-mode-pane--page, .quran-mode-pane--juz) .ayah-actions-inline__icon-btn::height::35px",
  "src/styles/domains/reader-consolidation.css::.app-root .quran-display--platform :is(.quran-mode-pane--surah, .quran-mode-pane--page, .quran-mode-pane--juz) .ayah-actions-inline__icon-btn::width::35px",
  "src/styles/domains/reading-platform.css::.app-root .quran-display--platform .reader-toolbar-btn, .app-root .quran-display--platform .reader-toolbar__font-stepper::min-height::40px",
  "src/styles/domains/reading-platform.css::.app-root .quran-display--platform .reader-toolbar-btn::min-height::38px",
  "src/styles/domains/reading-platform.css::.app-root .quran-display--platform .reader-toolbar-btn::min-width::40px",
  "src/styles/domains/reading-platform.css::.app-root .quran-display--platform .reader-toolbar::min-height::41px",
  "src/styles/domains/reading-platform.css::.quran-display--platform .mushaf-layout-btn::min-height::39px",
  "src/styles/domains/reading-platform.css::.quran-display--platform .reader-control-deck .reader-context-card__icon::height::30px",
  "src/styles/domains/reading-platform.css::.quran-display--platform .reader-control-deck .reader-context-card__icon::width::30px",
  "src/styles/domains/search-home-polish.css::.app-root .quran-display--platform .reader-toolbar-btn::min-height::38px",
  "src/styles/domains/search-home-polish.css::.app-root .quran-display--platform .reader-toolbar__font-stepper button::height::32px",
  "src/styles/domains/search-home-polish.css::.app-root .quran-display--platform .reader-toolbar__font-stepper button::width::34px",
  "src/styles/domains/search-home-polish.css::.app-root .quran-display--platform .reader-toolbar__font-stepper::min-height::42px",
  "src/styles/home-audio-ux-refonte.css::.app-root .qc-reader-toolbar .afc-size-btn::min-width::36px",
  "src/styles/reader-calm.css::#root .app-root[data-view=\"reading\"] :is(.reader-toolbar-btn--translation, .reader-toolbar-btn--tajweed, .reader-typography-trigger, .reader-fullscreen-trigger)::min-height::36px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::height::28px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::height::29px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::height::31px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::width::28px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::width::29px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .ayah-actions-inline__icon-btn::width::31px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .hp-tabs .mushaf-layout-btn::min-height::39px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .quran-mode-pane--surah .ayah-actions-inline__icon-btn::height::29px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .quran-mode-pane--surah .ayah-actions-inline__icon-btn::height::30px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .quran-mode-pane--surah .ayah-actions-inline__icon-btn::height::32px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .quran-mode-pane--surah .ayah-actions-inline__icon-btn::width::29px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .quran-mode-pane--surah .ayah-actions-inline__icon-btn::width::30px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .quran-mode-pane--surah .ayah-actions-inline__icon-btn::width::32px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .quran-mode-pane--surah .btn-play-surah::min-height::34px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .reader-toolbar-btn::min-height::33px",
  "src/styles/tailwind.css::.app-root .quran-display--platform .reader-toolbar-btn::min-height::35px",
]);


/** Comments are replaced by their own newlines so line numbers stay true. */
const stripComments = (text) => text.replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ""));

/** Literal length to px, or null when it is not a plain px/rem/em length. */
function toPx(value) {
  const match = /^(-?\d*\.?\d+)\s*(px|rem|em)$/.exec(value);
  if (!match) return null;
  const number = Number(match[1]);
  if (!Number.isFinite(number)) return null;
  return match[2] === "px" ? number : number * 16;
}

/**
 * Walk a stylesheet with a selector stack: the text before `{` opens a block and
 * becomes its selector (or at-rule prelude); inside a block the text before `;`
 * is a declaration. Nested at-rules (`@media`) push a frame that is skipped when
 * reading the selector, and `@keyframes` blocks are skipped entirely.
 */
export function scanSource(name, text) {
  const source = stripComments(String(text).replace(/\r\n/g, "\n"));
  const findings = [];
  const stack = [];
  let pending = "";
  let line = 1;

  const flush = () => {
    const declaration = pending.trim().replace(/\s+/g, " ");
    pending = "";
    if (!declaration || !stack.length) return;
    if (stack.some((frame) => /^@keyframes\b/i.test(frame))) return;
    // The declaration belongs to the innermost real selector: at-rule preludes
    // (@media, @supports, @layer) are frames too but never the target, and a
    // block with no selector frame at all (`@font-face`) is not a rule.
    const frames = stack.filter((frame) => frame && !frame.startsWith("@"));
    if (!frames.length) return;
    const selector = frames[frames.length - 1];
    if (/^\d/.test(selector)) return;
    if (!CONTROL_CLASS.test(selector)) return;

    const match = /^([a-z-]+)\s*:\s*(.*)$/i.exec(declaration);
    if (!match) return;
    const property = match[1].toLowerCase();
    if (!SIZE_PROPERTIES.has(property)) return;
    const value = match[2].replace(/\s*!important$/i, "").trim();
    if (DYNAMIC_VALUE.test(value)) return;
    const px = toPx(value);
    if (px == null || px < MIN_SUSPECT_PX || px > MAX_SUSPECT_PX) return;

    findings.push({
      file: name,
      line,
      selector,
      property: match[1],
      value,
      px: Math.round(px),
      key: `${name}::${selector}::${match[1]}::${Math.round(px)}px`,
    });
  };

  for (const char of source) {
    if (char === "\n") {
      pending += char;
      line += 1;
    } else if (char === "{") {
      stack.push(pending.trim().replace(/\s+/g, " "));
      pending = "";
    } else if (char === "}") {
      flush();
      stack.pop();
      pending = "";
    } else if (char === ";") {
      flush();
    } else {
      pending += char;
    }
  }
  return findings;
}

function walkCss(dir, files = []) {
  for (const entry of fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
    const relative = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) walkCss(relative, files);
    else if (entry.name.endsWith(".css")) files.push(relative);
  }
  return files;
}

const FILES = walkCss("src/styles");
const ALL_FINDINGS = FILES.map((file) =>
  scanSource(file, fs.readFileSync(path.join(ROOT, file), "utf8")),
).flat();

/** The figure quoted in the header: what an unscoped sweep would report today. */
function measureFullRepo() {
  return ALL_FINDINGS.filter((finding) => !OWNED_FILES.includes(finding.file)).length;
}

const ownedFindings = ALL_FINDINGS.filter((finding) => OWNED_FILES.includes(finding.file));
const readingFindings = ALL_FINDINGS.filter(
  (finding) => !OWNED_FILES.includes(finding.file) && READING_SURFACE.test(finding.selector),
);

test("the scanner works, on a fixture it can be shown", () => {
  const fixture = `
    .reader-toolbar { min-height: 41px; }            /* caught: 41px control */
    .rd-toolbar-btn { height: 2rem; }                /* caught: 32px */
    .toolbar { width: 44px; height: 48px; }          /* fine: at or over target */
    .ayah-card { min-height: 2.4rem; }               /* not a control class */
    .close-btn { padding: 2rem; }                    /* not a size property */
    .ctrl-btn { min-height: var(--control-h); }      /* fluid: not measurable */
    .btn-x { min-height: 12px; }                     /* hairline, under suspicion */
    @keyframes grow { .toolbar-btn { height: 30px; } }
    @media (max-width: 480px) { .trigger { width: 26px; } }
  `;
  const found = scanSource("fixture.css", fixture).map((finding) => finding.key);
  assert.deepEqual(found, [
    "fixture.css::.reader-toolbar::min-height::41px",
    "fixture.css::.rd-toolbar-btn::height::32px",
    "fixture.css::.trigger::width::26px",
  ]);
});

test("the scan covers the owned stylesheets", () => {
  assert.ok(FILES.length > 30, `${FILES.length} stylesheets scanned`);
  for (const owned of OWNED_FILES) {
    assert.ok(FILES.includes(owned), `${owned} is part of the scan`);
  }
  assert.ok(readingFindings.length > 0, "the reading surface is scanned at all");
});

test("owned stylesheets add no hit-area finding beyond their recorded debt", () => {
  const found = ownedFindings.map((finding) => finding.key).sort();
  const unexpected = found.filter((key) => !OWNED_BASELINE.has(key));
  const stale = [...OWNED_BASELINE].filter((key) => !found.includes(key));
  assert.deepEqual(
    unexpected,
    [],
    `new sub-44px control sizing in a file this agent owns: ${unexpected.join(" | ")}`,
  );
  assert.deepEqual(stale, [], `paid-down debt to remove from OWNED_BASELINE: ${stale.join(" | ")}`);
});

test("the reading surface elsewhere adds no finding beyond the reported debt", () => {
  const found = readingFindings.map((finding) => finding.key).sort();
  const unexpected = found.filter((key) => !BASELINE.has(key));
  const stale = [...BASELINE].filter((key) => !found.includes(key));
  assert.deepEqual(
    unexpected,
    [],
    `new sub-44px control sizing on the reading surface (fix it, or list it with a reason): ${unexpected.join(" | ")}`,
  );
  assert.deepEqual(stale, [], `stale entries to remove from BASELINE: ${stale.join(" | ")}`);
  assert.ok(
    measureFullRepo() > BASELINE.size,
    "the unscoped sweep is larger than this gate covers, as documented",
  );
});

test("every deferred entry is a real, in-range control finding in a file not owned here", () => {
  for (const key of [...BASELINE, ...OWNED_BASELINE]) {
    const [file, selector, property, px] = key.split("::");
    assert.ok(FILES.includes(file), `${file} is a shipped stylesheet`);
    assert.ok(CONTROL_CLASS.test(selector), `${selector} names a control`);
    assert.ok(SIZE_PROPERTIES.has(property), `${property} is a size property`);
    const value = Number(px.replace(/px$/, ""));
    assert.ok(value >= MIN_SUSPECT_PX && value <= MAX_SUSPECT_PX, `${px} is inside the suspect band`);
    if (!OWNED_BASELINE.has(key)) {
      assert.ok(!OWNED_FILES.includes(file), `${file} is owned here: it belongs in OWNED_BASELINE`);
      assert.ok(READING_SURFACE.test(selector), `${selector} is on the reading surface`);
    }
  }
});

test("the reading toolbar itself is never pinned below the target", () => {
  const toolbar = ALL_FINDINGS.filter((finding) =>
    /(reader-toolbar|rd-toolbar|reading-toolbar|reading-controls)/.test(finding.selector),
  );
  const notDeferred = toolbar.filter((finding) => !BASELINE.has(finding.key));
  assert.deepEqual(
    notDeferred.map((finding) => `${finding.file}:${finding.line} ${finding.selector} ${finding.property}: ${finding.value}`),
    [],
    "a new rule would shrink the reading toolbar's controls again",
  );
});
