/**
 * SurahReaderHeader — single unified block replacing SurahHeader + ReadingToolbar.
 * Quran.com–inspired, no redundancy, fully responsive.
 */
import React, { useCallback, useRef, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Info,
  Languages,
  List,
  Loader2,
  Maximize2,
  Palette,
  Pause,
  Play,
  Type,
} from "lucide-react";
import { getSurah } from "../../data/surahs";
import { getSurahVerseCountByRiwaya } from "../../constants/warshSource";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";
import { useApp } from "../../context/AppContext";
import audioService from "../../services/audioService";
import ArabicFontControls from "../ArabicFontControls";
import { Modal } from "../ui/modal";
import SurahInfoPanel from "../QuranDisplay/SurahInfoPanel";

const READER_TOOLS_SESSION_KEY = "mushafplus-reader-tools-open";

function readReaderToolsState() {
  if (typeof window === "undefined") return false;
  try {
    return window.sessionStorage.getItem(READER_TOOLS_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}

export default function SurahReaderHeader({
  surahNum,
  onPlaySurah,
  preparingSurah,
  onToggleMushaf,
  onOpenFullscreen,
}) {
  const { state, set } = useApp();
  const {
    lang,
    mushafLayout,
    showTajwid,
    showTranslation,
    isPlaying,
  } = state;

  const [showInfo, setShowInfo] = useState(false);
  const [readerToolsOpen, setReaderToolsOpen] = useState(readReaderToolsState);
  const toggleReaderTools = useCallback(() => {
    setReaderToolsOpen((open) => {
      const next = !open;
      try {
        window.sessionStorage.setItem(READER_TOOLS_SESSION_KEY, String(next));
      } catch {
        // The control still works when session storage is unavailable.
      }
      return next;
    });
  }, []);
  const infoTriggerRef = useRef(null);
  const openInfo = useCallback((event) => {
    infoTriggerRef.current = event.currentTarget;
    setShowInfo(true);
  }, []);
  const closeInfo = useCallback(() => {
    setShowInfo(false);
    window.requestAnimationFrame(() => {
      infoTriggerRef.current?.focus({ preventScroll: true });
    });
  }, []);
  const [typographyOpen, setTypographyOpen] = useState(false);
  const toggleTypography = useCallback(() => setTypographyOpen((v) => !v), []);
  const handleTypographyPointerUp = useCallback(
    (event) => {
      if (event.button === 0) toggleTypography();
    },
    [toggleTypography],
  );
  const handleTypographyClick = useCallback(
    (event) => {
      // Pointer activation is handled on pointerup so quick taps are not lost
      // while the reader finishes settling. Keyboard/screen-reader clicks have detail 0.
      if (event.detail === 0) toggleTypography();
    },
    [toggleTypography],
  );

  const s = getSurah(surahNum);
  if (!s) return null;

  const verseCount = getSurahVerseCountByRiwaya(surahNum, state.riwaya) || s.ayahs;

  const surahLigature = String(surahNum).padStart(3, "0");

  const isMeccan = s.type === "Meccan";
  const translatedName =
    lang === "ar" ? s.ar : lang === "fr" ? s.fr || s.en : s.en;
  const revelationLabel = isMeccan
    ? t("quran.meccan", lang)
    : t("quran.medinan", lang);

  const isPreparing = Boolean(preparingSurah && preparingSurah === surahNum);
  const mushafIsOn = mushafLayout === "mushaf";

  /* ── Toggle helpers ── */
  const setMushafLayout = () => {
    if (mushafIsOn) return;
    if (onToggleMushaf) { onToggleMushaf(); return; }
    set({ mushafLayout: "mushaf" });
  };
  const setListLayout = () => {
    if (!mushafIsOn) return;
    if (onToggleMushaf) { onToggleMushaf(); return; }
    set({ mushafLayout: "list" });
  };
  const toggleTranslation = () => set({ showTranslation: !showTranslation });
  const toggleTajweed = () => set({ showTajwid: !showTajwid });

  const handlePlay = () => {
    if (isPlaying) { audioService.pause(); return; }
    onPlaySurah?.();
  };

  /* ── View-mode pill ── */
  const viewPills = [
    {
      key: "mushaf",
      icon: <BookOpen size={13} />,
      label: t("reader.mushaf", lang),
      active: mushafIsOn,
      onClick: setMushafLayout,
    },
    {
      key: "list",
      icon: <List size={13} />,
      label: t("reader.list", lang),
      active: !mushafIsOn,
      onClick: setListLayout,
    },
  ];

  /* ── Study toggles ── */
  const studyToggles = [
    {
      key: "translation",
      icon: <Languages size={13} />,
      label: t("reader.translationToggle", lang),
      active: showTranslation,
      onClick: toggleTranslation,
      // A printed mushaf page carries no translation, so the control has no
      // state to show there: a disabled button only teaches the reader to
      // ignore the row.
      hidden: mushafIsOn,
    },
    {
      key: "tajweed",
      icon: <Palette size={13} />,
      label: t("reader.tajweedToggle", lang),
      active: showTajwid,
      onClick: toggleTajweed,
      hidden: false,
    },
  ];
  const visibleToggles = studyToggles.filter((toggle) => !toggle.hidden);

  return (
    <div className="reader-command-bar srh-root" aria-label={t("reader.headerAria", lang)}>
      {/* ══ ROW 1 — Identity ════════════════════════════════════ */}
      <div className="srh-identity">
        <div
          role="button"
          tabIndex={0}
          className="srh-identity__disclosure"
          onClick={toggleReaderTools}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggleReaderTools();
            }
          }}
          aria-expanded={readerToolsOpen}
          aria-controls="srh-reader-tools"
          aria-label={t(
            readerToolsOpen ? "reader.hideControls" : "reader.showControls",
            lang,
          )}
        >
        {/* Arabic name */}
        <div className="srh-arabic" dir="rtl" lang="ar" aria-label={s.ar} role="img">
          <span className="font-surah-names" dir="ltr" lang="en" aria-hidden="true">
            {surahLigature}
          </span>
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
                {verseCount} {t("reader.verses", lang)}
              </span>
            </div>
          </div>
          <p className="srh-sub">{s.en}</p>
          <p className="srh-desc">
            {t("reader.description", lang).replace("{name}", translatedName)}
          </p>
        </div>
          <ChevronDown className="srh-identity__chevron" size={15} aria-hidden="true" />
        </div>

        {/* Action buttons */}
        <div className="srh-actions">
          {mushafIsOn && onOpenFullscreen ? (
            <button
              type="button"
              className="srh-info-btn srh-fullscreen-btn"
              onClick={onOpenFullscreen}
              aria-label={t("reader.immersive", lang)}
              title={t("reader.immersive", lang)}
            >
              <Maximize2 size={15} aria-hidden="true" />
              <span className="srh-info-btn__label">{t("reader.fullscreen", lang)}</span>
            </button>
          ) : null}
          <button
            type="button"
            className={cn("srh-play-btn", isPlaying && "srh-play-btn--playing")}
            onClick={handlePlay}
            disabled={isPreparing}
            aria-label={isPlaying ? t("audio.pause", lang) : t("actions.listen", lang)}
            data-testid="surah-play"
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
                ? t("reader.loading", lang)
                : isPlaying
                ? t("audio.pause", lang)
                : t("actions.listen", lang)}
            </span>
          </button>

          <button
            type="button"
            className={cn("srh-info-btn", showInfo && "srh-info-btn--active")}
            onClick={openInfo}
            aria-expanded={showInfo}
            aria-haspopup="dialog"
            aria-label={t("reader.infoAria", lang)}
          >
            <Info size={15} />
            <span className="srh-info-btn__label">{t("reader.infoShort", lang)}</span>
          </button>
        </div>
      </div>

      {/* Mobile-only compact action row (identity hidden on ≤640px) */}
      <div className="srh-mobile-bar">
        <button
          type="button"
          className="srh-mobile-bar__disclosure"
          onClick={toggleReaderTools}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleReaderTools();
            }
          }}
          aria-expanded={readerToolsOpen}
          aria-controls="srh-reader-tools"
          aria-label={t(
            readerToolsOpen ? "reader.hideControls" : "reader.showControls",
            lang,
          )}
        >
          <span className="srh-mobile-bar__name" dir="rtl" lang="ar" aria-label={s.ar} role="img">
            <span className="font-surah-names" dir="ltr" lang="en" aria-hidden="true">
              {surahLigature}
            </span>
          </span>
          <span className="srh-mobile-bar__title">
            <strong>{translatedName}</strong>
            <small>{surahNum} · {verseCount} {t("reader.verses", lang)}</small>
          </span>
          <ChevronDown className="srh-mobile-bar__chevron" size={13} aria-hidden="true" />
        </button>
        <div className="srh-mobile-bar__actions">
          {mushafIsOn && onOpenFullscreen ? (
            <button
              type="button"
              className="srh-info-btn srh-fullscreen-btn"
              onClick={onOpenFullscreen}
              aria-label={t("reader.immersive", lang)}
            >
              <Maximize2 size={15} aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            className={cn("srh-play-btn", isPlaying && "srh-play-btn--playing")}
            onClick={handlePlay}
            disabled={isPreparing}
            aria-label={isPlaying ? t("audio.pause", lang) : t("actions.listen", lang)}
            data-testid="surah-play"
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
            onClick={openInfo}
            aria-expanded={showInfo}
            aria-haspopup="dialog"
            aria-label={t("reader.infoAria", lang)}
          >
            <Info size={15} />
          </button>
        </div>
      </div>

      <Modal
        open={showInfo}
        onClose={closeInfo}
        title={t("reader.infoTitle", lang)}
        size="lg"
        portal
        className="surah-info-modal"
        overlayClassName="surah-info-modal__overlay"
      >
        <SurahInfoPanel surahNum={surahNum} lang={lang} />
      </Modal>

      {/* ══ DIVIDER ═══════════════════════════════════════════ */}
      <div
        id="srh-reader-tools"
        className={cn("srh-reader-tools", readerToolsOpen && "srh-reader-tools--open")}
        aria-hidden={!readerToolsOpen ? "true" : undefined}
        inert={!readerToolsOpen ? "" : undefined}
      >
        <div className="srh-reader-tools__inner">
      <div className="srh-divider" aria-hidden="true" />

      {/* ══ ROW 2 — View controls ═══════════════════════════════ */}
      <div className="srh-controls">
        {/* Left cluster: view mode (Mushaf / Liste) */}
        <div className="srh-view-pills" role="radiogroup" aria-label={t("reader.displayModeAria", lang)}>
          {viewPills.map((pill) => (
            <button
              key={pill.key}
              type="button"
              role="radio"
              className={cn("srh-pill", pill.active && "srh-pill--active")}
              onClick={pill.onClick}
              aria-checked={pill.active}
              aria-label={pill.label}
            >
              {pill.icon}
              <span>{pill.label}</span>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="srh-vsep" aria-hidden="true" />

        {/* Right cluster: study toggles */}
        <div className="srh-study-toggles" role="group" aria-label={t("reader.studyOptions", lang)}>
          {visibleToggles.map((toggle) => (
            <button
              key={toggle.key}
              type="button"
              className={cn("srh-toggle", toggle.active && "srh-toggle--active")}
              onClick={toggle.onClick}
              disabled={toggle.disabled}
              aria-pressed={toggle.active}
              aria-label={toggle.label}
              title={toggle.disabled ? toggle.disabledHint : toggle.label}
            >
              {toggle.icon}
              <span className="srh-toggle__label">{toggle.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ══ DIVIDER ═══════════════════════════════════════════ */}
      <div className="srh-divider" aria-hidden="true" />

      {/* ══ ROW 3 — Navigation & font ═══════════════════════════ */}
      <div className="srh-footer">
        <div className={cn("srh-typography-disclosure", typographyOpen && "open")}>
          <button
            type="button"
            className="srh-typography-trigger"
            onPointerUp={handleTypographyPointerUp}
            onClick={handleTypographyClick}
            aria-expanded={typographyOpen}
            aria-controls="srh-typography-panel"
          >
            <Type size={14} aria-hidden="true" />
            <span>{t("reader.textSize", lang)}</span>
          </button>
          <div id="srh-typography-panel" className="srh-typography-panel">
            <ArabicFontControls lang={lang} compact />
          </div>
        </div>

        <div className="srh-footer__spacer" />
      </div>
        </div>
      </div>
    </div>
  );
}
