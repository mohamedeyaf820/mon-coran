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
  Palette,
  Pause,
  Play,
  SlidersHorizontal,
  Type,
} from "lucide-react";
import { getSurah } from "../../data/surahs";
import { cn } from "../../lib/utils";
import { useApp } from "../../context/AppContext";
import audioService from "../../services/audioService";
import ArabicFontControls from "../ArabicFontControls";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
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

function lbl(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

export default function SurahReaderHeader({
  surahNum,
  onPlaySurah,
  preparingSurah,
  onToggleMushaf,
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

  const surahLigature = String(surahNum).padStart(3, "0");

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
    set({ mushafLayout: "mushaf", showTajwid: true });
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
      key: "tajweed",
      icon: <Palette size={13} />,
      label: lbl(lang, "Tajweed", "Tajweed", "تجويد"),
      active: showTajwid,
      onClick: toggleTajweed,
      hidden: false,
    },
  ];
  const [translationToggle, ...secondaryStudyToggles] = studyToggles.filter(
    (toggle) => !toggle.hidden,
  );
  const secondaryStudyIsActive = secondaryStudyToggles.some(
    (toggle) => toggle.active,
  );

  return (
    <div className="reader-command-bar srh-root" aria-label={lbl(lang, "En-tête de lecture", "Reading header", "رأس القراءة")}>
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
          aria-label={lbl(
            lang,
            readerToolsOpen ? "Masquer les réglages de lecture" : "Afficher les réglages de lecture",
            readerToolsOpen ? "Hide reading controls" : "Show reading controls",
            readerToolsOpen ? "إخفاء إعدادات القراءة" : "إظهار إعدادات القراءة",
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
          <ChevronDown className="srh-identity__chevron" size={15} aria-hidden="true" />
        </div>

        {/* Action buttons */}
        <div className="srh-actions">
          <button
            type="button"
            className={cn("srh-play-btn", isPlaying && "srh-play-btn--playing")}
            onClick={handlePlay}
            disabled={isPreparing}
            aria-label={isPlaying ? lbl(lang, "Pause", "Pause", "إيقاف") : lbl(lang, "Écouter", "Listen", "استمع")}
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
                ? lbl(lang, "Chargement...", "Loading...", "جارٍ...")
                : isPlaying
                ? lbl(lang, "Pause", "Pause", "إيقاف")
                : lbl(lang, "Écouter", "Listen", "استمع")}
            </span>
          </button>

          <button
            type="button"
            className={cn("srh-info-btn", showInfo && "srh-info-btn--active")}
            onClick={openInfo}
            aria-expanded={showInfo}
            aria-haspopup="dialog"
            aria-label={lbl(lang, "Informations sur la sourate", "Surah info", "معلومات السورة")}
          >
            <Info size={15} />
            <span className="srh-info-btn__label">Info</span>
          </button>
        </div>
      </div>

      {/* Mobile-only compact action row (identity hidden on ≤640px) */}
      <div className="srh-mobile-bar">
        <button
          type="button"
          className="srh-mobile-bar__disclosure"
          onClick={toggleReaderTools}
          aria-expanded={readerToolsOpen}
          aria-controls="srh-reader-tools"
          aria-label={lbl(
            lang,
            readerToolsOpen ? "Masquer les réglages de lecture" : "Afficher les réglages de lecture",
            readerToolsOpen ? "Hide reading controls" : "Show reading controls",
            readerToolsOpen ? "إخفاء إعدادات القراءة" : "إظهار إعدادات القراءة",
          )}
        >
          <span className="srh-mobile-bar__name" dir="rtl" lang="ar" aria-label={s.ar} role="img">
            <span className="font-surah-names" dir="ltr" lang="en" aria-hidden="true">
              {surahLigature}
            </span>
          </span>
          <span className="srh-mobile-bar__title">
            <strong>{translatedName}</strong>
            <small>{surahNum} · {s.ayahs} {lbl(lang, "versets", "verses", "آيات")}</small>
          </span>
          <ChevronDown className="srh-mobile-bar__chevron" size={13} aria-hidden="true" />
        </button>
        <div className="srh-mobile-bar__actions">
          <button
            type="button"
            className={cn("srh-play-btn", isPlaying && "srh-play-btn--playing")}
            onClick={handlePlay}
            disabled={isPreparing}
            aria-label={isPlaying ? lbl(lang, "Pause", "Pause", "إيقاف") : lbl(lang, "Écouter", "Listen", "استمع")}
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
            aria-label={lbl(lang, "Informations sur la sourate", "Surah info", "معلومات السورة")}
          >
            <Info size={15} />
          </button>
        </div>
      </div>

      <Modal
        open={showInfo}
        onClose={closeInfo}
        title={lbl(lang, "Informations sur la sourate", "Surah information", "معلومات السورة")}
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
        <div className="srh-view-pills" role="radiogroup" aria-label={lbl(lang, "Mode d'affichage", "Display mode", "وضع العرض")}>
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
        <div className="srh-study-toggles" role="group" aria-label={lbl(lang, "Options d'étude", "Study options", "خيارات الدراسة")}>
          <button
            type="button"
            className={cn(
              "srh-toggle",
              translationToggle.active && "srh-toggle--active",
            )}
            onClick={translationToggle.onClick}
            aria-pressed={translationToggle.active}
            aria-label={translationToggle.label}
            title={translationToggle.label}
          >
            {translationToggle.icon}
            <span className="srh-toggle__label">{translationToggle.label}</span>
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "srh-toggle srh-study-more",
                  secondaryStudyIsActive && "srh-toggle--active",
                )}
                aria-label={lbl(lang, "Plus d'options d'étude", "More study options", "المزيد من خيارات الدراسة")}
                title={lbl(lang, "Options d'étude", "Study options", "خيارات الدراسة")}
              >
                <SlidersHorizontal size={13} />
                <span className="srh-toggle__label">
                  {lbl(lang, "Options", "Options", "خيارات")}
                </span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align={lang === "ar" ? "start" : "end"}
              className="min-w-[12rem]"
            >
              <DropdownMenuLabel>
                {lbl(lang, "Options d'étude", "Study options", "خيارات الدراسة")}
              </DropdownMenuLabel>
              {secondaryStudyToggles.map((toggle) => (
                <DropdownMenuCheckboxItem
                  key={toggle.key}
                  checked={toggle.active}
                  onCheckedChange={toggle.onClick}
                >
                  {toggle.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
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
            <span>{lbl(lang, "Texte et taille", "Text size", "حجم الخط")}</span>
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
