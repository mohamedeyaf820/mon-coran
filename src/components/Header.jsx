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
  Menu,
  Shapes,
  X,
  Home,
  SunMoon,
  Type,
  BookOpen,
  List,
} from "lucide-react";

export default function Header({ immersiveHidden = false }) {
  const { dispatch, set } = useAppActions();
  const state = useAppSelector(
    (current) => ({
      lang: current.lang,
      currentSurah: current.currentSurah,
      displayMode: current.displayMode,
      currentPage: current.currentPage,
      currentJuz: current.currentJuz,
      riwaya: current.riwaya,
      fontFamily: current.fontFamily,
      fontFamilyByRiwaya: current.fontFamilyByRiwaya,
      warshStrictMode: current.warshStrictMode,
      showHome: current.showHome,
      showDuas: current.showDuas,
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
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const inputRef = useRef(null);
  const headerRef = useRef(null);
  const navigationRequestRef = useRef(0);
  const riwayaRequestRef = useRef(0);

  const isRtl = lang === "ar";
  const tr = (obj) =>
    lang === "ar" ? obj.ar : lang === "fr" ? obj.fr : obj.en;

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
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [goToOpen]);

  const goHome = () => set({ legalPage: null, showHome: true, showDuas: false });
  const openDuas = () => set({ legalPage: null, showDuas: true, showHome: false });
  const openSearch = () => dispatch({ type: "TOGGLE_SEARCH" });
  const openSettings = () => dispatch({ type: "TOGGLE_SETTINGS" });
  const isReadingView = !showHome && !showDuas && !legalPage;
  const changeArabicFontSize = (delta) => {
    set({
      quranFontSize: clampArabicFontSize(Number(quranFontSize) + delta),
    });
  };
  const selectReadingLayout = (layout) => {
    set(
      layout === "mushaf"
        ? { mushafLayout: "mushaf", showTajwid: true }
        : { mushafLayout: "list" },
    );
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
    } else if (currentSurah > 1) {
      navigateReadingTarget("surah", currentSurah - 1);
    }
  };

  const handleNext = () => {
    if (displayMode === "page" && currentPage < 604) {
      navigateReadingTarget("page", currentPage + 1);
    } else if (displayMode === "juz" && currentJuz < 30) {
      navigateReadingTarget("juz", currentJuz + 1);
    } else if (currentSurah < 114) {
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
    if (Number.isNaN(num)) return;
    if (displayMode === "page" && num >= 1 && num <= 604) {
      navigateReadingTarget("page", num);
    } else if (displayMode === "juz" && num >= 1 && num <= 30) {
      navigateReadingTarget("juz", num);
    } else if (num >= 1 && num <= 114) {
      navigateReadingTarget("surah", num);
    }
    setGoToOpen(false);
    setGoToValue("");
  };

  const goToMax =
    displayMode === "page" ? 604 : displayMode === "juz" ? 30 : 114;
  const goToLabel =
    displayMode === "page"
      ? tr({
          fr: "Page (1-604)",
          en: "Page (1-604)",
          ar: "\u0635\u0641\u062d\u0629 (\u0661-\u0666\u0660\u0664)",
        })
      : displayMode === "juz"
        ? tr({
            fr: "Juz (1-30)",
            en: "Juz (1-30)",
            ar: "\u062c\u0632\u0621 (\u0661-\u0663\u0660)",
          })
        : tr({
            fr: "Sourate (1-114)",
            en: "Surah (1-114)",
            ar: "\u0633\u0648\u0631\u0629 (\u0661-\u0661\u0661\u0664)",
          });

  const activeSurahNum =
    displayMode === "page" ? getSurahForPage(currentPage) : currentSurah;
  const surahMeta = getSurah(activeSurahNum);
  const centerTitle = showDuas
    ? tr({
        fr: "Douas",
        en: "Duas",
        ar: "\u0627\u0644\u0623\u062f\u0639\u064a\u0629",
      })
    : displayMode === "juz"
      ? lang === "ar"
        ? `\u062c\u0632\u0621 ${toAr(currentJuz)}`
        : `Juz ${currentJuz}`
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
    centerTransliteration,
    centerMeaning,
  ].filter((value, index, values) => value && values.indexOf(value) === index);
  const centerTitleLabel = centerTitleVariants.length
    ? centerTitleVariants.join(" — ")
    : centerTitle;

  const headerLabels = {
    menu: tr({
      fr: "Menu",
      en: "Menu",
      ar: "\u0627\u0644\u0642\u0627\u0626\u0645\u0629",
    }),
    more: tr({
      fr: "Plus d'options",
      en: "More options",
      ar: "\u062e\u064a\u0627\u0631\u0627\u062a \u0625\u0636\u0627\u0641\u064a\u0629",
    }),
    homeSummary: tr({
      fr: "Reprendre la lecture",
      en: "Continue reading",
      ar: "\u0627\u0633\u062a\u0626\u0646\u0627\u0641 \u0627\u0644\u0642\u0631\u0627\u0621\u0629",
    }),
    homeMeta: `${riwaya.toUpperCase()} \u00b7 114 ${
      lang === "fr"
        ? "sourates"
        : lang === "ar"
          ? "\u0633\u0648\u0631\u0629"
          : "surahs"
    } \u00b7 ${lang === "ar" ? "\u0663\u0660 \u062c\u0632\u0621" : "30 Juz"}`,
    quranNav: tr({
      fr: "Navigation du Coran",
      en: "Quran navigation",
      ar: "\u0627\u0644\u062a\u0646\u0642\u0644 \u0641\u064a \u0627\u0644\u0642\u0631\u0622\u0646",
    }),
    riwayaToggle: tr({
      fr: "Changer de riwaya",
      en: "Switch riwaya",
      ar: "\u062a\u0628\u062f\u064a\u0644 \u0627\u0644\u0631\u0648\u0627\u064a\u0629",
    }),
  };

  const quickItems = [
    {
      key: "search",
      Icon: Search,
      label: i18nT("nav.search", lang),
      description: tr({
        fr: "Sourate, verset ou mot-clé",
        en: "Surah, verse or keyword",
        ar: "سورة أو آية أو كلمة",
      }),
      action: openSearch,
      mobileOnly: true,
    },
    {
      key: "theme",
      Icon: SunMoon,
      label: tr({ fr: "Changer de thème", en: "Change theme", ar: "تغيير المظهر" }),
      description: tr({
        fr: theme === "dark" ? "Mode sombre actif" : theme === "sepia" ? "Mode sépia actif" : "Mode clair actif",
        en: `${theme || "light"} theme active`,
        ar: "التبديل بين الفاتح والسيبيا والداكن",
      }),
      action: cycleTheme,
    },
    {
      key: "settings",
      Icon: Settings,
      label: i18nT("nav.settings", lang),
      description: tr({ fr: "Lecture, audio et apparence", en: "Reading, audio and appearance", ar: "القراءة والصوت والمظهر" }),
      action: openSettings,
    },
    {
      key: "duas",
      Icon: HandHeart,
      label: tr({ fr: "Invocations", en: "Supplications", ar: "الأدعية" }),
      description: tr({ fr: "Invocations coraniques", en: "Quranic supplications", ar: "أدعية قرآنية" }),
      action: openDuas,
    },
  ];

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
            {sidebarOpen ? (
              <X size={18} strokeWidth={2.2} />
            ) : (
              <Menu size={18} strokeWidth={2.2} />
            )}
          </button>

          <button
            className="mp-header__brand"
            type="button"
            onClick={goHome}
            title={lang === "ar" ? "العودة إلى الرئيسية" : lang === "en" ? "Back to home" : "Retour à l'accueil"}
            data-testid="mobile-home-logo"
            aria-label={lang === "ar" ? "MushafPlus — الرئيسية" : lang === "en" ? "MushafPlus — Home" : "MushafPlus — Accueil"}
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
                aria-label={i18nT("quran.prevSurah", lang)}
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
                      ) : (
                        <span className="mp-header__title">{centerTitle}</span>
                      )}
                    </span>
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  sideOffset={10}
                  className="z-[300] w-64 rounded-2xl border border-border bg-bg-primary p-0 shadow-xl"
                >
                  <form
                    onSubmit={handleGoTo}
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
                        onChange={(event) => setGoToValue(event.target.value)}
                        placeholder="#"
                        className="h-[44px] flex-1 rounded-xl border border-border bg-bg-secondary px-3 text-center text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="submit"
                        className="flex h-[44px] w-[44px] items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark"
                        aria-label={tr({
                          fr: "Aller",
                          en: "Go",
                          ar: "\u0627\u0646\u062a\u0642\u0644",
                        })}
                      >
                        <ChevronRight size={16} strokeWidth={2.5} />
                      </button>
                    </div>
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
                aria-label={i18nT("quran.nextSurah", lang)}
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
            aria-label={`${headerLabels.riwayaToggle} — ${riwaya === "warsh" ? "Warsh" : "Hafs"}`}
            title={headerLabels.riwayaToggle}
          >
            <span>{riwaya === "warsh" ? "Warsh" : "Hafs"}</span>
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
              className="mp-header-menu z-[300]"
            >
              <div className="mp-header-menu__header">
                <span className="mp-header-menu__header-icon">
                  <Shapes size={15} strokeWidth={2.1} />
                </span>
                <span className="mp-header-menu__heading">
                  <span className="mp-header-menu__header-text">
                    {tr({ fr: "Actions rapides", en: "Quick actions", ar: "إجراءات سريعة" })}
                  </span>
                  <span className="mp-header-menu__header-subtitle">
                    {tr({
                      fr: isReadingView
                        ? "Lecture et préférences"
                        : "Navigation et préférences",
                      en: isReadingView
                        ? "Reading and preferences"
                        : "Navigation and preferences",
                      ar: isReadingView
                        ? "القراءة والتفضيلات"
                        : "التنقل والتفضيلات",
                    })}
                  </span>
                </span>
                <button
                  className="mp-header-menu__close"
                  type="button"
                  onClick={() => setQuickMenuOpen(false)}
                  aria-label={tr({
                    fr: "Fermer les actions rapides",
                    en: "Close quick actions",
                    ar: "إغلاق الإجراءات السريعة",
                  })}
                >
                  <X size={14} strokeWidth={2.2} />
                </button>
              </div>

              {isReadingView ? (
                <section
                  className="mp-header-menu__reader-tools"
                  aria-labelledby="header-reader-tools-title"
                >
                  <div className="mp-header-menu__reader-heading">
                    <Type size={13} strokeWidth={2.1} aria-hidden="true" />
                    <span id="header-reader-tools-title">
                      {tr({
                        fr: "Affichage de lecture",
                        en: "Reading display",
                        ar: "عرض القراءة",
                      })}
                    </span>
                  </div>

                  <div className="mp-header-menu__reader-card">
                    <span className="mp-header-menu__reader-label">
                      {tr({
                        fr: "Taille du texte arabe",
                        en: "Arabic text size",
                        ar: "حجم النص العربي",
                      })}
                    </span>
                    <div className="mp-header-menu__font-controls">
                      <button
                        type="button"
                        data-testid="header-reader-font-decrease"
                        onClick={() => changeArabicFontSize(-2)}
                        disabled={quranFontSize <= ARABIC_FONT_SIZE_MIN}
                        aria-label={tr({
                          fr: "Réduire le texte arabe",
                          en: "Decrease Arabic text size",
                          ar: "تصغير النص العربي",
                        })}
                      >
                        <span aria-hidden="true">−</span>
                      </button>
                      <output aria-live="polite">{quranFontSize}px</output>
                      <button
                        type="button"
                        data-testid="header-reader-font-increase"
                        onClick={() => changeArabicFontSize(2)}
                        disabled={quranFontSize >= ARABIC_FONT_SIZE_MAX}
                        aria-label={tr({
                          fr: "Agrandir le texte arabe",
                          en: "Increase Arabic text size",
                          ar: "تكبير النص العربي",
                        })}
                      >
                        <span aria-hidden="true">+</span>
                      </button>
                    </div>
                  </div>

                  <div
                    className="mp-header-menu__layout"
                    role="group"
                    aria-label={tr({
                      fr: "Mode de lecture",
                      en: "Reading mode",
                      ar: "وضع القراءة",
                    })}
                  >
                    <button
                      type="button"
                      data-testid="header-reader-layout-mushaf"
                      className={mushafLayout === "mushaf" ? "is-active" : ""}
                      aria-pressed={mushafLayout === "mushaf"}
                      onClick={() => selectReadingLayout("mushaf")}
                    >
                      <BookOpen size={14} strokeWidth={2} />
                      <span>Mushaf</span>
                    </button>
                    <button
                      type="button"
                      data-testid="header-reader-layout-list"
                      className={mushafLayout === "list" ? "is-active" : ""}
                      aria-pressed={mushafLayout === "list"}
                      onClick={() => selectReadingLayout("list")}
                    >
                      <List size={14} strokeWidth={2} />
                      <span>{tr({ fr: "Liste", en: "List", ar: "قائمة" })}</span>
                    </button>
                  </div>

                  <div
                    className="mp-header-menu__mobile-riwaya mp-header-menu__riwaya"
                    data-testid="header-mobile-riwaya"
                  >
                    <div className="mp-header-menu__riwaya-heading">
                      <span className="mp-header-menu__riwaya-copy">
                        <span className="mp-header-menu__riwaya-label">
                          {tr({
                            fr: "Riwaya",
                            en: "Riwaya",
                            ar: "الرواية",
                          })}
                        </span>
                        <span className="mp-header-menu__riwaya-description">
                          {tr({
                            fr: "Choisir le texte et la récitation",
                            en: "Choose text and recitation",
                            ar: "اختيار النص والتلاوة",
                          })}
                        </span>
                      </span>
                    </div>
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
                          {option === "hafs" ? "Hafs" : "Warsh"}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}

              <div className="mp-header-menu__section">
                {quickItems.map((item) => (
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
                      <span className="mp-header-menu__item-description">
                        {item.description}
                      </span>
                    </span>
                    {item.key === "search" && (
                      <kbd className="mp-header-menu__item-kbd">/</kbd>
                    )}
                  </button>
                ))}
              </div>

            </PopoverContent>
          </Popover>
        </div>
      </div>
    </header>
  );
}
