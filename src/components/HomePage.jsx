/* HomePage - orchestrateur ─ gère le state et délègue le rendu aux sous-composants Home/ */
import React, {
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useApp } from "../context/AppContext";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA } from "../data/juz";
import { getAllBookmarks, getAllNotes } from "../services/storageService";
import { getRecentVisits } from "../services/recentHistoryService";
import audioService from "../services/audioService";
import {
  getReciter,
  ensureReciterForRiwaya,
  isWarshVerifiedReciter,
  getRecitersByRiwaya,
} from "../data/reciters";
import { runWhenIdle } from "../utils/idleUtils";
import { THEMATIC_STATIONS } from "../services/StationService";
import {
  buildStationPlaylistForRiwaya,
  buildSurahPlaylistForRiwaya,
  playPlaylistWithReciter,
  reciterDownloadUrl,
} from "../services/RecitationService";
import { getResumeState, setResumeState } from "../stores/AudioQueueStore";
import Footer from "./Footer";
import { buildAudioPlaylistForSurah } from "../utils/audioPlaylist";
import ReciterDetailPage from "./recitation/ReciterDetailPage";

import {
  HOME_INITIAL_SURAHS,
  HOME_INITIAL_SURAHS_LOW,
  HOME_SURAHS_BATCH,
  HOME_FOOTER_SECTION_STYLE,
  SURAH_SEARCH_INDEX,
  DAILY_VERSES,
  MOCK_BLOG_POSTS,
  getDailyVerseIndex,
  getSuggestedSurahs,
} from "./Home/homeConstants";
import HeroSection from "./Home/HeroSection";
import DailyVerseCard from "./Home/DailyVerseCard";
import SessionCard from "./Home/SessionCard";
import StatsStrip from "./Home/StatsStrip";
import ContentSection from "./Home/ContentSection";

