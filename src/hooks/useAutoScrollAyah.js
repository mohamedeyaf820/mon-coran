import { useEffect, useRef } from 'react';

/**
 * Auto-scroll to the currently playing ayah.
 *
 * Strategy:
 * - Only scrolls when isPlaying is true and the ayah changes.
 * - Uses IntersectionObserver to skip scroll when the element is already
 *   visible in the viewport.
 * - Debounced (300 ms) to avoid jitter during rapid ayah changes.
 * - Respects user intent: if the user manually scrolls, we pause
 *   auto-scroll for 5 seconds before resuming.
 * - ayahId lookup: `[data-surah-number="${surah}"][data-ayah-number="${ayah}"]`
 *   (works across all display modes — surah, page, juz — since AyahList,
 *    QCVerseByVerseView and QuranMushafPage all set these attributes).
 */
export function useAutoScrollAyah({ currentAyah, currentSurah, isPlaying }) {
  const debounceRef     = useRef(null);
  const observerRef     = useRef(null);
  const userScrolledRef = useRef(false);
  const resumeTimerRef  = useRef(null);
  const prevAyahRef     = useRef(null);

  // Listen for manual scrolling from the user
  useEffect(() => {
    const mainEl = document.getElementById('main-content');
    if (!mainEl) return;

    const onUserScroll = () => {
      userScrolledRef.current = true;
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        userScrolledRef.current = false;
      }, 5000);
    };

    mainEl.addEventListener('wheel',      onUserScroll, { passive: true });
    mainEl.addEventListener('touchmove',  onUserScroll, { passive: true });
    mainEl.addEventListener('pointerdown', onUserScroll, { passive: true });

    return () => {
      mainEl.removeEventListener('wheel',      onUserScroll);
      mainEl.removeEventListener('touchmove',  onUserScroll);
      mainEl.removeEventListener('pointerdown', onUserScroll);
      clearTimeout(resumeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Only scroll while audio is playing
    if (!isPlaying || !currentAyah) return;

    const ayahNum  = currentAyah.ayah;
    const surahNum = currentAyah.surah ?? currentSurah;
    if (!ayahNum || !surahNum) return;

    // Skip if same ayah as before (avoids double-scroll on re-renders)
    const ayahKey = `${surahNum}:${ayahNum}`;
    if (prevAyahRef.current === ayahKey) return;
    prevAyahRef.current = ayahKey;

    // Don't scroll if user recently scrolled manually
    if (userScrolledRef.current) return;

    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (userScrolledRef.current) return;

      // Find the element — prefer data attributes (works for all display modes)
      const el =
        document.querySelector(
          `[data-surah-number="${surahNum}"][data-ayah-number="${ayahNum}"]`,
        ) ||
        document.getElementById(`ayah-${ayahNum}`);

      if (!el) return;

      // Use IntersectionObserver to check visibility before scrolling
      observerRef.current?.disconnect();
      const observer = new IntersectionObserver(
        ([entry]) => {
          observer.disconnect();
          observerRef.current = null;
          if (!entry.isIntersecting) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        },
        {
          root: document.getElementById('main-content'),
          threshold: 0.5,
        },
      );
      observerRef.current = observer;
      observer.observe(el);
    }, 300);

    return () => {
      clearTimeout(debounceRef.current);
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [currentAyah, currentSurah, isPlaying]);

}
