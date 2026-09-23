import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { preloadQuranDisplayData } from "./useQuranDisplayData";
import { getSurahVerseCountByRiwaya } from "../../constants/warshSource";
import { getPageTranslation } from "../../services/quranAPI";
import { t } from "../../i18n";
import { toast } from "../../lib/utils";
import {
  getTranslationKeyForAyah,
  getWarshTranslationKeyForAyah,
  isWarshNumberedAyah,
} from "./displayHelpers";

const LAST_PAGE = 604;
const MAX_PAGES = 8;

function findScrollParent(node) {
  let el = node?.parentElement;
  while (el && el !== document.body) {
    const { overflowY } = getComputedStyle(el);
    if (/(auto|scroll|overlay)/.test(overflowY) && el.scrollHeight > el.clientHeight) return el;
    el = el.parentElement;
  }
  return document.scrollingElement || document.documentElement;
}

/**
 * Continuous reading in page mode.
 *
 * Keeps a contiguous window of Mushaf pages around the page the reader
 * navigated to, appends the next page when the reader approaches the end of
 * the window, and prepends the previous page when they scroll back up (the
 * viewport is kept still while content is inserted above). The page in the
 * middle of the viewport is reported so the reading position, header and
 * sidebar follow the reader without any page-turn control.
 */