export default function HomePage({ lowPerfMode = false }) {
  const { state, dispatch, set } = useApp();
  const { lang, currentSurah, currentAyah, currentJuz, displayMode, riwaya } =
    state;
  const isRtl = lang === "ar";

  /* ── State local ─────────────────────────────────────────────────────── */
  const [activeTab, setActiveTab] = useState("surah");
  const [activeInfo, setActiveInfo] = useState("suggest");
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState("");
  const [reciterStyleFilter, setReciterStyleFilter] = useState("all");
  const [sortDir, setSortDir] = useState("asc");
  const [viewMode, setViewMode] = useState("grid");
  const [selectedReciterId, setSelectedReciterId] = useState(null);
  const [resumeState, setResumeLocalState] = useState(() => getResumeState());
  const [now, setNow] = useState(() => new Date());
  const [recentVisits, setRecentVisits] = useState([]);

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

  /* ── Dérivations simples ─────────────────────────────────────────────── */
  const hasReadingHistory =
    currentSurah > 1 || (currentSurah === 1 && currentAyah > 1);

  const availableReciters = useMemo(
    () => getRecitersByRiwaya(riwaya),
    [riwaya],
  );

  const selectedReciter = useMemo(
    () => availableReciters.find((r) => r.id === selectedReciterId) || null,
    [availableReciters, selectedReciterId],
  );
  const canDirectDownloadSelectedReciter =
    selectedReciter?.cdnType === "mp3quran-surah";

  /* ── Effects ─────────────────────────────────────────────────────────── */
  useEffect(() => {
    startTransition(() => {
      setActiveTab(displayMode === "juz" ? "juz" : "surah");
    });
  }, [displayMode]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cancelIdleLoad = runWhenIdle(async () => {
      const nextRecentVisits = getRecentVisits();
      try {
        const [bks, ns] = await Promise.all([getAllBookmarks(), getAllNotes()]);
        if (cancelled) return;
        startTransition(() => {
          setRecentVisits(nextRecentVisits);
          setBookmarks((bks || []).sort((a, b) => b.createdAt - a.createdAt));
          setNotes((ns || []).sort((a, b) => b.updatedAt - a.updatedAt));
        });
      } catch {
        if (cancelled) return;
        startTransition(() => {
          setRecentVisits(nextRecentVisits);
        });
      }
    });
    return () => {
      cancelled = true;
      cancelIdleLoad();
    };
  }, []);

  useEffect(() => {
    if (!selectedReciter) return;
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
      window.cancelAnimationFrame(rafId);
      document.body.style.overflow = previousBodyOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      reciterModalTriggerRef.current?.focus();
      reciterModalTriggerRef.current = null;
    };
  }, [selectedReciter]);

  /* ── Filtrage / tri ──────────────────────────────────────────────────── */
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

  /* ── Callbacks de navigation / lecture ──────────────────────────────── */
  const playFromHome = useCallback(
    async (surahNum) => {
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
        set({ displayMode: "surah", currentSurah: surahNum, currentAyah: 1 });
        audioService.loadPlaylist(items, rec.cdn, rec.cdnType || "islamic");
        audioService.play();
      } catch (error) {
        console.error("Home play error:", error);
      }
    },
    [state.reciter, state.riwaya, state.warshStrictMode, set],
  );

  const goSurah = useCallback(
    (n) => {
      set({ displayMode: "surah", showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: n, ayah: 1 } });
    },
    [set, dispatch],
  );

  const goSurahAyah = useCallback(
    (surah, ayah) => {
      set({ displayMode: "surah", showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah: ayah || 1 } });
    },
    [set, dispatch],
  );

  const goJuz = useCallback(
    (juz) => {
      set({ showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
    },
    [set, dispatch],
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
        const items = await buildSurahPlaylistForRiwaya(surahNum, riwaya);
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
        const stationItems = await buildStationPlaylistForRiwaya(
          [1, 36, 55, 67, 18],
          riwaya,
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
    set({ showHome: false, showDuas: false });
    if (displayMode === "juz")
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz } });
    else
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: currentSurah, ayah: currentAyah },
      });
  }, [set, dispatch, displayMode, currentJuz, currentSurah, currentAyah]);

  const openDuas = useCallback(
    () => set({ showHome: false, showDuas: true }),
    [set],
  );

  const selectInfoTab = useCallback((tabId) => {
    startTransition(() => {
      setActiveInfo(tabId);
    });
  }, []);

  const selectContentTab = useCallback((tabId) => {
    startTransition(() => {
      setActiveTab(tabId);
    });
  }, []);

  const changeViewMode = useCallback((nextViewMode) => {
    startTransition(() => {
      setViewMode(nextViewMode);
    });
  }, []);

  const toggleSortDirection = useCallback(() => {
    startTransition(() => {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    });
  }, []);

  /* ── Données dérivées ────────────────────────────────────────────────── */
  const dailyVerse = useMemo(
    () => DAILY_VERSES[getDailyVerseIndex(now)],
    [now],
  );
  const suggestionSet = useMemo(() => getSuggestedSurahs(now), [now]);
  const surahLabel = SURAHS[currentSurah - 1];
  const progressPct = Math.round(((Math.max(1, currentSurah) - 1) / 113) * 100);

  const riwayaLabel =
    riwaya === "warsh"
      ? lang === "fr"
        ? "Riwaya Warsh"
        : lang === "ar"
          ? "رواية ورش"
          : "Warsh"
      : lang === "fr"
        ? "Riwaya Hafs"
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
      return { fr: "Bon apres-midi", en: "Good afternoon", ar: "مساء النهار" };
    if (h >= 17 && h < 22)
      return { fr: "Bonsoir", en: "Good evening", ar: "مساء الخير" };
    return { fr: "Bonne nuit", en: "Good night", ar: "ليلة طيبة" };
  }, [now]);

  const currentPrayer = useMemo(() => {
    const h = now.getHours();
    if (h >= 4 && h < 7)
      return { icon: "fa-star", fr: "Fajr", ar: "الفجر", en: "Fajr" };
    if (h >= 7 && h < 12)
      return { icon: "fa-sun", fr: "Duha", ar: "الضحى", en: "Duha" };
    if (h >= 12 && h < 15)
      return { icon: "fa-sun", fr: "Dhuhr", ar: "الظهر", en: "Dhuhr" };
    if (h >= 15 && h < 18)
      return { icon: "fa-cloud-sun", fr: "Asr", ar: "العصر", en: "Asr" };
    if (h >= 18 && h < 20)
      return {
        icon: "fa-cloud-moon",
        fr: "Maghrib",
        ar: "المغرب",
        en: "Maghrib",
      };
    return { icon: "fa-moon", fr: "Isha", ar: "العشاء", en: "Isha" };
  }, [now]);

  const vodSurahNum = useMemo(() => {
    const match = dailyVerse.ref.match(/(\d{1,3}):\d+/);
    return match ? parseInt(match[1], 10) : null;
  }, [dailyVerse]);

  /* ── Traductions ─────────────────────────────────────────────────────── */
  const T = {
    continueReading: { fr: "Continuer", en: "Continue", ar: "متابعة القراءة" },
    startFatiha: { fr: "Al-Fatiha", en: "Al-Fatihah", ar: "البداية" },
    duas: { fr: "Douas", en: "Duas", ar: "الأدعية" },
    surahs: { fr: "Sourates", en: "Surahs", ar: "السور" },
    juz: { fr: "Juz", en: "Juz", ar: "الأجزاء" },
    recitations: { fr: "Recitations", en: "Recitations", ar: "التلاوات" },
    radio: { fr: "Radio", en: "Radio", ar: "الراديو" },
    reciters: { fr: "Recitateurs", en: "Reciters", ar: "القراء" },
    radioStations: { fr: "Stations", en: "Stations", ar: "محطات" },
    articles: { fr: "Articles", en: "Articles", ar: "مقالات" },
    search: {
      fr: "Rechercher une sourate...",
      en: "Search a surah...",
      ar: "ابحث عن سورة...",
    },
    searchReciter: {
      fr: "Rechercher un recitateur...",
      en: "Search a reciter...",
      ar: "ابحث عن قارئ...",
    },
    verseOfDay: {
      fr: "Verset du jour",
      en: "Verse of the Day",
      ar: "آية اليوم",
    },
    quickAccess: { fr: "Acces rapide", en: "Quick Access", ar: "وصول سريع" },
    noBookmarks: {
      fr: "Aucun favori - appuyez sur etoile",
      en: "No bookmarks yet",
      ar: "لا توجد إشارات",
    },
    noNotes: {
      fr: "Aucune note encore",
      en: "No notes yet",
      ar: "لا توجد ملاحظات",
    },
    noResults: {
      fr: "Aucune sourate trouvee",
      en: "No surah found",
      ar: "لم يتم العثور",
    },
    bookmarks: { fr: "Favoris", en: "Saved", ar: "المفضلة" },
    notes: { fr: "Notes", en: "Notes", ar: "ملاحظات" },
    suggest: { fr: "Suggestions", en: "Suggest", ar: "اقتراحات" },
  };
  const t = (k) =>
    T[k]?.[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"] ?? k;

  /* ── Compteurs / labels des collections ─────────────────────────────── */
  const infoTabs = [
    {
      id: "suggest",
      icon: "fa-lightbulb",
      label: t("suggest"),
      count: suggestionSet.surahs.length,
    },
    {
      id: "bookmarks",
      icon: "fa-bookmark",
      label: t("bookmarks"),
      count: bookmarks.length,
    },
    {
      id: "notes",
      icon: "fa-pen-line",
      label: t("notes"),
      count: notes.length,
    },
  ];

  const activeCollectionCount =
    activeTab === "surah"
      ? filteredSurahs.length
      : activeTab === "juz"
        ? JUZ_DATA.length
        : activeTab === "recitations"
          ? filteredReciters.length
          : activeTab === "blog"
            ? MOCK_BLOG_POSTS.length
            : THEMATIC_STATIONS.length + Math.min(8, availableReciters.length);

  const activeCollectionLabel =
    activeTab === "surah"
      ? t("surahs")
      : activeTab === "juz"
        ? t("juz")
        : activeTab === "recitations"
          ? t("reciters")
          : activeTab === "blog"
            ? t("articles")
            : t("radioStations");

  const shouldReduceHomeFx = lowPerfMode;

  /* ── Rendu ───────────────────────────────────────────────────────────── */
  return (
    <div className="hp-wrapper">
      {/* Orbes de fond (hors hero) */}
      {!shouldReduceHomeFx && (
        <div
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute -top-28 left-[6%] h-72 w-72 rounded-full blur-[110px] motion-safe:animate-pulse [animation-duration:8s]" />
          <div className="absolute top-[18%] -right-28 h-80 w-80 rounded-full blur-[120px] motion-safe:animate-pulse [animation-duration:11s]" />
          <div className="absolute -bottom-32 left-[30%] h-96 w-96 rounded-full blur-[130px] motion-safe:animate-pulse [animation-duration:9s]" />
          <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.17)_1px,transparent_1px)] [background-size:64px_64px]" />
        </div>
      )}

      {/* ── Section héro ──────────────────────────────────────────────── */}
      <HeroSection
        lang={lang}
        isRtl={isRtl}
        now={now}
        riwayaLabel={riwayaLabel}
        currentPrayer={currentPrayer}
        greeting={greeting}
        shouldReduceHomeFx={shouldReduceHomeFx}
        hasReadingHistory={hasReadingHistory}
        primaryReadingCtaLabel={primaryReadingCtaLabel}
        surahLabel={surahLabel}
        continueReading={continueReading}
        goSurah={goSurah}
        openDuas={openDuas}
        t={t}
        activeInfo={activeInfo}
        onSelectInfo={selectInfoTab}
        infoTabs={infoTabs}
        bookmarks={bookmarks}
        notes={notes}
        suggestionSet={suggestionSet}
        goSurahAyah={goSurahAyah}
      >
        <DailyVerseCard
          lang={lang}
          isRtl={isRtl}
          now={now}
          dailyVerse={dailyVerse}
          vodSurahNum={vodSurahNum}
          goSurah={goSurah}
          shouldReduceHomeFx={shouldReduceHomeFx}
          t={t}
        />
        <SessionCard
          lang={lang}
          riwayaLabel={riwayaLabel}
          readingTarget={readingTarget}
          surahLabel={surahLabel}
          displayMode={displayMode}
          bookmarks={bookmarks}
          notes={notes}
          progressPct={progressPct}
          hasReadingHistory={hasReadingHistory}
          primaryReadingCtaLabel={primaryReadingCtaLabel}
          continueReading={continueReading}
          now={now}
          t={t}
        />
      </HeroSection>

      {/* ── Layout principal (stats + grille) ─────────────────────────── */}
      <div className=" !relative !z-10">
        {/* <StatsStrip lang={lang} /> */}

        <ContentSection
          lang={lang}
          isRtl={isRtl}
          activeTab={activeTab}
          onSelectTab={selectContentTab}
          filter={filter}
          onFilterChange={setFilter}
          reciterStyleFilter={reciterStyleFilter}
          onStyleFilterChange={setReciterStyleFilter}
          sortDir={sortDir}
          onToggleSort={toggleSortDirection}
          viewMode={viewMode}
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
          goJuz={goJuz}
          playFromHome={playFromHome}
          playReciterRadio={playReciterRadio}
          playStation={playStation}
          setSelectedReciterId={setSelectedReciterId}
          availableReciters={availableReciters}
          resumeState={resumeState}
          resumeListening={resumeListening}
          onSetAudioSpeed={(speed) => {
            set({ audioSpeed: speed });
            audioService.setSpeed(speed);
          }}
          t={t}
        />
      </div>

      {/* ── Modal détail récitateur ────────────────────────────────────── */}
      {selectedReciter && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedReciterId(null)}
        >
          <ReciterDetailPage
            lang={lang}
            reciter={selectedReciter}
            canDirectDownload={canDirectDownloadSelectedReciter}
            onPlayRadio={playReciterRadio}
            onClose={() => setSelectedReciterId(null)}
            onPlaySurah={playSurahForReciter}
            onOpenSurah={(surahNum, reciter) => {
              setSelectedReciterId(null);
              set({ reciter: reciter.id, showHome: false, showDuas: false });
              dispatch({
                type: "NAVIGATE_SURAH",
                payload: { surah: surahNum, ayah: 1 },
              });
            }}
            getDownloadUrl={reciterDownloadUrl}
            dialogRef={reciterModalRef}
            closeBtnRef={reciterModalCloseBtnRef}
          />
        </div>
      )}

      {/* ── Pied de page ──────────────────────────────────────────────── */}
      <div className="relative z-10" style={HOME_FOOTER_SECTION_STYLE}>
        <Footer goSurah={goSurah} />
      </div>
    </div>
  );
}
