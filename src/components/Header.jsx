import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
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

  useEffect(() => {
    if (goToOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [goToOpen]);

  const cycleTheme = () => {
    const themes = [
      "light",
      "dark",
      "oled",
      "sepia",
      "ocean",
      "forest",
      "night-blue",
    ];
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

  return (
    <header className="hdr">
      <div className="hdr__main">
        <div className="hdr__left">
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
            aria-label="Accueil"
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

        {/* Center Nav */}
        {!showHome && (
          <div className="hdr__nav">
            <button
              className="hdr__nav-arrow"
              onClick={isRtl ? handleNext : handlePrev}
              disabled={isRtl ? !canGoNext : !canGoPrev}
              aria-label={t("quran.prevSurah", lang)}
            >
              <i className="fas fa-chevron-left" />
            </button>

            <Popover open={goToOpen} onOpenChange={setGoToOpen}>
              <PopoverTrigger asChild>
                <button className="hdr__nav-center">
                  <span className="hdr__nav-title">{centerTitle}</span>
                  <span className="hdr__nav-sub">
                    {displayMode === "surah" ? (
                      <>
                        <span>
                          {lang === "ar"
                            ? toAr(currentSurah)
                            : `#${currentSurah}`}
                        </span>
                        <span className="hdr__nav-dot">·</span>
                        <span>{ayahCount}</span>
                      </>
                    ) : displayMode === "page" ? (
                      <>
                        <span>
                          {lang === "ar" ? toAr(currentPage) : currentPage}
                        </span>
                        <span className="hdr__nav-dot">/</span>
                        <span>{lang === "ar" ? toAr(604) : 604}</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {lang === "ar" ? toAr(currentJuz) : currentJuz}
                        </span>
                        <span className="hdr__nav-dot">/</span>
                        <span>{lang === "ar" ? toAr(30) : 30}</span>
                      </>
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
              aria-label={t("quran.nextSurah", lang)}
            >
              <i className="fas fa-chevron-right" />
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="hdr__actions">
          <NetworkStatus />

          <div className="hdr__divider" />

          <button
            className="hdr__btn-duas"
            onClick={() => set({ showDuas: true, showHome: false })}
          >
            <i
              className="fas fa-hands-praying"
              style={{ fontSize: "0.7rem" }}
            />
            <span>
              {lang === "ar" ? "أدعية" : lang === "fr" ? "Douas" : "Duas"}
            </span>
          </button>

          <div className="hdr__divider" />

          {/* Sélecteur de riwaya */}
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

          <div className="hdr__divider" />

          <button
            className={cn("hdr__btn", state.settingsOpen && "hdr__btn--active")}
            onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
            title={t("nav.settings", lang)}
            aria-label={t("nav.settings", lang)}
          >
            <i className="fas fa-sliders" />
          </button>

          <button
            className="hdr__btn"
            onClick={() => dispatch({ type: "TOGGLE_SEARCH" })}
            title={`${t("nav.search", lang)} — Ctrl+K`}
            aria-label={t("nav.search", lang)}
          >
            <i className="fas fa-magnifying-glass" />
            <span className="hdr__kbd-hint">K</span>
          </button>
        </div>
      </div>
    </header>
  );
}
