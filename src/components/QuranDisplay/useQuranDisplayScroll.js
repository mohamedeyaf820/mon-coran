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
  onInitialFocusAyah,
}) {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const followRetryTimerRef = useRef(null);
  const initialScrollAyahRef = useRef(currentAyah > 1 ? currentAyah : null);
  const lastFollowKeyRef = useRef("");

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

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setShowScrollTop(element.scrollTop > 500);
        const total = element.scrollHeight - element.clientHeight;
        if (total > 0) {
          document.documentElement.style.setProperty("--reading-progress", String(element.scrollTop / total));
        }
        ticking = false;
      });
    };

    element.addEventListener("scroll", handleScroll, { passive: true });
    return () => element.removeEventListener("scroll", handleScroll);
  }, [ayahCount, displayMode, getScrollContainer]);

  useEffect(() => {
    getScrollContainer()?.scrollTo({ top: 0, behavior: "auto" });
  }, [currentJuz, currentPage, currentSurah, getScrollContainer]);

  useEffect(() => {
    const targetAyah = initialScrollAyahRef.current;
    if (!targetAyah || ayahCount === 0 || displayMode !== "surah") return;
    initialScrollAyahRef.current = null;
    window.setTimeout(() => {
      document.getElementById(`ayah-${targetAyah}`)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      if (typeof onInitialFocusAyah === "function") onInitialFocusAyah(targetAyah);
    }, 120);
  }, [ayahCount, displayMode, onInitialFocusAyah]);

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
