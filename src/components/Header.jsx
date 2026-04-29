import React, { useEffect, useRef, useState } from "react";
import { useApp } from "../context/AppContext";
import { t as i18nT } from "../i18n";
import { getSurah, surahName, toAr } from "../data/surahs";
import { cn } from "../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import NetworkStatus from "./NetworkStatus";
import PlatformLogo from "./PlatformLogo";
import { THEME_ORDER } from "../data/themes";

export default function Header() {
  const { state, dispatch, set } = useApp();
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
  const tr = (obj) => (lang === "ar" ? obj.ar : lang === "fr" ? obj.fr : obj.en);

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

  useEffect(() => {
    if (goToOpen) window.setTimeout(() => inputRef.current?.focus(), 50);
  }, [goToOpen]);

  const cycleTheme = () => dispatch({ type: "SET_THEME", payload: nextThemeId });

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
    if (displayMode === "page" && currentPage > 1) set({ currentPage: currentPage - 1 });
    else if (displayMode === "juz" && currentJuz > 1)
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz - 1 } });
    else if (currentSurah > 1)
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: currentSurah - 1 } });
  };

  const handleNext = () => {
    set({ showHome: false, showDuas: false });
    if (displayMode === "page" && currentPage < 604) set({ currentPage: currentPage + 1 });
    else if (displayMode === "juz" && currentJuz < 30)
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz + 1 } });
    else if (currentSurah < 114)
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: currentSurah + 1 } });
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

  const goToMax = displayMode === "page" ? 604 : displayMode === "juz" ? 30 : 114;
  const goToLabel =
    displayMode === "page"
      ? tr({ fr: "Page (1-604)", en: "Page (1-604)", ar: "صفحة (١-٦٠٤)" })
      : displayMode === "juz"
        ? tr({ fr: "Juz (1-30)", en: "Juz (1-30)", ar: "جزء (١-٣٠)" })
        : tr({ fr: "Sourate (1-114)", en: "Surah (1-114)", ar: "سورة (١-١١٤)" });

  const surahMeta = getSurah(currentSurah);
  const ayahWord = lang === "fr" ? "versets" : lang === "ar" ? "آية" : "ayahs";
  const ayahCount = loadedAyahCount
    ? `${lang === "ar" ? toAr(loadedAyahCount) : loadedAyahCount} ${ayahWord}`
    : surahMeta
      ? `${surahMeta.ayahs} ${ayahWord}`
      : "";

  const centerTitle = showDuas
    ? tr({ fr: "Douas", en: "Duas", ar: "الأدعية" })
    : displayMode === "juz"
      ? lang === "ar"
        ? `جزء ${toAr(currentJuz)}`
        : `Juz ${currentJuz}`
      : lang === "ar"
        ? surahMeta?.ar || ""
        : surahName(currentSurah, lang);

  const centerKicker = showDuas
    ? tr({ fr: "Espace Douas", en: "Duas", ar: "الأدعية" })
    : displayMode === "page"
      ? tr({ fr: "Page", en: "Page", ar: "صفحة" })
      : displayMode === "juz"
        ? tr({ fr: "Juz", en: "Juz", ar: "جزء" })
        : tr({ fr: "Sourate", en: "Surah", ar: "سورة" });

  const centerSub = showDuas
    ? tr({ fr: "Invocations coraniques", en: "Quranic supplications", ar: "أدعية قرآنية" })
    : displayMode === "page"
      ? tr({ fr: `Page ${currentPage} / 604`, en: `Page ${currentPage} / 604`, ar: `صفحة ${toAr(currentPage)} / ${toAr(604)}` })
      : displayMode === "juz"
        ? tr({ fr: `Juz ${currentJuz} / 30`, en: `Juz ${currentJuz} / 30`, ar: `جزء ${toAr(currentJuz)} / ${toAr(30)}` })
        : ayahCount;

  const themeDotColors = {
    light: "#199b90",
    dark: "#2bb6c7",
    sepia: "#b4883c",
    "quran-night": "#3ca675",
    oled: "#2db870",
  };
  const dotColor = themeDotColors[theme] || "var(--primary)";

  const goHome = () => set({ showHome: true, showDuas: false });
  const openDuas = () => set({ showDuas: true, showHome: false });
  const openSearch = () => dispatch({ type: "TOGGLE_SEARCH" });
  const openSettings = () => dispatch({ type: "TOGGLE_SETTINGS" });

  const quickItems = [
    { key: "duas", icon: "fa-hands-praying", label: tr({ fr: "Douas", en: "Duas", ar: "الأدعية" }), action: openDuas },
    { key: "settings", icon: "fa-sliders", label: i18nT("nav.settings", lang), action: openSettings },
    { key: "theme", icon: "fa-palette", label: tr({ fr: "Thème", en: "Theme", ar: "الثيم" }), action: cycleTheme },
  ];

  return (
    <header ref={headerRef} className="mp-header" role="banner">
      <div className="mp-header__bar">
        <div className="mp-header__brand-row">
          <button
            className={cn("mp-header__icon-btn", state.sidebarOpen && "is-active")}
            type="button"
            onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            aria-label={tr({ fr: "Menu", en: "Menu", ar: "القائمة" })}
            aria-expanded={state.sidebarOpen}
          >
            <i className={state.sidebarOpen ? "fas fa-times" : "fas fa-bars"} />
          </button>

          <button className="mp-header__brand" type="button" onClick={goHome}>
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
            <span className="mp-header__brand-text">
              Mushaf<span style={{ color: dotColor }}>.</span>plus
            </span>
          </button>
        </div>

        <div className="mp-header__center">
          {showHome ? (
            <button className="mp-header__home-summary" type="button" onClick={goHome}>
              <strong>{tr({ fr: "Reprends ta lecture", en: "Continue reading", ar: "استأنف القراءة" })}</strong>
              <span>{riwaya.toUpperCase()} · 114 sourates · 30 Juz</span>
            </button>
          ) : (
            <nav
              className="mp-header__nav"
              aria-label={tr({ fr: "Navigation Coran", en: "Quran navigation", ar: "التنقل في القرآن" })}
            >
              <button
                className="mp-header__nav-arrow"
                type="button"
                onClick={isRtl ? handleNext : handlePrev}
                disabled={isRtl ? !canGoNext : !canGoPrev}
                aria-label={i18nT("quran.prevSurah", lang)}
              >
                <i className="fas fa-chevron-left" />
              </button>

              <Popover open={goToOpen} onOpenChange={setGoToOpen}>
                <PopoverTrigger asChild>
                  <button className="mp-header__title-btn" type="button">
                    <span className="mp-header__kicker">{centerKicker}</span>
                    <span className="mp-header__title">{centerTitle}</span>
                    {centerSub && <span className="mp-header__sub">{centerSub}</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  sideOffset={10}
                  className="z-[300] w-64 rounded-2xl border border-border bg-bg-primary p-0 shadow-xl"
                >
                  <form onSubmit={handleGoTo} className="flex flex-col gap-3 p-4">
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
                      >
                        <i className="fas fa-arrow-right" />
                      </button>
                    </div>
                  </form>
                </PopoverContent>
              </Popover>

              <button
                className="mp-header__nav-arrow"
                type="button"
                onClick={isRtl ? handlePrev : handleNext}
                disabled={isRtl ? !canGoPrev : !canGoNext}
                aria-label={i18nT("quran.nextSurah", lang)}
              >
                <i className="fas fa-chevron-right" />
              </button>
            </nav>
          )}
        </div>

        <div className="mp-header__actions">
          <div className="mp-header__riwaya" role="group" aria-label="Riwaya">
            {["hafs", "warsh"].map((id) => (
              <button
                key={id}
                className={cn("mp-header__seg", riwaya === id && "is-active")}
                type="button"
                onClick={() => set({ riwaya: id })}
                aria-pressed={riwaya === id}
              >
                {id.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            className={cn("mp-header__action mp-header__action--duas", showDuas && "is-active")}
            type="button"
            onClick={openDuas}
            aria-label={tr({ fr: "Douas", en: "Duas", ar: "الأدعية" })}
          >
            <i className="fas fa-hands-praying" />
            <span>{tr({ fr: "Douas", en: "Duas", ar: "الأدعية" })}</span>
          </button>
          <button className="mp-header__action" type="button" onClick={cycleTheme} aria-label={tr({ fr: "Thème", en: "Theme", ar: "الثيم" })}>
            <i className="fas fa-palette" />
          </button>
          <button className={cn("mp-header__action", state.settingsOpen && "is-active")} type="button" onClick={openSettings} aria-label={i18nT("nav.settings", lang)}>
            <i className="fas fa-sliders" />
          </button>
          <button className="mp-header__action mp-header__search" type="button" onClick={openSearch} aria-label={i18nT("nav.search", lang)}>
            <i className="fas fa-magnifying-glass" />
            <span>{i18nT("nav.search", lang)}</span>
          </button>

          <Popover open={quickMenuOpen} onOpenChange={setQuickMenuOpen}>
            <PopoverTrigger asChild>
              <button className="mp-header__more" type="button" aria-label="Plus">
                <i className="fas fa-ellipsis" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={10}
              className="z-[300] w-64 rounded-2xl border border-border bg-bg-primary p-2 shadow-xl"
            >
              {quickItems.map((item) => (
                <button
                  key={item.key}
                  className="mp-header-menu__item"
                  type="button"
                  onClick={() => {
                    item.action();
                    setQuickMenuOpen(false);
                  }}
                >
                  <i className={`fas ${item.icon}`} />
                  <span>{item.label}</span>
                </button>
              ))}
              <div className="mp-header-menu__riwaya">
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
            </PopoverContent>
          </Popover>

          <div className="mp-header__network">
            <NetworkStatus />
          </div>
        </div>
      </div>
    </header>
  );
}
