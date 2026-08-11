import React, {
  Suspense,
  lazy,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import "../styles/domains/search-home-polish.css";
import {
  shallowEqual,
  useAppActions,
  useAppSelector,
} from "../context/AppContext";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA } from "../data/juz";
import { getAllBookmarks, getAllNotes } from "../services/storageService";
import { getAllPlaylists } from "../services/playlistService";
import audioService from "../services/audioService";
import {
  getReciter,
  ensureReciterForRiwaya,
  isWarshVerifiedReciter,
  getRecitersByRiwaya,
} from "../data/reciters";
import { runWhenIdle } from "../utils/idleUtils";
import { shouldAvoidBackgroundWork } from "../utils/networkPolicy";
import { THEMATIC_STATIONS } from "../services/StationService";
import {
  buildContinuousRadioPlaylist,
  buildStationPlaylistForRiwaya,
  buildSurahPlaylistForRiwaya,
  playPlaylistWithReciter,
} from "../services/RecitationService";
import { getResumeState, setResumeState } from "../stores/AudioQueueStore";
import Footer from "./Footer";
import { buildAudioPlaylistForSurah } from "../utils/audioPlaylist";

let reciterDetailModulePromise;
let resolvedReciterDetailPage;
function loadReciterDetailModule() {
  if (!reciterDetailModulePromise) {
    reciterDetailModulePromise = import("./recitation/ReciterDetailPage").then(
      (module) => {
        resolvedReciterDetailPage = module.default;
        return module;
      },
    );
  }
  return reciterDetailModulePromise;
}

let reciterLibraryWarmPromise;
export function preloadReciterLibrary() {
  if (!reciterLibraryWarmPromise) {
    reciterLibraryWarmPromise = loadReciterDetailModule()
      .then(async (module) => {
        await module.preloadReciterDetailData?.();
        return module;
      })
      .catch((error) => {
        reciterDetailModulePromise = null;
        reciterLibraryWarmPromise = null;
        throw error;
      });
  }
  return reciterLibraryWarmPromise;
}

function loadQuranReaderModule() {
  return globalThis.__mushafPlusLoadQuranDisplay();
}

let quranReaderDataModulePromise;
function loadQuranReaderDataModule() {
  if (!quranReaderDataModulePromise) {
    quranReaderDataModulePromise = import(
      "./QuranDisplay/useQuranDisplayData"
    );
  }
  return quranReaderDataModulePromise;
}

const ReciterDetailPage = lazy(loadReciterDetailModule);

function ReciterDetailFallback({ lang }) {
  const label =
    lang === "ar"
      ? "\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0645\u0643\u062a\u0628\u0629 \u0627\u0644\u062a\u0644\u0627\u0648\u0627\u062a"
      : lang === "fr"
        ? "Chargement de la bibliothèque de récitations"
        : "Loading recitation library";

  return (
    <div
      className="reciter-detail reciter-detail--loading flex min-h-[min(360px,calc(100dvh-1rem))] w-[min(920px,calc(100vw-1rem))] flex-col items-center justify-center gap-4 rounded-[26px] border border-border bg-bg-primary p-8 text-center text-text-secondary shadow-2xl"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="reciter-detail__loading-spinner h-10 w-10 animate-spin rounded-full border-[3px] border-[rgba(var(--primary-rgb),0.16)] border-t-[var(--primary)]"
        aria-hidden="true"
      />
      <strong>{label}</strong>
    </div>
  );
}

import { t as i18nT } from "../i18n";
import {
  HOME_INITIAL_SURAHS,
  HOME_INITIAL_SURAHS_LOW,
  HOME_SURAHS_BATCH,
  HOME_FOOTER_SECTION_STYLE,
  SURAH_SEARCH_INDEX,
  DAILY_VERSES,
  getDailyVerseIndex,
  getSuggestedSurahs,
} from "./Home/homeConstants";
import HeroSection from "./Home/HeroSection";
import ContentSection from "./Home/ContentSection";

