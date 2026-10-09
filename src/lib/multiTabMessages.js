/**
 * Multi-tab write notice.
 *
 * MushafPlus keeps one localStorage blob (`mushaf-plus-settings`) holding the
 * reading position, bookmarks, notes and preferences. Every tab writes the
 * whole blob on a debounced save, so with two tabs open the last writer wins
 * and the other tab keeps showing — and keeps overwriting — a state the reader
 * believes is saved. There is no server to merge against, so the accepted
 * behaviour stays last-write-wins; this module only makes it *visible*: the
 * first external write of a session raises the existing toast, and nothing is
 * reloaded, merged or discarded automatically.
 *
 * The reader-facing copy lives in src/i18n as `errors.externalSettingsWrite`.
 */

/**
 * Reader-facing notice for an external write. The copy lives in `src/i18n`
 * like every other string the reader sees, so this names the key only.
 */
export const MULTI_TAB_NOTICE_KEY = "errors.externalSettingsWrite";

/**
 * Mirror of the private `SETTINGS_KEY` in src/services/storageService.js.
 * storageService does not export it, and the `storage` event hands us the raw
 * key, so the literal is duplicated here; tests/multi-tab-guard.test.mjs fails
 * if the two ever drift.
 */
export const SETTINGS_STORAGE_KEY = "mushaf-plus-settings";

/**
 * Raw blob this document last wrote, so a same-tab save can never be read as an
 * external one. `saveSettings` writes synchronously, so the value is read
 * straight after the save; a storage engine that refuses reads only costs this
 * suppression, it never hides a real external write.
 */
let ownWrittenValue = null;

export function noteSettingsWrite() {
  try {
    ownWrittenValue = localStorage.getItem(SETTINGS_STORAGE_KEY);
  } catch {
    ownWrittenValue = null;
  }
}

/** Test seam: forget the recorded own-write value. */
export function clearSettingsWriteRecord() {
  ownWrittenValue = null;
}

/**
 * Per-page guard. Per the HTML specification a `storage` event is delivered
 * only to the *other* same-origin documents, so a handler wired to it already
 * means "another tab wrote"; the extra filters keep deletions (the local-data
 * flow announces those its own way), no-op rewrites and our own echoed writes
 * from raising a toast.
 */
export function createMultiTabWriteGuard(onNotice) {
  let announced = false;

  return {
    /** Returns true when this event raised the notice. */
    handleStorageEvent(event) {
      if (!event || event.key !== SETTINGS_STORAGE_KEY) return false;
      const next = event.newValue;
      if (!next || next === event.oldValue || next === ownWrittenValue) return false;
      if (announced) return false;
      announced = true;
      onNotice?.();
      return true;
    },
    get announced() {
      return announced;
    },
  };
}
