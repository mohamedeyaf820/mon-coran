import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CleanPageView from "../Quran/CleanPageView";

const DEFAULT_PAGE_HEIGHT = "clamp(34rem, 82dvh, 58rem)";

function ayahSurahNumber(ayah, fallback) {
  return Number(ayah?.surah?.number || ayah?.surah || fallback || 1);
}

function VirtualizedMushafPages({
  activeAyah,
  calibration,
  currentAyah,
  currentPlayingAyah,
  fallbackSurah,
  getTranslation,
  isQCF4,
  lang,
  mode = "surah",
  onAyahClick,
  onOpenFullscreen,
  pageGroups = [],
  readingFontSize,
  riwaya,
  showTajwid,
  showTranslation,
  showTransliteration,
}) {
  const nodeRefs = useRef(new Map());
  const measuredHeights = useRef(new Map());
  const pinnedIndexesRef = useRef(new Set());
  const signature = pageGroups.map((group) => group.page).join(":");

  const getToggleId = useCallback(
    (ayah) => (mode === "surah" ? ayah.numberInSurah : ayah.number),
    [mode],
  );

  const handlePageDoubleClick = useCallback(
    (event) => {
      if (event.target.closest("button, a, input, select, textarea, [role='button']")) return;
      onOpenFullscreen?.();
    },
    [onOpenFullscreen],
  );

  const pinnedIndexes = useMemo(() => {
    const next = new Set();
    if (pageGroups.length) next.add(0);

    pageGroups.forEach((group, index) => {
      const hasTarget = group.ayahs.some((ayah) => {
        const toggleId = getToggleId(ayah);
        const isCurrent =
          mode === "surah" && Number(ayah.numberInSurah) === Number(currentAyah);
        const isActive = activeAyah != null && Number(toggleId) === Number(activeAyah);
        const isPlaying =
          Number(ayah.numberInSurah) === Number(currentPlayingAyah?.ayah) &&
          ayahSurahNumber(ayah, fallbackSurah) === Number(currentPlayingAyah?.surah);
        return isCurrent || isActive || isPlaying;
      });
      if (hasTarget) next.add(index);
    });
    return next;
  }, [activeAyah, currentAyah, currentPlayingAyah, fallbackSurah, getToggleId, mode, pageGroups]);

  const pinnedKey = [...pinnedIndexes].join(":");
  const [visibleIndexes, setVisibleIndexes] = useState(() => new Set([0]));

  useEffect(() => {
    pinnedIndexesRef.current = pinnedIndexes;
    setVisibleIndexes((previous) => {
      const next = new Set(previous);
      let changed = false;
      pinnedIndexes.forEach((index) => {
        if (!next.has(index)) {
          next.add(index);
          changed = true;
        }
      });
      return changed ? next : previous;
    });
  }, [pinnedIndexes, pinnedKey]);

  // Reset only when the loaded page collection changes. While scrolling or
  // listening, rendered pages remain mounted and keep their exact height.
  useEffect(() => {
    measuredHeights.current.clear();
    setVisibleIndexes(new Set([0, ...pinnedIndexesRef.current]));
  }, [signature]);

  const registerPage = useCallback((index, node) => {
    if (node) nodeRefs.current.set(index, node);
    else nodeRefs.current.delete(index);
  }, []);

  useEffect(() => {
    if (!pageGroups.length) return undefined;
    if (typeof IntersectionObserver !== "function") {
      setVisibleIndexes(new Set(pageGroups.map((_, index) => index)));
      return undefined;
    }
    const nodes = [...nodeRefs.current.values()];
    const root =
      nodes[0]?.closest(".app-main") ||
      nodes[0]?.closest(".app-main-shell") ||
      null;

    const observer = new IntersectionObserver(
      (entries) => {
        setVisibleIndexes((previous) => {
          const next = new Set(previous);
          let changed = false;
          for (const entry of entries) {
            const index = Number(entry.target.dataset.virtualPageIndex);
            const shouldRender = entry.isIntersecting || pinnedIndexesRef.current.has(index);
            if (shouldRender && !next.has(index)) {
              next.add(index);
              changed = true;
            }
          }
          return changed ? next : previous;
        });
      },
      { root, rootMargin: "1800px 0px", threshold: 0.01 },
    );

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver((entries) => {
            for (const entry of entries) {
              const index = Number(entry.target.dataset.virtualPageIndex);
              if (entry.contentRect.height > 120) {
                measuredHeights.current.set(index, entry.contentRect.height);
              }
            }
          })
        : null;

    nodes.forEach((node) => {
      observer.observe(node);
      resizeObserver?.observe(node);
    });

    return () => {
      observer.disconnect();
      resizeObserver?.disconnect();
    };
  }, [pageGroups, pageGroups.length, signature]);

  return pageGroups.map((group, index) => {
    const rendered = visibleIndexes.has(index);
    const measuredHeight = measuredHeights.current.get(index);
    const groupSurah = ayahSurahNumber(group.ayahs[0], fallbackSurah);

    return (
      <div
        key={`virtual-mushaf-${group.page}-${index}`}
        ref={(node) => registerPage(index, node)}
        className="virtual-mushaf-page"
        data-rendered={rendered ? "true" : "false"}
        data-virtual-page-index={index}
        data-virtualized-page="true"
        aria-hidden={rendered ? undefined : "true"}
        style={rendered ? undefined : { minHeight: measuredHeight || DEFAULT_PAGE_HEIGHT }}
        onDoubleClick={handlePageDoubleClick}
      >
        {rendered ? (
          <CleanPageView
            ayahs={group.ayahs}
            lang={lang}
            fontSize={readingFontSize}
            isQCF4={isQCF4}
            showTajwid={showTajwid}
            currentPlayingAyah={currentPlayingAyah}
            surahNum={groupSurah}
            calibration={calibration}
            riwaya={riwaya}
            showTranslation={showTranslation}
            getTranslation={getTranslation}
            onAyahClick={onAyahClick}
            activeAyah={activeAyah}
            getAyahToggleId={getToggleId}
            showSurahHeader
            showTransliteration={showTransliteration}
          />
        ) : null}
      </div>
    );
  });
}

export default memo(VirtualizedMushafPages);
