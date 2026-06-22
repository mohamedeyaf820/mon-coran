import React, { useEffect, useRef, useState } from "react";
import {
  shallowEqual,
  useAppActions,
  useAppSelector,
} from "../context/AppContext";
import { t as i18nT } from "../i18n";
import { getSurah, surahName, toAr, getSurahForPage } from "../data/surahs";
import { cn } from "../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import NetworkStatus from "./NetworkStatus";
import PlatformLogo from "./PlatformLogo";
import { THEME_ORDER } from "../data/themes";
import {
  Search,
  Settings,
  Moon,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  HandHeart,
  Menu,
  Palette,
  Shapes,
  X,
  BookOpen,
} from "lucide-react";

export default function Header() {
  const { dispatch, set } = useAppActions();
  const state = useAppSelector(
    (current) => ({
      lang: current.lang,
      theme: current.theme,
      currentSurah: current.currentSurah,
      displayMode: current.displayMode,
      currentPage: current.currentPage,
      currentJuz: current.currentJuz,
      riwaya: current.riwaya,
      loadedAyahCount: current.loadedAyahCount,
      showHome: current.showHome,
      showDuas: current.showDuas,
      sidebarOpen: current.sidebarOpen,
      settingsOpen: current.settingsOpen,
    }),
    shallowEqual,
  );
  const {
    lang,
    theme,
    currentSurah,
    displayMode,
    currentPage,
    currentJuz,
    riwaya,
    loadedAyahCount,
    showHome,
    showDuas,
    sidebarOpen,
    settingsOpen,
  } = state;

  const [goToValue, setGoToValue] = useState("");
  const [goToOpen, setGoToOpen] = useState(false);
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const inputRef = useRef(null);
  const headerRef = useRef(null);

  const currentThemeIndex = THEME_ORDER.indexOf(theme);
  const nextThemeId =
    THEME_ORDER[
      (currentThemeIndex + 1 + THEME_ORDER.length) % THEME_ORDER.length
    ];
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
  }, [showHome, showDuas, displayMode, lang, riwaya]);

  // Compact header on scroll (reading view only)
  const [headerCompact, setHeaderCompact] = useState(false);
  useEffect(() => {
    if (showHome || showDuas) {
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
  }, [showHome, showDuas]);

  useEffect(() => {
    if (!goToOpen) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(id);
  }, [goToOpen]);

  const cycleTheme = () =>
    dispatch({ type: "SET_THEME", payload: nextThemeId });
  const goHome = () => set({ showHome: true, showDuas: false });
  const openDuas = () => set({ showDuas: true, showHome: false });
  const openSearch = () => dispatch({ type: "TOGGLE_SEARCH" });
  const openSettings = () => dispatch({ type: "TOGGLE_SETTINGS" });
  const openToolsHub = () => set({ toolsHubOpen: true });

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
    set({ showHome: false, showDuas: false });
    if (displayMode === "page" && currentPage > 1) {
      set({ currentPage: currentPage - 1 });
    } else if (displayMode === "juz" && currentJuz > 1) {
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz - 1 } });
    } else if (currentSurah > 1) {
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: currentSurah - 1 },
      });
    }
  };

  const handleNext = () => {
    set({ showHome: false, showDuas: false });
    if (displayMode === "page" && currentPage < 604) {
      set({ currentPage: currentPage + 1 });
    } else if (displayMode === "juz" && currentJuz < 30) {
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz + 1 } });
    } else if (currentSurah < 114) {
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: currentSurah + 1 },
      });
    }
  };

  const handleGoTo = (event) => {
    event.preventDefault();
    const num = Number.parseInt(goToValue, 10);
    if (Number.isNaN(num)) return;
    if (displayMode === "page" && num >= 1 && num <= 604) {
      set({ currentPage: num, showHome: false, showDuas: false });
    } else if (displayMode === "juz" && num >= 1 && num <= 30) {
      set({ showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: num } });
    } else if (num >= 1 && num <= 114) {
      set({ showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: num } });
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
  const ayahWord =
    lang === "fr" ? "versets" : lang === "ar" ? "\u0622\u064a\u0629" : "ayahs";
  const ayahCount = loadedAyahCount
    ? `${lang === "ar" ? toAr(loadedAyahCount) : loadedAyahCount} ${ayahWord}`
    : surahMeta
      ? `${surahMeta.ayahs} ${ayahWord}`
      : "";

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
        ? surahMeta?.ar || ""
        : surahName(activeSurahNum, lang);

  const centerKicker = showDuas
    ? tr({
        fr: "Espace Douas",
        en: "Duas",
        ar: "\u0627\u0644\u0623\u062f\u0639\u064a\u0629",
      })
    : displayMode === "page"
      ? tr({ fr: "Page", en: "Page", ar: "\u0635\u0641\u062d\u0629" })
      : displayMode === "juz"
        ? tr({ fr: "Juz", en: "Juz", ar: "\u062c\u0632\u0621" })
        : tr({ fr: "Sourate", en: "Surah", ar: "\u0633\u0648\u0631\u0629" });

  const centerSub = showDuas
    ? tr({
        fr: "Invocations coraniques",
        en: "Quranic supplications",
        ar: "\u0623\u062f\u0639\u064a\u0629 \u0642\u0631\u0622\u0646\u064a\u0629",
      })
    : displayMode === "page"
      ? tr({
          fr: `Page ${currentPage} / 604`,
          en: `Page ${currentPage} / 604`,
          ar: `\u0635\u0641\u062d\u0629 ${toAr(currentPage)} / ${toAr(604)}`,
        })
      : displayMode === "juz"
        ? tr({
            fr: `Juz ${currentJuz} / 30`,
            en: `Juz ${currentJuz} / 30`,
            ar: `\u062c\u0632\u0621 ${toAr(currentJuz)} / ${toAr(30)}`,
          })
        : ayahCount;

  const themeDotColors = {
    light: "#199b90",
    dark: "#2bb6c7",
    sepia: "#b4883c",
    "quran-night": "#3ca675",
    oled: "#2db870",
  };
  const dotColor = themeDotColors[theme] || "var(--primary)";

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
    cycleTheme: tr({
      fr: "Changer de th\u00e8me",
      en: "Switch theme",
      ar: "\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0645\u0638\u0647\u0631",
    }),
  };

  const cleanQuickItems = [
    {
      key: "settings",
      Icon: Settings,
      label: i18nT("nav.settings", lang),
      action: openSettings,
    },
    {
      key: "duas",
      Icon: HandHeart,
      label: tr({
        fr: "Douas / Invocations",
        en: "Duas / Supplications",
        ar: "\u0627\u0644\u0623\u062f\u0639\u064a\u0629 \u0648\u0627\u0644\u0623\u0630\u0643\u0627\u0631",
      }),
      action: openDuas,
    },
    {
      key: "theme",
      Icon: Palette,
      label: tr({
        fr: "Changer de th\u00e8me",
        en: "Switch theme",
        ar: "\u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u0645\u0638\u0647\u0631",
      }),
      action: cycleTheme,
    },
    {
      key: "tools",
      Icon: Shapes,
      label: tr({
        fr: "Espace outils",
        en: "Tools hub",
        ar: "\u0645\u0631\u0643\u0632 \u0627\u0644\u0623\u062f\u0648\u0627\u062a",
      }),
      action: openToolsHub,
    },
  ];

  return (
    <header ref={headerRef} className={cn("mp-header", headerCompact && "mp-header--compact")} role="banner">
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
            aria-label={lang === "ar" ? "Mushaf.plus — الرئيسية" : lang === "en" ? "Mushaf.plus — Home" : "Mushaf.plus — Accueil"}
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
            <span className="mp-header__brand-text hidden lg:inline">
              Mushaf<span style={{ color: dotColor }}>.</span>plus
            </span>
          </button>
        </div>

        {/* ── CENTER: surah nav ───────────────────────────── */}
        <div className="mp-header__center">
          {showHome ? (
            <button
              className="mp-header__home-summary"
              type="button"
              onClick={() => set({ showHome: false, showDuas: false })}
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
                    style={{
                      width: "fit-content",
                      maxWidth: "min(65vw, 300px)",
                    }}
                  >
                    <span className="mp-header__kicker">{centerKicker}</span>
                    <span className="mp-header__title">{centerTitle}</span>
                    {centerSub && (
                      <span className="mp-header__sub">{centerSub}</span>
                    )}
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
                    <label className="text-center text-[0.85rem] font-bold text-text-primary">
                      {goToLabel}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={inputRef}
                        type="number"
                        min={1}
                        max={goToMax}
                        value={goToValue}
                        onChange={(event) => setGoToValue(event.target.value)}
                        placeholder="#"
                        className="h-10 flex-1 rounded-xl border border-border bg-bg-secondary px-3 text-center text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="submit"
                        className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white transition-colors hover:bg-primary-dark"
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
            onClick={() => set({ riwaya: riwaya === "hafs" ? "warsh" : "hafs" })}
            aria-label={headerLabels.riwayaToggle}
            title={headerLabels.riwayaToggle}
          >
            <BookOpen size={14} strokeWidth={2.2} />
            <span>{riwaya.toUpperCase()}</span>
          </button>

          {/* Search */}
          <button
            className="mp-header__action mp-header__search"
            type="button"
            onClick={openSearch}
            aria-label={i18nT("nav.search", lang)}
            title={i18nT("nav.search", lang)}
          >
            <Search size={16} strokeWidth={2.2} />
            <span>{i18nT("nav.search", lang)}</span>
          </button>

          {/* Settings */}
          <button
            className={cn("mp-header__action mp-header__settings", settingsOpen && "is-active")}
            type="button"
            onClick={openSettings}
            aria-label={i18nT("nav.settings", lang)}
            title={i18nT("nav.settings", lang)}
          >
            <Settings size={16} strokeWidth={2.2} />
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
              className="z-[300] w-60 rounded-2xl border border-border bg-bg-primary p-1 shadow-2xl"
            >
              <div className="mp-header-menu__header">
                <span className="mp-header-menu__header-icon">
                  <MoreHorizontal size={14} strokeWidth={2.2} />
                </span>
                <span className="mp-header-menu__header-text">
                  {tr({ fr: "Actions rapides", en: "Quick actions", ar: "إجراءات سريعة" })}
                </span>
              </div>

              {cleanQuickItems.map((item) => (
                <button
                  key={item.key}
                  className="mp-header-menu__item"
                  type="button"
                  onClick={() => {
                    item.action();
                    setQuickMenuOpen(false);
                  }}
                >
                  <span className="mp-header-menu__item-icon">
                    <item.Icon size={15} strokeWidth={2} />
                  </span>
                  <span>{item.label}</span>
                </button>
              ))}

              <div className="mp-header-menu__riwaya">
                <div className="mp-header-menu__riwaya-label">
                  {tr({ fr: "Riwaya", en: "Riwaya", ar: "الرواية" })}
                </div>
                <div className="mp-header-menu__riwaya-btns">
                  {["hafs", "warsh"].map((id) => (
                    <button
                      key={id}
                      className={cn("mp-header__seg", riwaya === id && "is-active")}
                      type="button"
                      onClick={() => {
                        set({ riwaya: id });
                        setQuickMenuOpen(false);
                      }}
                    >
                      {id.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Network status */}
          <div className="mp-header__network">
            <NetworkStatus />
          </div>
        </div>
      </div>
    </header>
  );
}
