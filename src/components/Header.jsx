import React, { useState, useRef, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { toAr, getSurah, surahName } from "../data/surahs";
import { JUZ_DATA } from "../data/juz";
import { getDefaultReciterId } from "../data/reciters";
import audioService from "../services/audioService";
import { clearCache } from "../services/quranAPI";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "./ui/dropdown-menu";
import { Popover, PopoverTrigger, PopoverContent } from "./ui/popover";
import PlatformLogo from "./PlatformLogo";

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
    translationLang,
    wordTranslationLang,
    loadedAyahCount,
    showHome,
    showDuas,
    showTranslation,
    showWordTranslation,
    mushafLayout,
  } = state;

  const [goToValue, setGoToValue] = useState("");
  const [goToOpen, setGoToOpen] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus go-to input
  useEffect(() => {
    if (goToOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [goToOpen]);

  const themeLabel =
    theme === "dark"
      ? t("settings.dark", lang)
      : theme === "sepia"
        ? t("settings.sepia", lang)
        : theme === "ocean"
          ? t("settings.ocean", lang)
          : theme === "forest"
            ? t("settings.forest", lang)
            : theme === "night-blue"
              ? t("settings.nightBlue", lang)
              : t("settings.light", lang);

  const cycleTheme = () => {
    const themes = ["light", "dark", "sepia", "ocean", "forest", "night-blue"];
    const idx = themes.indexOf(theme);
    dispatch({
      type: "SET_THEME",
      payload: themes[(idx + 1) % themes.length],
    });
  };

  const applyRiwaya = (nextRiwaya) => {
    if (nextRiwaya === riwaya) return;
    audioService.stop();
    clearCache();
    const fallbackReciter = getDefaultReciterId(nextRiwaya);
    const patch = {
      riwaya: nextRiwaya,
      reciter: fallbackReciter,
      isPlaying: false,
      currentPlayingAyah: null,
      currentAyah: 1,
    };
    set(patch);
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
          : "صفحة (١-٦٠٤)"
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

  const allDisplayModes = [
    { id: "surah", icon: "fa-align-justify", labelKey: "settings.surahMode" },
    { id: "page", icon: "fa-file-lines", labelKey: "settings.pageMode" },
    { id: "juz", icon: "fa-book-open", labelKey: "settings.juzMode" },
  ];

  const displayModeMeta =
    displayMode === "page"
      ? { icon: "fa-file-lines", label: t("settings.pageMode", lang) }
      : displayMode === "juz"
        ? { icon: "fa-book-open", label: t("settings.juzMode", lang) }
        : { icon: "fa-align-justify", label: t("settings.surahMode", lang) };

  const isRtl = lang === "ar";
  const currentValue =
    displayMode === "page"
      ? currentPage
      : displayMode === "juz"
        ? currentJuz
        : currentSurah;

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

  const juzMeta = JUZ_DATA?.[currentJuz - 1];
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
    <header className="flex flex-col z-[100] relative select-none w-full border-b border-[var(--border)] bg-[#FDFCFB] dark:bg-[var(--bg-primary)] transition-colors duration-300">
      {/* Top Banner */}
      <div className="bg-[#0E8A5E] text-white text-[0.65rem] sm:text-[0.75rem] py-[5px] sm:py-1.5 flex flex-wrap items-center justify-center gap-1 sm:gap-2 font-medium w-full px-4 text-center">
        <span>
          {lang === "fr"
            ? "C'est le mois du Coran. Aidez-nous à diffuser sa lumière."
            : lang === "ar"
              ? "إنه شهر القرآن. ساهم في نشر نوره."
              : "It's the month of the Quran. Help us spread its light."}
        </span>
        <button className="bg-white/20 hover:bg-white/30 text-white rounded-full px-2 sm:px-2.5 py-0.5 transition-colors font-bold flex items-center gap-1 ml-1 cursor-pointer">
          <i className="fas fa-sparkles text-[0.6rem]" />{" "}
          {lang === "fr" ? "Faire un don" : lang === "ar" ? "تبرع" : "Donate"}
        </button>
      </div>

      <div className="app-header-main flex items-center justify-between w-full h-[var(--header-h)] lg:h-[70px] px-3 sm:px-6 gap-3">
        <div className="flex items-center shrink-0 min-w-0">
          <button
            className="app-header-brand flex items-center gap-3 group outline-none cursor-pointer min-w-0"
            onClick={() => set({ showHome: true, showDuas: false })}
          >
            <PlatformLogo
              className="header-brand-mark"
              imgClassName="header-brand-mark__img"
              decorative
            />
            <span
              className="font-bold text-[#111827] dark:text-white tracking-tight text-[1.4rem] sm:text-[1.6rem] transition-colors"
              style={{
                fontFamily:
                  "ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif",
              }}
            >
              Mushaf.plus
            </span>
          </button>
        </div>

        {/* CENTER: Simple Navigation (No Border) */}
        {!showHome && (
          <div className="hidden md:flex flex-1 items-center justify-center mx-4 min-w-0 gap-3">
            {/* Prev Button */}
            <button
              onClick={isRtl ? handleNext : handlePrev}
              disabled={isRtl ? !canGoNext : !canGoPrev}
              className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[#0E8A5E] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all active:scale-95"
              aria-label={
                isRtl ? t("quran.nextSurah", lang) : t("quran.prevSurah", lang)
              }
            >
              <i className="fas fa-chevron-left text-[0.7rem]" />
            </button>

            {/* Center Text (Clickable for Go-To) */}
            <Popover open={goToOpen} onOpenChange={setGoToOpen}>
              <PopoverTrigger asChild>
                <button className="flex flex-col items-center justify-center min-w-[140px] group cursor-pointer">
                  <span
                    className="text-[1.05rem] font-bold text-[var(--text)] group-hover:text-[#0E8A5E] truncate transition-colors"
                    style={{ fontFamily: "var(--font-ui)" }}
                  >
                    {centerTitle}
                  </span>
                  <span className="text-[0.65rem] text-[var(--text-muted)] opacity-70 group-hover:opacity-100 flex gap-1 transition-opacity">
                    {displayMode === "surah" ? (
                      <>
                        <span>
                          {lang === "ar"
                            ? toAr(currentSurah)
                            : `#${currentSurah}`}
                        </span>
                        <span className="opacity-30">·</span>
                        <span>{ayahCount}</span>
                      </>
                    ) : displayMode === "page" ? (
                      <>
                        <span>
                          {lang === "ar" ? toAr(currentPage) : currentPage}
                        </span>
                        <span className="opacity-30">/</span>
                        <span>{lang === "ar" ? toAr(604) : 604}</span>
                      </>
                    ) : (
                      <>
                        <span>
                          {lang === "ar" ? toAr(currentJuz) : currentJuz}
                        </span>
                        <span className="opacity-30">/</span>
                        <span>{lang === "ar" ? toAr(30) : 30}</span>
                      </>
                    )}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                sideOffset={12}
                className="w-[260px] p-0 border border-[var(--border)]/60 shadow-xl rounded-3xl bg-[var(--bg-primary)] z-[110]"
              >
                <form onSubmit={handleGoTo} className="flex flex-col gap-4 p-4">
                  <label className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--text-muted)] ml-1">
                    {goToLabel}
                  </label>
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      type="number"
                      min={1}
                      max={goToMax}
                      value={goToValue}
                      onChange={(e) => setGoToValue(e.target.value)}
                      placeholder="#"
                      className="flex-1 text-center h-10 rounded-xl border-[var(--border)] focus:ring-[#0E8A5E]/30"
                    />
                    <Button
                      type="submit"
                      className="px-5 h-10 rounded-xl bg-[#0E8A5E] hover:bg-[#0c7c54] text-white transition-colors cursor-pointer"
                    >
                      <i className="fas fa-arrow-right" />
                    </Button>
                  </div>
                </form>
              </PopoverContent>
            </Popover>

            {/* Next Button */}
            <button
              onClick={isRtl ? handlePrev : handleNext}
              disabled={isRtl ? !canGoPrev : !canGoNext}
              className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[#0E8A5E] disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer transition-all active:scale-95"
              aria-label={
                isRtl ? t("quran.prevSurah", lang) : t("quran.nextSurah", lang)
              }
            >
              <i className="fas fa-chevron-right text-[0.7rem]" />
            </button>
          </div>
        )}

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          {/* Duas Button */}
          <button
            className="app-header-chip hidden sm:flex items-center justify-center px-4 py-1.5 rounded-full text-[0.85rem] font-semibold font-[var(--font-ui)] transition-colors cursor-pointer"
            onClick={() => set({ showDuas: true, showHome: false })}
          >
            <span>
              {lang === "ar" ? "أدعية" : lang === "fr" ? "Douas" : "Duas"}
            </span>
          </button>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Settings */}
            <HeaderIconButton
              icon="fa-sliders"
              onClick={() => dispatch({ type: "TOGGLE_SETTINGS" })}
              title={t("nav.settings", lang)}
            />
            <HeaderIconButton
              icon="fa-search"
              onClick={() => dispatch({ type: "TOGGLE_SEARCH" })}
              title={t("nav.search", lang)}
            />
            {/* Hamburger Menu */}
            <button
              className="flex items-center justify-center w-10 h-10 rounded-xl text-[#111827] dark:text-white hover:bg-[var(--bg-secondary)] transition-colors cursor-pointer"
              onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
            >
              <i className="fas fa-bars text-[1.1rem]" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

/* Icon Button Component */
function HeaderIconButton({ icon, onClick, title, active = false }) {
  return (
    <button
      className={cn(
        "flex items-center justify-center w-10 h-10 rounded-xl transition-all cursor-pointer",
        active
          ? "text-[#0E8A5E] bg-[#0E8A5E]/10"
          : "text-[#111827] dark:text-white hover:bg-[var(--bg-secondary)]",
      )}
      onClick={onClick}
      title={title}
      aria-label={title}
    >
      <i className={`fas ${icon} text-[0.95rem]`} />
    </button>
  );
}
