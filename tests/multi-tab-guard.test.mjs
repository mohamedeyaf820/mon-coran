/**
 * Contract: the multi-tab write guard (Finding "two tabs silently overwrite each
 * other").
 *
 * The reader's whole state lives in one localStorage blob that every tab
 * rewrites on its debounced save, so the guard is the only thing that tells a
 * reader their screen is behind another tab. These tests pin the detection
 * rules — external write warns once, own write and unrelated keys stay quiet —
 * the codepoint-built Arabic notice, and the App.jsx/AppContext wiring that a
 * unit test cannot execute because JSX is not importable from `node --test`.
 */
import assert from "node:assert/strict";
import fr from "../src/i18n/fr.js";
import en from "../src/i18n/en.js";
import ar from "../src/i18n/ar.js";

// Byte-for-byte pin of the Arabic notice, carried over from the revision that
// introduced it. The copy itself now lives in src/i18n; this is what keeps a
// later edit from silently reordering those codepoints.
const ARABIC_NOTICE_CODEPOINTS = [
  0x62a, 0x645, 0x20, 0x62a, 0x63a, 0x64a, 0x64a, 0x631, 0x20, 0x627, 0x644, 0x62d,
  0x627, 0x644, 0x629, 0x20, 0x641, 0x64a, 0x20, 0x62a, 0x628, 0x648, 0x64a, 0x628,
  0x20, 0x622, 0x62e, 0x631, 0x2e, 0x20, 0x623, 0x639, 0x62f, 0x20, 0x627, 0x644,
  0x62a, 0x62d, 0x645, 0x64a, 0x644, 0x20, 0x644, 0x631, 0x624, 0x64a, 0x629, 0x20,
  0x627, 0x644, 0x62a, 0x63a, 0x64a, 0x64a, 0x631, 0x20, 0x627, 0x644, 0x623, 0x62e,
  0x64a, 0x631, 0x2e
];

import fs from "node:fs";
import test from "node:test";

import {
  SETTINGS_STORAGE_KEY,
  clearSettingsWriteRecord,
  createMultiTabWriteGuard,
  noteSettingsWrite,
} from "../src/lib/multiTabMessages.js";

const readSource = (relativePath) =>
  fs.readFileSync(new URL(relativePath, import.meta.url), "utf8").replace(/\r\n/g, "\n");

const externalWrite = (newValue, oldValue = "previous-blob") => ({
  key: SETTINGS_STORAGE_KEY,
  oldValue,
  newValue,
});

/** Minimal localStorage stand-in for the own-write recording path. */
function withStoredValue(value, run) {
  const previous = globalThis.localStorage;
  globalThis.localStorage = { getItem: () => value, setItem: () => {} };
  try {
    return run();
  } finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
    clearSettingsWriteRecord();
  }
}

test.beforeEach(() => clearSettingsWriteRecord());

/* ── 1. Detection rules ─────────────────────────────────────────────────── */

test("an external write to the settings key warns exactly once", () => {
  let notices = 0;
  const guard = createMultiTabWriteGuard(() => {
    notices += 1;
  });

  assert.equal(guard.handleStorageEvent(externalWrite("blob-from-tab-b")), true);
  assert.equal(notices, 1);
  assert.equal(guard.announced, true);

  // Later writes from the other tab must not turn the reading view into a
  // toast machine: one notice per session, the reader decides when to reload.
  assert.equal(guard.handleStorageEvent(externalWrite("blob-from-tab-c", "blob-from-tab-b")), false);
  assert.equal(guard.handleStorageEvent(externalWrite("blob-from-tab-d", "blob-from-tab-c")), false);
  assert.equal(notices, 1, "the notice stays raised once per session");
});

test("a write made by this tab does not warn", () => {
  // saveSettings() writes synchronously, so noteSettingsWrite() records the
  // exact bytes this document produced. An engine that echoed the event back
  // into the writing document must therefore stay silent.
  const ownBlob = "blob-written-by-this-tab";
  withStoredValue(ownBlob, () => {
    noteSettingsWrite();
    let notices = 0;
    const guard = createMultiTabWriteGuard(() => {
      notices += 1;
    });

    assert.equal(guard.handleStorageEvent(externalWrite(ownBlob)), false);
    assert.equal(notices, 0, "our own value is never an external change");
    assert.equal(guard.announced, false, "a suppressed event does not burn the notice");

    // A genuinely different blob still warns, once.
    assert.equal(guard.handleStorageEvent(externalWrite("blob-from-tab-b")), true);
    assert.equal(notices, 1);
  });
});

test("a write to an unrelated key does not warn", () => {
  let notices = 0;
  const guard = createMultiTabWriteGuard(() => {
    notices += 1;
  });

  for (const key of [
    "mushaf-plus-vod-notified-on",
    "mushaf-warsh-cache-migration-v5",
    "mushaf-plus-audio-sync",
    null,
    undefined,
    "",
  ]) {
    assert.equal(
      guard.handleStorageEvent({ key, oldValue: null, newValue: "changed" }),
      false,
      `${String(key)} is not the settings blob`,
    );
  }
  assert.equal(notices, 0);
});

