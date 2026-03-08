import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import {
  getSurahFull,
  getPageFull,
  getPage,
  getPageTranslation,
  getJuz,
  getJuzTranslation,
  getSurahText,
  getSurahTranslation,
  wasWarshTextFallback,
  abortPendingRequests,
  clearCache,
} from "../services/quranAPI";
import { savePosition } from "../services/storageService";
import { logSession } from "../services/historyService";
import { logWirdProgress } from "../services/wirdService";
import { stripBasmala } from "../utils/quranUtils";
import { toAr, getSurah } from "../data/surahs";
import { getJuzForAyah, HIZB_DATA } from "../data/juz";
import audioService from "../services/audioService";
import {
  ensureReciterForRiwaya,
  getDefaultReciterId,
  getReciter,
} from "../data/reciters";
import {
  getFontFamily,
  getWarshSurahFormatted,
  getWarshJuzVerses,
  preloadWarshSurah,
  loadWarshData,
  loadFontsForVerses,
} from "../services/warshService";
import { getKaraokeCalibration } from "../utils/karaokeUtils";
import { markRead } from "../services/readingProgressService";

// New sub-components
import Bismillah from "./Quran/Bismillah";
import SurahHeader from "./Quran/SurahHeader";
import TajweedLegend from "./Quran/TajweedLegend";
import SmartAyahRenderer from "./Quran/SmartAyahRenderer";
import AyahBlock from "./Quran/AyahBlock";
import MushafInlineView from "./Quran/MushafInlineView";

import "../styles/quran-display.css";

/* ── Surah chunking threshold ──
   Surahs with more than this many ayahs are split into Hizb-based chunks.
   Surahs at or below this are always rendered in full (no pagination). */
const LONG_SURAH_THRESHOLD = 50;

/**
 * Build ordered chunk boundaries for a surah using HIZB_DATA.
 * Each chunk spans [startAyah, endAyah] (1-indexed, inclusive).
 * Short surahs → single chunk covering the whole surah.
 * Long surahs → one chunk per hizb that falls inside this surah.
 */
function buildSurahChunks(surahNum, totalAyahs, lang = "fr") {
  if (totalAyahs <= LONG_SURAH_THRESHOLD) {
    return [{ start: 1, end: totalAyahs, label: null }];
  }

  // Collect hizb start positions that fall inside this surah
  const starts = [1];
  for (const h of HIZB_DATA) {
    if (h.start.s === surahNum && h.start.a > 1) {
      starts.push(h.start.a);
    }
  }
  // Deduplicate and sort
  const unique = [...new Set(starts)].sort((a, b) => a - b);

  return unique.map((start, i) => {
    const end = i + 1 < unique.length ? unique[i + 1] - 1 : totalAyahs;
    const hizbEntry = HIZB_DATA.find(
      (h) => h.start.s === surahNum && h.start.a === start,
    );
    const label = hizbEntry
      ? `${t("sidebar.hizb", lang)} ${hizbEntry.hizb}`
      : null;
    return { start, end, label };
  });
}

function getTranslationKeyForAyah(surahNumber, ayahNumber) {
  if (!surahNumber || !ayahNumber) return null;
  return `surah:${surahNumber}:${ayahNumber}`;
}

/* ── Font family mapping ── */
const FONT_MAP = {
  /* ── Scheherazade New (recommended — no black-dot rendering artifacts) ── */
  "scheherazade-new":
    "'Scheherazade New','Amiri Quran','Noto Naskh Arabic',serif",
  /* ── Amiri Quran (clean alternative) ── */
  "amiri-quran":
    "'Amiri Quran','Scheherazade New','Noto Naskh Arabic',serif",
  /* ── KFGQPC / ME Quran (may show rendering artifacts in some browsers) ── */
  "mushaf-1441h":
    "'KFGQPC Uthmanic Script HAFS','ME Quran','Scheherazade New','Amiri Quran',serif",
  "mushaf-tajweed":
    "'KFGQPC Uthmanic Script HAFS','ME Quran','Scheherazade New','Amiri Quran',serif",
  "uthmanic-digital":
    "'ME Quran','Scheherazade New','Amiri Quran',serif",
  "uthmanic-bold":
    "'ME Quran Bold','ME Quran','Scheherazade New',serif",
  /* ── Indopak ── */
  "qalam-madinah":
    "'Qalam Madinah','Scheherazade New','Noto Naskh Arabic',serif",
  "qalam-hanafi":
    "'Qalam Hanafi','Scheherazade New','Noto Naskh Arabic',serif",
  "uthman-taha":
    "'Uthman Taha Hafs','KFGQPC Uthmanic Script HAFS','Scheherazade New',serif",
  /* ── legacy aliases ── */
  "me-quran":
    "'ME Quran','Scheherazade New','Amiri Quran',serif",
  scheherazade:
    "'Scheherazade New','Amiri Quran','Noto Naskh Arabic',serif",
  "amiri": "'Amiri','Amiri Quran','Scheherazade New',serif",
  "noto-naskh": "'Noto Naskh Arabic','Scheherazade New','Amiri Quran',serif",
  lateef: "'Scheherazade New','Noto Naskh Arabic',serif",
  "noto-naskh-arabic": "'Noto Naskh Arabic','Scheherazade New','Amiri Quran',serif",
  "markazi-text": "'Markazi Text','Amiri Quran','Scheherazade New',serif",
  "el-messiri": "'El Messiri','Noto Naskh Arabic','Scheherazade New',serif",
  "kfgqpc-uthman-taha-naskh": "'KFGQPC Uthman Taha Naskh','Uthman Taha Hafs','ME Quran',serif",
  "reem-kufi": "'Reem Kufi','Cairo','Noto Naskh Arabic',sans-serif",
  "aref-ruqaa": "'Aref Ruqaa','Scheherazade New','Amiri Quran',serif",
  cairo: "'Cairo','Noto Naskh Arabic',sans-serif",
  harmattan: "'Harmattan','Cairo',sans-serif",
  mada: "'Mada','Cairo',sans-serif",
  tajawal: "'Tajawal','Cairo',sans-serif",
  lemonada: "'Lemonada','Cairo',sans-serif",
  jomhuria: "'Jomhuria','Cairo',sans-serif",
  rakkas: "'Rakkas','Cairo',sans-serif",
  marhey: "'Marhey','Cairo',sans-serif",
  mirza: "'Mirza','Lateef',serif",
};

const TRANSLATION_LANGUAGE_META = {
  fr: { fr: 'Français', ar: 'الفرنسية', en: 'French', icon: 'fa-language' },
  en: { fr: 'Anglais', ar: 'الإنجليزية', en: 'English', icon: 'fa-language' },
  es: { fr: 'Espagnol', ar: 'الإسبانية', en: 'Spanish', icon: 'fa-language' },
  de: { fr: 'Allemand', ar: 'الألمانية', en: 'German', icon: 'fa-language' },
  tr: { fr: 'Turc', ar: 'التركية', en: 'Turkish', icon: 'fa-language' },
  ur: { fr: 'Ourdou', ar: 'الأردية', en: 'Urdu', icon: 'fa-language' },
};

