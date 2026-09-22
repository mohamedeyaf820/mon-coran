import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Anchors of the reciting verse, most reliable first.
 *
 * `data-ayah-global` only means something inside one numbering space, and the
 * two riwayat use different ones: the Warsh mushaf emits its own 1..6214 legacy
 * row ids there (warshService page data) while a Warsh playlist carries the
 * hafs-keyed global number every audio CDN is keyed on. Anchoring on that first
 * would follow a neighbouring Warsh verse (off by one..twenty-two across the
 * mushaf). The surah+ayah pair is always in the numbering the reader displays —
 * Warsh numbers during Warsh playback, hafs numbers otherwise — so it wins, and
 * the global number stays the fallback for surfaces exposing nothing else.
 */
export function playingAyahSelectors(playingAyah, displayMode) {
  const { surah, ayah, globalNumber } = playingAyah || {};
  const ids =
    displayMode === "page"
      ? [ayah && `#ayah-${ayah}`]
      : displayMode === "juz"
        ? [globalNumber && `#ayah-${globalNumber}`, ayah && `#ayah-${ayah}`]
        : [ayah && `#ayah-${ayah}`, globalNumber && `#ayah-${globalNumber}`];

  return [
    surah && ayah && `[data-surah-number="${surah}"][data-ayah-number="${ayah}"]`,
    globalNumber && `[data-ayah-global="${globalNumber}"]`,
    displayMode === "surah" && ayah && `[data-ayah-number="${ayah}"]`,
    ...ids,
  ].filter(Boolean);
}

export function findPlayingAyahElement(root, playingAyah, displayMode) {
  if (!root || !playingAyah) return null;
  for (const selector of playingAyahSelectors(playingAyah, displayMode)) {
    const element = root.querySelector(selector);
    if (element) return element;
  }
  return null;
}

