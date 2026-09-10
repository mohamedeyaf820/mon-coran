import { useCallback, useEffect, useRef, useState, useContext } from "react";
import { useScrollContext } from "../../context/ScrollContext";

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
}) {
  const { markManualScroll, scrollToElement, userScrollUntilRef, isUserScrolling } = useScrollContext();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const followRetryTimerRef = useRef(null);
  const lastFollowKeyRef = useRef("");
  const showScrollTopRef = useRef(false);
  const userScrollUntilRefLocal = useRef(0);

  const clearFollowRetryTimer = useCallback(() => {
    if (!followRetryTimerRef.current) return;
    window.clearTimeout(followRetryTimerRef.current);
    followRetryTimerRef.current = null;
  }, []);

  const resolvePlayingAyahElement = useCallback(
    (playingAyah) => {
      if (!playingAyah) return null;
      const { surah, ayah, globalNumber } = playingAyah;
      const elByNumber = document.getElementById(`ayah-${ayah}`);
      const elByGlobal = document.getElementById(`ayah-${globalNumber}`);
      if (elByNumber) return elByNumber;
      if (elByGlobal) return elByGlobal;
      return document.querySelector(`[data-surah="${surah}"][data-ayah="${ayah}"]`);
    },
    []
  );

  useEffect(() => {
    const element = getScrollContainer();
    if (!element) return;

    let frameId = null;
    const progressBar = contentRef.current?.querySelector(".reading-progress-bar");
    const handleScroll = () => {
      markManualScroll();
      if (frameId !== null) return;
      frameId = requestAnimationFrame(() => {
        frameId = null;
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

    const handleTouchStart = () => markManualScroll();
    const handleWheel = () => markManualScroll();
    const handlePointerDown = () => markManualScroll();

    element.addEventListener("scroll", handleScroll, { passive: true });
    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("wheel", handleWheel, { passive: true });
    element.addEventListener("pointerdown", handlePointerDown, { passive: true });
    handleScroll();
    return () => {
      element.removeEventListener("scroll", handleScroll);
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("wheel", handleWheel);
      element.removeEventListener("pointerdown", handlePointerDown);
      if (frameId !== null) cancelAnimationFrame(frameId);
    };
  }, [ayahCount, contentRef, displayMode, getScrollContainer, markManualScroll]);

const scrollToTop = useCallback(() => {
    const container = getScrollContainer();
    if (container) {
      container.scrollTo({ top: 0, behavior: "auto" });
      container.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [getScrollContainer]);

  const navigationKey = `${displayMode}:${displayMode === "page" ? currentPage : displayMode === "juz" ? currentJuz : currentSurah}`;
  useEffect(() => {
    if (displayMode === "page" && pageNavigationSource === "scroll") return;
    const container = getScrollContainer();
    if (container) {
      container.scrollTo({ top: 0, behavior: "auto" });
      container.scrollTop = 0;
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }, [navigationKey, displayMode, getScrollContainer, pageNavigationSource]);

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

    const alignTarget = (attempt = 0) => {
      if (cancelled) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        const target = document.getElementById(`ayah-${currentAyah}`);
        if (!target) {
          if (attempt < 12) {
            correctionTimer = window.setTimeout(() => alignTarget(attempt + 1), 95);
          }
          return;
        }
        scrollToElement(target);
        correctionTimer = window.setTimeout(() => {
          if (!cancelled && target.isConnected && Date.now() >= userScrollUntilRef.current) {
            scrollToElement(target);
          }
        }, 220);
      });
    };

    alignTarget();

    return () => {
      cancelled = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      if (correctionTimer !== null) window.clearTimeout(correctionTimer);
    };
  }, [currentAyah, ayahCount, displayMode, scrollToElement, userScrollUntilRef]);

  useEffect(() => {
    clearFollowRetryTimer();
    if (!currentPlayingAyah?.ayah && !currentPlayingAyah?.globalNumber) return;

    let attempts = 0;
    let stopped = false;
    const followKey = `${currentPlayingAyah?.surah || 0}:${currentPlayingAyah?.ayah || 0}:${currentPlayingAyah?.globalNumber || 0}`;
    const isNewAyah = followKey !== lastFollowKeyRef.current;
    if (isNewAyah) lastFollowKeyRef.current = followKey;

    const follow = () => {
      if (stopped || isUserScrolling) return;
      if (Date.now() < userScrollUntilRef.current) {
        clearFollowRetryTimer();
        return;
      }
      const target = resolvePlayingAyahElement(currentPlayingAyah);
      if (target) {
        scrollToElement(target);
        clearFollowRetryTimer();
        return;
      }

      attempts += 1;
      if (attempts >= 10) {
        clearFollowRetryTimer();
        return;
      }

      followRetryTimerRef.current = window.setTimeout(follow, 250);
    };

    follow();
    return () => {
      stopped = true;
      clearFollowRetryTimer();
    };
  }, [
    currentPlayingAyah,
    isUserScrolling,
    userScrollUntilRef,
    clearFollowRetryTimer,
    resolvePlayingAyahElement,
    scrollToElement,
  ]);

  return { showScrollTop, scrollToTop };
}