export default function usePageStream({
  ayahs,
  currentJuz,
  currentPage,
  currentSurah,
  fallbackGetTranslation,
  lang,
  onVisiblePage,
  repaginationKey,
  riwaya,
  showTranslation = false,
  translationLangs,
  warshStrictMode,
}) {
  const [window_, setWindow] = useState(() => ({
    start: currentPage,
    end: currentPage,
    pages: new Map([[currentPage, ayahs]]),
  }));
  // Pages stream automatically inside a surah. When the last loaded page
  // closes a surah, the stream pauses and the reader chooses to continue
  // (the pattern quran.com uses at the end of a surah).
  const [continuedPast, setContinuedPast] = useState(0);
  // Translations per streamed page. The app only holds the current page's
  // translations, so pages above and below would otherwise render an empty
  // panel that fills in later and moves the text under the reader.
  const [translationsByPage, setTranslationsByPage] = useState(() => new Map());
  const translationLoadsRef = useRef(new Set());
  const loadTranslations = useCallback(
    (page) => {
      if (!showTranslation || !translationLangs?.length || translationLoadsRef.current.has(page)) return;
      translationLoadsRef.current.add(page);
      getPageTranslation(page, translationLangs)
        .then((editions) => {
          if (!Array.isArray(editions) || !editions.length) return;
          setTranslationsByPage((current) => {
            const next = new Map(current);
            next.set(page, editions);
            return next;
          });
        })
        .catch(() => translationLoadsRef.current.delete(page));
    },
    [showTranslation, translationLangs],
  );
  useEffect(() => {
    translationLoadsRef.current.clear();
    setTranslationsByPage(new Map());
  }, [showTranslation, translationLangs]);
  useEffect(() => {
    for (let page = window_.start; page <= window_.end; page += 1) loadTranslations(page);
  }, [loadTranslations, window_.start, window_.end]);
  const translationMap = useMemo(() => {
    const map = new Map();
    translationsByPage.forEach((editions) => {
      editions.forEach((edition) => {
        // A Warsh-adapted edition numbers the mushaf the Warsh way: keep its
        // verses out of the Hafs namespace (see displayHelpers).
        const isWarshEdition =
          edition.riwaya === "warsh" || edition.edition?.riwaya === "warsh";
        (edition.ayahs || []).forEach((translation) => {
          const surahNumber = translation.surah?.number;
          const ayahKey = surahNumber
            ? isWarshEdition
              ? getWarshTranslationKeyForAyah(surahNumber, translation.numberInSurah)
              : getTranslationKeyForAyah(surahNumber, translation.numberInSurah)
            : null;
          if (ayahKey) map.set(ayahKey, [...(map.get(ayahKey) || []), translation]);
          if (typeof translation.number === "number") {
            const globalKey = `global:${translation.number}`;
            map.set(globalKey, [...(map.get(globalKey) || []), translation]);
          }
        });
      });
    });
    return map;
  }, [translationsByPage]);
  const getTranslationForAyah = useCallback(
    (ayah) => {
      const surahNumber = ayah.surah?.number || currentSurah;
      const matched = [];

      if (isWarshNumberedAyah(ayah)) {
        const warshEditions = translationMap.get(
          getWarshTranslationKeyForAyah(surahNumber, ayah.numberInSurah),
        );
        if (warshEditions) matched.push(...warshEditions);
      }

      const hafsNumbers = ayah?.hafsNumbers;
      if (Array.isArray(hafsNumbers) && hafsNumbers.length > 0) {
        for (const hafsNumber of hafsNumbers) {
          const found = translationMap.get(
            getTranslationKeyForAyah(surahNumber, hafsNumber),
          );
          if (found) matched.push(...found);
        }
        if (matched.length) return matched;
      }

      const direct =
        translationMap.get(`global:${ayah.number}`) ||
        translationMap.get(getTranslationKeyForAyah(surahNumber, ayah.numberInSurah));

      if (direct) return [...matched, ...direct];
      return matched.length ? matched : fallbackGetTranslation?.(ayah) || null;
    },
    [currentSurah, fallbackGetTranslation, translationMap],
  );
  const loadingRef = useRef(new Set());
  // A page that already announced its failure: scrolling back and forth must
  // not repeat the same offline toast.
  const failedStreamRef = useRef(new Set());
  const rootRef = useRef(null);
  // Anchor used to keep the viewport still when content changes above it:
  // the first page that stays in the window and its position before the
  // update. After render the same page is put back at that position.
  const pendingAdjustRef = useRef(null);
  const anchorOn = (page) => {
    const section = rootRef.current?.querySelector(`[data-stream-page="${page}"]`);
    if (!section) return;
    pendingAdjustRef.current = {
      scroller: findScrollParent(rootRef.current),
      page,
      top: section.getBoundingClientRect().top,
    };
  };
  const visiblePageRef = useRef(currentPage);

  // A navigation outside the window (sidebar, URL, search) restarts the
  // stream at that page. Scrolling only ever reports pages already in it.
  useEffect(() => {
    setWindow((current) => {
      if (current.pages.has(currentPage)) {
        if (current.pages.get(currentPage) === ayahs || !ayahs?.length) return current;
        const pages = new Map(current.pages);
        pages.set(currentPage, ayahs);
        return { ...current, pages };
      }
      loadingRef.current.clear();
      return { start: currentPage, end: currentPage, pages: new Map([[currentPage, ayahs]]) };
    });
  }, [ayahs, currentPage]);

  // A layout or riwaya switch re-paginates every sheet: pages still loaded
  // above the one being read would keep anchoring the viewport to content the
  // new pagination no longer places there, so the window restarts at the
  // current page and the reader is repositioned onto its top. The alignment
  // keeps re-asserting while the new layout (and its fonts) resize under it,
  // and yields the moment the reader takes over with a gesture of their own.
  const prevRepaginationRef = useRef(repaginationKey);
  const repagAlignRef = useRef(false);
  const currentPageRef = useRef(currentPage);
  currentPageRef.current = currentPage;
  useEffect(() => {
    if (prevRepaginationRef.current === repaginationKey) return undefined;
    prevRepaginationRef.current = repaginationKey;
    const page = currentPageRef.current;
    setWindow((current) => {
      if (current.start >= page) return current;
      if (!current.pages.has(page)) return current;
      const pages = new Map(current.pages);
      for (let p = current.start; p < page; p += 1) pages.delete(p);
      return { start: page, end: current.end, pages };
    });
    repagAlignRef.current = true;
    const cancelAlign = () => {
      repagAlignRef.current = false;
    };
    let frame = 0;
    let stable = 0;
    let attempts = 0;
    const align = () => {
      frame = 0;
      if (!repagAlignRef.current) return;
      const root = rootRef.current;
      const scroller = root && findScrollParent(root);
      const section = root?.querySelector(`[data-stream-page="${currentPageRef.current}"]`);
      if (!scroller || !section) {
        if (++attempts > 120) cancelAlign();
        else frame = window.requestAnimationFrame(align);
        return;
      }
      const offset = section.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
      if (Math.abs(offset) > 1) {
        scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + Math.round(offset)), behavior: "auto" });
        stable = 0;
      } else {
        stable += 1;
      }
      attempts += 1;
      if (stable >= 3 || attempts > 240) cancelAlign();
      else frame = window.requestAnimationFrame(align);
    };
    frame = window.requestAnimationFrame(align);
    window.addEventListener("wheel", cancelAlign, { once: true, passive: true });
    window.addEventListener("touchstart", cancelAlign, { once: true, passive: true });
    return () => {
      cancelAlign();
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("wheel", cancelAlign);
      window.removeEventListener("touchstart", cancelAlign);
    };
  }, [repaginationKey]);

  const fetchPage = useCallback(
    (page) =>
      preloadQuranDisplayData({
        currentJuz,
        currentPage: page,
        currentSurah,
        displayMode: "page",
        lang,
        riwaya,
        warshStrictMode,
      }).then((result) => result?.ayahs || []),
    [currentJuz, currentSurah, lang, riwaya, warshStrictMode],
  );

  const lastAyah = (() => {
    const lastPage = window_.pages.get(window_.end);
    return lastPage?.length ? lastPage[lastPage.length - 1] : null;
  })();
  const lastSurah = Number(lastAyah?.surah?.number || lastAyah?.surah || 0);
  const endsSurah =
    Boolean(lastAyah) &&
    Number(lastAyah.numberInSurah) >=
      getSurahVerseCountByRiwaya(lastSurah, riwaya) &&
    window_.end < LAST_PAGE;
  const pausedAtSurah = endsSurah && continuedPast !== window_.end;

  // An unreachable leaf must not look like the end of the Quran: say once per
  // page that the stream stopped for a network reason, keep the retry live.
  const announceStreamFailure = useCallback(
    (page) => {
      if (failedStreamRef.current.has(page)) return;
      failedStreamRef.current.add(page);
      toast(t("errors.network", lang), "error");
    },
    [lang],
  );

  const loadNext = useCallback(() => {
    const page = window_.end + 1;
    if (page > LAST_PAGE || loadingRef.current.has(page)) return;
    if (pausedAtSurah) return;
    loadingRef.current.add(page);
    fetchPage(page)
      .then((pageAyahs) => {
        if (!pageAyahs.length) {
          announceStreamFailure(page);
          return;
        }
        failedStreamRef.current.delete(page);
        setWindow((current) => {
          if (page !== current.end + 1) return current;
          const pages = new Map(current.pages);
          pages.set(page, pageAyahs);
          let start = current.start;
          // Bound the window: drop the farthest pages above, keeping the
          // viewport anchored on the first page that stays.
          while (page - start + 1 > MAX_PAGES) {
            pages.delete(start);
            start += 1;
          }
          if (start !== current.start) anchorOn(start);
          return { start, end: page, pages };
        });
      })
      .catch(() => {
        announceStreamFailure(page);
      })
      .finally(() => loadingRef.current.delete(page));
  }, [announceStreamFailure, fetchPage, pausedAtSurah, window_.end]);

  const continueStream = useCallback(() => {
    setContinuedPast(window_.end);
  }, [window_.end]);

  useEffect(() => {
    if (continuedPast === window_.end && !pausedAtSurah) loadNext();
  }, [continuedPast, loadNext, pausedAtSurah, window_.end]);

  const loadPrevious = useCallback(() => {
    const page = window_.start - 1;
    if (page < 1 || loadingRef.current.has(page)) return;
    loadingRef.current.add(page);
    fetchPage(page)
      .then((pageAyahs) => {
        if (!pageAyahs.length) {
          announceStreamFailure(page);
          return;
        }
        failedStreamRef.current.delete(page);
        setWindow((current) => {
          if (page !== current.start - 1) return current;
          anchorOn(current.start);
          const pages = new Map(current.pages);
          pages.set(page, pageAyahs);
          let end = current.end;
          // Bound the window: drop the farthest page below.
          while (end - page + 1 > MAX_PAGES) {
            pages.delete(end);
            end -= 1;
          }
          return { start: page, end, pages };
        });
      })
      .catch(() => {
        announceStreamFailure(page);
      })
      .finally(() => loadingRef.current.delete(page));
  }, [announceStreamFailure, fetchPage, window_.start]);

  // Keep the reader's viewport still when content changes above it.
  useLayoutEffect(() => {
    const pending = pendingAdjustRef.current;
    if (!pending) return;
    pendingAdjustRef.current = null;
    // While a repagination alignment owns the viewport, its anchors are
    // stale: restoring them would yank the reader off the page top.
    if (repagAlignRef.current) return;
    const section = rootRef.current?.querySelector(`[data-stream-page="${pending.page}"]`);
    if (!section) return;
    const delta = section.getBoundingClientRect().top - pending.top;
    if (delta !== 0) pending.scroller.scrollTop = Math.max(0, pending.scroller.scrollTop + delta);
  }, [window_.start, window_.end]);

  // Sentinels: load ahead well before the reader reaches the edge.
  const bottomRef = useRef(null);
  const topRef = useRef(null);
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return undefined;
    const bottom = bottomRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) loadNext();
      },
      { rootMargin: "0px 0px 1400px 0px" },
    );
    if (bottom) observer.observe(bottom);
    return () => observer.disconnect();
  }, [loadNext]);

  // The previous page is fetched only while the reader scrolls up close to
  // the top of the window, one page per upward gesture, never on mount.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const scroller = findScrollParent(root);
    const target = scroller === document.scrollingElement || scroller === document.documentElement ? window : scroller;
    let lastTop = scroller.scrollTop;
    const onScroll = () => {
      const top = scroller.scrollTop;
      const movingUp = top < lastTop;
      lastTop = top;
      // The alignment's own upward jumps are not the reader scrolling back.
      if (!movingUp || repagAlignRef.current) return;
      const rootTop = root.getBoundingClientRect().top;
      if (rootTop > -500) loadPrevious();
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    return () => target.removeEventListener("scroll", onScroll);
  }, [loadPrevious]);

  // Report the page that contains the middle of the viewport. A single
  // point maps to exactly one page, so the position can never oscillate
  // between two pages (which would flood history.pushState).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const scroller = findScrollParent(root);
    const target = scroller === document.scrollingElement || scroller === document.documentElement ? window : scroller;
    let frame = 0;
    const measure = () => {
      frame = 0;
      // During a repagination alignment the transient heights are noise:
      // the page being read is the one the alignment is pinning.
      if (repagAlignRef.current) return;
      const middle = window.innerHeight / 2;
      const sections = root.querySelectorAll("[data-stream-page]");
      for (const section of sections) {
        const rect = section.getBoundingClientRect();
        if (rect.top <= middle && rect.bottom >= middle) {
          const page = Number(section.getAttribute("data-stream-page"));
          if (page && page !== visiblePageRef.current) {
            visiblePageRef.current = page;
            onVisiblePage?.(page);
          }
          break;
        }
      }
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    target.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      target.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [onVisiblePage]);

  // A navigation (not a scroll) moves the reader: follow it.
  useEffect(() => {
    if (window_.pages.size === 1) visiblePageRef.current = currentPage;
  }, [currentPage, window_.pages]);

  const pages = [];
  for (let page = window_.start; page <= window_.end; page += 1) {
    const pageAyahs = window_.pages.get(page);
    if (pageAyahs?.length) pages.push({ page, ayahs: pageAyahs });
  }

  return {
    pages,
    rootRef,
    topRef,
    bottomRef,
    hasPrevious: window_.start > 1,
    hasNext: window_.end < LAST_PAGE,
    pausedAtSurah,
    endedSurah: pausedAtSurah ? lastSurah : null,
    continueStream,
    getTranslationForAyah,
  };
}
