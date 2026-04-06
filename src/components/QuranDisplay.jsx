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
import { getJuzForAyah } from "../data/juz";
import audioService from "../services/audioService";
import {
  ensureReciterForRiwaya,
  getDefaultReciterId,
  getReciter,
  isWarshVerifiedReciter,
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
import { addRecentVisit } from "../services/recentHistoryService";
import { FONT_MAP, resolveFontFamily } from "../data/fonts";
import { openExternalUrl } from "../lib/security";

import Footer from "./Footer";

// New sub-components
import Bismillah from "./Quran/Bismillah";
import SurahHeader from "./Quran/SurahHeader";
import TajweedLegend from "./Quran/TajweedLegend";
import SmartAyahRenderer from "./Quran/SmartAyahRenderer";
import AyahBlock from "./Quran/AyahBlock";
import AyahActions from "./AyahActions";
import CleanPageView from "./Quran/CleanPageView";
import ReadingToolbar from "./Quran/ReadingToolbar";

import "../styles/quran-display.css";

function getTranslationKeyForAyah(surahNumber, ayahNumber) {
  if (!surahNumber || !ayahNumber) return null;
  return `surah:${surahNumber}:${ayahNumber}`;
}


const TRANSLATION_LANGUAGE_META = {
  fr: { fr: "Francais", ar: "الفرنسية", en: "French", icon: "fa-language" },
  en: { fr: "Anglais", ar: "الإنجليزية", en: "English", icon: "fa-language" },
  es: { fr: "Espagnol", ar: "الإسبانية", en: "Spanish", icon: "fa-language" },
  de: { fr: "Allemand", ar: "الألمانية", en: "German", icon: "fa-language" },
  tr: { fr: "Turc", ar: "التركية", en: "Turkish", icon: "fa-language" },
  ur: { fr: "Ourdou", ar: "الأردية", en: "Urdu", icon: "fa-language" },
};

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
/*  Main QuranDisplay                                  */
/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function QuranDisplay() {
  const { state, dispatch, set } = useApp();
  const {
    displayMode,
    mushafLayout,
    currentSurah,
    currentAyah,
    currentPage,
    riwaya,
    translationLangs,
    wordTranslationLang,
    lang,
    quranFontSize,
    fontFamily,
    showTranslation,
    showTajwid,
    showWordByWord,
    showTransliteration,
    showWordTranslation,
    currentPlayingAyah,
    loading,
    currentJuz,
    theme,
    continuousPlay,
    warshStrictMode,
    syncOffsetsMs,
    memMode,
  } = state;

  const quranFontCss = resolveFontFamily(fontFamily);
  const effectiveReciterId = ensureReciterForRiwaya(state.reciter, riwaya);
  const syncKey = `${riwaya}:${effectiveReciterId}`;
  const userSyncOffsetMs = Math.max(
    -500,
    Math.min(500, Number(syncOffsetsMs?.[syncKey] ?? 0)),
  );
  const karaokeCalibration = useMemo(() => {
    const base = getKaraokeCalibration(effectiveReciterId, riwaya);
    const modeSyncBiasSec = displayMode === "surah" ? 0 : -0.02;
    const mergedOffsetSec =
      (base.offsetSec ?? 0.15) + userSyncOffsetMs / 1000 + modeSyncBiasSec;
    return {
      ...base,
      offsetSec: Math.max(-0.8, Math.min(0.95, mergedOffsetSec)),
    };
  }, [displayMode, effectiveReciterId, riwaya, userSyncOffsetMs]);

  const [ayahs, setAyahs] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [error, setError] = useState(null);
  const [sourceEdition, setSourceEdition] = useState("");
  const [isWarshFallback, setIsWarshFallback] = useState(false);
  const [isQCF4, setIsQCF4] = useState(false);
  const contentRef = useRef(null);
  const readingStartRef = useRef(Date.now());
  const continuousAutoPlayRef = useRef(false);
  const pinchRef = useRef({ startDist: null, startSize: null });
  const [activeAyah, setActiveAyah] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [fullPage, setFullPage] = useState(false);
  const [preparingSurah, setPreparingSurah] = useState(null);
  const [isCompactPhone, setIsCompactPhone] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 420px)").matches;
  });
  const followRetryTimerRef = useRef(null);
  const lastFollowKeyRef = useRef("");

  // Reading area scroll can live on .app-main (shell) or on .quran-display.
  // Always target the active scroll container to keep UX stable across layouts.
  const getScrollContainer = useCallback(() => {
    const content = contentRef.current;
    const shell = content?.closest(".app-main");
    if (shell && shell.scrollHeight - shell.clientHeight > 1) return shell;

    const docScroll =
      typeof document !== "undefined"
        ? document.scrollingElement || document.documentElement
        : null;
    if (docScroll && docScroll.scrollHeight - docScroll.clientHeight > 1) {
      return docScroll;
    }

    return shell || content || docScroll || null;
  }, []);

  // Close fullPage overlay on Escape key
  useEffect(() => {
    if (!fullPage) return;
    const handler = (e) => {
      if (e.key === "Escape") setFullPage(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [fullPage]);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(max-width: 420px)");
    const onChange = (event) => setIsCompactPhone(event.matches);

    setIsCompactPhone(media.matches);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }
    if (typeof media.addListener === "function") {
      media.addListener(onChange);
      return () => media.removeListener(onChange);
    }
    return undefined;
  }, []);

  // Track reading progress
  useEffect(() => {
    if (
      !state.showHome &&
      currentSurah &&
      currentAyah &&
      displayMode === "surah"
    ) {
      markRead(currentSurah, currentAyah);
      const meta = getSurah(currentSurah);
      addRecentVisit(currentSurah, currentAyah, meta?.fr || meta?.en || "");
    }
  }, [currentSurah, currentAyah, state.showHome, displayMode]);

  // Stable toggle callback avoids re-creating closures for each ayah row.
  const toggleAyah = useCallback((id) => {
    setActiveAyah((prev) => (prev === id ? null : id));
  }, []);

  const readingFontSize = useMemo(
    () =>
      isCompactPhone
        ? Math.min(Math.max(quranFontSize, 27), 52)
        : Math.min(Math.max(quranFontSize, 32), 64),
    [isCompactPhone, quranFontSize],
  );
  const fullscreenFontSize = useMemo(
    () =>
      isCompactPhone
        ? Math.min(Math.max(readingFontSize + 5, 40), 60)
        : Math.min(Math.max(readingFontSize + 8, 50), 72),
    [isCompactPhone, readingFontSize],
  );

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    el.style.setProperty(
      "--qd-reading-font-size",
      `${displayMode === "page" ? readingFontSize * 1.15 : readingFontSize}px`,
    );
    el.style.setProperty(
      "--qd-fullscreen-font-size",
      `${fullscreenFontSize}px`,
    );

    if (isQCF4) {
      el.style.removeProperty("--qd-font-family");
      el.dataset.qcf4Font = "true";
      return;
    }

    el.style.setProperty("--qd-font-family", quranFontCss);
    el.dataset.qcf4Font = "false";
  }, [
    displayMode,
    fullscreenFontSize,
    isQCF4,
    quranFontCss,
    readingFontSize,
  ]);

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
    document.documentElement.style.setProperty(
      "--font-quran-tajweed",
      quranFontCss,
    );
  }, [quranFontCss, isQCF4]);

  /* â”€â”€ Track scroll for back-to-top button + reading progress (throttled) â”€â”€ */
  useEffect(() => {
    const el = getScrollContainer();
    if (!el) return;
    let ticking = false;
    const handler = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setShowScrollTop(el.scrollTop > 500);
          const total = el.scrollHeight - el.clientHeight;
          if (total > 0) {
            const progress = el.scrollTop / total;
            document.documentElement.style.setProperty(
              "--reading-progress",
              progress.toString(),
            );
          }
          ticking = false;
        });
      }
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => el.removeEventListener("scroll", handler);
  }, [displayMode, ayahs.length, getScrollContainer]);

  const scrollToTop = () => {
    getScrollContainer()?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const clearFollowRetryTimer = useCallback(() => {
    if (!followRetryTimerRef.current) return;
    window.clearTimeout(followRetryTimerRef.current);
    followRetryTimerRef.current = null;
  }, []);

  const resolvePlayingAyahElement = useCallback(
    (playingAyah) => {
      if (!playingAyah) return null;

      const root = contentRef.current || document;
      const ayahNum = Number(playingAyah.ayah);
      const globalNum = Number(playingAyah.globalNumber);
      const hasAyahNum = Number.isFinite(ayahNum) && ayahNum > 0;
      const hasGlobalNum = Number.isFinite(globalNum) && globalNum > 0;

      const selectors = [];
      if (hasGlobalNum) selectors.push(`[data-ayah-global="${globalNum}"]`);
      if (playingAyah.surah && hasAyahNum) {
        selectors.push(
          `[data-surah-number="${playingAyah.surah}"][data-ayah-number="${ayahNum}"]`,
        );
      }
      if (displayMode === "surah" && hasAyahNum) {
        selectors.push(`[data-ayah-number="${ayahNum}"]`);
      }

      for (const selector of selectors) {
        const el = root.querySelector(selector);
        if (el) return el;
      }

      const ids = [];
      if (displayMode === "page") {
        if (hasGlobalNum) ids.push(`ayah-pg-${globalNum}`);
        if (hasAyahNum) ids.push(`ayah-${ayahNum}`);
      } else if (displayMode === "juz") {
        if (hasGlobalNum) ids.push(`ayah-${globalNum}`);
        if (hasAyahNum) ids.push(`ayah-${ayahNum}`);
      } else {
        if (hasAyahNum) ids.push(`ayah-${ayahNum}`);
        if (hasGlobalNum) ids.push(`ayah-${globalNum}`);
      }

      for (const id of ids) {
        const byId = root.querySelector(`#${CSS.escape(id)}`);
        if (byId) return byId;
      }

      return null;
    },
    [displayMode],
  );

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

  /* â”€â”€ Continuous play: auto-advance to next surah/juz when playlist ends â”€â”€ */
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

  /* â”€â”€ Load audio playlist when ayahs or reciter/riwaya change â”€â”€ */
  useEffect(() => {
    if (ayahs.length === 0 || !state.reciter) return;
    // Use safeReciterId directly â€” AudioPlayer's own effect already writes
    // the corrected value back to state, so we must NOT do it here too or
    // we create a set() â†’ state.reciter change â†’ effect re-fires loop.
    const safeReciterId = ensureReciterForRiwaya(state.reciter, riwaya);
    const rec = getReciter(safeReciterId, riwaya);
    if (rec) {
      if (
        riwaya === "warsh" &&
        warshStrictMode &&
        !isWarshVerifiedReciter(rec)
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

  /* â”€â”€ Auto-scroll to playing ayah â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  /* â”€â”€ Play entire surah from start â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const playSurah = useCallback(() => {
    if (ayahs.length === 0) return;
    const safeReciterId = ensureReciterForRiwaya(state.reciter, riwaya);
    const rec = getReciter(safeReciterId, riwaya);
    if (rec) {
      if (
        riwaya === "warsh" &&
        warshStrictMode &&
        !isWarshVerifiedReciter(rec)
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

  const playSpecificSurah = useCallback(
    async (surahNum) => {
      if (!surahNum || preparingSurah === surahNum) return;

      const safeReciterId = ensureReciterForRiwaya(state.reciter, riwaya);
      const rec = getReciter(safeReciterId, riwaya);
      if (!rec) return;

      if (
        riwaya === "warsh" &&
        warshStrictMode &&
        !isWarshVerifiedReciter(rec)
      ) {
        setError(t("errors.warshStrict", lang));
        return;
      }

      setPreparingSurah(surahNum);
      setError(null);

      try {
        let surahData;
        if (riwaya === "warsh") {
          try {
            surahData = await getWarshSurahFormatted(surahNum);
          } catch {
            surahData = await getSurahText(surahNum, "hafs");
          }
        } else {
          surahData = await getSurahText(surahNum, riwaya);
        }

        const playlistAyahs = (surahData?.data || surahData || []).map((a) => ({
          surah: a.surah?.number || surahNum,
          numberInSurah: a.numberInSurah,
          number: a.number,
          text: a.text,
        }));

        if (playlistAyahs.length === 0) {
          setError(
            lang === "fr"
              ? "Impossible de preparer la sourate pour la recitation."
              : "Unable to prepare this surah for playback.",
          );
          return;
        }

        audioService.loadPlaylist(
          playlistAyahs,
          rec.cdn,
          rec.cdnType || "islamic",
        );
        audioService.play();
      } catch {
        setError(
          lang === "fr"
            ? "Une erreur est survenue pendant la preparation audio."
            : "An error occurred while preparing audio playback.",
        );
      } finally {
        setPreparingSurah(null);
      }
    },
    [preparingSurah, state.reciter, riwaya, warshStrictMode, lang],
  );

  /* â”€â”€ Expose playSurah via custom DOM event so AudioPlayer can trigger it â”€â”€ */
  useEffect(() => {
    const handler = () => playSurah();
    window.addEventListener("mushaf:play-surah", handler);
    return () => window.removeEventListener("mushaf:play-surah", handler);
  }, [playSurah]);

  /* â”€â”€ Fetch data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const fetchData = useCallback(async () => {
    // Abort any previous in-flight request
    const signal = abortPendingRequests();
    dispatch({ type: "SET_LOADING", payload: true });
    setError(null);

    try {
      let arabicData;

      // â”€â”€ Primary fetch â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
            loadFontsForVerses(enriched.map((a) => a.warshWords || [])).catch(
              () => {},
            );
          } catch {
            // Warsh data unavailable â€” keep Hafs text as fallback
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
        // Don't leave loading=true â€” the newer fetch will handle it
        return;
      }

      const fetchedAyahs = arabicData?.ayahs || [];
      if (!Array.isArray(fetchedAyahs) || fetchedAyahs.length === 0) {
        throw new Error(t("errors.emptyData", lang));
      }

      // Warsh strict mode check â€” but NOT in page mode (QCF4 only supports surah/juz)
      if (
        riwaya === "warsh" &&
        warshStrictMode &&
        arabicData?.isTextFallback &&
        displayMode !== "page"
      ) {
        throw new Error(
          lang === "fr"
            ? "Mode Warsh strict: texte Warsh indisponible (fallback Hafs refuse)."
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

      // Replace all state atomically â€” new data is ready
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
      // Secondary fetch: in Warsh mode, enrich with Hafs text for tajweed/fallback rendering.
      if (riwaya === "warsh" && displayMode !== "page") {
        const hafsPromise =
          displayMode === "juz"
            ? getJuz(currentJuz, "hafs", signal)
            : getSurahText(currentSurah, "hafs", signal);

        hafsPromise
          .then((hafsData) => {
            if (signal.aborted) return;
            const hafsAyahs = hafsData?.ayahs || [];
            if (!Array.isArray(hafsAyahs) || hafsAyahs.length === 0) return;

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
          })
          .catch(() => {});
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
          }).catch(() => {});
          logWirdProgress({
            surah: sSurah,
            fromAyah: sFrom,
            toAyah: sTo,
            pagesCount,
          }).catch(() => {});
        }
      } catch {
        /* best-effort */
      }
    } catch (err) {
      // Silently ignore abort errors â€” a newer fetchData is already running
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
    lang,
    dispatch,
    warshStrictMode,
    // `set` is intentionally omitted â€” we use dispatch directly inside fetchData
    // to avoid re-triggering this callback whenever set's identity changes.
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load verse translations only when the translation layer is visible.
  // This avoids unnecessary network work and speeds up surah navigation.
  useEffect(() => {
    if (!showTranslation) {
      setTranslations([]);
      return;
    }

    const ctrl = new AbortController();
    const signal = ctrl.signal;
    setTranslations([]);

    const loadTranslations = async () => {
      try {
        const trans =
          displayMode === "page"
            ? await getPageTranslation(currentPage, translationLangs, signal)
            : displayMode === "juz"
              ? await getJuzTranslation(currentJuz, translationLangs, signal)
              : await getSurahTranslation(currentSurah, translationLangs, signal);
        if (!signal.aborted) {
          setTranslations(trans || []);
        }
      } catch (err) {
        if (err?.name !== "AbortError") {
          setTranslations([]);
        }
      }
    };

    loadTranslations();
    return () => ctrl.abort();
  }, [
    showTranslation,
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    translationLangs,
  ]);

  // Flush the final reading session duration when the component unmounts
  // (e.g. user navigates away from the reading view entirely).
  // readingStartRef is a plain ref â€” no state cleanup needed, only the
  // fire-and-forget logSession call so the session isn't lost silently.
  useEffect(() => {
    return () => {
      const elapsed = Date.now() - readingStartRef.current;
      // Only log if the user actually spent time reading (> 3 seconds)
      if (elapsed > 3000) {
        logSession({
          surah: null,
          ayahFrom: null,
          ayahTo: null,
          page: null,
          durationMs: elapsed,
        }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prefetch adjacent surah/page/juz data so next navigation is instant
  useEffect(() => {
    if (loading) return;
    const connection = navigator.connection;
    const isConstrainedConnection =
      connection?.saveData === true ||
      /2g/.test(connection?.effectiveType || "");
    if (isConstrainedConnection) return;

    const runPrefetch = () => {
      const translationLang = translationLangs[0] || "fr";
      if (displayMode === "surah") {
        if (riwaya === "warsh") {
          if (currentSurah < 114) preloadWarshSurah(currentSurah + 1);
          if (currentSurah > 1) preloadWarshSurah(currentSurah - 1);
          if (showTranslation && currentSurah < 114) {
            getSurahTranslation(currentSurah + 1, translationLang).catch(() => {});
          }
          if (showTranslation && currentSurah > 1) {
            getSurahTranslation(currentSurah - 1, translationLang).catch(() => {});
          }
        } else {
          const prefetchSurah = (surahNum) => {
            getSurahText(surahNum, riwaya).catch(() => {});
            if (showTranslation) {
              getSurahTranslation(surahNum, translationLang).catch(() => {});
            }
          };
          if (currentSurah < 114) prefetchSurah(currentSurah + 1);
          if (currentSurah > 1) prefetchSurah(currentSurah - 1);
        }
      } else if (displayMode === "page") {
        const prefetchPage = (pageNum) => {
          // Page mode is based on Hafs page boundaries, even in Warsh UI mode.
          getPage(pageNum, "hafs").catch(() => {});
          if (showTranslation) {
            getPageTranslation(pageNum, translationLang).catch(() => {});
          }
        };
        if (currentPage < 604) prefetchPage(currentPage + 1);
        if (currentPage > 1) prefetchPage(currentPage - 1);
      } else if (displayMode === "juz") {
        if (riwaya === "warsh") {
          if (currentJuz < 30) {
            getWarshJuzVerses(currentJuz + 1).catch(() => {});
            if (showTranslation) {
              getJuzTranslation(currentJuz + 1, translationLang).catch(() => {});
            }
          }
          if (currentJuz > 1) {
            getWarshJuzVerses(currentJuz - 1).catch(() => {});
            if (showTranslation) {
              getJuzTranslation(currentJuz - 1, translationLang).catch(() => {});
            }
          }
        } else {
          const prefetchJuz = (juzNum) => {
            getJuz(juzNum, riwaya).catch(() => {});
            if (showTranslation) {
              getJuzTranslation(juzNum, translationLang).catch(() => {});
            }
          };
          if (currentJuz < 30) prefetchJuz(currentJuz + 1);
          if (currentJuz > 1) prefetchJuz(currentJuz - 1);
        }
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const idleId = window.requestIdleCallback(runPrefetch, { timeout: 1200 });
      return () => window.cancelIdleCallback?.(idleId);
    }

    const timer = setTimeout(runPrefetch, 350);
    return () => clearTimeout(timer);
  }, [
    loading,
    displayMode,
    currentSurah,
    currentPage,
    currentJuz,
    riwaya,
    showTranslation,
    translationLangs,
  ]);

  // Scroll to top on navigation (instant for speed)
  useEffect(() => {
    getScrollContainer()?.scrollTo({ top: 0, behavior: "auto" });
  }, [currentSurah, currentPage, currentJuz, getScrollContainer]);

  /* â”€â”€ Scroll to specific ayah on initial navigation (e.g. from Duas page) â”€â”€ */
  // Capture the target ayah at mount time â€” only relevant when ayah > 1
  const initialScrollAyahRef = useRef(currentAyah > 1 ? currentAyah : null);
  useEffect(() => {
    const target = initialScrollAyahRef.current;
    if (!target || ayahs.length === 0 || displayMode !== "surah") return;
    initialScrollAyahRef.current = null; // consume once

    // Allow a frame for any chunk re-render, then scroll
    setTimeout(() => {
      const el = document.getElementById(`ayah-${target}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setActiveAyah(target);
      }
    }, 120);
  }, [ayahs.length, displayMode]); // eslint-disable-line react-hooks/exhaustive-deps

  /* â”€â”€ Page navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
  const goNextPage = () => {
    if (currentPage < 604) set({ currentPage: currentPage + 1 });
  };
  const goPrevPage = () => {
    if (currentPage > 1) set({ currentPage: currentPage - 1 });
  };
  const goNextSurah = () => {
    if (currentSurah < 114) {
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: currentSurah + 1 },
      });
    }
  };
  const goPrevSurah = () => {
    if (currentSurah > 1) {
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

  const toggleWordByWordMode = useCallback(() => {
    set({
      mushafLayout: "list",
      showWordByWord: !showWordByWord,
      memMode: false,
    });
  }, [set, showWordByWord]);

  /* â”€â”€ (continuous play is handled in the earlier useEffect) â”€â”€ */

  useEffect(() => {
    return () => clearFollowRetryTimer();
  }, [clearFollowRetryTimer]);

  /* Keep the currently recited ayah visible, even when chunk/page DOM changes. */
  useEffect(() => {
    clearFollowRetryTimer();

    const ayahNum = Number(currentPlayingAyah?.ayah);
    const globalNum = Number(currentPlayingAyah?.globalNumber);
    const hasAyahNum = Number.isFinite(ayahNum) && ayahNum > 0;
    const hasGlobalNum = Number.isFinite(globalNum) && globalNum > 0;

    if (!currentPlayingAyah || (!hasAyahNum && !hasGlobalNum)) return;

    let attempts = 0;
    let stopped = false;
    const followKey = `${Number(currentPlayingAyah?.surah) || 0}:${Number(currentPlayingAyah?.ayah) || 0}:${Number(currentPlayingAyah?.globalNumber) || 0}`;
    const isNewAyah = followKey !== lastFollowKeyRef.current;
    if (isNewAyah) {
      lastFollowKeyRef.current = followKey;
    }
    const maxAttempts = 10;
    const retryDelayMs = 95;

    const follow = () => {
      if (stopped) return;
      const target = resolvePlayingAyahElement(currentPlayingAyah);
      if (target) {
        const container = getScrollContainer();
        if (container) {
          const cRect = container.getBoundingClientRect();
          const eRect = target.getBoundingClientRect();
          const margin = Math.max(40, Math.min(120, cRect.height * 0.14));
          const outOfView =
            eRect.top < cRect.top + margin ||
            eRect.bottom > cRect.bottom - margin;
          if (isNewAyah || outOfView) {
            target.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          }
        }
        clearFollowRetryTimer();
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        clearFollowRetryTimer();
        return;
      }
      followRetryTimerRef.current = window.setTimeout(follow, retryDelayMs);
    };

    followRetryTimerRef.current = window.setTimeout(follow, 0);

    return () => {
      stopped = true;
      clearFollowRetryTimer();
    };
  }, [
    ayahs.length,
    currentPlayingAyah,
    currentSurah,
    displayMode,
    mushafLayout,
    resolvePlayingAyahElement,
    clearFollowRetryTimer,
    getScrollContainer,
  ]);

  // Display all ayahs (no chunking)
  const visibleAyahs = useMemo(() => {
    return ayahs;
  }, [ayahs]);

  const visibleMushafAyahs = useMemo(() => {
    return visibleAyahs;
  }, [visibleAyahs]);

  /* â”€â”€ Group ayahs by surah (memoized for page/juz mode) â”€â”€ */
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

  const pageTopSurah = useMemo(() => {
    if (displayMode !== "page") return null;
    return surahGroups[0]?.surah || currentSurah;
  }, [displayMode, surahGroups, currentSurah]);

  /* â”€â”€ Translation Map for O(1) lookup (juz mode) â”€â”€ */
  const translationMap = useMemo(() => {
    if (!Array.isArray(translations) || translations.length === 0) return null;
    const map = new Map();

    translations.forEach((edition) => {
      const editionAyahs = edition.ayahs || [];
      const inferredSurah =
        editionAyahs[0]?.surah?.number != null ? null : currentSurah;

      editionAyahs.forEach((tr) => {
        if (!tr) return;
        const surahNumber = tr.surah?.number ?? inferredSurah;
        const ayahNumber = tr.numberInSurah;
        const localKey = getTranslationKeyForAyah(surahNumber, ayahNumber);
        if (localKey) {
          const existing = map.get(localKey);
          if (existing) existing.push(tr);
          else map.set(localKey, [tr]);
        }
        if (typeof tr.number === "number") {
          const globalKey = `global:${tr.number}`;
          const existingGlobal = map.get(globalKey);
          if (existingGlobal) existingGlobal.push(tr);
          else map.set(globalKey, [tr]);
        }
      });
    });
    return map;
  }, [translations, currentSurah]);

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

  const fullscreenAyahs = useMemo(() => {
    if (displayMode === "surah" && mushafLayout === "mushaf") {
      return visibleMushafAyahs;
    }
    return visibleAyahs;
  }, [displayMode, mushafLayout, visibleMushafAyahs, visibleAyahs]);

  const canDecreaseFontSize = quranFontSize > 32;
  const canIncreaseFontSize = quranFontSize < 64;
  const decreaseFontSize = useCallback(() => {
    dispatch({
      type: "SET_QURAN_FONT_SIZE",
      payload: Math.max(32, quranFontSize - 2),
    });
  }, [dispatch, quranFontSize]);
  const increaseFontSize = useCallback(() => {
    dispatch({
      type: "SET_QURAN_FONT_SIZE",
      payload: Math.min(64, quranFontSize + 2),
    });
  }, [dispatch, quranFontSize]);

  const translationLang = translationLangs[0] || "fr";
  const verseTranslationMeta =
    TRANSLATION_LANGUAGE_META[translationLang] || TRANSLATION_LANGUAGE_META.fr;
  const wordTranslationMeta =
    TRANSLATION_LANGUAGE_META[wordTranslationLang] ||
    TRANSLATION_LANGUAGE_META.fr;
  const verseTranslationLabel =
    lang === "ar"
      ? verseTranslationMeta.ar
      : lang === "fr"
        ? verseTranslationMeta.fr
        : verseTranslationMeta.en;
  const wordTranslationLabel =
    lang === "ar"
      ? wordTranslationMeta.ar
      : lang === "fr"
        ? wordTranslationMeta.fr
        : wordTranslationMeta.en;

  /* Loading / Error states */
  // Show skeleton ONLY when we have no data at all - otherwise show stale data while loading
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
    const isNetworkError =
      ayahs.length === 0 &&
      /Failed to fetch|NetworkError|timeout|AbortError/i.test(error);
    return (
      <div className="quran-error">
        <i
          className={`fas ${isNetworkError ? "fa-wifi-slash" : "fa-circle-exclamation"}`}
        ></i>
        {isNetworkError ? (
          <>
            <p className="quran-error-network-msg">
              {lang === "fr"
                ? "Impossible de charger les donnees : verifiez votre connexion internet et reessayez."
                : "Unable to load data: please check your internet connection and try again."}
            </p>
            <p className="quran-error-detail">{error}</p>
          </>
        ) : (
          <p>{error}</p>
        )}
        <div className="quran-error-actions">
          <button className="btn btn-primary" onClick={fetchData}>
            {t("errors.retry", lang)}
          </button>
          <button className="btn btn-outline" onClick={repairPlatform}>
            {lang === "fr" ? "Reparer la plateforme" : "Repair Platform"}
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
            {lang === "fr" ? "Reparer la plateforme" : "Repair Platform"}
          </button>
        </div>
      </div>
    );
  }

  const showRiwayaStar = riwaya === "warsh" && isQCF4;
  const riwayaBadgeClassName = `page-header-bar__riwaya-badge${
    riwaya === "warsh" ? " is-warsh" : ""
  }`;
  const modePaneShellClass =
    "rd-wrapper mx-auto flex max-w-[1040px] flex-col gap-[1.2rem] px-[0.9rem] pt-[1.15rem] pb-[calc(var(--player-h,88px)+2.4rem)] max-[640px]:gap-[0.9rem] max-[640px]:px-[0.56rem] max-[640px]:pt-[0.78rem] max-[640px]:pb-[calc(var(--player-h,88px)+1.6rem)] max-[560px]:landscape:gap-[0.66rem] max-[560px]:landscape:px-[0.62rem] max-[560px]:landscape:pt-[0.58rem] max-[560px]:landscape:pb-[calc(var(--player-h,88px)+1rem)]";
  const mushafToggleBarClass = "hp-tabs"; // We can reuse hp-tabs or similar, but let's keep it simple
  const listSurfaceClass = "";

  return (
    <>
      <div className="reading-progress-bar" aria-hidden="true" />
      <div
        className={`quran-display quran-display--${riwaya} quran-display--platform`}
        ref={contentRef}
        onTouchStart={(e) => {
          if (e.touches.length === 2) {
            const d = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY,
            );
            pinchRef.current = { startDist: d, startSize: quranFontSize };
          }
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 2 && pinchRef.current.startDist) {
            const d = Math.hypot(
              e.touches[0].clientX - e.touches[1].clientX,
              e.touches[0].clientY - e.touches[1].clientY,
            );
            const scale = d / pinchRef.current.startDist;
            const next = Math.round(
              Math.max(32, Math.min(64, pinchRef.current.startSize * scale)),
            );
            if (next !== quranFontSize)
              dispatch({ type: "SET_QURAN_FONT_SIZE", payload: next });
          }
        }}
        onTouchEnd={() => {
          pinchRef.current = { startDist: null, startSize: null };
        }}
      >
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
        {/* Warsh fallback â€” if QCF4 failed and using Hafs text */}
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
            <button
              type="button"
              onClick={() =>
                openExternalUrl(
                  "https://archive.org/download/MushafAlMadinahWarsh5488865/Mushaf%20AlMadinah_Warsh.pdf",
                )
              }
              className="warsh-mushaf-link"
            >
              <i className="fas fa-external-link-alt"></i>
              {t("settings.warshMushafLink", lang)}
            </button>
          </div>
        )}

        {/* Surah mode */}
        {displayMode === "surah" && (
          <div
            role="region"
            aria-label={t("settings.surahMode", lang)}
            className={`quran-mode-pane quran-mode-pane--surah ${modePaneShellClass}`}
          >
            {/* Surah Header & Bismillah */}
            {!(isQCF4 && mushafLayout === "mushaf") && (
              <div className="qc-surah-header-wrap animate-in">
                <SurahHeader surahNum={currentSurah} lang={lang} />
                {currentSurah !== 1 &&
                  currentSurah !== 9 &&
                  mushafLayout !== "mushaf" && <Bismillah />}
              </div>
            )}

            {/* Quran.com-style Reading Toolbar */}
            <ReadingToolbar
              surahNum={currentSurah}
              onPlaySurah={playSurah}
              preparingSurah={preparingSurah}
            />

            {/* Tajweed Legend */}
            <TajweedLegend lang={lang} visible={showTajwid} riwaya={riwaya} />

            {/* Mushaf page layout - Clean Page Style (Quran.com like) */}
            {mushafLayout === "mushaf" && (
              <>
                <CleanPageView
                  ayahs={visibleMushafAyahs}
                  lang={lang}
                  fontSize={readingFontSize}
                  isQCF4={isQCF4}
                  showTajwid={showTajwid}
                  currentPlayingAyah={currentPlayingAyah}
                  surahNum={currentSurah}
                  calibration={karaokeCalibration}
                  riwaya={riwaya}
                  showTranslation={showTranslation}
                  getTranslation={getTranslationForAyah}
                  onAyahClick={(n) => toggleAyah(n)}
                />
                
                {activeAyah && (
                  <div className="ayah-actions-modal-overlay" onClick={() => toggleAyah(null)}>
                    <div className="ayah-actions-modal-content animate-reveal-up" onClick={(e) => e.stopPropagation()}>
                      <button className="ayah-actions-modal-close" onClick={() => toggleAyah(null)}>
                        <i className="fas fa-times"></i>
                      </button>
                      <AyahActions
                        surah={currentSurah}
                        ayah={activeAyah}
                        ayahData={visibleMushafAyahs.find(a => a.numberInSurah === activeAyah)}
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* List layout (default) - chunks + ayah blocks */}
            {mushafLayout !== "mushaf" && (
              <>
                {/* Ayah list - plain render, no virtual scroll */}
                <div
                  role="list"
                  className={`surah-ayahs-list ${listSurfaceClass}`}
                >
                  {visibleAyahs.map((ayah, idx) => {
                    const isPlayingAyah =
                      currentPlayingAyah?.ayah === ayah.numberInSurah &&
                      currentPlayingAyah?.surah === currentSurah;

                    // Add page separator if this ayah is on a new page
                    const showPageSeparator =
                      idx > 0 && visibleAyahs[idx - 1].page !== ayah.page;
                    const trans = visibleTranslations[idx] || null;
                    return (
                      <React.Fragment key={ayah.number}>
                        {showPageSeparator && (
                          <div className="page-separator relative my-[2.25rem] flex items-center justify-center gap-[0.85rem] py-4 max-[640px]:my-[1.5rem] max-[640px]:gap-[0.6rem] max-[640px]:py-3">
                            <span className="page-separator-line h-px flex-1 rounded-[1px] bg-[linear-gradient(to_right,transparent,rgba(var(--primary-rgb,27,94,59),0.35)_35%,rgba(var(--primary-rgb,27,94,59),0.55)_65%,transparent)]"></span>
                            <span
                              className={`page-separator-text inline-flex items-center gap-[0.45rem] whitespace-nowrap rounded-full border border-[rgba(var(--primary-rgb,27,94,59),0.18)] bg-[rgba(var(--primary-rgb,27,94,59),0.04)] px-[0.65rem] py-[0.2rem] font-[var(--font-ui,sans-serif)] text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[var(--primary,#d4a822)] transition-[opacity,background] duration-200 before:text-[0.4em] before:leading-none before:text-[var(--gold,#b8860b)] before:opacity-60 before:content-['◆'] after:text-[0.4em] after:leading-none after:text-[var(--gold,#b8860b)] after:opacity-60 after:content-['◆'] max-[640px]:px-[0.5rem] max-[640px]:py-[0.15rem] max-[640px]:text-[0.68rem] max-[640px]:tracking-[0.05em]${theme === "dark" || theme === "night-blue" ? " border-[rgba(var(--primary-rgb,42,158,94),0.2)] bg-[rgba(var(--primary-rgb,42,158,94),0.06)] opacity-[0.62]" : " opacity-[0.72]"}`}
                            >
                              {lang === "ar" ? "صفحة" : "Page"}{" "}
                              {lang === "ar" ? toAr(ayah.page) : ayah.page}
                            </span>
                            <span className="page-separator-line h-px flex-1 rounded-[1px] bg-[linear-gradient(to_left,transparent,rgba(var(--primary-rgb,27,94,59),0.35)_35%,rgba(var(--primary-rgb,27,94,59),0.55)_65%,transparent)]"></span>
                          </div>
                        )}
                        <AyahBlock
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
                          fontSize={readingFontSize}
                          memMode={memMode}
                          toggleId={ayah.numberInSurah}
                          onToggleActive={toggleAyah}
                        />
                      </React.Fragment>
                    );
                  })}
                </div>
              </>
            )}

            {/* Surah navigation - always shown */}
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
            className={`quran-mode-pane quran-mode-pane--page ${modePaneShellClass}`}
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
                  {getJuzForAyah(
                    ayahs[0].surah?.number,
                    ayahs[0].numberInSurah,
                  )}
                </span>
              )}
              <span className={riwayaBadgeClassName}>
                {showRiwayaStar && (
                  <i className="fas fa-star page-header-bar__riwaya-star"></i>
                )}
                {riwaya === "warsh" ? "WARSH" : "HAFS"}
              </span>
            </div>

            {!isQCF4 && pageTopSurah && (
              <div className="page-mode-top-surah mx-auto mt-[0.4rem] mb-[0.78rem]">
                <SurahHeader surahNum={pageTopSurah} lang={lang} />
              </div>
            )}

            {/* Layout mode toggle */}
            <div className={mushafToggleBarClass}>
              {/* Toggle between List and Word-by-word */}
              <button
                className={`mushaf-layout-btn${showWordByWord ? " active" : ""}`}
                onClick={toggleWordByWordMode}
                title={
                  showWordByWord
                    ? lang === "fr"
                      ? "Afficher en liste"
                      : lang === "ar"
                        ? "عرض كقائمة"
                        : "Show as list"
                    : lang === "fr"
                      ? "Afficher mot à mot"
                      : lang === "ar"
                        ? "عرض كلمة بكلمة"
                        : "Show word by word"
                }
              >
                <i className={`fas ${showWordByWord ? "fa-language" : "fa-list-ul"}`}></i>
                <span>
                  {showWordByWord
                    ? lang === "fr"
                      ? "Mot à mot"
                      : lang === "ar"
                        ? "كلمة بكلمة"
                        : "Word by Word"
                    : lang === "fr"
                      ? "Liste"
                      : lang === "ar"
                        ? "قائمة"
                        : "List"}
                </span>
              </button>
              <span className="mushaf-layout-sep" />
              {/* Mushaf mode */}
              <button
                className={`mushaf-layout-btn${mushafLayout === "mushaf" ? " active" : ""}`}
                onClick={() =>
                  set({
                    mushafLayout: mushafLayout === "mushaf" ? "list" : "mushaf",
                    showWordByWord: false,
                    memMode: false,
                    showTajwid: true,
                    fontFamily: "mushaf-tajweed",
                  })
                }
                title={lang === "fr" ? "Vue Mushaf" : "Mushaf view"}
              >
                <i className="fas fa-book-open"></i>
                {lang === "fr" ? "Mushaf" : "Mushaf"}
              </button>
              <span className="mushaf-layout-sep" />
              {/* Memorization mode */}
              <button
                className={`mushaf-layout-btn${memMode ? " active" : ""}`}
                onClick={() =>
                  set({
                    mushafLayout: "list",
                    memMode: !memMode,
                    showWordByWord: false,
                  })
                }
                title={
                  lang === "fr" ? "Mode mémorisation" : "Memorization mode"
                }
              >
                <i className="fas fa-graduation-cap"></i>
                {lang === "fr" ? "Mémorisation" : "Memorize"}
              </button>
            </div>

            {/* Vue Mushaf - Clean Page Style (Quran.com like) - une CleanPageView par sourate */}
            {mushafLayout === "mushaf" &&
              surahGroups.map((group, gi) => (
                <CleanPageView
                  key={`cpv-pg-${group.surah}-${gi}`}
                  ayahs={group.ayahs}
                  lang={lang}
                  fontSize={readingFontSize}
                  isQCF4={isQCF4}
                  showTajwid={showTajwid}
                  currentPlayingAyah={currentPlayingAyah}
                  surahNum={group.surah}
                  calibration={karaokeCalibration}
                  riwaya={riwaya}
                  showTranslation={showTranslation}
                  getTranslation={getTranslationForAyah}
                  onAyahClick={(n) => toggleAyah(n)}
                  showSurahHeader={false}
                />
              ))}

            {activeAyah && mushafLayout === "mushaf" && (
              <div className="ayah-actions-modal-overlay" onClick={() => toggleAyah(null)}>
                <div className="ayah-actions-modal-content animate-reveal-up" onClick={(e) => e.stopPropagation()}>
                  <button className="ayah-actions-modal-close" onClick={() => toggleAyah(null)}>
                    <i className="fas fa-times"></i>
                  </button>
                  <AyahActions
                    surah={ayahs.find(a => a.number === activeAyah || a.numberInSurah === activeAyah)?.surah?.number || currentSurah}
                    ayah={activeAyah}
                    ayahData={ayahs.find(a => a.numberInSurah === activeAyah || a.number === activeAyah)}
                  />
                </div>
              </div>
            )}

            {/* Vue liste - utilise AyahBlock (coherent avec sourate/juz) */}
            {mushafLayout !== "mushaf" && (
              <div className={listSurfaceClass}>
                {surahGroups.map((group, gi) => (
                  <div key={gi}>

                    <div className="surah-ayahs-list">
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
                            fontSize={readingFontSize}
                            memMode={memMode}
                            toggleId={ayah.number}
                            onToggleActive={toggleAyah}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Navigation */}
            <div className="quran-nav">
              <button
                className="btn btn-outline"
                onClick={goPrevPage}
                disabled={currentPage <= 1}
              >
                <i
                  className={`fas fa-arrow-${lang === "ar" ? "right" : "left"}`}
                ></i>
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
                <i
                  className={`fas fa-arrow-${lang === "ar" ? "left" : "right"}`}
                ></i>
              </button>
            </div>
          </div>
        )}

        {/* Juz mode */}
        {displayMode === "juz" && (
          <div
            role="region"
            aria-label={t("settings.juzMode", lang)}
            className={`quran-mode-pane quran-mode-pane--juz ${modePaneShellClass}`}
          >
            {/* En-tete Juz */}
            <div className="page-header-bar">
              <span>
                <i
                  className="fas fa-book-open page-header-bar__lead-icon"
                ></i>
                {t("sidebar.juz", lang)}{" "}
                {lang === "ar" ? toAr(currentJuz) : currentJuz}
              </span>
              <span className={riwayaBadgeClassName}>
                {showRiwayaStar && (
                  <i className="fas fa-star page-header-bar__riwaya-star"></i>
                )}
                {riwaya === "warsh" ? "WARSH" : "HAFS"}
              </span>
            </div>

            {/* Layout mode toggle */}
            <div className={mushafToggleBarClass}>
              {/* Toggle between List and Word-by-word */}
              <button
                className={`mushaf-layout-btn${showWordByWord ? " active" : ""}`}
                onClick={toggleWordByWordMode}
                title={
                  showWordByWord
                    ? lang === "fr"
                      ? "Afficher en liste"
                      : lang === "ar"
                        ? "عرض كقائمة"
                        : "Show as list"
                    : lang === "fr"
                      ? "Afficher mot à mot"
                      : lang === "ar"
                        ? "عرض كلمة بكلمة"
                        : "Show word by word"
                }
              >
                <i className={`fas ${showWordByWord ? "fa-language" : "fa-list-ul"}`}></i>
                <span>
                  {showWordByWord
                    ? lang === "fr"
                      ? "Mot à mot"
                      : lang === "ar"
                        ? "كلمة بكلمة"
                        : "Word by Word"
                    : lang === "fr"
                      ? "Liste"
                      : lang === "ar"
                        ? "قائمة"
                        : "List"}
                </span>
              </button>
              <span className="mushaf-layout-sep" />
              {/* Mushaf mode */}
              <button
                className={`mushaf-layout-btn${mushafLayout === "mushaf" ? " active" : ""}`}
                onClick={() =>
                  set({
                    mushafLayout: mushafLayout === "mushaf" ? "list" : "mushaf",
                    showWordByWord: false,
                    memMode: false,
                    showTajwid: true,
                    fontFamily: "mushaf-tajweed",
                  })
                }
              >
                <i className="fas fa-book-open"></i>
                {lang === "fr" ? "Mushaf" : "Mushaf"}
              </button>
              <span className="mushaf-layout-sep" />
              {/* Memorization mode */}
              <button
                className={`mushaf-layout-btn${memMode ? " active" : ""}`}
                onClick={() =>
                  set({
                    mushafLayout: "list",
                    memMode: !memMode,
                    showWordByWord: false,
                  })
                }
                title={
                  lang === "fr" ? "Mode mémorisation" : "Memorization mode"
                }
              >
                <i className="fas fa-graduation-cap"></i>
                {lang === "fr" ? "Mémorisation" : "Memorize"}
              </button>
            </div>

            {/* Vue Mushaf - Clean Page Style (Quran.com like) - une CleanPageView par sourate */}
            {mushafLayout === "mushaf" &&
              surahGroups.map((group, gi) => (
                <CleanPageView
                  key={`cpv-jz-${group.surah}-${gi}`}
                  ayahs={group.ayahs}
                  lang={lang}
                  fontSize={readingFontSize}
                  isQCF4={isQCF4}
                  showTajwid={showTajwid}
                  currentPlayingAyah={currentPlayingAyah}
                  surahNum={group.surah}
                  calibration={karaokeCalibration}
                  riwaya={riwaya}
                  showTranslation={showTranslation}
                  getTranslation={getTranslationForAyah}
                />
              ))}

            {/* Vue liste */}
            {mushafLayout !== "mushaf" && (
              <div role="list" className={listSurfaceClass}>
                {surahGroups.map((group, gi) => (
                  <div key={gi}>
                    {!isQCF4 &&
                      displayMode !== "page" &&
                      group.ayahs[0]?.numberInSurah === 1 && (
                      <SurahHeader surahNum={group.surah} lang={lang} />
                    )}
                    {!isQCF4 &&
                      displayMode !== "page" &&
                      group.ayahs[0]?.numberInSurah === 1 &&
                      group.surah !== 1 &&
                      group.surah !== 9 && <Bismillah />}

                    {!isQCF4 &&
                      displayMode !== "page" &&
                      group.ayahs[0]?.numberInSurah === 1 && (
                      <div className="play-surah-bar mt-3 mb-2 flex justify-center">
                        <button
                          className="btn-play-surah"
                          type="button"
                          onClick={() => playSpecificSurah(group.surah)}
                          disabled={preparingSurah === group.surah}
                          title={t("audio.playSurah", lang)}
                        >
                          <i className="fas fa-play"></i>
                          <span>
                            {preparingSurah === group.surah
                              ? lang === "fr"
                                ? "Preparation..."
                                : "Preparing..."
                              : t("audio.playSurah", lang)}
                          </span>
                        </button>
                      </div>
                    )}

                    <div
                      className="surah-ayahs-list"
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
                            fontSize={readingFontSize}
                            memMode={memMode}
                            toggleId={ayah.number}
                            onToggleActive={toggleAyah}
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
              <button
                className="btn btn-outline"
                onClick={goPrevJuz}
                disabled={currentJuz <= 1}
              >
                <i
                  className={`fas fa-arrow-${lang === "ar" ? "right" : "left"}`}
                ></i>
                {t("quran.prevJuz", lang)}
              </button>
              <span className="page-indicator">
                {t("sidebar.juz", lang)}{" "}
                {lang === "ar" ? toAr(currentJuz) : currentJuz} / 30
              </span>
              <button
                className="btn btn-outline"
                onClick={goNextJuz}
                disabled={currentJuz >= 30}
              >
                {t("quran.nextJuz", lang)}
                <i
                  className={`fas fa-arrow-${lang === "ar" ? "left" : "right"}`}
                ></i>
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
            aria-label={t("nav.scrollTop", lang)}
          >
            <i className="fas fa-chevron-up"></i>
          </button>
        )}

        {/* Shared Site Footer */}
        <Footer
          goSurah={(n) => {
            set({ displayMode: "surah", showHome: false, showDuas: false });
            dispatch({
              type: "NAVIGATE_SURAH",
              payload: { surah: n, ayah: 1 },
            });
          }}
        />

        {/* Fullscreen Mushaf Overlay */}
        {fullPage && (
          <div
            className="mfp-overlay"
            onClick={() => setFullPage(false)}
            role="dialog"
            aria-modal="true"
            aria-label={lang === "fr" ? "Vue pleine page" : "Full page view"}
          >
            <div
              className="mfp-page-container"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="mfp-close-btn"
                onClick={() => setFullPage(false)}
                aria-label="Fermer"
              >
                <i className="fas fa-times" />
              </button>
              <div className="mfp-page-header">
                <div className="mfp-page-header__top">
                  <span className="mfp-page-chip">
                    {riwaya === "warsh"
                      ? lang === "ar"
                        ? "ورش"
                        : "Warsh"
                      : lang === "ar"
                        ? "حفص"
                        : "Hafs"}
                  </span>
                  <span className="mfp-page-chip">
                    {t("quran.page", lang)}{" "}
                    {lang === "ar" ? toAr(currentPage) : currentPage}
                  </span>
                </div>
                <span className="mfp-bismillah">ï·½</span>
                <span className="mfp-surah-label">
                  {getSurah(currentSurah)?.ar}
                </span>
              </div>
              <div
                className="mfp-content-area"
                dir="rtl"
              >
                {ayahs.map((a) => (
                  <React.Fragment key={a.number || a.numberInSurah}>
                    <span
                      className={
                        currentPlayingAyah?.ayah === a.numberInSurah &&
                        currentPlayingAyah?.surah === currentSurah
                          ? "mfp-playing"
                          : ""
                      }
                    >
                      {a.text || ""}
                    </span>{" "}
                    <span className="mfp-ayah-num">
                      ﴿{a.numberInSurah}﴾
                    </span>{" "}
                  </React.Fragment>
                ))}
              </div>
              <div className="mfp-footer-bar">
                <span className="mfp-footer-text">
                  {getSurah(currentSurah)
                    ? lang === "fr"
                      ? getSurah(currentSurah).fr
                      : getSurah(currentSurah).en
                    : ""}
                  {" · "}
                  {ayahs.length} {lang === "fr" ? "versets" : "ayahs"}
                </span>
                <span className="mfp-footer-text mfp-footer-text--muted">
                  MushafPlus
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