/* ═══════════════════════════════════════════════════ */
/*  Main QuranDisplay                                  */
/* ═══════════════════════════════════════════════════ */
export default function QuranDisplay() {
  const { state, dispatch, set } = useApp();
  const {
    displayMode,
    mushafLayout,
    currentSurah,
    currentAyah,
    currentPage,
    riwaya,
    translationLang,
    wordTranslationLang,
    lang,
    fontSize,
    fontFamily,
    showTranslation,
    showTajwid,
    showWordByWord,
    showTransliteration,
    showWordTranslation,
    currentPlayingAyah,
    loading,
    currentJuz,
    continuousPlay,
    warshStrictMode,
    syncOffsetsMs,
    memMode,
  } = state;

  const quranFontCss = FONT_MAP[fontFamily] || FONT_MAP["scheherazade-new"];
  const effectiveReciterId = ensureReciterForRiwaya(state.reciter, riwaya);
  const syncKey = `${riwaya}:${effectiveReciterId}`;
  const userSyncOffsetMs = Math.max(
    -500,
    Math.min(500, Number(syncOffsetsMs?.[syncKey] ?? 0)),
  );
  const karaokeCalibration = useMemo(() => {
    const base = getKaraokeCalibration(effectiveReciterId, riwaya);
    return {
      ...base,
      offsetSec: (base.offsetSec ?? 0.15) + userSyncOffsetMs / 1000,
    };
  }, [effectiveReciterId, riwaya, userSyncOffsetMs]);

  const [ayahs, setAyahs] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [error, setError] = useState(null);
  const [sourceEdition, setSourceEdition] = useState("");
  const [isWarshFallback, setIsWarshFallback] = useState(false);
  const [isQCF4, setIsQCF4] = useState(false);
  const contentRef = useRef(null);
  const readingStartRef = useRef(Date.now());
  const continuousAutoPlayRef = useRef(false);
  const [activeAyah, setActiveAyah] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [fullPage, setFullPage] = useState(false);
  // Surah chunk navigation for long surahs
  const [chunkIndex, setChunkIndex] = useState(0);
  const [mushafPageIndex, setMushafPageIndex] = useState(0);

  // Close fullPage overlay on Escape key
  useEffect(() => {
    if (!fullPage) return;
    const handler = (e) => { if (e.key === "Escape") setFullPage(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [fullPage]);

  // Reset chunk to 0 whenever the surah changes
  useEffect(() => {
    setChunkIndex(0);
  }, [currentSurah]);

  useEffect(() => {
    setMushafPageIndex(0);
  }, [currentSurah, displayMode, mushafLayout, riwaya]);

  // Track reading progress
  useEffect(() => {
    if (!state.showHome && currentSurah && currentAyah && displayMode === 'surah') {
      markRead(currentSurah, currentAyah);
    }
  }, [currentSurah, currentAyah, state.showHome, displayMode]);

  // Stable toggle callback — prevents re-creating closures per ayah
  const toggleActiveRef = useRef(null);
  toggleActiveRef.current = activeAyah;
  const toggleAyah = useCallback((id) => {
    setActiveAyah((prev) => (prev === id ? null : id));
  }, []);

  // Memoized style object for ayahs container (avoid new object per render)
  const ayahsContainerStyle = useMemo(
    () => ({
      fontSize: `${fontSize}px`,
      fontFamily: isQCF4 ? undefined : quranFontCss,
    }),
    [fontSize, isQCF4, quranFontCss],
  );

  // Stable signature for audio playlist to avoid unnecessary reloads when only
  // non-audio fields (e.g. hafsText enrichment) change.
  const audioPlaylistKey = useMemo(() => {
    if (!Array.isArray(ayahs) || ayahs.length === 0) return "";
    return ayahs
      .map(
        (a) =>
          `${a.surah?.number || currentSurah}:${a.numberInSurah}:${a.number}`,
      )
      .join("|");
  }, [ayahs, currentSurah]);

  // Sync selected font to CSS variables so .ayah-text-ar picks it up
  useEffect(() => {
    if (isQCF4) return; // QCF4 uses per-word font faces, not the variable
    document.documentElement.style.setProperty("--font-quran", quranFontCss);
    document.documentElement.style.setProperty("--font-quran-tajweed", quranFontCss);
  }, [quranFontCss, isQCF4]);

  /* ── Track scroll for back-to-top button (throttled) ── */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    let ticking = false;
    const handler = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setShowScrollTop(el.scrollTop > 500);
          ticking = false;
        });
      }
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, []);

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const repairPlatform = useCallback(async () => {
    try {
      await clearCache();
      if ("serviceWorker" in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      localStorage.removeItem("mushaf-plus-settings");
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }, []);

  // Removed old visibleAyahCount reset

  /* ── Continuous play: auto-advance to next surah/juz when playlist ends ── */
  useEffect(() => {
    if (!continuousPlay) return;
    const unsubEnd = audioService.addEndListener(() => {
      // Playlist ended, auto-navigate to next
      if (displayMode === "surah" && currentSurah < 114) {
        continuousAutoPlayRef.current = true;
        dispatch({
          type: "NAVIGATE_SURAH",
          payload: { surah: currentSurah + 1, ayah: 1 },
        });
      } else if (displayMode === "juz" && currentJuz < 30) {
        continuousAutoPlayRef.current = true;
        dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz + 1 } });
      } else if (displayMode === "page" && currentPage < 604) {
        continuousAutoPlayRef.current = true;
        set({ currentPage: currentPage + 1 });
      }
    });
    return unsubEnd;
  }, [
    continuousPlay,
    displayMode,
    currentSurah,
    currentJuz,
    currentPage,
    dispatch,
    set,
  ]);

  useEffect(() => {
    if (!continuousPlay) {
      continuousAutoPlayRef.current = false;
    }
  }, [continuousPlay]);

  /* ── Load audio playlist when ayahs or reciter/riwaya change ── */
  useEffect(() => {
    if (ayahs.length === 0 || !state.reciter) return;
    // Use safeReciterId directly — AudioPlayer's own effect already writes
    // the corrected value back to state, so we must NOT do it here too or
    // we create a set() → state.reciter change → effect re-fires loop.
    const safeReciterId = ensureReciterForRiwaya(state.reciter, riwaya);
    const rec = getReciter(safeReciterId, riwaya);
    if (rec) {
      if (
        riwaya === "warsh" &&
        warshStrictMode &&
        !String(rec.cdn || "")
          .toLowerCase()
          .includes("warsh")
      ) {
        setError(t("errors.warshStrict", lang));
        return;
      }
      const playlistAyahs = ayahs.map((a) => ({
        surah: a.surah?.number || currentSurah,
        numberInSurah: a.numberInSurah,
        number: a.number,
        text: a.text,
      }));
      audioService.loadPlaylist(
        playlistAyahs,
        rec.cdn,
        rec.cdnType || "islamic",
      );
      if (continuousAutoPlayRef.current && continuousPlay) {
        continuousAutoPlayRef.current = false;
        audioService.play();
      }
    }
  }, [
    audioPlaylistKey,
    state.reciter,
    riwaya,
    currentSurah,
    warshStrictMode,
    continuousPlay,
  ]);

  /* ── Auto-scroll to playing ayah ───────────── */
  useEffect(() => {
    if (!currentPlayingAyah?.ayah) return;
    const ids =
      displayMode === "juz"
        ? [`ayah-${currentPlayingAyah.globalNumber || currentPlayingAyah.ayah}`]
        : displayMode === "page"
          ? [
            `ayah-pg-${currentPlayingAyah.globalNumber || currentPlayingAyah.ayah}`,
            `ayah-${currentPlayingAyah.ayah}`,
          ]
          : [`ayah-${currentPlayingAyah.ayah}`];
    const el = ids.map((id) => document.getElementById(id)).find(Boolean);
    if (el) {
      const container = contentRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      const outOfView =
        eRect.top < cRect.top + 40 || eRect.bottom > cRect.bottom - 40;
      if (outOfView) {
        el.scrollIntoView({ behavior: "auto", block: "center" });
      }
    }
  }, [currentPlayingAyah, displayMode]);

  /* ── Play entire surah from start ──────────── */
  const playSurah = useCallback(() => {
    if (ayahs.length === 0) return;
    const safeReciterId = ensureReciterForRiwaya(state.reciter, riwaya);
    const rec = getReciter(safeReciterId, riwaya);
    if (rec) {
      if (
        riwaya === "warsh" &&
        warshStrictMode &&
        !String(rec.cdn || "")
          .toLowerCase()
          .includes("warsh")
      ) {
        setError(t("errors.warshStrict", lang));
        return;
      }
      const playlistAyahs = ayahs.map((a) => ({
        surah: a.surah?.number || currentSurah,
        numberInSurah: a.numberInSurah,
        number: a.number,
        text: a.text,
      }));
      audioService.loadPlaylist(
        playlistAyahs,
        rec.cdn,
        rec.cdnType || "islamic",
      );
      audioService.play();
    }
  }, [ayahs, state.reciter, riwaya, currentSurah, warshStrictMode, lang]);

  /* ── Expose playSurah via custom DOM event so AudioPlayer can trigger it ── */
  useEffect(() => {
    const handler = () => playSurah();
    window.addEventListener("mushaf:play-surah", handler);
    return () => window.removeEventListener("mushaf:play-surah", handler);
  }, [playSurah]);

  /* ── Fetch data ────────────────────────────── */
  const fetchData = useCallback(async () => {
    // Abort any previous in-flight request
    const signal = abortPendingRequests();
    dispatch({ type: "SET_LOADING", payload: true });
    setError(null);

    try {
      let arabicData;

      // ── Primary fetch ──────────────────────────────────────────────────
      if (displayMode === "page") {
        // Fetch Hafs page data to get page boundaries
        arabicData = await getPage(currentPage, "hafs", signal);

        if (riwaya === "warsh") {
          // Enrich each ayah with Warsh QCF4 words (from warsh.json, surah-indexed)
          try {
            const warshJson = await loadWarshData();
            const enriched = (arabicData?.ayahs || []).map((ayah) => {
              try {
                const sn = ayah.surah?.number;
                const vn = ayah.numberInSurah;
                if (!sn || !vn || !warshJson[sn - 1]) return ayah;
                const wds = warshJson[sn - 1][vn - 1];
                if (!Array.isArray(wds) || wds.length === 0) return ayah;
                const valid = wds.filter(
                  (w) =>
                    w &&
                    typeof w === "object" &&
                    Number.isFinite(Number(w.p)) &&
                    Number.isFinite(Number(w.c)),
                );
                if (valid.length === 0) return ayah;
                return {
                  ...ayah,
                  warshWords: valid,
                  hafsText: ayah.text, // keep Hafs text for tajweed color analysis
                  requestedRiwaya: "warsh",
                };
              } catch {
                return ayah;
              }
            });
            const allEnriched = enriched.every((a) => a.warshWords?.length > 0);
            arabicData = {
              ...arabicData,
              ayahs: enriched,
              isTextFallback: !allEnriched,
              isQCF4: allEnriched,
              requestedRiwaya: "warsh",
            };
            // Load fonts in background
            loadFontsForVerses(enriched.map((a) => a.warshWords || [])).catch(() => { });
          } catch {
            // Warsh data unavailable — keep Hafs text as fallback
            arabicData = {
              ...arabicData,
              isTextFallback: true,
              requestedRiwaya: "warsh",
            };
          }
        }
      } else if (riwaya === "warsh") {
        if (displayMode === "juz") {
          arabicData = await getWarshJuzVerses(currentJuz);
        } else {
          arabicData = await getWarshSurahFormatted(currentSurah);
        }
      } else if (displayMode === "juz") {
        arabicData = await getJuz(currentJuz, riwaya, signal);
      } else {
        arabicData = await getSurahText(currentSurah, riwaya, signal);
      }

      // If aborted after await, bail out (another fetchData call is running)
      if (signal.aborted) {
        // Don't leave loading=true — the newer fetch will handle it
        return;
      }

      const fetchedAyahs = arabicData?.ayahs || [];
      if (!Array.isArray(fetchedAyahs) || fetchedAyahs.length === 0) {
        throw new Error(t("errors.emptyData", lang));
      }

      // Warsh strict mode check — but NOT in page mode (QCF4 only supports surah/juz)
      if (
        riwaya === "warsh" &&
        warshStrictMode &&
        arabicData?.isTextFallback &&
        displayMode !== "page"
      ) {
        throw new Error(
          lang === "fr"
            ? "Mode Warsh strict: texte Warsh indisponible (fallback Hafs refusé)."
            : lang === "ar"
              ? "وضع ورش الصارم: نص ورش غير متاح (تم رفض بديل حفص)."
              : "Warsh strict mode: Warsh text unavailable (Hafs fallback blocked).",
        );
      }

      // Mark ayahs with requested riwaya (prevents any visual fallback confusion)
      // Also strip Bismillah from verse 1 text at data level for Hafs (belt-and-suspenders)
      for (const ayah of fetchedAyahs) {
        ayah.requestedRiwaya = riwaya;
        if (!ayah.warshWords && ayah.text && ayah.numberInSurah === 1) {
          const sn = ayah.surah?.number;
          if (sn && sn !== 1 && sn !== 9) {
            ayah.text = stripBasmala(ayah.text, sn, 1);
          }
        }
      }

      // Replace all state atomically — new data is ready
      setAyahs(fetchedAyahs);
      dispatch({
        type: "SET",
        payload: { loadedAyahCount: fetchedAyahs.length },
      });
      setTranslations([]);
      setSourceEdition(
        arabicData?.usedEdition || arabicData?.edition?.identifier || "",
      );
      setIsWarshFallback(arabicData?.isTextFallback || false);
      setIsQCF4(arabicData?.isQCF4 || false);
      dispatch({ type: "SET_LOADING", payload: false });

      // Secondary fetches in background — parallel for speed
      if (riwaya === "warsh" && displayMode !== "page") {
        const transPromise =
          displayMode === "juz"
            ? getJuzTranslation(currentJuz, translationLang, signal)
            : getSurahTranslation(currentSurah, translationLang, signal);

        const hafsPromise =
          displayMode === "juz"
            ? getJuz(currentJuz, "hafs", signal)
            : getSurahText(currentSurah, "hafs", signal);

        // Fire both in parallel
        Promise.allSettled([transPromise, hafsPromise]).then(
          ([transResult, hafsResult]) => {
            if (signal.aborted) return;
            if (
              transResult.status === "fulfilled" &&
              transResult.value?.ayahs
            ) {
              setTranslations(transResult.value.ayahs);
            }
            if (hafsResult.status === "fulfilled") {
              const hafsAyahs = hafsResult.value?.ayahs || [];
              if (Array.isArray(hafsAyahs) && hafsAyahs.length > 0) {
                const hafsMap = new Map();
                for (const h of hafsAyahs) {
                  hafsMap.set(`${h.surah?.number}:${h.numberInSurah}`, h.text);
                }
                setAyahs((prev) =>
                  prev.map((a) => {
                    const key = `${a.surah?.number}:${a.numberInSurah}`;
                    const ht = hafsMap.get(key);
                    return ht ? { ...a, hafsText: ht } : a;
                  }),
                );
              }
            }
          },
        );
      } else {
        // Hafs mode OR Warsh page mode (using Hafs text)
        const transPromise =
          displayMode === "page"
            ? getPageTranslation(currentPage, translationLang, signal)
            : displayMode === "juz"
              ? getJuzTranslation(currentJuz, translationLang, signal)
              : getSurahTranslation(currentSurah, translationLang, signal);
        transPromise
          .then((trans) => {
            if (signal.aborted) return;
            setTranslations(trans?.ayahs || []);
          })
          .catch(() => { });
      }

      // Save reading position
      if (displayMode === "page") {
        const firstAyah = arabicData.ayahs?.[0];
        savePosition(
          firstAyah?.surah?.number || currentSurah,
          firstAyah?.numberInSurah || 1,
          currentPage,
        );
      } else {
        const firstAyah = arabicData.ayahs?.[0];
        if (firstAyah) {
          savePosition(
            firstAyah.surah?.number || currentSurah,
            1,
            firstAyah.page,
          );
        }
      }

      // Log reading history & wird progress (fire-and-forget)
      try {
        const allAyahs = arabicData.ayahs || [];
        if (allAyahs.length > 0) {
          const firstA = allAyahs[0];
          const lastA = allAyahs[allAyahs.length - 1];
          const sSurah = firstA.surah?.number || currentSurah;
          const sFrom = firstA.numberInSurah || 1;
          const sTo = lastA.numberInSurah || sFrom;
          const pagesCount =
            displayMode === "page" ? 1 : Math.ceil(allAyahs.length / 15);
          // Compute actual reading duration since last navigation
          const elapsed = Date.now() - readingStartRef.current;
          readingStartRef.current = Date.now();
          logSession({
            surah: sSurah,
            ayahFrom: sFrom,
            ayahTo: sTo,
            page: currentPage,
            durationMs: elapsed,
          }).catch(() => { });
          logWirdProgress({
            surah: sSurah,
            fromAyah: sFrom,
            toAyah: sTo,
            pagesCount,
          }).catch(() => { });
        }
      } catch {
        /* best-effort */
      }
    } catch (err) {
      // Silently ignore abort errors — a newer fetchData is already running
      if (err.name === "AbortError") return;
      console.error("Fetch error:", err);
      setError(err.message);
      dispatch({ type: "SET_ERROR", payload: err.message });
    } finally {
      // Safety net: if no data loaded and we're still loading, clear the flag
      // This prevents infinite loading skeleton when all fetches fail/abort
      if (signal.aborted) return;
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    riwaya,
    translationLang,
    lang,
    dispatch,
    warshStrictMode,
    // `set` is intentionally omitted — we use dispatch directly inside fetchData
    // to avoid re-triggering this callback whenever set's identity changes.
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Prefetch adjacent surah/page/juz data so next navigation is instant
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (displayMode === "surah") {
        if (riwaya === "warsh") {
          if (currentSurah < 114) preloadWarshSurah(currentSurah + 1);
          if (currentSurah > 1) preloadWarshSurah(currentSurah - 1);
          if (currentSurah < 114)
            getSurahTranslation(currentSurah + 1, translationLang).catch(
              () => { },
            );
        } else {
          if (currentSurah < 114)
            getSurahFull(currentSurah + 1, riwaya, translationLang).catch(
              () => { },
            );
          if (currentSurah > 1)
            getSurahFull(currentSurah - 1, riwaya, translationLang).catch(
              () => { },
            );
        }
      } else if (displayMode === "page") {
        if (currentPage < 604)
          getPageFull(currentPage + 1, riwaya, translationLang).catch(() => { });
        if (currentPage > 1)
          getPageFull(currentPage - 1, riwaya, translationLang).catch(() => { });
      } else if (displayMode === "juz") {
        if (riwaya === "warsh") {
          if (currentJuz < 30) {
            getWarshJuzVerses(currentJuz + 1).catch(() => { });
            getJuzTranslation(currentJuz + 1, translationLang).catch(() => { });
          }
        } else {
          if (currentJuz < 30) getJuz(currentJuz + 1, riwaya).catch(() => { });
        }
      }
    }, 150); // Fast prefetch — data will be cached for instant next navigation
    return () => clearTimeout(timer);
  }, [
    loading,
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    riwaya,
    translationLang,
  ]);

  // Scroll to top on navigation (instant for speed)
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [currentSurah, currentPage, currentJuz]);

  /* ── Page navigation ───────────────────────── */
  const goNextPage = () => {
    if (currentPage < 604) set({ currentPage: currentPage + 1 });
  };
  const goPrevPage = () => {
    if (currentPage > 1) set({ currentPage: currentPage - 1 });
  };
  const goNextSurah = () => {
    if (currentSurah < 114) {
      setChunkIndex(0);
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: currentSurah + 1 },
      });
    }
  };
  const goPrevSurah = () => {
    if (currentSurah > 1) {
      setChunkIndex(0);
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: currentSurah - 1 },
      });
    }
  };
  const goNextJuz = () => {
    if (currentJuz < 30)
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz + 1 } });
  };
  const goPrevJuz = () => {
    if (currentJuz > 1)
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz - 1 } });
  };

  /* ── (continuous play is handled in the earlier useEffect) ── */

  /* ── Surah chunks (memoized) ── */
  const surahChunks = useMemo(() => {
    if (displayMode !== "surah" || ayahs.length === 0) return [];
    const surahMeta = getSurah(currentSurah);
    const totalAyahs = surahMeta?.ayahs || ayahs.length;
    return buildSurahChunks(currentSurah, totalAyahs, lang);
  }, [displayMode, currentSurah, ayahs.length, lang]);

  const isLongSurah = surahChunks.length > 1;

  /* ── Auto-advance chunk when playing ayah leaves visible window ── */
  useEffect(() => {
    if (!currentPlayingAyah?.ayah) return;
    if (displayMode !== "surah") return;
    if (!isLongSurah || surahChunks.length === 0) return;
    // Only care if the playing ayah belongs to the current surah
    if (
      currentPlayingAyah.surah !== undefined &&
      currentPlayingAyah.surah !== currentSurah
    )
      return;

    const playingNum = currentPlayingAyah.ayah; // numberInSurah
    const chunk = surahChunks[chunkIndex];
    if (!chunk) return;

    // If the playing ayah is outside the current chunk, jump to the right chunk
    if (playingNum < chunk.start || playingNum > chunk.end) {
      const targetIdx = surahChunks.findIndex(
        (c) => playingNum >= c.start && playingNum <= c.end,
      );
      if (targetIdx >= 0 && targetIdx !== chunkIndex) {
        setChunkIndex(targetIdx);
        // Scroll to top so the new chunk is visible
        contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [
    currentPlayingAyah,
    displayMode,
    isLongSurah,
    surahChunks,
    chunkIndex,
    currentSurah,
  ]);

  // The slice of ayahs visible in the current chunk
  const visibleAyahs = useMemo(() => {
    if (!isLongSurah || surahChunks.length === 0) return ayahs;
    const chunk = surahChunks[chunkIndex];
    if (!chunk) return ayahs;
    // ayahs array is 0-indexed; chunk.start/end are 1-indexed ayah numbers within the surah
    return ayahs.filter(
      (a) => a.numberInSurah >= chunk.start && a.numberInSurah <= chunk.end,
    );
  }, [ayahs, isLongSurah, surahChunks, chunkIndex]);

  const mushafPageGroups = useMemo(() => {
    if (displayMode !== "surah" || ayahs.length === 0) return [];

    const groupedByPage = new Map();
    for (const ayah of ayahs) {
      const pageNum = Number(ayah.page);
      if (!Number.isFinite(pageNum) || pageNum <= 0) continue;
      if (!groupedByPage.has(pageNum)) groupedByPage.set(pageNum, []);
      groupedByPage.get(pageNum).push(ayah);
    }

    if (groupedByPage.size > 0) {
      return Array.from(groupedByPage.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([page, items]) => ({
          page,
          startAyah: items[0]?.numberInSurah || 1,
          endAyah: items[items.length - 1]?.numberInSurah || 1,
          ayahs: items,
        }));
    }

    const segmentSize = ayahs.length > 140 ? 10 : ayahs.length > 80 ? 12 : 15;
    const fallback = [];
    for (let i = 0; i < ayahs.length; i += segmentSize) {
      const items = ayahs.slice(i, i + segmentSize);
      fallback.push({
        page: i / segmentSize + 1,
        startAyah: items[0]?.numberInSurah || 1,
        endAyah: items[items.length - 1]?.numberInSurah || 1,
        ayahs: items,
      });
    }
    return fallback;
  }, [displayMode, ayahs]);

  const activeMushafGroup = useMemo(() => {
    if (mushafPageGroups.length === 0) {
      return {
        page: currentPage,
        startAyah: ayahs[0]?.numberInSurah || 1,
        endAyah: ayahs[ayahs.length - 1]?.numberInSurah || 1,
        ayahs,
      };
    }
    return mushafPageGroups[mushafPageIndex] || mushafPageGroups[0];
  }, [mushafPageGroups, mushafPageIndex, ayahs, currentPage]);

  useEffect(() => {
    if (displayMode !== "surah" || mushafLayout !== "mushaf") return;
    if (!currentPlayingAyah?.ayah || mushafPageGroups.length <= 1) return;
    const targetIndex = mushafPageGroups.findIndex(
      (group) =>
        currentPlayingAyah.ayah >= group.startAyah &&
        currentPlayingAyah.ayah <= group.endAyah,
    );
    if (targetIndex >= 0 && targetIndex !== mushafPageIndex) {
      setMushafPageIndex(targetIndex);
      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [
    displayMode,
    mushafLayout,
    currentPlayingAyah,
    mushafPageGroups,
    mushafPageIndex,
  ]);

  const visibleMushafAyahs = useMemo(() => {
    if (
      displayMode === "surah" &&
      mushafLayout === "mushaf" &&
      activeMushafGroup?.ayahs?.length
    ) {
      return activeMushafGroup.ayahs;
    }
    return visibleAyahs;
  }, [displayMode, mushafLayout, activeMushafGroup, visibleAyahs]);

  /* ── Group ayahs by surah (memoized for page/juz mode) ── */
  const surahGroups = useMemo(() => {
    if (displayMode !== "page" && displayMode !== "juz") return [];
    const groups = [];
    let currentGroup = null;
    for (const a of ayahs) {
      const sn = a.surah?.number || currentSurah;
      if (!currentGroup || currentGroup.surah !== sn) {
        currentGroup = { surah: sn, ayahs: [] };
        groups.push(currentGroup);
      }
      currentGroup.ayahs.push(a);
    }
    return groups;
  }, [ayahs, displayMode, currentSurah]);

  /* ── Translation Map for O(1) lookup (juz mode) ── */
  const translationMap = useMemo(() => {
    if (translations.length === 0) return null;
    const map = new Map();
    for (const tr of translations) {
      if (!tr) continue;
      if (typeof tr.number === "number") {
        map.set(`global:${tr.number}`, tr);
      }
      const surahNumber = tr.surah?.number;
      const ayahNumber = tr.numberInSurah;
      const localKey = getTranslationKeyForAyah(surahNumber, ayahNumber);
      if (localKey) {
        map.set(localKey, tr);
      }
    }
    return map;
  }, [translations]);

  const getTranslationForAyah = useCallback(
    (ayah) => {
      if (!ayah || !translationMap) return null;
      return (
        translationMap.get(`global:${ayah.number}`) ||
        translationMap.get(
          getTranslationKeyForAyah(
            ayah.surah?.number || currentSurah,
            ayah.numberInSurah,
          ),
        ) ||
        null
      );
    },
    [translationMap, currentSurah],
  );

  const visibleTranslations = useMemo(
    () => visibleAyahs.map((ayah) => getTranslationForAyah(ayah)),
    [visibleAyahs, getTranslationForAyah],
  );

  const visibleMushafTranslations = useMemo(
    () => visibleMushafAyahs.map((ayah) => getTranslationForAyah(ayah)),
    [visibleMushafAyahs, getTranslationForAyah],
  );

  const fullscreenAyahs = useMemo(() => {
    if (displayMode === "surah" && mushafLayout === "mushaf") {
      return visibleMushafAyahs;
    }
    return visibleAyahs;
  }, [displayMode, mushafLayout, visibleMushafAyahs, visibleAyahs]);

  const canDecreaseFontSize = fontSize > 18;
  const canIncreaseFontSize = fontSize < 48;
  const decreaseFontSize = useCallback(() => {
    dispatch({ type: "SET_FONT_SIZE", payload: Math.max(18, fontSize - 2) });
  }, [dispatch, fontSize]);
  const increaseFontSize = useCallback(() => {
    dispatch({ type: "SET_FONT_SIZE", payload: Math.min(48, fontSize + 2) });
  }, [dispatch, fontSize]);

  const verseTranslationMeta =
    TRANSLATION_LANGUAGE_META[translationLang] || TRANSLATION_LANGUAGE_META.fr;
  const wordTranslationMeta =
    TRANSLATION_LANGUAGE_META[wordTranslationLang] || TRANSLATION_LANGUAGE_META.fr;
  const verseTranslationLabel =
    lang === 'ar'
      ? verseTranslationMeta.ar
      : lang === 'fr'
        ? verseTranslationMeta.fr
        : verseTranslationMeta.en;
  const wordTranslationLabel =
    lang === 'ar'
      ? wordTranslationMeta.ar
      : lang === 'fr'
        ? wordTranslationMeta.fr
        : wordTranslationMeta.en;

  /* ── Loading / Error states ────────────────── */
  // Show skeleton ONLY when we have no data at all — otherwise show stale data while loading
  if (loading && ayahs.length === 0) {
    return (
      <div className="quran-loading">
        <div className="loading-skeleton">
          <div className="loading-skeleton-topbar">
            <div className="loading-pill"></div>
            <div className="loading-pill"></div>
          </div>
          <div className="skeleton-header"></div>
          <div className="skeleton-bismillah"></div>
          <div className="skeleton-line thin"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line medium"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line short"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line medium"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line short"></div>
          <div className="skeleton-line medium"></div>
          <div className="skeleton-line long"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quran-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <div className="quran-error-actions">
          <button className="btn btn-primary" onClick={fetchData}>
            {t("errors.retry", lang)}
          </button>
          <button className="btn btn-outline" onClick={repairPlatform}>
            {lang === "fr" ? "Réparer la plateforme" : "Repair Platform"}
          </button>
        </div>
      </div>
    );
  }

  if (!loading && !error && ayahs.length === 0) {
    return (
      <div className="quran-error">
        <i className="fas fa-book-open"></i>
        <p>{t("errors.emptyData", lang)}</p>
        <div className="quran-error-actions">
          <button className="btn btn-primary" onClick={fetchData}>
            {t("errors.retry", lang)}
          </button>
          <button className="btn btn-outline" onClick={repairPlatform}>
            {lang === "fr" ? "Réparer la plateforme" : "Repair Platform"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`quran-display quran-display--${riwaya}`} ref={contentRef}>
      {/* Warsh QCF4 active indicator */}
      {riwaya === "warsh" && isQCF4 && (
        <div className="warsh-notice warsh-qcf4-active">
          <div className="warsh-notice-content">
            <div className="warsh-notice-badge warsh-badge-ok">
              <i className="fas fa-check-circle"></i>
              <span>{t("settings.warshScriptLabel", lang)}</span>
            </div>
          </div>
        </div>
      )}
      {/* Warsh fallback — if QCF4 failed and using Hafs text */}
      {riwaya === "warsh" && isWarshFallback && !isQCF4 && (
        <div className="warsh-notice warsh-fallback">
          <div className="warsh-notice-content">
            <div className="warsh-notice-badge">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{t("settings.warshFallbackBadge", lang)}</span>
            </div>
            <p className="warsh-notice-text">
              {t("settings.warshFallbackText", lang)}
            </p>
          </div>
          <a
            href="https://archive.org/download/MushafAlMadinahWarsh5488865/Mushaf%20AlMadinah_Warsh.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="warsh-mushaf-link"
          >
            <i className="fas fa-external-link-alt"></i>
            {t("settings.warshMushafLink", lang)}
          </a>
        </div>
      )}

      {(showTranslation || (showWordByWord && showWordTranslation)) && (
        <div className="translation-active-strip" aria-label={lang === 'fr' ? 'Langues de traduction actives' : lang === 'ar' ? 'لغات الترجمة النشطة' : 'Active translation languages'}>
          {showTranslation && (
            <div className="translation-active-chip">
              <i className={`fas ${verseTranslationMeta.icon}`} aria-hidden="true"></i>
              <span className="translation-active-chip__label">
                {lang === 'fr' ? 'Versets' : lang === 'ar' ? 'الآيات' : 'Verses'}
              </span>
              <strong>{verseTranslationLabel}</strong>
            </div>
          )}
          {showWordByWord && showWordTranslation && (
            <div className="translation-active-chip translation-active-chip--secondary">
              <i className="fas fa-w" aria-hidden="true"></i>
              <span className="translation-active-chip__label">
                {lang === 'fr' ? 'Mot-à-mot' : lang === 'ar' ? 'كلمة بكلمة' : 'Word by word'}
              </span>
              <strong>{wordTranslationLabel}</strong>
            </div>
          )}
        </div>
      )}

      <div className="quran-reading-bar" aria-label={lang === 'fr' ? 'Contexte de lecture' : lang === 'ar' ? 'سياق القراءة' : 'Reading context'}>
        <div className="quran-reading-bar__cluster">
          <span className="quran-meta-pill">
            <i className={`fas ${displayMode === "surah" ? "fa-align-justify" : displayMode === "page" ? "fa-file-lines" : "fa-book-open"}`} aria-hidden="true"></i>
            <span>
              {displayMode === "surah"
                ? t("settings.surahMode", lang)
                : displayMode === "page"
                  ? t("settings.pageMode", lang)
                  : t("settings.juzMode", lang)}
            </span>
          </span>
          <span className="quran-meta-pill quran-meta-pill--riwaya">
            {riwaya === "warsh" && isQCF4 && <i className="fas fa-star" aria-hidden="true"></i>}
            <span>{riwaya === "warsh" ? "ورش · Warsh" : "حفص · Hafs"}</span>
          </span>
          {memMode && (
            <span className="quran-meta-pill quran-meta-pill--focus">
              <i className="fas fa-graduation-cap" aria-hidden="true"></i>
              <span>{lang === "fr" ? "Mémorisation" : lang === "ar" ? "مراجعة" : "Memorization"}</span>
            </span>
          )}
        </div>
        <div className="quran-reading-bar__cluster quran-reading-bar__cluster--end">
          <span className="quran-reading-bar__hint">
            {displayMode === "surah"
              ? `${t("quran.surah", lang)} ${lang === "ar" ? toAr(currentSurah) : currentSurah}`
              : displayMode === "page"
                ? `${t("quran.page", lang)} ${lang === "ar" ? toAr(currentPage) : currentPage}`
                : `${t("sidebar.juz", lang)} ${lang === "ar" ? toAr(currentJuz) : currentJuz}`}
          </span>
        </div>
      </div>

      {/* Surah mode */}
      {displayMode === "surah" && (
        <div
          role="region"
          aria-label={t("settings.surahMode", lang)}
          className="quran-mode-pane quran-mode-pane--surah"
        >
          {/* Surah header — always shown except when QCF4 mushaf view handles it */}
          {!(isQCF4 && mushafLayout === "mushaf") && !isQCF4 && (
            <SurahHeader surahNum={currentSurah} lang={lang} />
          )}
          {isQCF4 && mushafLayout !== "mushaf" && (
            <SurahHeader surahNum={currentSurah} lang={lang} />
          )}
          {currentSurah !== 1 && currentSurah !== 9 && mushafLayout !== "mushaf" && (
            <Bismillah />
          )}
          <TajweedLegend lang={lang} visible={showTajwid} riwaya={riwaya} />

          {/* Layout toggle: list ↔ mushaf */}
          <div className="mushaf-layout-toggle-bar">
            <button
              className={`mushaf-layout-btn${mushafLayout === "list" ? " active" : ""}`}
              onClick={() => set({ mushafLayout: "list" })}
              title={lang === "fr" ? "Vue liste" : "List view"}
            >
              <i className="fas fa-list-ul"></i>
              {lang === "fr" ? "Liste" : "List"}
            </button>
            <button
              className={`mushaf-layout-btn${mushafLayout === "mushaf" ? " active" : ""}`}
              onClick={() => set({ mushafLayout: "mushaf" })}
              title={lang === "fr" ? "Vue Mushaf" : "Mushaf view"}
            >
              <i className="fas fa-book-open"></i>
              {lang === "fr" ? "Mushaf" : "Mushaf"}
            </button>
            <span className="mushaf-layout-sep" />
            <button
              className={`mushaf-layout-btn${memMode ? " active" : ""}`}
              onClick={() => set({ memMode: !memMode })}
              title={lang === "fr" ? "Mode mémorisation" : "Memorization mode"}
            >
              <i className="fas fa-graduation-cap"></i>
              {lang === "fr" ? "Mémorisation" : "Memorize"}
            </button>
            <button
              className="mushaf-layout-btn"
              onClick={() => setFullPage(true)}
              title={lang === "fr" ? "Vue pleine page" : "Full page view"}
            >
              <i className="fas fa-expand"></i>
              {lang === "fr" ? "Pleine page" : "Full page"}
            </button>
          </div>

          {/* ── Mushaf page layout ── */}
          {mushafLayout === "mushaf" && (
            <>
              {mushafPageGroups.length > 1 && (
                <div className="mushaf-page-switcher">
                  <button
                    className="btn btn-outline mushaf-page-btn"
                    onClick={() => {
                      setMushafPageIndex((i) => Math.max(0, i - 1));
                      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={mushafPageIndex === 0}
                  >
                    <i className={`fas fa-arrow-${lang === "ar" ? "right" : "left"}`} />
                    {lang === "fr" ? "Page precedente" : lang === "ar" ? "الصفحة السابقة" : "Previous page"}
                  </button>

                  <div className="mushaf-page-meta">
                    <strong>
                      {t("quran.page", lang)} {lang === "ar" ? toAr(activeMushafGroup.page) : activeMushafGroup.page}
                    </strong>
                    <span>
                      {lang === "fr"
                        ? `Versets ${activeMushafGroup.startAyah}-${activeMushafGroup.endAyah}`
                        : lang === "ar"
                          ? `الآيات ${toAr(activeMushafGroup.startAyah)}-${toAr(activeMushafGroup.endAyah)}`
                          : `Ayahs ${activeMushafGroup.startAyah}-${activeMushafGroup.endAyah}`}
                    </span>
                  </div>

                  <button
                    className="btn btn-outline mushaf-page-btn"
                    onClick={() => {
                      setMushafPageIndex((i) => Math.min(mushafPageGroups.length - 1, i + 1));
                      contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    disabled={mushafPageIndex === mushafPageGroups.length - 1}
                  >
                    {lang === "fr" ? "Page suivante" : lang === "ar" ? "الصفحة التالية" : "Next page"}
                    <i className={`fas fa-arrow-${lang === "ar" ? "left" : "right"}`} />
                  </button>
                </div>
              )}

              <MushafInlineView
                ayahs={visibleMushafAyahs}
                translations={visibleMushafTranslations}
                surahNum={currentSurah}
                displayMode={displayMode}
                currentPage={activeMushafGroup.page || currentPage}
                currentJuz={currentJuz}
                isQCF4={isQCF4}
                showTajwid={showTajwid}
                showTranslation={showTranslation}
                currentPlayingAyah={currentPlayingAyah}
                calibration={karaokeCalibration}
                riwaya={riwaya}
                lang={lang}
                fontSize={fontSize}
                onAyahClick={toggleAyah}
                onIncreaseFont={increaseFontSize}
                onDecreaseFont={decreaseFontSize}
                canIncreaseFont={canIncreaseFontSize}
                canDecreaseFont={canDecreaseFontSize}
              />
            </>
          )}

          {/* ── List layout (default) — chunks + ayah blocks ── */}
          {mushafLayout !== "mushaf" && (<>
            {/* Chunk label for long surahs */}
            {isLongSurah && surahChunks[chunkIndex] && (
              <div className="chunk-nav-bar">
                <button
                  className="btn btn-outline chunk-btn"
                  onClick={() => {
                    setChunkIndex((i) => i - 1);
                    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={chunkIndex === 0}
                >
                  <i
                    className={`fas fa-arrow-${lang === "ar" ? "right" : "left"}`}
                  ></i>
                  {lang === "fr" ? "Précédent" : "Previous"}
                </button>
                <span className="chunk-label">
                  {lang === "fr"
                    ? `Partie ${chunkIndex + 1} / ${surahChunks.length}`
                    : `Part ${chunkIndex + 1} / ${surahChunks.length}`}
                  {surahChunks[chunkIndex].label && (
                    <span className="chunk-hizb-label">
                      {" "}
                      · {surahChunks[chunkIndex].label}
                    </span>
                  )}
                  <span className="chunk-ayah-range">
                    {" "}
                    (
                    {lang === "ar"
                      ? toAr(surahChunks[chunkIndex].start)
                      : surahChunks[chunkIndex].start}
                    {" – "}
                    {lang === "ar"
                      ? toAr(surahChunks[chunkIndex].end)
                      : surahChunks[chunkIndex].end}
                    )
                  </span>
                </span>
                <button
                  className="btn btn-outline chunk-btn"
                  onClick={() => {
                    setChunkIndex((i) => i + 1);
                    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={chunkIndex === surahChunks.length - 1}
                >
                  {lang === "fr" ? "Suivant" : "Next"}
                  <i
                    className={`fas fa-arrow-${lang === "ar" ? "left" : "right"}`}
                  ></i>
                </button>
              </div>
            )}

            {/* Ayah list — plain render, no virtual scroll */}
            <div
              role="list"
              className={`surah-ayahs-list${isQCF4 ? " qcf4-container" : ""}`}
              style={ayahsContainerStyle}
            >
              {visibleAyahs.map((ayah, idx) => {
                const isPlayingAyah =
                  currentPlayingAyah?.ayah === ayah.numberInSurah &&
                  currentPlayingAyah?.surah === currentSurah;
                const trans = visibleTranslations[idx] || null;
                return (
                  <AyahBlock
                    key={ayah.number}
                    ayah={ayah}
                    ayahId={`ayah-${ayah.numberInSurah}`}
                    isPlaying={isPlayingAyah}
                    isActive={activeAyah === ayah.numberInSurah}
                    trans={trans}
                    showTajwid={showTajwid}
                    showTranslation={showTranslation}
                    showWordByWord={showWordByWord}
                    showTransliteration={showTransliteration}
                    showWordTranslation={showWordTranslation}
                    surahNum={currentSurah}
                    calibration={karaokeCalibration}
                    riwaya={riwaya}
                    lang={lang}
                    fontSize={fontSize}
                    memMode={memMode}
                    onToggleActive={() => toggleAyah(ayah.numberInSurah)}
                  />
                );
              })}
            </div>

            {/* Bottom chunk nav for long surahs */}
            {isLongSurah && (
              <div className="chunk-nav-bar chunk-nav-bar--bottom">
                <button
                  className="btn btn-outline chunk-btn"
                  onClick={() => {
                    setChunkIndex((i) => i - 1);
                    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={chunkIndex === 0}
                >
                  <i
                    className={`fas fa-arrow-${lang === "ar" ? "right" : "left"}`}
                  ></i>
                  {lang === "fr" ? "Précédent" : "Previous"}
                </button>
                <span className="chunk-label">
                  {lang === "fr"
                    ? `Partie ${chunkIndex + 1} / ${surahChunks.length}`
                    : `Part ${chunkIndex + 1} / ${surahChunks.length}`}
                </span>
                <button
                  className="btn btn-outline chunk-btn"
                  onClick={() => {
                    setChunkIndex((i) => i + 1);
                    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  disabled={chunkIndex === surahChunks.length - 1}
                >
                  {lang === "fr" ? "Suivant" : "Next"}
                  <i
                    className={`fas fa-arrow-${lang === "ar" ? "left" : "right"}`}
                  ></i>
                </button>
              </div>
            )}

          </>)}

          {/* Surah navigation — always shown */}
          <div className="quran-nav">
            <button
              className="btn btn-outline"
              onClick={goPrevSurah}
              disabled={currentSurah <= 1}
            >
              <i
                className={`fas fa-arrow-${lang === "ar" ? "right" : "left"}`}
              ></i>
              {t("quran.prevSurah", lang)}
            </button>
            <button
              className="btn btn-outline"
              onClick={goNextSurah}
              disabled={currentSurah >= 114}
            >
              {t("quran.nextSurah", lang)}
              <i
                className={`fas fa-arrow-${lang === "ar" ? "left" : "right"}`}
              ></i>
            </button>
          </div>
        </div>
      )}

      {/* Page mode */}
      {displayMode === "page" && (
        <div
          className="quran-mode-pane quran-mode-pane--page"
          role="region"
          aria-label={t("settings.pageMode", lang)}
        >
          <div className="page-header-bar">
            <span>
              {t("quran.page", lang)}{" "}
              {lang === "ar" ? toAr(currentPage) : currentPage}
            </span>
            {ayahs[0] && (
              <span>
                {t("sidebar.juz", lang)}{" "}
                {getJuzForAyah(ayahs[0].surah?.number, ayahs[0].numberInSurah)}
              </span>
            )}
            <span className="quran-meta-pill quran-meta-pill--riwaya">
              {riwaya === "warsh" && isQCF4 && <i className="fas fa-star" aria-hidden="true"></i>}
              {riwaya === "warsh" ? "ورش · Warsh" : "حفص · Hafs"}
            </span>
          </div>

          {/* Toggle vue Liste / Mushaf */}
          <div className="mushaf-layout-toggle-bar">
            <button
              className={`mushaf-layout-btn${mushafLayout === "list" ? " active" : ""}`}
              onClick={() => set({ mushafLayout: "list" })}
              title={lang === "fr" ? "Vue liste" : "List view"}
            >
              <i className="fas fa-list-ul"></i>
              {lang === "fr" ? "Liste" : "List"}
            </button>
            <button
              className={`mushaf-layout-btn${mushafLayout === "mushaf" ? " active" : ""}`}
              onClick={() => set({ mushafLayout: "mushaf" })}
              title={lang === "fr" ? "Vue Mushaf" : "Mushaf view"}
            >
              <i className="fas fa-book-open"></i>
              {lang === "fr" ? "Mushaf" : "Mushaf"}
            </button>
          </div>

          {/* Vue Mushaf */}
          {mushafLayout === "mushaf" && surahGroups.map((group, gi) => {
            const groupTrans = translationMap
              ? group.ayahs.map((a) => getTranslationForAyah(a))
              : [];
            return (
              <MushafInlineView
                key={gi}
                ayahs={group.ayahs}
                translations={groupTrans}
                surahNum={group.surah}
                displayMode={displayMode}
                currentPage={currentPage}
                currentJuz={currentJuz}
                isQCF4={isQCF4}
                showTajwid={showTajwid}
                showTranslation={showTranslation}
                currentPlayingAyah={currentPlayingAyah}
                calibration={karaokeCalibration}
                riwaya={riwaya}
                lang={lang}
                fontSize={fontSize}
                onAyahClick={toggleAyah}
                onIncreaseFont={increaseFontSize}
                onDecreaseFont={decreaseFontSize}
                canIncreaseFont={canIncreaseFontSize}
                canDecreaseFont={canDecreaseFontSize}
              />
            );
          })}

          {/* Vue liste — utilise AyahBlock (cohérent avec sourate/juz) */}
          {mushafLayout !== "mushaf" && surahGroups.map((group, gi) => (
            <div key={gi}>
              {!isQCF4 && group.ayahs[0]?.numberInSurah === 1 && (
                <SurahHeader surahNum={group.surah} lang={lang} />
              )}
              {!isQCF4 &&
                group.ayahs[0]?.numberInSurah === 1 &&
                group.surah !== 1 &&
                group.surah !== 9 && <Bismillah />}
              <div
                className={`surah-ayahs-list${isQCF4 ? " qcf4-container" : ""}`}
                style={ayahsContainerStyle}
              >
                {group.ayahs.map((ayah) => {
                  const isPlaying =
                    currentPlayingAyah?.ayah === ayah.numberInSurah &&
                    currentPlayingAyah?.surah === ayah.surah?.number;
                  const trans = getTranslationForAyah(ayah);
                  return (
                    <AyahBlock
                      key={ayah.number}
                      ayah={ayah}
                      ayahId={`ayah-pg-${ayah.number}`}
                      isPlaying={isPlaying}
                      isActive={activeAyah === ayah.number}
                      trans={trans}
                      showTajwid={showTajwid}
                      showTranslation={showTranslation}
                      showWordByWord={showWordByWord}
                      showTransliteration={showTransliteration}
                      showWordTranslation={showWordTranslation}
                      surahNum={ayah.surah?.number || group.surah}
                      calibration={karaokeCalibration}
                      riwaya={riwaya}
                      lang={lang}
                      fontSize={fontSize}
                      onToggleActive={() => toggleAyah(ayah.number)}
                    />
                  );
                })}
              </div>
            </div>
          ))}

          {/* Navigation */}
          <div className="quran-nav">
            <button
              className="btn btn-outline"
              onClick={goPrevPage}
              disabled={currentPage <= 1}
            >
              <i className={`fas fa-arrow-${lang === "ar" ? "right" : "left"}`}></i>
              {t("quran.prevPage", lang)}
            </button>
            <span className="page-indicator">
              {lang === "ar" ? toAr(currentPage) : currentPage} / 604
            </span>
            <button
              className="btn btn-outline"
              onClick={goNextPage}
              disabled={currentPage >= 604}
            >
              {t("quran.nextPage", lang)}
              <i className={`fas fa-arrow-${lang === "ar" ? "left" : "right"}`}></i>
            </button>
          </div>
        </div>
      )}

      {/* Juz mode */}
      {displayMode === "juz" && (
        <div
          role="region"
          aria-label={t("settings.juzMode", lang)}
          className="quran-mode-pane quran-mode-pane--juz"
        >
          {/* En-tête Juz */}
          <div className="page-header-bar">
            <span>
              <i className="fas fa-book-open" style={{ marginInlineEnd: "0.4rem" }}></i>
              {t("sidebar.juz", lang)}{" "}
              {lang === "ar" ? toAr(currentJuz) : currentJuz}
            </span>
            <span className="quran-meta-pill quran-meta-pill--riwaya">
              {riwaya === "warsh" && isQCF4 && <i className="fas fa-star" aria-hidden="true"></i>}
              {riwaya === "warsh" ? "ورش · Warsh" : "حفص · Hafs"}
            </span>
          </div>

          {/* Toggle vue */}
          <div className="mushaf-layout-toggle-bar">
            <button
              className={`mushaf-layout-btn${mushafLayout === "list" ? " active" : ""}`}
              onClick={() => set({ mushafLayout: "list" })}
            >
              <i className="fas fa-list-ul"></i>
              {lang === "fr" ? "Liste" : "List"}
            </button>
            <button
              className={`mushaf-layout-btn${mushafLayout === "mushaf" ? " active" : ""}`}
              onClick={() => set({ mushafLayout: "mushaf" })}
            >
              <i className="fas fa-book-open"></i>
              {lang === "fr" ? "Mushaf" : "Mushaf"}
            </button>
          </div>

          {/* Vue Mushaf */}
          {mushafLayout === "mushaf" && surahGroups.map((group, gi) => {
            const groupTrans = translationMap
              ? group.ayahs.map((a) => getTranslationForAyah(a))
              : [];
            return (
              <MushafInlineView
                key={gi}
                ayahs={group.ayahs}
                translations={groupTrans}
                surahNum={group.surah}
                displayMode={displayMode}
                currentPage={currentPage}
                currentJuz={currentJuz}
                isQCF4={isQCF4}
                showTajwid={showTajwid}
                showTranslation={showTranslation}
                currentPlayingAyah={currentPlayingAyah}
                calibration={karaokeCalibration}
                riwaya={riwaya}
                lang={lang}
                fontSize={fontSize}
                onAyahClick={(n) => toggleAyah(group.ayahs.find((a) => a.numberInSurah === n)?.number ?? n)}
                onIncreaseFont={increaseFontSize}
                onDecreaseFont={decreaseFontSize}
                canIncreaseFont={canIncreaseFontSize}
                canDecreaseFont={canDecreaseFontSize}
              />
            );
          })}

          {/* Vue liste */}
          {mushafLayout !== "mushaf" && (
            <div role="list">
              {surahGroups.map((group, gi) => (
                <div key={gi}>
                  {!isQCF4 && group.ayahs[0]?.numberInSurah === 1 && (
                    <SurahHeader surahNum={group.surah} lang={lang} />
                  )}
                  {!isQCF4 &&
                    group.ayahs[0]?.numberInSurah === 1 &&
                    group.surah !== 1 &&
                    group.surah !== 9 && <Bismillah />}
                  <div
                    className={`surah-ayahs-list${isQCF4 ? " qcf4-container" : ""}`}
                    style={ayahsContainerStyle}
                  >
                    {group.ayahs.map((ayah) => {
                      const isPlayingAyah =
                        currentPlayingAyah?.ayah === ayah.numberInSurah &&
                        currentPlayingAyah?.surah === ayah.surah?.number;
                      const trans = getTranslationForAyah(ayah);
                      return (
                        <AyahBlock
                          key={ayah.number}
                          ayah={ayah}
                          ayahId={`ayah-${ayah.number}`}
                          isPlaying={isPlayingAyah}
                          isActive={activeAyah === ayah.number}
                          trans={trans}
                          showTajwid={showTajwid}
                          showTranslation={showTranslation}
                          showWordByWord={showWordByWord}
                          showTransliteration={showTransliteration}
                          showWordTranslation={showWordTranslation}
                          surahNum={ayah.surah?.number}
                          calibration={karaokeCalibration}
                          riwaya={riwaya}
                          lang={lang}
                          fontSize={fontSize}
                          onToggleActive={() => toggleAyah(ayah.number)}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Navigation Juz */}
          <div className="quran-nav">
            <button className="btn btn-outline" onClick={goPrevJuz} disabled={currentJuz <= 1}>
              <i className={`fas fa-arrow-${lang === "ar" ? "right" : "left"}`}></i>
              {t("quran.prevJuz", lang)}
            </button>
            <span className="page-indicator">
              {t("sidebar.juz", lang)}{" "}
              {lang === "ar" ? toAr(currentJuz) : currentJuz} / 30
            </span>
            <button className="btn btn-outline" onClick={goNextJuz} disabled={currentJuz >= 30}>
              {t("quran.nextJuz", lang)}
              <i className={`fas fa-arrow-${lang === "ar" ? "left" : "right"}`}></i>
            </button>
          </div>
        </div>
      )}

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          className="scroll-top-btn"
          onClick={scrollToTop}
          title={t("nav.scrollTop", lang)}
        >
          <i className="fas fa-chevron-up"></i>
        </button>
      )}

      {/* Footer */}
      <footer className="quran-footer">
        <div className="footer-brand">
          <i className="fas fa-book-quran"></i>
          <span>MushafPlus v1.1.0</span>
        </div>
        <div className="footer-links">
          <a
            href="https://alquran.cloud/api"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fas fa-cloud"></i> API
          </a>
          <span className="footer-dot">·</span>
          <a
            href="https://archive.org/download/MushafAlMadinahWarsh5488865/Mushaf%20AlMadinah_Warsh.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i className="fas fa-file-pdf"></i> Warsh PDF
          </a>
          <span className="footer-dot">·</span>
          <button
            className="footer-link-btn"
            onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
          >
            <i className="fas fa-gear"></i> {t("nav.settings", lang)}
          </button>
        </div>
        <p className="footer-verse">
          ﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾
        </p>
      </footer>

      {/* ── Fullscreen Mushaf Overlay ── */}
      {fullPage && (
        <div
          className="mfp-overlay"
          onClick={() => setFullPage(false)}
          role="dialog"
          aria-modal="true"
          aria-label={lang === 'fr' ? 'Vue pleine page' : 'Full page view'}
        >
          <div
            className="mfp-page-container"
            onClick={e => e.stopPropagation()}
            style={{ fontFamily: isQCF4 ? undefined : quranFontCss }}
          >
            <button className="mfp-close-btn" onClick={() => setFullPage(false)} aria-label="Fermer">
              <i className="fas fa-times" />
            </button>
            <div className="mfp-page-header">
              <span className="mfp-bismillah">﷽</span>
              <span className="mfp-surah-label">
                {getSurah(currentSurah)?.ar}
              </span>
            </div>
            <div
              className="mfp-content-area"
              style={{ fontSize: `${Math.max(fontSize, 28)}px` }}
              dir="rtl"
            >
              {fullscreenAyahs.map((a) => (
                <React.Fragment key={a.number || a.numberInSurah}>
                  <span
                    className={currentPlayingAyah?.ayah === a.numberInSurah && currentPlayingAyah?.surah === currentSurah ? 'mfp-playing' : ''}
                  >
                    {a.text || ''}
                  </span>
                  {' '}
                  <span className="mfp-ayah-num">﴿{a.numberInSurah}﴾</span>
                  {' '}
                </React.Fragment>
              ))}
            </div>
            <div className="mfp-footer-bar">
              <span className="mfp-footer-text">
                {getSurah(currentSurah) ? (lang === 'fr' ? getSurah(currentSurah).fr : getSurah(currentSurah).en) : ''}
                {' · '}
                {fullscreenAyahs.length} {lang === 'fr' ? 'versets' : 'ayahs'}
              </span>
              <span className="mfp-footer-text" style={{ opacity: 0.5 }}>MushafPlus</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

