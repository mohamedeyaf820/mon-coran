/**
 * SurahReaderHeader — single unified block replacing SurahHeader + ReadingToolbar.
 * Quran.com–inspired, no redundancy, fully responsive.
 */
import React, { useState } from "react";
import {
  BookOpen,
  Brain,
  Info,
  Languages,
  List,
  Loader2,
  Palette,
  Pause,
  Play,
  Type,
} from "lucide-react";
import { getSurah } from "../../data/surahs";
import { cn } from "../../lib/utils";
import { useApp } from "../../context/AppContext";
import audioService from "../../services/audioService";
import ArabicFontControls from "../ArabicFontControls";
import HizbRukuNavigator from "./HizbRukuNavigator";
import SurahInfoPanel from "../QuranDisplay/SurahInfoPanel";

function lbl(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

export default function SurahReaderHeader({
  surahNum,
  currentAyah = 1,
  currentPage,
  onPlaySurah,
  preparingSurah,
  onNavigateToAyah,
  onToggleMushaf,
  onToggleWordByWord,
  onToggleMemorization,
}) {
  const { state, set, dispatch } = useApp();
  const {
    lang,
    memMode,
    mushafLayout,
    showTajwid,
    showTranslation,
    showWordByWord,
    isPlaying,
  } = state;

  const [showInfo, setShowInfo] = useState(false);

  const s = getSurah(surahNum);
  if (!s) return null;

  const isMeccan = s.type === "Meccan";
  const translatedName =
    lang === "ar" ? s.ar : lang === "fr" ? s.fr || s.en : s.en;
  const revelationLabel = isMeccan
    ? lbl(lang, "Mecquoise", "Meccan", "مكية")
    : lbl(lang, "Médinoise", "Medinan", "مدنية");

  const isPreparing = Boolean(preparingSurah && preparingSurah === surahNum);
  const mushafIsOn = mushafLayout === "mushaf";

  /* ── Toggle helpers ── */
  const setMushafLayout = () => {
    if (mushafIsOn) return;
    if (onToggleMushaf) { onToggleMushaf(); return; }
    set({ mushafLayout: "mushaf", memMode: false, showWordByWord: false, showTajwid: true });
  };
  const setListLayout = () => {
    if (!mushafIsOn) return;
    if (onToggleMushaf) { onToggleMushaf(); return; }
    set({ mushafLayout: "list" });
  };
  const toggleTranslation = () => set({ showTranslation: !showTranslation });
  const toggleWordByWord = onToggleWordByWord || (() => set({ showWordByWord: !showWordByWord, memMode: false }));
  const toggleTajweed = () => set({ showTajwid: !showTajwid });
  const toggleMemo = onToggleMemorization || (() => dispatch({ type: "TOGGLE_MEM_MODE" }));

  const handlePlay = () => {
    if (isPlaying) { audioService.pause(); return; }
    onPlaySurah?.();
  };

  /* ── View-mode pill ── */
  const viewPills = [
    {
      key: "mushaf",
      icon: <BookOpen size={13} />,
      label: lbl(lang, "Mushaf", "Mushaf", "مصحف"),
      active: mushafIsOn,
      onClick: setMushafLayout,
    },
    {
      key: "list",
      icon: <List size={13} />,
      label: lbl(lang, "Liste", "List", "قائمة"),
      active: !mushafIsOn,
      onClick: setListLayout,
    },
  ];

  /* ── Study toggles ── */
  const studyToggles = [
    {
      key: "translation",
      icon: <Languages size={13} />,
      label: lbl(lang, "Traduction", "Translation", "ترجمة"),
      active: showTranslation,
      onClick: toggleTranslation,
      hidden: false,
    },
    {
      key: "wbw",
      icon: <Type size={13} />,
      label: lbl(lang, "Mot à mot", "Word by word", "كلمة بكلمة"),
      active: showWordByWord,
      onClick: toggleWordByWord,
      hidden: false,
    },
    {
      key: "tajweed",
      icon: <Palette size={13} />,
      label: lbl(lang, "Tajweed", "Tajweed", "تجويد"),
      active: showTajwid,
      onClick: toggleTajweed,
      hidden: false,
    },
    {
      key: "memo",
      icon: <Brain size={13} />,
      label: lbl(lang, "Mémorisation", "Memorization", "حفظ"),
      active: memMode,
      onClick: toggleMemo,
      hidden: false,
    },
  ];

  return (
    <div className="srh-root" aria-label={lbl(lang, "En-tête de lecture", "Reading header", "رأس القراءة")}>
      {/* ══ ROW 1 — Identity ════════════════════════════════════ */}
      <div className="srh-identity">
        {/* Arabic name */}
        <div className="srh-arabic" dir="rtl" lang="ar" aria-label={s.ar}>
          {s.ar}
        </div>

        {/* Text info */}
        <div className="srh-meta">
          <div className="srh-meta__top">
            <h1 className="srh-title">
              <span className="srh-title__num">{surahNum}.</span>{" "}
              {translatedName}
            </h1>
            <div className="srh-badges">
              <span className={cn("srh-badge", isMeccan ? "srh-badge--gold" : "srh-badge--blue")}>
                {revelationLabel}
              </span>
              <span className="srh-badge">
                {s.ayahs} {lbl(lang, "versets", "verses", "آيات")}
              </span>
            </div>
          </div>
          <p className="srh-sub">{s.en}</p>
          <p className="srh-desc">
            {lbl(
              lang,
              `Lisez et écoutez la Sourate ${s.fr || s.en} — traduction, tafsir, récitation audio.`,
              `Read and listen to Surah ${s.en} — translation, tafsir, audio recitation.`,
              `اقرأ واستمع إلى سورة ${s.ar} — تفسير، تلاوة.`,
            )}
          </p>
        </div>

        {/* Action buttons */}
        <div className="srh-actions">
          <button
            type="button"
            className={cn("srh-play-btn", isPlaying && "srh-play-btn--playing")}
            onClick={handlePlay}
            disabled={isPreparing}
            aria-label={isPlaying ? lbl(lang, "Pause", "Pause", "إيقاف") : lbl(lang, "Écouter", "Listen", "استمع")}
          >
            {isPreparing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
            <span className="srh-play-btn__label">
              {isPreparing
                ? lbl(lang, "Chargement...", "Loading...", "جارٍ...")
                : isPlaying
                ? lbl(lang, "Pause", "Pause", "إيقاف")
                : lbl(lang, "Écouter", "Listen", "استمع")}
            </span>
          </button>

          <button
            type="button"
            className={cn("srh-info-btn", showInfo && "srh-info-btn--active")}
            onClick={() => setShowInfo((v) => !v)}
            aria-expanded={showInfo}
            aria-label={lbl(lang, "Informations sur la sourate", "Surah info", "معلومات السورة")}
          >
            <Info size={15} />
            <span className="srh-info-btn__label">Info</span>
          </button>
        </div>
      </div>

      {/* Mobile-only compact action row (identity hidden on ≤640px) */}
      <div className="srh-mobile-bar" aria-hidden={undefined}>
        <span className="srh-mobile-bar__name" dir="rtl" lang="ar">{s.ar}</span>
        <span className="srh-mobile-bar__title">{surahNum}. {translatedName}</span>
        <div className="srh-mobile-bar__actions">
          <button
            type="button"
            className={cn("srh-play-btn", isPlaying && "srh-play-btn--playing")}
            onClick={handlePlay}
            disabled={isPreparing}
            aria-label={isPlaying ? lbl(lang, "Pause", "Pause", "إيقاف") : lbl(lang, "Écouter", "Listen", "استمع")}
          >
            {isPreparing ? (
              <Loader2 size={14} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
          </button>
          <button
            type="button"
            className={cn("srh-info-btn", showInfo && "srh-info-btn--active")}
            onClick={() => setShowInfo((v) => !v)}
            aria-expanded={showInfo}
            aria-label={lbl(lang, "Informations sur la sourate", "Surah info", "معلومات السورة")}
          >
            <Info size={15} />
          </button>
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="srh-info-panel">
          <SurahInfoPanel surahNum={surahNum} lang={lang} />
        </div>
      )}

      {/* ══ DIVIDER ═══════════════════════════════════════════ */}
      <div className="srh-divider" aria-hidden="true" />

      {/* ══ ROW 2 — View controls ═══════════════════════════════ */}
      <div className="srh-controls">
        {/* Left cluster: view mode (Mushaf / Liste) */}
        <div className="srh-view-pills" role="group" aria-label={lbl(lang, "Mode d'affichage", "Display mode", "وضع العرض")}>
          {viewPills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              className={cn("srh-pill", pill.active && "srh-pill--active")}
              onClick={pill.onClick}
              aria-pressed={pill.active}
            >
              {pill.icon}
              <span>{pill.label}</span>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="srh-vsep" aria-hidden="true" />

        {/* Right cluster: study toggles */}
        <div className="srh-study-toggles" role="group" aria-label={lbl(lang, "Options d'étude", "Study options", "خيارات الدراسة")}>
          {studyToggles.map((tog) =>
            tog.hidden ? null : (
              <button
                key={tog.key}
                type="button"
                className={cn("srh-toggle", tog.active && "srh-toggle--active")}
                onClick={tog.onClick}
                aria-pressed={tog.active}
                title={tog.label}
              >
                {tog.icon}
                <span className="srh-toggle__label">{tog.label}</span>
              </button>
            ),
          )}
        </div>
      </div>

      {/* ══ DIVIDER ═══════════════════════════════════════════ */}
      <div className="srh-divider" aria-hidden="true" />

      {/* ══ ROW 3 — Navigation & font ═══════════════════════════ */}
      <div className="srh-footer">
        {/* Font controls */}
        <ArabicFontControls lang={lang} compact />

        {/* Spacer */}
        <div className="srh-footer__spacer" />

        {/* Hizb / Sajdah navigator */}
        <HizbRukuNavigator
          currentSurah={surahNum}
          currentAyah={currentAyah}
          currentPage={currentPage}
          onNavigate={onNavigateToAyah}
          className="srh-hizb-nav"
        />
      </div>
    </div>
  );
}
