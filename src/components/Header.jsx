import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { t as i18nT } from "../i18n";
import { toAr, getSurah, surahName } from "../data/surahs";
import { JUZ_DATA } from "../data/juz";
import audioService from "../services/audioService";
import { cn } from "../lib/utils";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import PlatformLogo from "./PlatformLogo";
import NetworkStatus from "./NetworkStatus";
import "../styles/header-modern.css";

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

  useEffect(() => {
    if (goToOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [goToOpen]);

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

  const cycleTheme = () => {
    const themes = ["light", "sepia", "dark", "quran-night"];
    const idx = themes.indexOf(theme);
    dispatch({ type: "SET_THEME", payload: themes[(idx + 1) % themes.length] });
  };

  const handleGoTo = (e) => {
    e.preventDefault();
    const num = parseInt(goToValue);
    if (isNaN(num)) return;
    if (displayMode === "page") {
      if (num >= 1 && num <= 604) {
        set({ currentPage: num, showHome: false, showDuas: false });
        setGoToOpen(false);
        setGoToValue("");
      }
    } else if (displayMode === "juz") {
      if (num >= 1 && num <= 30) {
        set({ showHome: false, showDuas: false });
        dispatch({ type: "NAVIGATE_JUZ", payload: { juz: num } });
        setGoToOpen(false);
        setGoToValue("");
      }
    } else {
      if (num >= 1 && num <= 114) {
        set({ showHome: false, showDuas: false });
        dispatch({ type: "NAVIGATE_SURAH", payload: { surah: num } });
        setGoToOpen(false);
        setGoToValue("");
      }
    }
  };

  const goToLabel =
    displayMode === "page"
      ? lang === "fr"
        ? "Page (1-604)"
        : lang === "en"
          ? "Page (1-604)"
          : "صفحة (-)"
      : displayMode === "juz"
        ? lang === "fr"
          ? "Juz (1-30)"
          : lang === "en"
            ? "Juz (1-30)"
            : "جزء (١-٣٠)"
        : lang === "fr"
          ? "Sourate (1-114)"
          : lang === "en"
            ? "Surah (1-114)"
            : "سورة (١-١١٤)";

  const goToMax =
    displayMode === "page" ? 604 : displayMode === "juz" ? 30 : 114;
  const isRtl = lang === "ar";
  const tr = (obj) => (lang === "ar" ? obj.ar : lang === "fr" ? obj.fr : obj.en);

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
    if (displayMode === "page") {
      if (currentPage > 1)
        set({ currentPage: currentPage - 1, showHome: false, showDuas: false });
    } else if (displayMode === "juz") {
      if (currentJuz > 1)
        dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz - 1 } });
    } else {
      if (currentSurah > 1)
        dispatch({
          type: "NAVIGATE_SURAH",
          payload: { surah: currentSurah - 1 },
        });
    }
  };

  const handleNext = () => {
    set({ showHome: false, showDuas: false });
    if (displayMode === "page") {
      if (currentPage < 604)
        set({ currentPage: currentPage + 1, showHome: false, showDuas: false });
    } else if (displayMode === "juz") {
      if (currentJuz < 30)
        dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz + 1 } });
    } else {
      if (currentSurah < 114)
        dispatch({
          type: "NAVIGATE_SURAH",
          payload: { surah: currentSurah + 1 },
        });
    }
  };

  const surahMeta = getSurah(currentSurah);
  const arabicName = surahMeta?.ar || "";
  const translatedName = surahName(currentSurah, lang);

  const centerTitle =
    displayMode === "juz"
      ? lang === "ar"
        ? `جزء ${toAr(currentJuz)}`
        : `Juz ${currentJuz}`
      : lang === "ar"
        ? arabicName
        : translatedName;

  const ayahWord = lang === "fr" ? "versets" : lang === "ar" ? "آية" : "ayahs";
  const ayahCount = loadedAyahCount
    ? `${lang === "ar" ? toAr(loadedAyahCount) : loadedAyahCount} ${ayahWord}`
    : surahMeta
      ? `${surahMeta.ayahs} ${ayahWord}`
      : "";

  const homeTitle = tr({
    fr: "Reprends ta lecture avec clarte",
    en: "Return to your reading with clarity",
    ar: "عد إلى قراءتك بوضوح",
  });
  const homeSubtitle = tr({
    fr: "Navigation rapide, ecoute guidee et memorisation apaisee.",
    en: "Quick navigation, guided listening and calmer memorization.",
    ar: "تنقل سريع واستماع موجّه ومراجعة أكثر هدوءا.",
  });
  const homeHighlights = [
    {
      icon: "fa-book-open",
      value: "114",
      label: tr({ fr: "sourates", en: "surahs", ar: "سورة" }),
    },
    {
      icon: "fa-layer-group",
      value: "30",
      label: tr({ fr: "juz", en: "juz", ar: "جزء" }),
    },
    {
      icon: "fa-wave-square",
      value: riwaya === "warsh" ? "ورش" : "حفص",
      label: tr({ fr: "riwaya", en: "riwaya", ar: "الرواية" }),
    },
  ];
  const pagePanelTitle = showDuas
    ? tr({ fr: "Espace Douas", en: "Duas Space", ar: "فضاء الأدعية" })
    : centerTitle;
  const pagePanelSubtitle = showDuas
    ? tr({
        fr: "Invocations organisees pour lire, apprendre et revenir plus vite.",
        en: "Structured invocations to read, learn and return faster.",
        ar: "أدعية مرتبة للقراءة والتعلم والعودة السريعة.",
      })
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

  return (
    <header
      ref={headerRef}
      className="hdr hdr--themes4 sticky top-0 z-[220] w-full backdrop-blur-xl"
    >
      <div className="hdr__main flex flex-wrap items-center gap-2 px-2 py-2 md:gap-3 md:px-4">
        <div className="hdr__left flex min-w-0 items-center gap-2">
          <button
            className={cn(
              "hdr__btn",
              "hdr__btn--menu-main",
              state.sidebarOpen && "hdr__btn--active",
            )}
            onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            title={lang === "fr" ? "Menu" : lang === "ar" ? "القائمة" : "Menu"}
            aria-label={
              lang === "fr" ? "Menu" : lang === "ar" ? "القائمة" : "Menu"
            }
          >
            <i className="fas fa-bars" />
          </button>

          <button
            className="hdr__brand"
            onClick={() => set({ showHome: true, showDuas: false })}
            aria-label={tr({
              fr: "Retour a l'accueil",
              en: "Back to home",
              ar: "العودة إلى الرئيسية",
            })}
          >
            <span className="hdr__brand-mark">
              <PlatformLogo
                className="w-full h-full"
                imgClassName="w-full h-full object-cover"
                decorative
              />
            </span>
            <span className="hdr__brand-name">Mushaf.plus</span>
            <span
              className={`hdr__theme-dot hdr__theme-dot--${theme}`}
              title={theme}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="hdr__center min-w-0 flex-1">
          {showHome ? (
            <div className="hdr__home-panel" aria-label={homeTitle}>
              <div className="hdr__home-copy">
                <span className="hdr__home-kicker">
                  {tr({ fr: "MushafPlus", en: "MushafPlus", ar: "مصحف بلس" })}
                </span>
                <strong className="hdr__home-title">{homeTitle}</strong>
                <span className="hdr__home-subtitle">{homeSubtitle}</span>
              </div>
              <div className="hdr__home-meta">
                {homeHighlights.map((item) => (
                  <span key={item.icon} className="hdr__home-chip">
                    <i className={`fas ${item.icon}`} aria-hidden="true" />
                    <strong>{item.value}</strong>
                    <span>{item.label}</span>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="hdr__nav-shell">
              <div className="hdr__nav hdr__nav--active">
                <button
                  className="hdr__nav-arrow"
                  onClick={isRtl ? handleNext : handlePrev}
                  disabled={isRtl ? !canGoNext : !canGoPrev}
                  aria-label={i18nT("quran.prevSurah", lang)}
                >
                  <i className="fas fa-chevron-left" />
                </button>

                <Popover open={goToOpen} onOpenChange={setGoToOpen}>
                  <PopoverTrigger asChild>
                    <button className="hdr__nav-center">
                      <span className="hdr__nav-kicker">
                        {showDuas
                          ? tr({ fr: "Douas", en: "Duas", ar: "الأدعية" })
                          : displayMode === "page"
                            ? tr({ fr: "Lecture page", en: "Page reading", ar: "قراءة الصفحة" })
                            : displayMode === "juz"
                              ? tr({ fr: "Lecture par juz", en: "Juz reading", ar: "قراءة الأجزاء" })
                              : tr({ fr: "Lecture sourate", en: "Surah reading", ar: "قراءة السور" })}
                      </span>
                      <span className="hdr__nav-title">{pagePanelTitle}</span>
                      <span className="hdr__nav-sub">
                        {displayMode === "surah" && !showDuas ? (
                          <>
                            <span>
                              {lang === "ar"
                                ? toAr(currentSurah)
                                : `#${currentSurah}`}
                            </span>
                            <span className="hdr__nav-dot">·</span>
                            <span>{pagePanelSubtitle}</span>
                          </>
                        ) : (
                          <span>{pagePanelSubtitle}</span>
                        )}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="center"
                    sideOffset={12}
                    className="w-60 p-0 border border-(--border) shadow-2xl rounded-2xl bg-(--bg-primary) z-110"
                  >
                    <form onSubmit={handleGoTo} className="hdr-goto-form">
                      <label className="hdr-goto-label">{goToLabel}</label>
                      <div className="hdr-goto-row">
                        <input
                          ref={inputRef}
                          type="number"
                          min={1}
                          max={goToMax}
                          value={goToValue}
                          onChange={(e) => setGoToValue(e.target.value)}
                          placeholder="#"
                          className="hdr-goto-input"
                        />
                        <button type="submit" className="hdr-goto-submit">
                          <i className="fas fa-arrow-right" />
                        </button>
                      </div>
                    </form>
                  </PopoverContent>
                </Popover>

                <button
                  className="hdr__nav-arrow"
                  onClick={isRtl ? handlePrev : handleNext}
                  disabled={isRtl ? !canGoPrev : !canGoNext}
                  aria-label={i18nT("quran.nextSurah", lang)}
                >
                  <i className="fas fa-chevron-right" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="hdr__actions ml-auto flex items-center justify-end gap-2">
          <div className="hdr__action-cluster hdr__action-cluster--status hidden lg:flex">
            <NetworkStatus />
            <button
              className="hdr__btn hdr__btn--theme"
              onClick={cycleTheme}
              title={tr({
                fr: "Changer de theme",
                en: "Cycle theme",
                ar: "تبديل السمة",
              })}
              aria-label={tr({
                fr: "Changer de theme",
                en: "Cycle theme",
                ar: "تبديل السمة",
              })}
            >
              <i className="fas fa-swatchbook" />
            </button>
          </div>

          <div className="hdr__action-cluster hdr__action-cluster--primary">
            <button
              className="hdr__btn-duas"
              onClick={() => set({ showDuas: true, showHome: false })}
            >
              <i className="fas fa-hands-praying text-[0.7rem]" />
              <span className="hidden sm:inline">
                {lang === "ar" ? "أدعية" : lang === "fr" ? "Douas" : "Duas"}
              </span>
            </button>

            <div className="hdr__riwaya-toggle" role="group" aria-label="Riwāya">
              <button
                className={cn(
                  "hdr__riwaya-btn",
                  riwaya === "hafs" && "hdr__riwaya-btn--active",
                )}
                onClick={() => set({ riwaya: "hafs" })}
                title="Riwāya Ḥafs"
                aria-pressed={riwaya === "hafs"}
              >
                حفص
              </button>
              <button
                className={cn(
                  "hdr__riwaya-btn",
                  riwaya === "warsh" && "hdr__riwaya-btn--active",
                )}
                onClick={() => set({ riwaya: "warsh" })}
                title="Riwāya Warsh"
                aria-pressed={riwaya === "warsh"}
              >
                ورش
              </button>
            </div>
          </div>

          <div className="hdr__action-cluster hdr__action-cluster--tools">
            <button
              className={cn("hdr__btn", state.settingsOpen && "hdr__btn--active")}
              onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
              title={i18nT("nav.settings", lang)}
              aria-label={i18nT("nav.settings", lang)}
            >
              <i className="fas fa-sliders" />
            </button>

            <button
              className="hdr__btn hdr__btn--search"
              onClick={() => dispatch({ type: "TOGGLE_SEARCH" })}
              title={`${i18nT("nav.search", lang)} — Ctrl+K`}
              aria-label={i18nT("nav.search", lang)}
            >
              <i className="fas fa-magnifying-glass" />
              <span className="hdr__kbd-hint hidden md:inline-flex">K</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
