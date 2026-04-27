import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { t as i18nT } from "../i18n";
import { toAr, getSurah, surahName } from "../data/surahs";
import { cn } from "../lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import PlatformLogo from "./PlatformLogo";
import NetworkStatus from "./NetworkStatus";
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

  // Mise à jour de la hauteur du header en CSS var
  useEffect(() => {
    const updateHeaderHeight = () => {
      const el = headerRef.current;
      if (!el) return;
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0)
        document.documentElement.style.setProperty("--header-h", `${h}px`);
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
    if (goToOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [goToOpen]);

  const cycleTheme = () =>
    dispatch({ type: "SET_THEME", payload: nextThemeId });

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
    if (displayMode === "page" && currentPage > 1)
      set({ currentPage: currentPage - 1 });
    else if (displayMode === "juz" && currentJuz > 1)
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz - 1 } });
    else if (currentSurah > 1)
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: currentSurah - 1 },
      });
  };

  const handleNext = () => {
    set({ showHome: false, showDuas: false });
    if (displayMode === "page" && currentPage < 604)
      set({ currentPage: currentPage + 1 });
    else if (displayMode === "juz" && currentJuz < 30)
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz + 1 } });
    else if (currentSurah < 114)
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: currentSurah + 1 },
      });
  };

  const handleGoTo = (e) => {
    e.preventDefault();
    const num = parseInt(goToValue);
    if (isNaN(num)) return;
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
      ? tr({ fr: "Page (1-604)", en: "Page (1-604)", ar: "صفحة (١-٦٠٤)" })
      : displayMode === "juz"
        ? tr({ fr: "Juz (1-30)", en: "Juz (1-30)", ar: "جزء (١-٣٠)" })
        : tr({
            fr: "Sourate (1-114)",
            en: "Surah (1-114)",
            ar: "سورة (١-١١٤)",
          });

  // Données title/subtitle du centre
  const surahMeta = getSurah(currentSurah);
  const arabicName = surahMeta?.ar || "";
  const translatedName = surahName(currentSurah, lang);
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
        ? arabicName
        : translatedName;

  const centerKicker = showDuas
    ? tr({ fr: "Espace Douas", en: "Duas Space", ar: "فضاء الأدعية" })
    : displayMode === "page"
      ? tr({ fr: "Lecture page", en: "Page reading", ar: "قراءة الصفحة" })
      : displayMode === "juz"
        ? tr({ fr: "Lecture par Juz", en: "Juz reading", ar: "قراءة الأجزاء" })
        : tr({
            fr: "Lecture Sourate",
            en: "Surah reading",
            ar: "قراءة السورة",
          });

  const centerSub = showDuas
    ? ""
    : displayMode === "page"
      ? tr({
          fr: `Page ${currentPage} sur 604`,
          en: `Page ${currentPage} of 604`,
          ar: `الصفحة ${toAr(currentPage)} من ${toAr(604)}`,
        })
      : displayMode === "juz"
        ? tr({
            fr: `Juz ${currentJuz} sur 30`,
            en: `Juz ${currentJuz} of 30`,
            ar: `الجزء ${toAr(currentJuz)} من ${toAr(30)}`,
          })
        : ayahCount;

  // Couleur du point thème
  const themeDotColors = {
    light: "#199b90",
    dark: "#2bb6c7",
    sepia: "#b4883c",
    "quran-night": "#3ca675",
    oled: "#2db870",
  };
  const dotColor = themeDotColors[theme] || "var(--primary)";

  // Chips accueil
  const homeChips = [
    {
      icon: "fa-book-open",
      value: "114",
      label: tr({ fr: "sourates", en: "surahs", ar: "سورة" }),
    },
    { icon: "fa-layer-group", value: "30", label: "Juz" },
    {
      icon: "fa-wave-square",
      value: riwaya === "warsh" ? "ورش" : "حفص",
      label: tr({ fr: "Riwaya", en: "Riwaya", ar: "رواية" }),
    },
  ];

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-[220] w-full px-2 sm:px-4 py-1.5 sm:py-2.5 bg-bg-card border-b border-border backdrop-blur-md backdrop-saturate-[1.8] transition-shadow duration-200 select-none shadow-[0_1px_0_var(--border)]"
      role="banner"
    >
      <div className="flex items-center gap-1 sm:gap-2 md:gap-3 max-w-[1400px] mx-auto min-h-[44px] h-auto md:h-[46px]">
        {/* ── GAUCHE : Menu + Brand ── */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <button
            className={cn(
              "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] bg-bg-secondary text-text-secondary transition-all duration-200 hover:bg-bg-tertiary hover:text-text-primary",
              state.sidebarOpen &&
                "bg-primary text-white hover:bg-primary-dark",
            )}
            onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            aria-label={tr({ fr: "Menu", en: "Menu", ar: "القائمة" })}
            aria-expanded={state.sidebarOpen}
          >
            <i className={state.sidebarOpen ? "fas fa-times" : "fas fa-bars"} />
          </button>

          <button
            className="flex items-center gap-2 px-1.5 py-1 rounded-[12px] transition-colors hover:bg-bg-secondary"
            onClick={() => set({ showHome: true, showDuas: false })}
            aria-label={tr({
              fr: "Retour à l'accueil",
              en: "Back to home",
              ar: "العودة للرئيسية",
            })}
          >
            <span className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] rounded-[9px] sm:rounded-[12px] overflow-hidden shadow-sm shrink-0">
              <PlatformLogo
                className="w-full h-full"
                imgClassName="w-full h-full object-cover"
                decorative
                priority
                width={34}
                height={34}
              />
            </span>
            <span className="hidden sm:flex items-baseline text-text-primary text-[0.84rem] sm:text-[1.04rem] font-bold tracking-tight">
              Mushaf
              <span
                className="w-1.5 h-1.5 mx-0.5 rounded-full"
                style={{ background: dotColor }}
              />
              plus
            </span>
          </button>
        </div>

        {/* ── CENTRE : Accueil ou Navigation ── */}
        <div className="flex flex-1 items-center justify-center min-w-0">
          {showHome ? (
            <div className="flex flex-1 items-center justify-center gap-3 sm:gap-4">
              <span className="hidden md:block text-[0.92rem] font-bold text-text-primary truncate">
                {tr({
                  fr: "Reprends ta lecture",
                  en: "Continue your reading",
                  ar: "استأنف قراءتك",
                })}
              </span>
              <div className="hidden lg:flex items-center gap-2">
                {homeChips.map((chip) => (
                  <span
                    key={chip.icon}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] bg-bg-secondary text-[0.78rem] text-text-secondary border border-border/50"
                  >
                    <i
                      className={`fas ${chip.icon} text-[0.7rem]`}
                      aria-hidden="true"
                    />
                    <strong className="text-text-primary font-bold">
                      {chip.value}
                    </strong>
                    <span>{chip.label}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <nav
              className="flex flex-1 items-center justify-center gap-1 sm:gap-2 min-w-0"
              aria-label={tr({
                fr: "Navigation Coran",
                en: "Quran navigation",
                ar: "التنقل في القرآن",
              })}
            >
              <button
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] bg-bg-secondary text-text-secondary transition-all hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none"
                onClick={isRtl ? handleNext : handlePrev}
                disabled={isRtl ? !canGoNext : !canGoPrev}
                aria-label={i18nT("quran.prevSurah", lang)}
              >
                <i className="fas fa-chevron-left text-[0.8rem]" />
              </button>

              <Popover open={goToOpen} onOpenChange={setGoToOpen}>
                <PopoverTrigger asChild>
                  <button
                    className="flex flex-col items-center justify-center px-3 sm:px-4 py-1 rounded-[12px] bg-bg-secondary hover:bg-bg-tertiary transition-colors cursor-pointer min-w-[120px] max-w-[200px] sm:max-w-[240px]"
                    aria-label={tr({
                      fr: "Aller à",
                      en: "Go to",
                      ar: "انتقل إلى",
                    })}
                  >
                    <span className="hidden sm:block text-[0.65rem] uppercase tracking-wider text-text-muted font-bold mb-[2px]">
                      {centerKicker}
                    </span>
                    <span className="text-[0.85rem] sm:text-[1rem] font-bold text-text-primary truncate w-full text-center">
                      {centerTitle}
                    </span>
                    {centerSub && (
                      <span className="hidden sm:block text-[0.7rem] text-text-secondary mt-[2px]">
                        {centerSub}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  sideOffset={10}
                  className="w-64 p-0 border border-border shadow-xl rounded-2xl bg-bg-primary z-[300]"
                >
                  <form
                    onSubmit={handleGoTo}
                    className="flex flex-col gap-3 p-4"
                  >
                    <label className="text-[0.85rem] font-bold text-text-primary text-center">
                      {goToLabel}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={inputRef}
                        type="number"
                        min={1}
                        max={goToMax}
                        value={goToValue}
                        onChange={(e) => setGoToValue(e.target.value)}
                        placeholder="#"
                        className="flex-1 h-10 px-3 rounded-[10px] bg-bg-secondary border border-border text-center text-text-primary outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                      <button
                        type="submit"
                        className="w-10 h-10 flex items-center justify-center rounded-[10px] bg-primary text-white hover:bg-primary-dark transition-colors"
                      >
                        <i className="fas fa-arrow-right" />
                      </button>
                    </div>
                  </form>
                </PopoverContent>
              </Popover>

              <button
                className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] bg-bg-secondary text-text-secondary transition-all hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-40 disabled:pointer-events-none"
                onClick={isRtl ? handlePrev : handleNext}
                disabled={isRtl ? !canGoPrev : !canGoNext}
                aria-label={i18nT("quran.nextSurah", lang)}
              >
                <i className="fas fa-chevron-right text-[0.8rem]" />
              </button>
            </nav>
          )}
        </div>

        {/* ── DROITE : Actions ── */}
        <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
          {/* Riwaya toggle */}
          <div
            className="hidden lg:flex p-[2px] bg-bg-secondary rounded-[10px] border border-border/50"
            role="group"
            aria-label="Riwāya"
          >
            <button
              className={cn(
                "px-2.5 py-1 text-[0.7rem] font-bold rounded-[8px] transition-colors text-text-secondary hover:text-text-primary",
                riwaya === "hafs" && "bg-bg-primary text-primary shadow-sm",
              )}
              onClick={() => set({ riwaya: "hafs" })}
              aria-pressed={riwaya === "hafs"}
              title="Riwāya HAFS"
            >
              HAFS
            </button>
            <button
              className={cn(
                "px-2.5 py-1 text-[0.7rem] font-bold rounded-[8px] transition-colors text-text-secondary hover:text-text-primary",
                riwaya === "warsh" && "bg-bg-primary text-primary shadow-sm",
              )}
              onClick={() => set({ riwaya: "warsh" })}
              aria-pressed={riwaya === "warsh"}
              title="Riwāya WARSH"
            >
              WARSH
            </button>
          </div>

          {/* Groupe d'outils */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            {/* Douas */}
            <button
              className={cn(
                "flex items-center justify-center h-8 sm:h-9 w-auto px-2 sm:px-3 gap-2 rounded-[10px] bg-bg-secondary text-text-secondary transition-all hover:bg-bg-tertiary hover:text-text-primary",
                showDuas &&
                  "bg-primary text-white hover:bg-primary-dark hover:text-white",
              )}
              onClick={() => set({ showDuas: true, showHome: false })}
              title={tr({ fr: "Douas", en: "Duas", ar: "الأدعية" })}
              aria-label={tr({ fr: "Douas", en: "Duas", ar: "الأدعية" })}
            >
              <i className="fas fa-hands-praying text-[0.8rem]" />
              <span className="hidden sm:inline-block text-[0.75rem] font-bold whitespace-nowrap">
                {tr({ fr: "Douas", en: "Duas", ar: "الأدعية" })}
              </span>
            </button>

            {/* Thème */}
            <button
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] bg-bg-secondary text-text-secondary transition-all hover:bg-bg-tertiary hover:text-text-primary"
              onClick={cycleTheme}
              title={tr({
                fr: "Changer le thème",
                en: "Change theme",
                ar: "تغيير الثيم",
              })}
              aria-label={tr({
                fr: "Changer le thème",
                en: "Change theme",
                ar: "تغيير الثيم",
              })}
            >
              <i className="fas fa-palette text-[0.9rem]" />
            </button>

            {/* Paramètres */}
            <button
              className={cn(
                "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-[10px] bg-bg-secondary text-text-secondary transition-all hover:bg-bg-tertiary hover:text-text-primary",
                state.settingsOpen &&
                  "bg-primary text-white hover:bg-primary-dark hover:text-white",
              )}
              onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
              title={i18nT("nav.settings", lang)}
              aria-label={i18nT("nav.settings", lang)}
            >
              <i className="fas fa-sliders text-[0.9rem]" />
            </button>

            {/* Recherche */}
            <button
              className="flex items-center justify-center h-8 sm:h-9 w-8 sm:w-9 md:w-auto md:px-3 gap-2 rounded-[10px] bg-bg-secondary text-text-secondary transition-all hover:bg-bg-tertiary hover:text-text-primary"
              onClick={() => dispatch({ type: "TOGGLE_SEARCH" })}
              title={`${i18nT("nav.search", lang)} — Ctrl+K`}
              aria-label={i18nT("nav.search", lang)}
            >
              <i className="fas fa-magnifying-glass text-[0.9rem]" />
              <span className="hidden md:inline-block text-[0.8rem] font-medium">
                {i18nT("nav.search", lang)}
              </span>
            </button>
          </div>

          {/* Statut réseau */}
          <div className="flex items-center pl-1 sm:pl-2 border-l border-border/40">
            <NetworkStatus />
          </div>
        </div>
      </div>
    </header>
  );
}
