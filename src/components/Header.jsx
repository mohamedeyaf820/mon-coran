import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  shallowEqual,
  useAppActions,
  useAppSelector,
} from "../context/AppContext";
import { t as i18nT } from "../i18n";
import {
  getSurah,
  getSurahForPage,
  getSurahLigature,
  toAr,
} from "../data/surahs";
import { normalizeFontId } from "../data/fonts";
import { cn } from "../lib/utils";
import {
  ARABIC_FONT_SIZE_MAX,
  ARABIC_FONT_SIZE_MIN,
  clampArabicFontSize,
} from "../utils/arabicTypography";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import PlatformLogo from "./PlatformLogo";
import {
  Search,
  Settings,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  HandHeart,
  CalendarCheck,
  Menu,
  Shapes,
  X,
  Home,
  SunMoon,
  Type,
  Minus,
  Plus,
  BookOpen,
  List,
} from "lucide-react";

export default function Header({ immersiveHidden = false }) {
  const { dispatch, set } = useAppActions();
  const state = useAppSelector(
    (current) => ({
      lang: current.lang,
      currentSurah: current.currentSurah,
      currentAyah: current.currentAyah,
      displayMode: current.displayMode,
      currentPage: current.currentPage,
      currentJuz: current.currentJuz,
      riwaya: current.riwaya,
      fontFamily: current.fontFamily,
      fontFamilyByRiwaya: current.fontFamilyByRiwaya,
      warshStrictMode: current.warshStrictMode,
      showHome: current.showHome,
      showDuas: current.showDuas,
      showPrayers: current.showPrayers,
      legalPage: current.legalPage,
      sidebarOpen: current.sidebarOpen,
      theme: current.theme,
      quranFontSize: current.quranFontSize,
      mushafLayout: current.mushafLayout,
    }),
    shallowEqual,
  );
  const {
    lang,
    currentSurah,
    currentAyah,
    displayMode,
    currentPage,
    currentJuz,
    riwaya,
    showHome,
    showDuas,
    legalPage,
    sidebarOpen,
    theme,
    quranFontSize,
    mushafLayout,
  } = state;

  const [goToValue, setGoToValue] = useState("");
  const [goToOpen, setGoToOpen] = useState(false);
  const [goToError, setGoToError] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const inputRef = useRef(null);
  const headerRef = useRef(null);
  const navigationRequestRef = useRef(0);
  const riwayaRequestRef = useRef(0);

  const isRtl = lang === "ar";

  useEffect(() => {
    const updateHeaderHeight = () => {
      const el = headerRef.current;
      if (!el) return;
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0) {
        document.documentElement.style.setProperty("--header-h", `${h}px`);
      }
    };

    updateHeaderHeight();
    let ro;
    if (typeof ResizeObserver !== "undefined" && headerRef.current) {
      ro = new ResizeObserver(updateHeaderHeight);
      ro.observe(headerRef.current);
    }
    window.addEventListener("resize", updateHeaderHeight, { passive: true });
    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
      ro?.disconnect();
    };
  }, [showHome, showDuas, legalPage, displayMode, lang, riwaya]);

  // Compact header on scroll (reading view only)
  const [headerCompact, setHeaderCompact] = useState(false);
  useEffect(() => {
    if (showHome || showDuas || legalPage) {
      setHeaderCompact(false);
      return;
    }
    const mainEl = document.querySelector("#main-content");
    if (!mainEl) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setHeaderCompact(mainEl.scrollTop > 100);
        ticking = false;
      });
    };
    mainEl.addEventListener("scroll", onScroll, { passive: true });
    return () => mainEl.removeEventListener("scroll", onScroll);
  }, [showHome, showDuas, legalPage]);

  useEffect(() => {
    if (!goToOpen) return;
    setGoToError(false);
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [goToOpen]);

  const goHome = () => set({ legalPage: null, showHome: true, showDuas: false, showPrayers: false });
  const openDuas = () => set({ legalPage: null, showDuas: true, showHome: false, showPrayers: false });
  const openPrayers = () =>
    set({ legalPage: null, showPrayers: true, showHome: false, showDuas: false });
  const openSearch = () => dispatch({ type: "TOGGLE_SEARCH" });
  const openSettings = () => dispatch({ type: "TOGGLE_SETTINGS" });
  const openLibrary = () => set({ libraryOpen: true, libraryTab: "favorites" });
  const isReadingView = !showHome && !showDuas && !legalPage;
  const changeArabicFontSize = (delta) => {
    set({
      quranFontSize: clampArabicFontSize(Number(quranFontSize) + delta),
    });
  };
  const selectReadingLayout = (layout) => {
    set({ mushafLayout: layout });
  };
  const cycleTheme = () => {
    const themes = ["light", "sepia", "dark"];
    const currentIndex = Math.max(0, themes.indexOf(theme));
    set({ theme: themes[(currentIndex + 1) % themes.length] });
  };
  const warmReadingTarget = useCallback(
    (mode, value, targetRiwaya = riwaya) => {
      if (showHome || showDuas || legalPage) return Promise.resolve(null);
      return import("./QuranDisplay/useQuranDisplayData")
        .then(({ preloadQuranDisplayData }) =>
          preloadQuranDisplayData({
            currentSurah: mode === "surah" ? value : currentSurah,
            currentPage: mode === "page" ? value : currentPage,
            currentJuz: mode === "juz" ? value : currentJuz,
            displayMode: mode,
            lang,
            riwaya: targetRiwaya,
            warshStrictMode: state.warshStrictMode,
          }),
        )
        .catch(() => null);
    },
    [
      currentJuz,
      currentPage,
      currentSurah,
      lang,
      legalPage,
      riwaya,
      state.warshStrictMode,
      showDuas,
      showHome,
    ],
  );

  const warmRiwaya = useCallback(
    (targetRiwaya) => {
      if (targetRiwaya === riwaya) return Promise.resolve(null);
      const targetFont = normalizeFontId(
        state.fontFamilyByRiwaya?.[targetRiwaya] || state.fontFamily,
        targetRiwaya,
      );
      return Promise.allSettled([
        warmReadingTarget(displayMode, displayMode === "page" ? currentPage : displayMode === "juz" ? currentJuz : currentSurah, targetRiwaya),
        import("../services/fontLoader")
          .then(({ ensureFontLoaded }) => ensureFontLoaded(targetFont))
          .catch(() => null),
      ]);
    }, [
      currentJuz,
      currentPage,
      currentSurah,
      displayMode,
      riwaya,
      state.fontFamily,
      state.fontFamilyByRiwaya,
      warmReadingTarget,
    ],
  );

  const selectRiwaya = useCallback(
    async (targetRiwaya) => {
      const normalized = targetRiwaya === "warsh" ? "warsh" : "hafs";
      const requestId = riwayaRequestRef.current + 1;
      riwayaRequestRef.current = requestId;
      if (normalized === riwaya) return;
      await warmRiwaya(normalized);
      if (riwayaRequestRef.current !== requestId) return;
      set({ riwaya: normalized });
    },
    [riwaya, set, warmRiwaya],
  );

  const navigateReadingTarget = useCallback(
    async (mode, value) => {
      const requestId = navigationRequestRef.current + 1;
      navigationRequestRef.current = requestId;
      await warmReadingTarget(mode, value);
      if (navigationRequestRef.current !== requestId) return;
      set({ showHome: false, showDuas: false });
      if (mode === "page") {
        dispatch({ type: "NAVIGATE_PAGE", payload: { page: value } });
      } else if (mode === "juz") {
        dispatch({ type: "NAVIGATE_JUZ", payload: { juz: value } });
      } else {
        dispatch({ type: "NAVIGATE_SURAH", payload: { surah: value, ayah: 1 } });
      }
    },
    [dispatch, set, warmReadingTarget],
  );

  const canGoPrev =
    displayMode === "page"
      ? currentPage > 1
      : displayMode === "juz"
        ? currentJuz > 1
        : currentSurah > 1;
  const canGoNext =
    displayMode === "page"
      ? currentPage < 604
      : displayMode === "juz"
        ? currentJuz < 30
        : currentSurah < 114;

  const handlePrev = () => {
    if (displayMode === "page" && currentPage > 1) {
      navigateReadingTarget("page", currentPage - 1);
    } else if (displayMode === "juz" && currentJuz > 1) {
      navigateReadingTarget("juz", currentJuz - 1);
    } else if (displayMode === "surah" && currentSurah > 1) {
      navigateReadingTarget("surah", currentSurah - 1);
    }
  };

  const handleNext = () => {
    if (displayMode === "page" && currentPage < 604) {
      navigateReadingTarget("page", currentPage + 1);
    } else if (displayMode === "juz" && currentJuz < 30) {
      navigateReadingTarget("juz", currentJuz + 1);
    } else if (displayMode === "surah" && currentSurah < 114) {
      navigateReadingTarget("surah", currentSurah + 1);
    }
  };

  const warmPrevious = () => {
    if (displayMode === "page" && currentPage > 1) warmReadingTarget("page", currentPage - 1);
    else if (displayMode === "juz" && currentJuz > 1) warmReadingTarget("juz", currentJuz - 1);
    else if (currentSurah > 1) warmReadingTarget("surah", currentSurah - 1);
  };
  const warmNext = () => {
    if (displayMode === "page" && currentPage < 604) warmReadingTarget("page", currentPage + 1);
    else if (displayMode === "juz" && currentJuz < 30) warmReadingTarget("juz", currentJuz + 1);
    else if (currentSurah < 114) warmReadingTarget("surah", currentSurah + 1);
  };

  const handleGoTo = (event) => {
    event.preventDefault();
    const num = Number.parseInt(goToValue, 10);
    const max =
      displayMode === "page" ? 604 : displayMode === "juz" ? 30 : 114;
    // An out-of-range or empty entry used to close the popover with no jump and
    // no explanation, which read as a broken control. Keep it open and say why.
    if (!Number.isFinite(num) || num < 1 || num > max) {
      setGoToError(true);
      inputRef.current?.select();
      return;
    }
    setGoToError(false);
    if (displayMode === "page") {
      navigateReadingTarget("page", num);
    } else if (displayMode === "juz") {
      navigateReadingTarget("juz", num);
    } else {
      navigateReadingTarget("surah", num);
    }
    setGoToOpen(false);
    setGoToValue("");
  };

  const goToMax =
    displayMode === "page" ? 604 : displayMode === "juz" ? 30 : 114;
  const goToLabel =
    displayMode === "page"
      ? i18nT("nav.goToPage", lang)
      : displayMode === "juz"
        ? i18nT("nav.goToJuz", lang)
        : i18nT("nav.goToSurah", lang);

  const activeSurahNum =
    displayMode === "page" ? getSurahForPage(currentPage) : currentSurah;
  const surahMeta = getSurah(activeSurahNum);
  const centerTitle = showDuas
    ? i18nT("header.duasTitle", lang)
    : displayMode === "juz"
      ? i18nT("header.juzTitle", lang).replace(
          "{n}",
          lang === "ar" ? toAr(currentJuz) : currentJuz,
        )
      : lang === "ar"
        ? surahMeta?.ar || surahMeta?.en || ""
        : surahMeta?.en || surahMeta?.fr || "";
  const centerSubtitle =
    !showDuas && displayMode !== "juz" && surahMeta
      ? lang === "ar"
        ? surahMeta.en || surahMeta.fr
        : surahMeta.fr || surahMeta.ar
      : "";
  const centerSurahLigature =
    !showDuas && displayMode !== "juz"
      ? getSurahLigature(activeSurahNum)
      : "";
  const centerArabicTitle =
    !showDuas && displayMode !== "juz"
      ? centerSurahLigature || surahMeta?.ar || ""
      : "";
  const centerTransliteration =
    !showDuas && displayMode !== "juz"
      ? surahMeta?.en || surahMeta?.fr || centerTitle
      : centerTitle;
  const centerMeaning =
    !showDuas && displayMode !== "juz"
      ? surahMeta?.fr || centerSubtitle || centerTransliteration
      : "";
  const centerTitleVariants = [
    centerArabicTitle,
    // The transliteration and the translated meaning exist for readers who
    // cannot parse the Arabic name. In the Arabic UI they are Latin/French
    // text inside a right-to-left interface, so the title shows the name only.
    lang === "ar" ? "" : centerTransliteration,
    lang === "ar" ? "" : centerMeaning,
  ].filter((value, index, values) => value && values.indexOf(value) === index);
  const centerTitleLabel = centerTitleVariants.length
    ? centerTitleVariants.join(" — ")
    : centerTitle;

  const headerLabels = {
    menu: i18nT("nav.menu", lang),
    more: i18nT("header.more", lang),
    homeSummary: i18nT(
      displayMode === "page" || displayMode === "juz" || currentSurah > 1 || currentAyah > 1
        ? "header.continueReading"
        : "header.startReading",
      lang,
    ),
    homeMeta: `${i18nT(riwaya === "warsh" ? "quran.warsh" : "quran.hafs", lang)} \u00b7 114 ${i18nT("header.metaSurahs", lang)} \u00b7 ${i18nT("header.metaJuz", lang)}`,
    quranNav: i18nT("header.quranNav", lang),
    riwayaToggle: i18nT("header.riwayaToggle", lang),
  };

  const quickItems = [
    {
      key: "search",
      Icon: Search,
      label: i18nT("nav.search", lang),
      description: i18nT("header.searchDesc", lang),
      action: openSearch,
      mobileOnly: true,
    },
    {
      key: "theme",
      Icon: SunMoon,
      label: i18nT("header.theme", lang),
      description: i18nT(
        theme === "dark"
          ? "header.themeDescDark"
          : theme === "sepia"
            ? "header.themeDescSepia"
            : "header.themeDescLight",
        lang,
      ),
      action: cycleTheme,
    },
    {
      key: "settings",
      Icon: Settings,
      label: i18nT("nav.settings", lang),
      description: i18nT("header.settingsDesc", lang),
      action: openSettings,
    },
    {
      key: "library",
      Icon: BookOpen,
      label: i18nT("library.title", lang),
      description: i18nT("header.libraryDesc", lang),
      action: openLibrary,
    },
    {
      key: "duas",
      Icon: HandHeart,
      label: i18nT("nav.duas", lang),
      description: i18nT("header.duasDesc", lang),
      action: openDuas,
    },
    {
      key: "prayers",
      Icon: CalendarCheck,
      label: i18nT("nav.prayers", lang),
      description: i18nT("header.prayersDesc", lang),
      action: openPrayers,
    },
  ];

  const renderQuickItem = (item) => (
    <button
      key={item.key}
      data-key={item.key}
      className={cn(
        "mp-header-menu__item",
        item.mobileOnly && "mp-header-menu__item--mobile-only",
      )}
      type="button"
      onClick={() => {
        item.action();
        setQuickMenuOpen(false);
      }}
    >
      <span className="mp-header-menu__item-icon">
        <item.Icon size={15} strokeWidth={2.1} />
      </span>
      <span className="mp-header-menu__item-copy">
        <span className="mp-header-menu__item-label">{item.label}</span>
        {item.key === "search" && (
          <span className="mp-header-menu__item-description">
            {item.description}
          </span>
        )}
      </span>
      {item.key === "search" && (
        <kbd className="mp-header-menu__item-kbd">/</kbd>
      )}
    </button>
  );

  return (
    <header
      ref={headerRef}
      className={cn(
        "mp-header",
        headerCompact && "mp-header--compact",
        (sidebarOpen || immersiveHidden) && "pointer-events-none",
      )}
      aria-hidden={sidebarOpen || immersiveHidden ? "true" : undefined}
      inert={sidebarOpen || immersiveHidden ? "" : undefined}
      role="banner"
    >
      <div className="mp-header__bar">
        {/* ── LEFT: hamburger + brand ─────────────────────── */}
        <div className="mp-header__brand-row">
          <button
            className={cn("mp-header__icon-btn", sidebarOpen && "is-active")}
            type="button"
            onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            aria-label={headerLabels.menu}
            aria-expanded={sidebarOpen}
            aria-controls="sidebar"
          >
            {/* The header is inert while the sidebar is open, so this button
                cannot close it — the drawer owns the only working close. Keep
                the hamburger here instead of a second, dead cross. */}
            <Menu size={18} strokeWidth={2.2} />
          </button>

          <button
            className="mp-header__brand"
            type="button"
            onClick={goHome}
            title={i18nT("errors.backHome", lang)}
            data-testid="mobile-home-logo"
            aria-label={`MushafPlus \u2014 ${i18nT("nav.home", lang)}`}
          >
            <span className="mp-header__logo">
              <PlatformLogo
                className="h-full w-full"
                imgClassName="h-full w-full object-cover"
                decorative
                priority
                width={38}
                height={38}
              />
            </span>
            <span className="mp-header__home-badge" aria-hidden="true">
              <Home size={9} strokeWidth={2.4} />
            </span>
            <span className="mp-header__brand-text">
              Mushaf<span className="mp-header__brand-accent">Plus</span>
            </span>
          </button>
        </div>

        {/* ── CENTER: surah nav ───────────────────────────── */}
        <div className="mp-header__center">
          {showHome || legalPage ? (
            <button
              className="mp-header__home-summary"
              type="button"
              onClick={() => set({ legalPage: null, showHome: false, showDuas: false })}
            >
              <strong className="mp-header__home-summary-clean">
                {headerLabels.homeSummary}
              </strong>
              <span className="mp-header__home-meta-clean">
                {headerLabels.homeMeta}
              </span>
            </button>
          ) : (
            <nav className="mp-header__nav" aria-label={headerLabels.quranNav}>
              {/* Prev arrow */}
              <button
                className="mp-header__nav-arrow"
                type="button"
                onClick={isRtl ? handleNext : handlePrev}
                onPointerEnter={isRtl ? warmNext : warmPrevious}
                onPointerDown={isRtl ? warmNext : warmPrevious}
                onFocus={isRtl ? warmNext : warmPrevious}
                disabled={isRtl ? !canGoNext : !canGoPrev}
                aria-label={i18nT(
                  // The mushaf always reads right-to-left on screen, so in the
                  // Arabic UI the left arrow advances. The name has to follow
                  // the action, not the glyph.
                  isRtl ? "quran.nextSurah" : "quran.prevSurah",
                  lang,
                )}
              >
                <ChevronLeft size={16} strokeWidth={2.5} />
              </button>

              {/* Title popover */}
              <Popover open={goToOpen} onOpenChange={setGoToOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="mp-header__title-btn"
                    type="button"
                    aria-label={centerTitleLabel}
                  >
                    <span
                      key={`${activeSurahNum}-${lang}-${displayMode}`}
                      className="mp-header__title-stack"
                      aria-hidden="true"
                    >
                      {centerTitleVariants.length > 1 ? (
                        <>
                          <span className="mp-header__title mp-header__title-cycle-viewport">
                            <span className="mp-header__title-sub-track">
                              <span
                                className="mp-header__title-sub"
                                dir="rtl"
                                lang="ar"
                              >
                                {centerSurahLigature ? (
                                  <span
                                    className="font-surah-names"
                                    dir="ltr"
                                    lang="en"
                                    aria-hidden="true"
                                  >
                                    {centerSurahLigature}
                                  </span>
                                ) : (
                                  centerArabicTitle
                                )}
                              </span>
                              <span className="mp-header__title-transliteration">
                                {centerTransliteration}
                              </span>
                              <span className="mp-header__title-meaning">
                                {centerMeaning}
                              </span>
                              <span
                                className="mp-header__title-sub mp-header__title-cycle-copy"
                                dir="rtl"
                                lang="ar"
                              >
                                {centerSurahLigature ? (
                                  <span
                                    className="font-surah-names"
                                    dir="ltr"
                                    lang="en"
                                    aria-hidden="true"
                                  >
                                    {centerSurahLigature}
                                  </span>
                                ) : (
                                  centerArabicTitle
                                )}
                              </span>
                            </span>
                          </span>
                          {/* Small screens: stable Arabic + transliteration lockup
                              instead of the cycle, which reads as duplicate text. */}
                          <span
                            key={`${activeSurahNum}-${lang}`}
                            className="mp-header__title-compact"
                            aria-hidden="true"
                          >
                            {surahMeta?.ar ? (
                              <span
                                className="mp-header__title-compact-ar"
                                dir="rtl"
                                lang="ar"
                              >
                                {centerSurahLigature ? (
                                  <span
                                    className="font-surah-names"
                                    dir="ltr"
                                    lang="en"
                                    aria-hidden="true"
                                  >
                                    {centerSurahLigature}
                                  </span>
                                ) : (
                                  surahMeta.ar
                                )}
                              </span>
                            ) : null}
                            <span className="mp-header__title-compact-la">
                              {centerTransliteration}
                            </span>
                          </span>
                        </>
                      ) : (
                        <span className="mp-header__title">{centerTitle}</span>
                      )}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  sideOffset={10}
                  className="z-[300] w-64 rounded-2xl border border-[var(--border)] bg-[var(--bg-primary)] p-0 shadow-xl"
                >
                  <form
                    onSubmit={handleGoTo}
                    noValidate
                    className="flex flex-col gap-3 p-4"
                  >
                    <label
                      htmlFor="header-goto-input"
                      className="text-center text-[0.85rem] font-bold text-text-primary"
                    >
                      {goToLabel}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        id="header-goto-input"
                        ref={inputRef}
                        type="number"
                        min={1}
                        max={goToMax}
                        value={goToValue}
                        onChange={(event) => {
                          setGoToValue(event.target.value);
                          if (goToError) setGoToError(false);
                        }}
                        placeholder="#"
                        aria-invalid={goToError}
                        aria-describedby={goToError ? "header-goto-error" : undefined}
                        className="h-[44px] flex-1 rounded-xl border border-border bg-bg-secondary px-3 text-center text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="submit"
                        className="flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark"
                        aria-label={i18nT("header.go", lang)}
                      >
                        <ChevronRight size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                    {goToError ? (
                      <p
                        id="header-goto-error"
                        role="alert"
                        className="text-center text-[0.72rem] font-semibold text-[var(--c-danger,#b42318)]"
                      >
                        {i18nT("header.goToRange", lang).replace(
                          "{max}",
                          lang === "ar" ? toAr(goToMax) : goToMax,
                        )}
                      </p>
                    ) : null}
                  </form>
                </PopoverContent>
              </Popover>

              {/* Next arrow */}
              <button
                className="mp-header__nav-arrow"
                type="button"
                onClick={isRtl ? handlePrev : handleNext}
                onPointerEnter={isRtl ? warmPrevious : warmNext}
                onPointerDown={isRtl ? warmPrevious : warmNext}
                onFocus={isRtl ? warmPrevious : warmNext}
                disabled={isRtl ? !canGoPrev : !canGoNext}
                aria-label={i18nT(
                  isRtl ? "quran.prevSurah" : "quran.nextSurah",
                  lang,
                )}
              >
                <ChevronRight size={16} strokeWidth={2.5} />
              </button>
            </nav>
          )}
        </div>

        {/* ── RIGHT: riwaya + search + settings + theme + more ── */}
        <div className="mp-header__actions">
          {/* Riwaya toggle — always visible */}
          <button
            className="mp-header__action mp-header__riwaya-toggle"
            type="button"
            onPointerEnter={() => warmRiwaya(riwaya === "hafs" ? "warsh" : "hafs")}
            onPointerDown={() => warmRiwaya(riwaya === "hafs" ? "warsh" : "hafs")}
            onFocus={() => warmRiwaya(riwaya === "hafs" ? "warsh" : "hafs")}
            onClick={() => {
              const nextRiwaya = riwaya === "hafs" ? "warsh" : "hafs";
              selectRiwaya(nextRiwaya);
            }}
            aria-label={`${headerLabels.riwayaToggle} — ${i18nT(riwaya === "warsh" ? "quran.warsh" : "quran.hafs", lang)}`}
            title={headerLabels.riwayaToggle}
          >
            <span>{i18nT(riwaya === "warsh" ? "quran.warsh" : "quran.hafs", lang)}</span>
          </button>

          {/* Search */}
          <button
            className="mp-header__action mp-header__search"
            type="button"
            onClick={openSearch}
            aria-label={i18nT("nav.search", lang)}
            title={i18nT("nav.search", lang)}
          >
            <Search size={18} strokeWidth={2.4} />
            <span>{i18nT("nav.search", lang)}</span>
          </button>

          {/* Theme cycle — moved to "More" menu for cleaner header */}

          {/* More / ellipsis */}
          <Popover open={quickMenuOpen} onOpenChange={setQuickMenuOpen}>
            <PopoverTrigger asChild>
              <button
                className="mp-header__more"
                type="button"
                aria-label={headerLabels.more}
                title={headerLabels.more}
              >
                <MoreHorizontal size={18} strokeWidth={2} />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={10}
              aria-label={i18nT(
                isReadingView ? "header.menuReading" : "header.menuMain",
                lang,
              )}
              className={cn(
                "mp-header-menu z-[300]",
                isReadingView && "mp-header-menu--reader",
              )}
            >
              <div className="mp-header-menu__header">
                <span className="mp-header-menu__panel-title">
                  {isReadingView ? <Type size={13} strokeWidth={2.2} /> : <Shapes size={13} strokeWidth={2.2} />}
                  {i18nT(isReadingView ? "header.reading" : "nav.menu", lang)}
                </span>
                <button
                  className="mp-header-menu__close"
                  type="button"
                  onClick={() => setQuickMenuOpen(false)}
                  aria-label={i18nT("common.close", lang)}
                >
                  <X size={15} strokeWidth={2.4} className="mp-header-menu__close-icon" aria-hidden="true" />
                </button>
              </div>

              <div className="mp-header-menu__primary-command">
                {quickItems.filter((item) => item.key === "search").map(renderQuickItem)}
              </div>

              {isReadingView ? (
                <section
                  className="mp-header-menu__reader-tools"
                  aria-label={i18nT("header.readerDisplay", lang)}
                >
                  {/* Font size + layout toggle — compact inline row */}
                  <div className="mp-header-menu__controls-row">
                    <div className="mp-header-menu__font-controls">
                      <button
                        type="button"
                        data-testid="header-reader-font-decrease"
                        onClick={() => changeArabicFontSize(-2)}
                        disabled={quranFontSize <= ARABIC_FONT_SIZE_MIN}
                        aria-label={i18nT("header.fontDecrease", lang)}
                      >
                        <Minus size={12} strokeWidth={2.4} />
                      </button>
                      <output aria-live="polite">{quranFontSize}px</output>
                      <button
                        type="button"
                        data-testid="header-reader-font-increase"
                        onClick={() => changeArabicFontSize(2)}
                        disabled={quranFontSize >= ARABIC_FONT_SIZE_MAX}
                        aria-label={i18nT("header.fontIncrease", lang)}
                      >
                        <Plus size={12} strokeWidth={2.4} />
                      </button>
                    </div>

                    <div
                      className="mp-header-menu__layout"
                      role="group"
                      aria-label={i18nT("header.readingMode", lang)}
                    >
                      <button
                        type="button"
                        data-testid="header-reader-layout-mushaf"
                        className={mushafLayout === "mushaf" ? "is-active" : ""}
                        aria-pressed={mushafLayout === "mushaf"}
                        onClick={() => selectReadingLayout("mushaf")}
                      >
                        <BookOpen size={13} strokeWidth={2} />
                        <span>{i18nT("header.layoutMushaf", lang)}</span>
                      </button>
                      <button
                        type="button"
                        data-testid="header-reader-layout-list"
                        className={mushafLayout === "list" ? "is-active" : ""}
                        aria-pressed={mushafLayout === "list"}
                        onClick={() => selectReadingLayout("list")}
                      >
                        <List size={13} strokeWidth={2} />
                        <span>{i18nT("header.layoutList", lang)}</span>
                      </button>
                    </div>
                  </div>

                  {/* Riwaya — pills only, no heading, mobile only */}
                  <div
                    className="mp-header-menu__mobile-riwaya mp-header-menu__riwaya"
                    data-testid="header-mobile-riwaya"
                  >
                    <div
                      className="mp-header-menu__riwaya-btns"
                      role="group"
                      aria-label={headerLabels.riwayaToggle}
                    >
                      {["hafs", "warsh"].map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={cn(
                            "mp-header__seg",
                            riwaya === option && "is-active",
                          )}
                          aria-pressed={riwaya === option}
                          onPointerEnter={() => warmRiwaya(option)}
                          onFocus={() => warmRiwaya(option)}
                          onClick={() => selectRiwaya(option)}
                        >
                          {i18nT(option === "hafs" ? "quran.hafs" : "quran.warsh", lang)}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}

              <div className="mp-header-menu__section">
                {quickItems.filter((item) => item.key !== "search").map(renderQuickItem)}
              </div>

            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
