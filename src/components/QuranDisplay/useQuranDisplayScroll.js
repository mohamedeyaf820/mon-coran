import { useCallback, useEffect, useRef, useState } from "react";

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
    (playingAyah) => {
      if (!playingAyah) return null;

      const root = contentRef.current || document;
      const selectors = [
        playingAyah.globalNumber ? `[data-ayah-global="${playingAyah.globalNumber}"]` : null,
        playingAyah.surah && playingAyah.ayah
          ? `[data-surah-number="${playingAyah.surah}"][data-ayah-number="${playingAyah.ayah}"]`
          : null,
        displayMode === "surah" && playingAyah.ayah
          ? `[data-ayah-number="${playingAyah.ayah}"]`
          : null,
      ].filter(Boolean);

      for (const selector of selectors) {
        const element = root.querySelector(selector);
        if (element) return element;
      }

      const ids =
        displayMode === "page"
          ? [`ayah-pg-${playingAyah.globalNumber}`, `ayah-${playingAyah.ayah}`]
          : displayMode === "juz"
            ? [`ayah-${playingAyah.globalNumber}`, `ayah-${playingAyah.ayah}`]
            : [`ayah-${playingAyah.ayah}`, `ayah-${playingAyah.globalNumber}`];

      return ids.filter(Boolean).map((id) => root.querySelector(`#${CSS.escape(id)}`)).find(Boolean) || null;
    },
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
    getScrollContainer()?.scrollTo({ top: 0, behavior: "auto" });
  }, [currentJuz, currentPage, currentSurah, getScrollContainer]);

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
    let correctionTimer = null;
    let frameId = null;

    const alignTarget = () => {
      if (cancelled) return;
      frameId = window.requestAnimationFrame(() => {
        const target = document.getElementById(`ayah-${currentAyah}`);
        if (!target) return;
        target.scrollIntoView({ behavior: "auto", block: "center" });
        correctionTimer = window.setTimeout(() => {
          if (!cancelled) {
            target.scrollIntoView({ behavior: "auto", block: "center" });
          }
        }, 220);
      });
    };

    const fontReady = document.fonts?.ready;
    if (fontReady && typeof fontReady.then === "function") {
      fontReady.then(alignTarget, alignTarget);
    } else {
      alignTarget();
    }

    return () => {
      cancelled = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (correctionTimer !== null) window.clearTimeout(correctionTimer);
    };
  }, [currentAyah, ayahCount, displayMode]);

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