test("a removal and a no-op rewrite do not warn", () => {
  let notices = 0;
  const guard = createMultiTabWriteGuard(() => {
    notices += 1;
  });

  // Deleting local data has its own flow (LOCAL_DATA_DELETION_EVENT) and its
  // own message; a guard toast on top of it would only add noise.
  assert.equal(guard.handleStorageEvent({ key: SETTINGS_STORAGE_KEY, newValue: null }), false);
  assert.equal(
    guard.handleStorageEvent({ key: SETTINGS_STORAGE_KEY, newValue: "" }),
    false,
  );
  assert.equal(
    guard.handleStorageEvent({
      key: SETTINGS_STORAGE_KEY,
      oldValue: "same",
      newValue: "same",
    }),
    false,
    "an identical rewrite changed nothing",
  );
  assert.equal(notices, 0);
});

test("a guard with no callback still classifies the event", () => {
  const guard = createMultiTabWriteGuard(undefined);
  assert.equal(guard.handleStorageEvent(externalWrite("blob-from-tab-b")), true);
  assert.doesNotThrow(() => guard.handleStorageEvent(externalWrite("blob-from-tab-c")));
});

/* ── 2. The settings key must not drift from its owner ───────────────────── */

test("the guard watches the key storageService actually writes", () => {
  const storageSource = readSource("../src/services/storageService.js");
  const match = /const SETTINGS_KEY = "([^"]+)";/.exec(storageSource);
  assert.ok(match, "storageService still declares its settings key as a literal");
  assert.equal(
    match[1],
    SETTINGS_STORAGE_KEY,
    "the duplicated key literal drifted from src/services/storageService.js",
  );
  assert.match(
    storageSource,
    /localStorage\.setItem\(SETTINGS_KEY, encryptData\(safe\)\)/,
    "saveSettings must still write the whole blob, which is why last-write-wins needs a notice",
  );
});

/* ── 3. The reader-facing notice, owned by src/i18n ── */

test("the notice exists in the three shipped languages", () => {
  for (const locale of [fr, en, ar]) {
    const message = locale.errors?.externalSettingsWrite;
    assert.equal(typeof message, "string", "the locale defines the notice");
    assert.ok(message.length > 20, "the notice is a sentence");
    assert.match(message, /[.!?]$/, "the notice ends in punctuation");
  }
});

test("the Arabic notice is still the codepoint sequence it was pinned as", () => {
  const message = ar.errors.externalSettingsWrite;
  assert.deepEqual(
    Array.from(message, (char) => char.codePointAt(0)),
    ARABIC_NOTICE_CODEPOINTS,
    "the Arabic value must match its documented codepoints",
  );
  // Arabic script, spaces and ASCII punctuation only. Written as arithmetic
  // rather than a character class so this file holds no Arabic literal.
  const foreign = Array.from(message, (char) => char.codePointAt(0)).filter(
    (cp) => cp !== 0x20 && cp !== 0x2e && !(cp >= 0x600 && cp <= 0x6ff),
  );
  assert.deepEqual(foreign, [], "unexpected script in the Arabic notice");
});

test("the guard module names the i18n key instead of carrying copy", () => {
  const source = readSource("../src/lib/multiTabMessages.js");
  assert.ok(
    source.includes(
      'export const MULTI_TAB_NOTICE_KEY = "errors.externalSettingsWrite";',
    ),
    "the module exports the key",
  );
  assert.ok(!source.includes("const NOTICES"), "no locale copy outside src/i18n");
});


/* ── 4. Wiring, pinned statically (JSX is not importable from node --test) ─ */

test("App.jsx listens for the storage event and reuses the toast host", () => {
  const app = readSource("../src/App.jsx");
  assert.match(app, /from "\.\/lib\/multiTabMessages"/, "App.jsx imports the guard module");
  assert.match(app, /createMultiTabWriteGuard\(/, "App.jsx builds the guard");
  assert.match(app, /addEventListener\("storage", handleStorage\)/, "the storage event is wired");
  assert.match(app, /removeEventListener\("storage", handleStorage\)/, "and cleaned up");
  assert.match(app, /t\(MULTI_TAB_NOTICE_KEY, document\.documentElement\.lang/, "lang comes from <html>");
  assert.ok(
    !/window\.location\.reload|location\.reload\(/.test(app),
    "the guard must never reload the reader by itself",
  );
});

test("AppContext records this tab's own writes", () => {
  const context = readSource("../src/context/AppContext.jsx");
  assert.match(context, /import \{ noteSettingsWrite \} from "\.\.\/lib\/multiTabMessages"/);
  const writes = context.match(/mergeSettings\(persistentSettingsRef\.current\);/g) || [];
  const marks = context.match(/noteSettingsWrite\(\);/g) || [];
  assert.ok(writes.length > 0, "the debounced saver still writes the blob");
  assert.equal(marks.length, writes.length, "every settings save records its own value");
});

test("the toast layer still outranks dialogs, through the token", () => {
  const scale = readSource("../src/styles/tailwind.css");
  const zToast = Number(/--z-toast:\s*(\d+)/.exec(scale)?.[1]);
  const zModal = Number(/--z-modal:\s*(\d+)/.exec(scale)?.[1]);
  assert.ok(Number.isFinite(zToast) && Number.isFinite(zModal), "both layers are declared");
  assert.ok(zToast > zModal, "a toast is the feedback channel for a dialog, so it must sit above");
  const app = readSource("../src/App.jsx");
  assert.match(app, /z-\[var\(--z-toast\)\]/, "the toast host takes its layer from the scale");
  assert.doesNotMatch(app, /z-\[9999\]/, "no raw literal may out-rank the scale again");
});