export default function HomePage({ lowPerfMode = false }) {
  const { dispatch, set } = useAppActions();
  const state = useAppSelector(
    (current) => ({
      lang: current.lang,
      currentSurah: current.currentSurah,
      currentAyah: current.currentAyah,
      currentJuz: current.currentJuz,
      currentPage: current.currentPage,
      displayMode: current.displayMode,
      fontFamily: current.fontFamily,
      riwaya: current.riwaya,
      reciter: current.reciter,
      favoriteReciters: current.favoriteReciters,
      warshStrictMode: current.warshStrictMode,
      isPlaying: current.isPlaying,
      currentPlayingAyah: current.currentPlayingAyah,
      homeSection: current.homeSection,
    }),
    shallowEqual,
  );
  const { lang, currentSurah, currentAyah, currentJuz, displayMode, riwaya } =
    state;
  const isRtl = lang === "ar";

  const [activeTab, setActiveTab] = useState("surah");
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [filter, setFilter] = useState("");
  const [reciterStyleFilter, setReciterStyleFilter] = useState("all");
  const [sortDir, setSortDir] = useState("asc");
  const [viewMode, setViewMode] = useState("grid");
  const [compactHomeLayout, setCompactHomeLayout] = useState(() =>
    typeof window === "undefined"
      ? false
      : window.matchMedia("(max-width: 700px)").matches,
  );
  const [selectedReciterId, setSelectedReciterId] = useState(null);
  const [resumeState, setResumeLocalState] = useState(() => getResumeState());
  const [now, setNow] = useState(() => new Date());

  const homeInitialSurahCount = lowPerfMode
    ? HOME_INITIAL_SURAHS_LOW
    : HOME_INITIAL_SURAHS;
  const [visibleSurahCount, setVisibleSurahCount] = useState(
    homeInitialSurahCount,
  );

  const deferredFilter = useDeferredValue(filter);
  const loadMoreRef = useRef(null);
  const reciterModalRef = useRef(null);
  const reciterModalCloseBtnRef = useRef(null);
  const reciterModalTriggerRef = useRef(null);

  const warmReciterDetail = useCallback(
    () => preloadReciterLibrary().catch(() => null),
    [],
  );
  const warmRecitationFlow = useCallback(
    () =>
      Promise.allSettled([
        preloadReciterLibrary(),
        loadQuranReaderModule(),
      ]),
    [],
  );

  const hasReadingHistory =
    displayMode === "page" ||
    displayMode === "juz" ||
    currentSurah > 1 ||
    (currentSurah === 1 && currentAyah > 1);

  const availableReciters = useMemo(
    () => getRecitersByRiwaya(riwaya),
    [riwaya],
  );

  const selectedReciter = useMemo(
    () => availableReciters.find((r) => r.id === selectedReciterId) || null,
    [availableReciters, selectedReciterId],
  );
  const ActiveReciterDetailPage =
    resolvedReciterDetailPage || ReciterDetailPage;

  useEffect(() => {
    startTransition(() => {
      setActiveTab(
        state.homeSection === "audio"
          ? "audio"
          : displayMode === "juz"
            ? "juz"
            : "surah",
      );
    });
  }, [displayMode, state.homeSection]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const syncLayout = (event) => setCompactHomeLayout(event.matches);
    query.addEventListener("change", syncLayout);
    return () => query.removeEventListener("change", syncLayout);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cancelIdleLoad = runWhenIdle(async () => {
      try {
        const [bks, ns, lists] = await Promise.all([
          getAllBookmarks(),
          getAllNotes(),
          getAllPlaylists(),
        ]);
        if (cancelled) return;
        startTransition(() => {
          setBookmarks((bks || []).sort((a, b) => b.createdAt - a.createdAt));
          setNotes((ns || []).sort((a, b) => b.updatedAt - a.updatedAt));
          setPlaylists(lists || []);
        });
      } catch {
        // Favorites and notes remain optional when local storage is unavailable.
      }
    });
    return () => {
      cancelled = true;
      cancelIdleLoad();
    };
  }, []);

  useEffect(
    // Profiles are useful, but must not compete with the home LCP or an
    // immediate tap on the resume-reading action on constrained phones.
    () => runWhenIdle(warmReciterDetail, lowPerfMode ? 2800 : 1600),
    [lowPerfMode, warmReciterDetail],
  );

  useEffect(() => {
    if (!selectedReciter) return;
    let cancelled = false;
    const previousActiveElement = document.activeElement;
    reciterModalTriggerRef.current =
      previousActiveElement instanceof HTMLElement
        ? previousActiveElement
        : null;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const rafId = window.requestAnimationFrame(() => {
      reciterModalCloseBtnRef.current?.focus();
    });
    loadReciterDetailModule()
      .then(() => {
        if (cancelled) return;
        window.requestAnimationFrame(() => {
          reciterModalCloseBtnRef.current?.focus();
        });
      })
      .catch(() => {});
    loadQuranReaderModule().catch(() => {});
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setSelectedReciterId(null);
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = reciterModalRef.current;
      if (!dialog) return;
      const focusable = dialog.querySelectorAll(
        'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeEl = document.activeElement;
      if (event.shiftKey && activeEl === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && activeEl === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(rafId);
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      reciterModalTriggerRef.current?.focus();
      reciterModalTriggerRef.current = null;
    };
  }, [selectedReciter]);

  const trimmedDeferredFilter = deferredFilter.trim();
  const normalizedDeferredFilter = trimmedDeferredFilter.toLowerCase();
  const hasSurahFilter = normalizedDeferredFilter.length > 0;

  const filteredSurahs = useMemo(() => {
    const source = !trimmedDeferredFilter
      ? SURAH_SEARCH_INDEX
      : SURAH_SEARCH_INDEX.filter(
          (entry) =>
            entry.ar.includes(trimmedDeferredFilter) ||
            entry.enLower.includes(normalizedDeferredFilter) ||
            entry.frLower.includes(normalizedDeferredFilter) ||
            entry.number === trimmedDeferredFilter,
        );
    const surahs = source.map((entry) => entry.surah);
    surahs.sort((a, b) => (sortDir === "asc" ? a.n - b.n : b.n - a.n));
    return surahs;
  }, [normalizedDeferredFilter, sortDir, trimmedDeferredFilter]);

  const filteredReciters = useMemo(() => {
    const favorites = new Set(state.favoriteReciters || []);
    const list = availableReciters.filter((reciter) => {
      const styleMatch =
        reciterStyleFilter === "all" ||
        (reciterStyleFilter === "favorites" && favorites.has(reciter.id)) ||
        String(reciter.style || "").toLowerCase() === reciterStyleFilter;
      if (!styleMatch) return false;
      if (!normalizedDeferredFilter) return true;
      const fr = String(reciter.nameFr || "").toLowerCase();
      const en = String(reciter.nameEn || "").toLowerCase();
      const ar = String(reciter.name || "");
      return (
        fr.includes(normalizedDeferredFilter) ||
        en.includes(normalizedDeferredFilter) ||
        ar.includes(trimmedDeferredFilter)
      );
    });
    return list.sort((a, b) => {
      const aFav = favorites.has(a.id) ? 1 : 0;
      const bFav = favorites.has(b.id) ? 1 : 0;
      if (aFav !== bFav) return bFav - aFav;
      return String(a.nameFr || a.nameEn || a.name).localeCompare(
        String(b.nameFr || b.nameEn || b.name),
      );
    });
  }, [
    availableReciters,
    normalizedDeferredFilter,
    reciterStyleFilter,
    state.favoriteReciters,
    trimmedDeferredFilter,
  ]);

  const renderedSurahs = useMemo(
    () =>
      hasSurahFilter
        ? filteredSurahs
        : filteredSurahs.slice(0, visibleSurahCount),
    [filteredSurahs, hasSurahFilter, visibleSurahCount],
  );

  const hasMoreSurahs =
    activeTab === "surah" &&
    !hasSurahFilter &&
    visibleSurahCount < filteredSurahs.length;

  const loadMoreSurahs = useCallback(() => {
    startTransition(() => {
      setVisibleSurahCount((count) =>
        Math.min(count + HOME_SURAHS_BATCH, filteredSurahs.length),
      );
    });
  }, [filteredSurahs.length]);

  useEffect(() => {
    setVisibleSurahCount(homeInitialSurahCount);
  }, [activeTab, normalizedDeferredFilter, sortDir, homeInitialSurahCount]);

  useEffect(() => {
    if (!hasMoreSurahs) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window))
      return;
    const node = loadMoreRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        loadMoreSurahs();
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreSurahs, loadMoreSurahs]);

  const playFromHome = useCallback(
    async (surahNum) => {
      if (
        audioService.isPlaying &&
        audioService.currentAyah?.surah === surahNum
      ) {
        audioService.pause();
        return;
      }
      const safeId = ensureReciterForRiwaya(state.reciter, state.riwaya);
      const rec = getReciter(safeId, state.riwaya);
      if (!rec) return;
      if (
        state.riwaya === "warsh" &&
        state.warshStrictMode &&
        !isWarshVerifiedReciter(rec)
      )
        return;
      try {
        const items = await buildAudioPlaylistForSurah(surahNum, state.riwaya);
        if (items.length === 0) return;
        audioService.loadPlaylist(items, rec.cdn, rec.cdnType || "islamic");
        await audioService.play();
        set({
          displayMode: "surah",
          currentSurah: surahNum,
          currentAyah: 1,
          isPlaying: true,
          currentPlayingAyah: { surah: surahNum, ayah: 1 },
        });
      } catch (error) {
        console.error("Home play error:", error);
      }
    },
    [
      state.reciter,
      state.riwaya,
      state.warshStrictMode,
      set,
    ],
  );

  const warmReadingTarget = useCallback(
    (mode, value) => {
      const modulePromise = loadQuranReaderModule().catch(() => null);
      if (lowPerfMode || shouldAvoidBackgroundWork()) return modulePromise;

      const dataPromise = loadQuranReaderDataModule()
        .then(({ preloadQuranDisplayData }) =>
          preloadQuranDisplayData({
            currentSurah:
              mode === "surah" ? Number(value) || currentSurah : currentSurah,
            currentPage:
              mode === "page"
                ? Number(value) || state.currentPage
                : state.currentPage,
            currentJuz:
              mode === "juz" ? Number(value) || currentJuz : currentJuz,
            displayMode: mode,
            lang,
            riwaya,
            warshStrictMode: state.warshStrictMode,
          }),
        )
        .catch(() => null);

      const fontPromise = import("../services/fontLoader")
        .then(({ ensureFontLoaded }) => ensureFontLoaded(state.fontFamily))
        .catch(() => null);

      return Promise.allSettled([modulePromise, dataPromise, fontPromise]);
    },
    [
      currentJuz,
      currentSurah,
      lang,
      lowPerfMode,
      riwaya,
      state.currentPage,
      state.fontFamily,
      state.warshStrictMode,
    ],
  );

  const warmSurah = useCallback(
    (surah) => {
      if (surah) warmReadingTarget("surah", surah);
      else loadQuranReaderModule().catch(() => null);
    },
    [warmReadingTarget],
  );

  const warmSurahIntent = useCallback(
    (surah) => {
      if (surah && !shouldAvoidBackgroundWork()) {
        loadQuranReaderDataModule()
          .then(({ preloadQuranDisplayData }) =>
            preloadQuranDisplayData({
              currentSurah: Number(surah) || currentSurah,
              currentPage: state.currentPage,
              currentJuz: currentJuz,
              displayMode: "surah",
              lang,
              riwaya,
              warshStrictMode: state.warshStrictMode,
            }),
          )
          .catch(() => null);
      }
      loadQuranReaderModule().catch(() => null);
    },
    [currentJuz, currentSurah, lang, riwaya, state.currentPage, state.warshStrictMode],
  );

  const goSurah = useCallback(
    (n) => {
      warmSurah(n);
      set({ displayMode: "surah", showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: n, ayah: 1 } });
    },
    [set, dispatch, warmSurah],
  );

  const goJuz = useCallback(
    (juz) => {
      warmReadingTarget("juz", juz);
      set({ showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
    },
    [set, dispatch, warmReadingTarget],
  );

  const openLibrary = useCallback(
    (tab = "favorites") => {
      set({
        libraryOpen: true,
        libraryTab: ["favorites", "notes", "playlists"].includes(tab)
          ? tab
          : "favorites",
      });
    },
    [set],
  );

  const toggleFavoriteReciter = useCallback(
    (reciterId) => {
      const favorites = Array.isArray(state.favoriteReciters)
        ? state.favoriteReciters
        : [];
      const next = favorites.includes(reciterId)
        ? favorites.filter((id) => id !== reciterId)
        : [...favorites, reciterId].slice(0, 24);
      set({ favoriteReciters: next });
    },
    [set, state.favoriteReciters],
  );

  const persistQueueAndResume = useCallback((items, targetReciter, source) => {
    const first = items?.[0] || {};
    setResumeState({
      surah: first.surah || 1,
      ayah: first.ayah || 1,
      reciterId: targetReciter?.id || "",
      source,
    });
    setResumeLocalState(getResumeState());
  }, []);

  const playSurahForReciter = useCallback(
    async (surahNum, targetReciter) => {
      if (!targetReciter) return;
      try {
        const items = await buildSurahPlaylistForRiwaya(
          surahNum,
          riwaya,
          targetReciter.cdnType || "islamic",
        );
        if (!items.length) return;
        const played = playPlaylistWithReciter({
          items,
          reciter: targetReciter,
          set,
        });
        if (!played) return;
        persistQueueAndResume(items, targetReciter, "reciter-surah");
      } catch (error) {
        console.error("Reciter surah play error:", error);
      }
    },
    [persistQueueAndResume, riwaya, set],
  );

  const playReciterRadio = useCallback(
    async (targetReciter) => {
      if (!targetReciter) return;
      try {
        const stationItems = await buildContinuousRadioPlaylist(
          1,
          riwaya,
          targetReciter.cdnType || "islamic",
        );
        if (!stationItems.length) return;
        const played = playPlaylistWithReciter({
          items: stationItems,
          reciter: targetReciter,
          set,
        });
        if (!played) return;
        persistQueueAndResume(stationItems, targetReciter, "reciter-radio");
      } catch (error) {
        console.error("Reciter radio play error:", error);
      }
    },
    [persistQueueAndResume, riwaya, set],
  );

  const playStation = useCallback(
    async (station) => {
      const fallbackId = ensureReciterForRiwaya(state.reciter, riwaya);
      const stationReciter =
        availableReciters.find((r) => r.id === station.reciterId) ||
        availableReciters.find((r) => r.id === fallbackId) ||
        availableReciters[0];
      if (!stationReciter) return;
      try {
        const items = await buildStationPlaylistForRiwaya(
          station.surahs,
          riwaya,
          stationReciter.cdnType || "islamic",
        );
        if (!items.length) return;
        const played = playPlaylistWithReciter({
          items,
          reciter: stationReciter,
          set,
        });
        if (!played) return;
        persistQueueAndResume(items, stationReciter, "station");
      } catch (error) {
        console.error("Station play error:", error);
      }
    },
    [availableReciters, persistQueueAndResume, riwaya, set, state.reciter],
  );

  const resumeListening = useCallback(() => {
    const current = getResumeState();
    if (!current) return;
    const reciter =
      availableReciters.find((item) => item.id === current.reciterId) ||
      availableReciters[0];
    if (!reciter) return;
    playSurahForReciter(current.surah || 1, reciter);
  }, [availableReciters, playSurahForReciter]);

  const continueReading = useCallback(() => {
    warmReadingTarget(
      displayMode,
      displayMode === "juz"
        ? currentJuz
        : displayMode === "page"
          ? state.currentPage
          : currentSurah,
    );
    set({ showHome: false, showDuas: false });
    if (displayMode === "juz")
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz } });
    else if (displayMode === "page")
      dispatch({
        type: "NAVIGATE_PAGE",
        payload: { page: state.currentPage },
      });
    else
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: currentSurah, ayah: currentAyah },
      });
  }, [
    set,
    dispatch,
    displayMode,
    currentJuz,
    currentSurah,
    currentAyah,
    state.currentPage,
    warmReadingTarget,
  ]);

  const openDuas = useCallback(
    () => set({ showHome: false, showDuas: true }),
    [set],
  );

  const selectContentTab = useCallback(
    (tabId) => {
      if (tabId === "audio") warmRecitationFlow();
      set({ homeSection: tabId });
      startTransition(() => {
        setFilter("");
        setActiveTab(tabId);
      });
    },
    [set, warmRecitationFlow],
  );

  const changeViewMode = useCallback((nextViewMode) => {
    startTransition(() => {
      setViewMode(nextViewMode);
    });
  }, []);

  const changeSortDirection = useCallback((nextSortDirection) => {
    startTransition(() => {
      setSortDir(nextSortDirection === "desc" ? "desc" : "asc");
    });
  }, []);

  const dailyVerse = useMemo(
    () => DAILY_VERSES[getDailyVerseIndex(now)],
    [now],
  );
  const suggestionSet = useMemo(() => getSuggestedSurahs(now), [now]);
  const surahLabel = SURAHS[currentSurah - 1];

  const riwayaLabel =
    riwaya === "warsh"
      ? lang === "fr"
        ? "Warsh"
        : lang === "ar"
          ? "رواية ورش"
          : "Warsh"
      : lang === "fr"
        ? "Hafs"
        : lang === "ar"
          ? "رواية حفص"
          : "Hafs";

  const readingTarget =
    displayMode === "juz"
      ? lang === "ar"
        ? `الجزء ${toAr(currentJuz)}`
        : `Juz ${currentJuz}`
      : displayMode === "page"
        ? lang === "ar"
          ? `صفحة ${toAr(state.currentPage || 1)}`
          : `${lang === "fr" ? "Page" : "Page"} ${state.currentPage || 1}`
        : lang === "ar"
          ? `${surahLabel?.ar || "الفاتحة"} · ${toAr(currentAyah)}`
          : `${lang === "fr" ? surahLabel?.fr : surahLabel?.en} · v.${currentAyah}`;

  const primaryReadingCtaLabel = hasReadingHistory
    ? lang === "ar"
      ? "متابعة القراءة"
      : lang === "fr"
        ? "Continuer"
        : "Continue"
    : lang === "ar"
      ? "ابدأ القراءة"
      : lang === "fr"
        ? "Commencer la lecture"
        : "Start reading";

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h >= 4 && h < 12)
      return { fr: "Bonjour", en: "Good morning", ar: "صباح الخير" };
    if (h >= 12 && h < 17)
      return { fr: "Bon après-midi", en: "Good afternoon", ar: "مساء النهار" };
    if (h >= 17 && h < 22)
      return { fr: "Bonsoir", en: "Good evening", ar: "مساء الخير" };
    return { fr: "Bonne nuit", en: "Good night", ar: "ليلة طيبة" };
  }, [now]);

  const vodSurahNum = useMemo(() => {
    const match = dailyVerse.ref.match(/(\d{1,3}):\d+/);
    return match ? parseInt(match[1], 10) : null;
  }, [dailyVerse]);

  const T = {
    continueReading: { fr: "Continuer", en: "Continue", ar: "متابعة القراءة" },
    startFatiha: { fr: "Al-Fatiha", en: "Al-Fatihah", ar: "البداية" },
    duas: { fr: "Douas", en: "Duas", ar: "الأدعية" },
    surahs: { fr: "Sourates", en: "Surahs", ar: "السور" },
    juz: { fr: "Juz", en: "Juz", ar: "الأجزاء" },
    recitations: { fr: "Récitations", en: "Recitations", ar: "التلاوات" },
    radio: { fr: "Radio", en: "Radio", ar: "الراديو" },
    reciters: { fr: "Récitateurs", en: "Reciters", ar: "القراء" },
    radioStations: { fr: "Stations", en: "Stations", ar: "محطات" },
    search: {
      fr: "Rechercher une sourate...",
      en: "Search a surah...",
      ar: "ابحث عن سورة...",
    },
    searchReciter: {
      fr: "Rechercher un récitateur...",
      en: "Search a reciter...",
      ar: "ابحث عن قارئ...",
    },
    verseOfDay: {
      fr: "Verset du jour",
      en: "Verse of the Day",
      ar: "آية اليوم",
    },
    quickAccess: { fr: "Accès rapide", en: "Quick Access", ar: "وصول سريع" },
    noBookmarks: {
      fr: "Aucun favori - appuyez sur l'étoile",
      en: "No bookmarks yet",
      ar: "لا توجد إشارات",
    },
    noNotes: {
      fr: "Aucune note encore",
      en: "No notes yet",
      ar: "لا توجد ملاحظات",
    },
    noResults: {
      fr: "Aucune sourate trouvée",
      en: "No surah found",
      ar: "لم يتم العثور على سورة",
    },
    bookmarks: { fr: "Favoris", en: "Saved", ar: "المفضلة" },
    notes: { fr: "Notes", en: "Notes", ar: "ملاحظات" },
    suggest: { fr: "Suggestions", en: "Suggest", ar: "اقتراحات" },
  };
  const t = (k) =>
    T[k]?.[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"] ?? k;

  const activeCollectionCount =
    activeTab === "surah"
      ? filteredSurahs.length
      : activeTab === "juz"
        ? JUZ_DATA.length
        : filteredReciters.length + THEMATIC_STATIONS.length;

  const activeCollectionLabel =
    activeTab === "surah"
      ? t("surahs")
      : activeTab === "juz"
        ? t("juz")
        : lang === "ar"
          ? "صوتيات"
          : lang === "en"
            ? "audio items"
            : "contenus audio";

  const shouldReduceHomeFx = lowPerfMode;

  return (
    <div className="hp-wrapper">
      {/* Orbes de fond (hors hero) */}
      {!shouldReduceHomeFx && (
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden="true"
        >
          <div
            className="absolute -top-28 left-[6%] h-72 w-72 rounded-full blur-[110px] motion-safe:animate-pulse [animation-duration:8s]"
            style={{ background: "radial-gradient(circle, rgba(var(--primary-rgb,11,98,53),0.30) 0%, transparent 70%)" }}
          />
          <div
            className="absolute top-[18%] -right-28 h-80 w-80 rounded-full blur-[120px] motion-safe:animate-pulse [animation-duration:11s]"
            style={{ background: "radial-gradient(circle, rgba(var(--primary-rgb,11,98,53),0.16) 0%, transparent 70%)" }}
          />
          <div
            className="absolute -bottom-32 left-[30%] h-96 w-96 rounded-full blur-[130px] motion-safe:animate-pulse [animation-duration:9s]"
            style={{ background: "radial-gradient(circle, rgba(var(--primary-rgb,11,98,53),0.22) 0%, transparent 70%)" }}
          />
        </div>
      )}

      {/* ── Section héro ──────────────────────────────────────────────── */}
      <HeroSection
        lang={lang}
        isRtl={isRtl}
        now={now}
        riwayaLabel={riwayaLabel}
        greeting={greeting}
        shouldReduceHomeFx={shouldReduceHomeFx}
        hasReadingHistory={hasReadingHistory}
        primaryReadingCtaLabel={primaryReadingCtaLabel}
        surahLabel={surahLabel}
        readingTarget={readingTarget}
        bookmarks={bookmarks}
        notes={notes}
        playlists={playlists}
        continueReading={continueReading}
        goSurah={goSurah}
        onWarmSurah={warmSurah}
        openLibrary={openLibrary}
        openDuas={openDuas}
        suggestionSet={suggestionSet}
        dailyVerse={dailyVerse}
        vodSurahNum={vodSurahNum}
      />

      {/* ── Layout principal (stats + grille) ─────────────────────────── */}
      <div className="home-content-zone !relative !z-10">
        <ContentSection
          lang={lang}
          isRtl={isRtl}
          activeTab={activeTab}
          onSelectTab={selectContentTab}
          onRecitationsIntent={warmRecitationFlow}
          onReciterIntent={warmRecitationFlow}
          filter={filter}
          onFilterChange={setFilter}
          reciterStyleFilter={reciterStyleFilter}
          onStyleFilterChange={setReciterStyleFilter}
          sortDir={sortDir}
          onChangeSort={changeSortDirection}
          viewMode={compactHomeLayout ? "list" : viewMode}
          isCompactLayout={compactHomeLayout}
          onChangeViewMode={changeViewMode}
          activeCollectionCount={activeCollectionCount}
          activeCollectionLabel={activeCollectionLabel}
          filteredSurahs={filteredSurahs}
          renderedSurahs={renderedSurahs}
          hasMoreSurahs={hasMoreSurahs}
          loadMoreSurahs={loadMoreSurahs}
          loadMoreRef={loadMoreRef}
          filteredReciters={filteredReciters}
          onToggleFavoriteReciter={toggleFavoriteReciter}
          favoriteReciters={state.favoriteReciters}
          state={state}
          goSurah={goSurah}
          onSurahIntent={warmSurah}
          goJuz={goJuz}
          playFromHome={playFromHome}
          playReciterRadio={playReciterRadio}
          playStation={playStation}
          setSelectedReciterId={setSelectedReciterId}
          resumeState={resumeState}
          resumeListening={resumeListening}
          t={(k) => i18nT(k, lang)}
        />
      </div>

      {/* ── Modal détail récitateur ────────────────────────────────────── */}
      {selectedReciter && typeof document !== "undefined"
        ? createPortal(
            <div
              className="reciter-detail-overlay fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-300"
              onClick={() => setSelectedReciterId(null)}
            >
              <Suspense fallback={<ReciterDetailFallback lang={lang} />}>
                <ActiveReciterDetailPage
                  lang={lang}
                  reciter={selectedReciter}
                  onPlayRadio={playReciterRadio}
                  onClose={() => setSelectedReciterId(null)}
                  onPlaySurah={playSurahForReciter}
                  onOpenSurahIntent={warmSurahIntent}
                  onOpenSurah={(surahNum, reciter) => {
                    warmSurah(surahNum);
                    setSelectedReciterId(null);
                    set({
                      reciter: reciter.id,
                      displayMode: "surah",
                      showHome: false,
                      showDuas: false,
                    });
                    dispatch({
                      type: "NAVIGATE_SURAH",
                      payload: { surah: surahNum, ayah: 1 },
                    });
                  }}
                  dialogRef={reciterModalRef}
                  closeBtnRef={reciterModalCloseBtnRef}
                />
              </Suspense>
            </div>,
            document.body,
          )
        : null}

      {/* ── Pied de page ──────────────────────────────────────────────── */}
      <div className="relative z-10" style={HOME_FOOTER_SECTION_STYLE}>
        <Footer goSurah={goSurah} />
      </div>
    </div>
  );
}