export default function useQuranDisplayScroll({
  ayahCount,
  contentRef,
  currentAyah,
  currentJuz,
  currentPage,
  currentPlayingAyah,
  currentSurah,
  displayMode,
  getScrollContainer,
  mushafLayout,
  pageNavigationSource = "navigate",
  riwaya,
}) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const followRetryTimerRef = useRef(null);
  const lastFollowKeyRef = useRef("");
  const showScrollTopRef = useRef(false);
  const userScrollUntilRef = useRef(0);

  const clearFollowRetryTimer = useCallback(() => {
    if (!followRetryTimerRef.current) return;
    window.clearTimeout(followRetryTimerRef.current);
    followRetryTimerRef.current = null;
  }, []);

  const resolvePlayingAyahElement = useCallback(
    (playingAyah) => findPlayingAyahElement(contentRef.current || document, playingAyah, displayMode),
    [displayMode],
  );

  useEffect(() => {
    const element = getScrollContainer();
    if (!element) return;

    let frameId = null;
    const progressBar = contentRef.current?.querySelector(".reading-progress-bar");
    const markManualScroll = () => {
      userScrollUntilRef.current = Date.now() + 2200;
    };
    const handleScroll = () => {
      if (frameId !== null) return;
      frameId = requestAnimationFrame(() => {
        const shouldShowScrollTop = element.scrollTop > 500;
        if (shouldShowScrollTop !== showScrollTopRef.current) {
          showScrollTopRef.current = shouldShowScrollTop;
          setShowScrollTop(shouldShowScrollTop);
        }
        const total = element.scrollHeight - element.clientHeight;
        if (progressBar) {
          const progress = total > 0 ? Math.min(1, Math.max(0, element.scrollTop / total)) : 0;
          progressBar.style.transform = `scaleX(${progress})`;
        }
        frameId = null;
      });
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    element.addEventListener("touchstart", markManualScroll, { passive: true });
    element.addEventListener("wheel", markManualScroll, { passive: true });
    element.addEventListener("pointerdown", markManualScroll, { passive: true });
    handleScroll();
    return () => {
      element.removeEventListener("scroll", handleScroll);
      element.removeEventListener("touchstart", markManualScroll);
      element.removeEventListener("wheel", markManualScroll);
      element.removeEventListener("pointerdown", markManualScroll);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [ayahCount, contentRef, displayMode, getScrollContainer]);

  useEffect(() => {
    // Continuous page reading updates the page from the scroll position:
    // resetting the scroll there would throw the reader back to the top.
    if (displayMode === "page" && pageNavigationSource === "scroll") return;
    getScrollContainer()?.scrollTo({ top: 0, behavior: "auto" });
  }, [currentJuz, currentPage, currentSurah, displayMode, getScrollContainer, pageNavigationSource]);

  // A layout or riwaya switch re-paginates the text: the old pixel position
  // means nothing in the new sheet, so reset even mid-stream, where the
  // scroll-source guard above deliberately never fires. The continuous page
  // stream repositions itself onto the page being read (usePageStream);
  // surah and juz content has no page anchor, so the top of the sheet is it.
  //
  // A list ⇄ mushaf switch is the exception worth anchoring: the verse being
  // read is known and exists in both sheets, and dropping the reader at verse 1
  // throws away where they were for no reason. A riwaya switch keeps the reset,
  // because verse 40 in Warsh is not verse 40 in Hafs.
  const repaginationRef = useRef(null);
  useEffect(() => {
    const key = `${mushafLayout}:${riwaya}`;
    if (repaginationRef.current === null) {
      repaginationRef.current = key;
      return;
    }
    if (repaginationRef.current === key) return;
    const keptRiwaya = repaginationRef.current.endsWith(`:${riwaya}`);
    repaginationRef.current = key;
    if (displayMode !== "page" && !(keptRiwaya && currentAyah > 1)) {
      getScrollContainer()?.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [currentAyah, displayMode, getScrollContainer, mushafLayout, riwaya]);

  useEffect(() => {
    if (
      !currentAyah ||
      Number(currentAyah) <= 1 ||
      ayahCount === 0 ||
      displayMode !== "surah"
    ) {
      return;
    }
    let cancelled = false;
    let observer = null;
    let discoveryTimer = null;
    let deadlineTimer = null;

    const stop = () => {
      observer?.disconnect();
      observer = null;
      if (discoveryTimer !== null) window.clearTimeout(discoveryTimer);
      if (deadlineTimer !== null) window.clearTimeout(deadlineTimer);
      discoveryTimer = null;
      deadlineTimer = null;
    };

    const align = () => {
      if (cancelled) return;
      if (Date.now() < userScrollUntilRef.current) return stop();
      const target = document.getElementById(`ayah-${currentAyah}`);
      if (!target) {
        // VirtualizedItem renders lazily; the observer covers growth, but a
        // still-empty sheet never resizes, so keep looking for a while.
        if (discoveryTimer === null) {
          discoveryTimer = window.setTimeout(() => {
            discoveryTimer = null;
            align();
          }, 95);
        }
        return;
      }
      target.scrollIntoView({ behavior: "auto", block: "center" });
    };

    const start = () => {
      if (cancelled) return;
      align();
      const content = contentRef.current;
      if (typeof ResizeObserver === "undefined" || !content) return;
      observer = new ResizeObserver(align);
      observer.observe(content);
      // The virtualized verses keep being re-measured for a moment, so the
      // sheet grows after each alignment. Follow it until it settles, then stop
      // rather than fighting wherever the reader has scrolled to.
      deadlineTimer = window.setTimeout(stop, 3_000);
    };

    const fontReady = document.fonts?.ready;
    if (fontReady && typeof fontReady.then === "function") {
      fontReady.then(start, start);
    } else {
      start();
    }

    return () => {
      cancelled = true;
      stop();
    };
    // mushafLayout is a dependency because switching sheet re-paginates the
    // verses: the anchor has to be sought again in the new sheet.
  }, [ayahCount, contentRef, currentAyah, displayMode, mushafLayout]);

  useEffect(() => {
    clearFollowRetryTimer();
    if (!currentPlayingAyah?.ayah && !currentPlayingAyah?.globalNumber) return;

    let attempts = 0;
    let stopped = false;
    const followKey = `${currentPlayingAyah?.surah || 0}:${currentPlayingAyah?.ayah || 0}:${currentPlayingAyah?.globalNumber || 0}`;
    const isNewAyah = followKey !== lastFollowKeyRef.current;
    if (isNewAyah) lastFollowKeyRef.current = followKey;

    const follow = () => {
      if (stopped) return;
      if (Date.now() < userScrollUntilRef.current) {
        clearFollowRetryTimer();
        return;
      }
      const target = resolvePlayingAyahElement(currentPlayingAyah);
      if (target) {
        const container = getScrollContainer();
        if (container) {
          const containerRect = container.getBoundingClientRect();
          const targetRect = target.getBoundingClientRect();
          const margin = Math.max(40, Math.min(120, containerRect.height * 0.14));
          const outOfView =
            targetRect.top < containerRect.top + margin ||
            targetRect.bottom > containerRect.bottom - margin;
          if (isNewAyah || outOfView) {
            target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          }
        }
        clearFollowRetryTimer();
        return;
      }

      attempts += 1;
      if (attempts >= 10) {
        clearFollowRetryTimer();
        return;
      }
      followRetryTimerRef.current = window.setTimeout(follow, 95);
    };

    followRetryTimerRef.current = window.setTimeout(follow, 0);
    return () => {
      stopped = true;
      clearFollowRetryTimer();
    };
  }, [
    ayahCount,
    clearFollowRetryTimer,
    currentPlayingAyah,
    currentSurah,
    displayMode,
    getScrollContainer,
    mushafLayout,
    resolvePlayingAyahElement,
  ]);

  useEffect(() => () => clearFollowRetryTimer(), [clearFollowRetryTimer]);

  return {
    scrollToTop: () => getScrollContainer()?.scrollTo({ top: 0, behavior: "smooth" }),
    showScrollTop,
  };
}
