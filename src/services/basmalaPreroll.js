/**
 * Basmala pre-roll.
 *
 * The mushaf opens every surah — At-Tawba excepted — with the basmala, and the
 * verse files do not carry it: Quran.com's own timing for Alafasy 2:1 spans the
 * whole 7-second file with the single word ألم, so nothing is missing from the
 * CDN and nothing is hiding. Al-Fatiha's first verse IS the basmala in both
 * riwayas, which is why every per-ayah CDN already publishes it as 001001.mp3
 * and the reciter's own voice is one URL away.
 *
 * It is a pre-roll, not a playlist item: the verse pointer, the word highlight,
 * the seek bar and the saved position must not move while it plays.
 */

import { basmalaPrerollUrl, hafsFileNumber } from "./audioUrlBuilder.js";

export function createBasmalaPreroll(service) {
  let active = false;
  let token = 0;
  let settle = null;

  return {
    get active() {
      return active;
    },

    /**
     * Play the basmala ahead of `item` when it opens a surah. Resolves true when
     * the caller still owns the element and should load the verse, false when a
     * newer request superseded the wait. A missing or blocked basmala never
     * costs the reader the verse: it resolves true immediately.
     */
    async before(item) {
      const url = basmalaPrerollUrl(
        service._currentReciterCdn,
        service._currentCdnType,
        item?.surah,
      );
      if (!url || hafsFileNumber(item) !== 1) return true;

      const generation = ++token;
      active = true;
      service.onBasmala?.(true);
      try {
        // No retries: a pre-roll is not worth delaying the recitation for.
        await service._loadUrlWithRetry(url, 0);
        const seconds = Number(service.audio.duration);
        // Not every folder keeps its promise: measured on 2026-09-24,
        // AbdulSamad_64kbps_QuranExplorer.Com/001001.mp3 runs 67 s and
        // Ahmed_ibn_Ali_al-Ajamy_64kbps/001001.mp3 runs 39 s — neither is the
        // four-word basmala, while the slowest legitimate one measured is
        // 16.8 s. Past this ceiling it is somebody else's recitation: hand the
        // element to the verse instead.
        if (!(Number.isFinite(seconds) && seconds > 24)) {
          await new Promise((resolve) => {
            let timer = null;
            const startedAt = Date.now();
            const deadline = startedAt + (seconds > 0 ? seconds : 8) * 1000 + 3000;
            const done = () => {
              clearTimeout(timer);
              settle = null;
              resolve();
            };
            settle = done;
            // Two ways the pre-roll must let go, because a surah may not be
            // held hostage by its opening file: the stream stops reporting
            // `ended` (a stalled or mocked element), or it never starts moving.
            const poll = () => {
              if (Date.now() > deadline) return done();
              if (
                Number(service.audio.currentTime) <= 0.05 &&
                Date.now() - startedAt > 2500
              ) {
                return done();
              }
              timer = setTimeout(poll, 500);
            };
            timer = setTimeout(poll, 500);
          });
        }
      } catch {
        /* fall through to the verse */
      }
      if (generation === token) {
        active = false;
        service.onBasmala?.(false);
      }
      return generation === token;
    },

    /** True when an `ended` event belongs to the pre-roll, not to a verse. */
    ended() {
      if (!active) return false;
      settle?.();
      return true;
    },

    /** Hand the element to the next request and stop waiting for `ended`. */
    cancel() {
      if (!active) return;
      token += 1;
      settle?.();
      active = false;
      service.onBasmala?.(false);
    },
  };
}
