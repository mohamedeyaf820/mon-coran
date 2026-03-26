import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { t as i18nT } from "../i18n";
import { toAr, getSurah, surahName } from "../data/surahs";
import { cn } from "../lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import PlatformLogo from "./PlatformLogo";
import NetworkStatus from "./NetworkStatus";
import { THEME_ORDER } from "../data/themes";
import "../styles/navbar-refonte.css";

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
    THEME_ORDER[(currentThemeIndex + 1 + THEME_ORDER.length) % THEME_ORDER.length];

  const isRtl = lang === "ar";

  const tr = (obj) =>
    lang === "ar" ? obj.ar : lang === "fr" ? obj.fr : obj.en;

  // Mise à jour de la hauteur du header en CSS var
  useEffect(() => {
    const updateHeaderHeight = () => {
      const el = headerRef.current;
      if (!el) return;
      const h = Math.ceil(el.getBoundingClientRect().height);
      if (h > 0) document.documentElement.style.setProperty("--header-h", `${h}px`);
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

  const cycleTheme = () => dispatch({ type: "SET_THEME", payload: nextThemeId });

  const canGoPrev =
    displayMode === "page" ? currentPage > 1
    : displayMode === "juz" ? currentJuz > 1
    : currentSurah > 1;

  const canGoNext =
    displayMode === "page" ? currentPage < 604
    : displayMode === "juz" ? currentJuz < 30
    : currentSurah < 114;

  const handlePrev = () => {
    set({ showHome: false, showDuas: false });
    if (displayMode === "page" && currentPage > 1) set({ currentPage: currentPage - 1 });
    else if (displayMode === "juz" && currentJuz > 1) dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz - 1 } });
    else if (currentSurah > 1) dispatch({ type: "NAVIGATE_SURAH", payload: { surah: currentSurah - 1 } });
  };

  const handleNext = () => {
    set({ showHome: false, showDuas: false });
    if (displayMode === "page" && currentPage < 604) set({ currentPage: currentPage + 1 });
    else if (displayMode === "juz" && currentJuz < 30) dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz + 1 } });
    else if (currentSurah < 114) dispatch({ type: "NAVIGATE_SURAH", payload: { surah: currentSurah + 1 } });
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

  const goToMax = displayMode === "page" ? 604 : displayMode === "juz" ? 30 : 114;
  const goToLabel =
    displayMode === "page"
      ? tr({ fr: "Page (1-604)", en: "Page (1-604)", ar: "صفحة (١-٦٠٤)" })
      : displayMode === "juz"
      ? tr({ fr: "Juz (1-30)", en: "Juz (1-30)", ar: "جزء (١-٣٠)" })
      : tr({ fr: "Sourate (1-114)", en: "Surah (1-114)", ar: "سورة (١-١١٤)" });

  // Données title/subtitle du centre
  const surahMeta = getSurah(currentSurah);
  const arabicName = surahMeta?.ar || "";
  const translatedName = surahName(currentSurah, lang);
  const ayahWord = lang === "fr" ? "versets" : lang === "ar" ? "آية" : "ayahs";
  const ayahCount = loadedAyahCount
    ? `${lang === "ar" ? toAr(loadedAyahCount) : loadedAyahCount} ${ayahWord}`
    : surahMeta ? `${surahMeta.ayahs} ${ayahWord}` : "";

  const centerTitle =
    showDuas
      ? tr({ fr: "Douas", en: "Duas", ar: "الأدعية" })
      : displayMode === "juz"
      ? lang === "ar" ? `جزء ${toAr(currentJuz)}` : `Juz ${currentJuz}`
      : lang === "ar" ? arabicName : translatedName;

  const centerKicker =
    showDuas
      ? tr({ fr: "Espace Douas", en: "Duas Space", ar: "فضاء الأدعية" })
      : displayMode === "page"
      ? tr({ fr: "Lecture page", en: "Page reading", ar: "قراءة الصفحة" })
      : displayMode === "juz"
      ? tr({ fr: "Lecture par Juz", en: "Juz reading", ar: "قراءة الأجزاء" })
      : tr({ fr: "Lecture Sourate", en: "Surah reading", ar: "قراءة السورة" });

  const centerSub =
    showDuas
      ? ""
      : displayMode === "page"
      ? tr({ fr: `Page ${currentPage} sur 604`, en: `Page ${currentPage} of 604`, ar: `الصفحة ${toAr(currentPage)} من ${toAr(604)}` })
      : displayMode === "juz"
      ? tr({ fr: `Juz ${currentJuz} sur 30`, en: `Juz ${currentJuz} of 30`, ar: `الجزء ${toAr(currentJuz)} من ${toAr(30)}` })
      : ayahCount;

  // Couleur du point thème
  const themeDotColors = {
    light: "#199b90", dark: "#2bb6c7", sepia: "#b4883c",
    "quran-night": "#3ca675", oled: "#2db870",
  };
  const dotColor = themeDotColors[theme] || "var(--primary)";

  // Chips accueil
  const homeChips = [
    { icon: "fa-book-open", value: "114", label: tr({ fr: "sourates", en: "surahs", ar: "سورة" }) },
    { icon: "fa-layer-group", value: "30", label: "Juz" },
    { icon: "fa-wave-square", value: riwaya === "warsh" ? "ورش" : "حفص", label: tr({ fr: "Riwaya", en: "Riwaya", ar: "رواية" }) },
  ];

  return (
    <header
      ref={headerRef}
      className="hdr-v7"
      role="banner"
    >
      <div className="hdr-v7__inner">

        {/* ── GAUCHE : Menu + Brand ── */}
        <div className="hdr-v7__left">
          <button
            className={cn("hdr-v7__menu-btn", state.sidebarOpen && "is-active")}
            onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            aria-label={tr({ fr: "Menu", en: "Menu", ar: "القائمة" })}
            aria-expanded={state.sidebarOpen}
          >
            <i className={state.sidebarOpen ? "fas fa-times" : "fas fa-bars"} />
          </button>

          <button
            className="hdr-v7__brand"
            onClick={() => set({ showHome: true, showDuas: false })}
            aria-label={tr({ fr: "Retour à l'accueil", en: "Back to home", ar: "العودة للرئيسية" })}
          >
            <span className="hdr-v7__brand-logo">
              <PlatformLogo
                className="w-full h-full"
                imgClassName="w-full h-full object-cover"
                decorative
                priority
                width={34}
                height={34}
              />
            </span>
            <span className="hdr-v7__brand-name">
              Mushaf
              <span className="hdr-v7__brand-dot" style={{ background: dotColor }} />
              plus
            </span>
          </button>
        </div>

        {/* ── CENTRE : Accueil ou Navigation ── */}
        <div className="hdr-v7__center">
          {showHome ? (
            <div className="hdr-v7__home">
              <span className="hdr-v7__home-title">
                {tr({ fr: "Reprends ta lecture", en: "Continue your reading", ar: "استأنف قراءتك" })}
              </span>
              <div className="hdr-v7__home-chips">
                {homeChips.map((chip) => (
                  <span key={chip.icon} className="hdr-v7__home-chip">
                    <i className={`fas ${chip.icon}`} aria-hidden="true" />
                    <strong>{chip.value}</strong>
                    <span>{chip.label}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <nav className="hdr-v7__nav" aria-label={tr({ fr: "Navigation Coran", en: "Quran navigation", ar: "التنقل في القرآن" })}>
              <button
                className="hdr-v7__nav-arrow"
                onClick={isRtl ? handleNext : handlePrev}
                disabled={isRtl ? !canGoNext : !canGoPrev}
                aria-label={i18nT("quran.prevSurah", lang)}
              >
                <i className="fas fa-chevron-left" />
              </button>

              <Popover open={goToOpen} onOpenChange={setGoToOpen}>
                <PopoverTrigger asChild>
                  <button className="hdr-v7__nav-center" aria-label={tr({ fr: "Aller à", en: "Go to", ar: "انتقل إلى" })}>
                    <span className="hdr-v7__nav-kicker">{centerKicker}</span>
                    <span className="hdr-v7__nav-title">{centerTitle}</span>
                    {centerSub && <span className="hdr-v7__nav-sub">{centerSub}</span>}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="center"
                  sideOffset={10}
                  className="w-56 p-0 border border-[var(--border)] shadow-xl rounded-2xl bg-[var(--bg-primary)] z-[300]"
                >
                  <form onSubmit={handleGoTo} className="hdr-v7-goto">
                    <label className="hdr-v7-goto__label">{goToLabel}</label>
                    <div className="hdr-v7-goto__row">
                      <input
                        ref={inputRef}
                        type="number"
                        min={1}
                        max={goToMax}
                        value={goToValue}
                        onChange={(e) => setGoToValue(e.target.value)}
                        placeholder="#"
                        className="hdr-v7-goto__input"
                      />
                      <button type="submit" className="hdr-v7-goto__submit">
                        <i className="fas fa-arrow-right" />
                      </button>
                    </div>
                  </form>
                </PopoverContent>
              </Popover>

              <button
                className="hdr-v7__nav-arrow"
                onClick={isRtl ? handlePrev : handleNext}
                disabled={isRtl ? !canGoPrev : !canGoNext}
                aria-label={i18nT("quran.nextSurah", lang)}
              >
                <i className="fas fa-chevron-right" />
              </button>
            </nav>
          )}
        </div>

        {/* ── DROITE : Actions ── */}
        <div className="hdr-v7__right">

          {/* Riwaya toggle */}
          <div className="hdr-v7__riwaya" role="group" aria-label="Riwāya">
            <button
              className={cn("hdr-v7__riwaya-btn", riwaya === "hafs" && "is-active")}
              onClick={() => set({ riwaya: "hafs" })}
              aria-pressed={riwaya === "hafs"}
              title="Riwāya HAFS"
            >
              HAFS
            </button>
            <button
              className={cn("hdr-v7__riwaya-btn", riwaya === "warsh" && "is-active")}
              onClick={() => set({ riwaya: "warsh" })}
              aria-pressed={riwaya === "warsh"}
              title="Riwāya WARSH"
            >
              WARSH
            </button>
          </div>

          {/* Groupe d'outils */}
          <div className="hdr-v7__btn-group">
            {/* Douas */}
            <button
              className={cn("hdr-v7__action-btn hdr-v7__action-btn--wide", showDuas && "is-active")}
              onClick={() => set({ showDuas: true, showHome: false })}
              title={tr({ fr: "Douas", en: "Duas", ar: "الأدعية" })}
              aria-label={tr({ fr: "Douas", en: "Duas", ar: "الأدعية" })}
            >
              <i className="fas fa-hands-praying" style={{ fontSize: ".7rem" }} />
              <span className="hdr-v7__btn-label" style={{ fontSize: ".7rem", fontWeight: 700, fontFamily: "var(--font-ui)", whiteSpace: "nowrap" }}>
                {tr({ fr: "Douas", en: "Duas", ar: "الأدعية" })}
              </span>
            </button>

            {/* Thème */}
            <button
              className="hdr-v7__action-btn"
              onClick={cycleTheme}
              title={tr({ fr: "Changer le thème", en: "Change theme", ar: "تغيير الثيم" })}
              aria-label={tr({ fr: "Changer le thème", en: "Change theme", ar: "تغيير الثيم" })}
            >
              <i className="fas fa-palette" />
            </button>

            {/* Paramètres */}
            <button
              className={cn("hdr-v7__action-btn", state.settingsOpen && "is-active")}
              onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
              title={i18nT("nav.settings", lang)}
              aria-label={i18nT("nav.settings", lang)}
            >
              <i className="fas fa-sliders" />
            </button>

            {/* Recherche */}
            <button
              className="hdr-v7__search-btn"
              onClick={() => dispatch({ type: "TOGGLE_SEARCH" })}
              title={`${i18nT("nav.search", lang)} — Ctrl+K`}
              aria-label={i18nT("nav.search", lang)}
            >
              <i className="fas fa-magnifying-glass" />
              <span>{i18nT("nav.search", lang)}</span>
            </button>
          </div>

          {/* Statut réseau */}
          <NetworkStatus />
        </div>
      </div>
    </header>
  );
}
