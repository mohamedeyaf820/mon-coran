import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Brain,
  Columns2,
  Eye,
  Languages,
  List,
  Loader2,
  Minus,
  Palette,
  Play,
  Plus,
  Type,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../lib/utils";

function labelFor(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

function ToolbarButton({
  active = false,
  primary = false,
  className,
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={cn(
        "reader-toolbar-btn inline-flex h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] border px-3",
        "font-ui text-[0.78rem] font-semibold transition duration-150",
        primary
          ? "reader-toolbar-btn--primary border-[var(--primary)] bg-[var(--primary)] text-white shadow-none disabled:opacity-60"
          : active
            ? "active border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.12)] text-[var(--primary)]"
            : "border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[rgba(var(--primary-rgb),0.34)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export default function ReadingToolbar({
  contextLabel,
  onPlay,
  onPlaySurah,
  playLabel,
  preparingSurah,
  surahNum,
}) {
  const { state, set } = useApp();
  const {
    focusReading,
    lang,
    memMode,
    mushafLayout,
    quranFontSize,
    riwaya,
    showTajwid,
    showTranslation,
    showWordByWord,
    translationReadingMode,
  } = state;
  const [splitView, setSplitView] = useState(
    () =>
      typeof document !== "undefined" &&
      document.documentElement.dataset.splitView === "on",
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.splitView = splitView ? "on" : "off";
  }, [splitView]);

  const playHandler = onPlay || onPlaySurah;
  const isPreparing = Boolean(preparingSurah && preparingSurah === surahNum);
  const mushafIsOn = mushafLayout === "mushaf";

  const toggleMushaf = () =>
    set({
      mushafLayout: mushafIsOn ? "list" : "mushaf",
      memMode: false,
      showWordByWord: false,
      showTajwid: true,
      fontFamily: riwaya === "warsh" ? "mushaf-warsh" : "mushaf-kfgqpc",
    });

  const toggleStudyMode = () =>
    set({
      focusReading: true,
      memMode: false,
      showTranslation: true,
      showTransliteration: false,
      showWordByWord: true,
      showWordTranslation: true,
      translationReadingMode: false,
    });

  const toggleTranslationReading = () =>
    set({
      showTranslation: true,
      translationReadingMode: !translationReadingMode,
      showWordByWord: false,
      memMode: false,
    });

  const decreaseFontSize = () =>
    set({ quranFontSize: Math.max(28, quranFontSize - 4) });
  const increaseFontSize = () =>
    set({ quranFontSize: Math.min(64, quranFontSize + 4) });

  return (
    <div
      className="reader-toolbar sticky top-[var(--header-h,68px)] z-50 flex items-center gap-2 border-b border-[var(--border)] bg-[var(--bg-primary)] px-3 py-2 max-md:px-2"
      role="toolbar"
      aria-label={labelFor(lang, "Outils de lecture", "Reading tools", "Reading tools")}
    >
      <div className="reader-toolbar__left flex min-w-0 items-center gap-2">
        {playHandler ? (
          <ToolbarButton
            primary
            onClick={playHandler}
            disabled={isPreparing}
            aria-label={playLabel || labelFor(lang, "Ecouter", "Listen")}
            title={playLabel || labelFor(lang, "Ecouter", "Listen")}
          >
            {isPreparing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Play size={16} fill="currentColor" />
            )}
            <span className="hidden sm:inline">
              {isPreparing
                ? labelFor(lang, "Chargement", "Loading")
                : playLabel || labelFor(lang, "Ecouter", "Listen")}
            </span>
          </ToolbarButton>
        ) : null}

        {contextLabel ? (
          <span className="reader-toolbar__context hidden min-w-0 truncate rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 font-ui text-[0.76rem] font-bold text-[var(--text-secondary)] lg:inline-flex">
            {contextLabel}
          </span>
        ) : null}
      </div>

      <div className="reader-toolbar__center flex flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ToolbarButton
          active={mushafIsOn}
          onClick={toggleMushaf}
          aria-pressed={mushafIsOn}
          title={mushafIsOn ? labelFor(lang, "Vue liste", "List view") : "Mushaf"}
        >
          {mushafIsOn ? <List size={16} /> : <BookOpen size={16} />}
          <span className="hidden md:inline">
            {mushafIsOn ? labelFor(lang, "Liste", "List") : "Mushaf"}
          </span>
        </ToolbarButton>

        <ToolbarButton
          active={showTranslation}
          onClick={() => set({ showTranslation: !showTranslation })}
          aria-pressed={showTranslation}
          title={labelFor(lang, "Traduction", "Translation")}
        >
          <Languages size={16} />
          <span className="hidden md:inline">
            {labelFor(lang, "Traduction", "Translation")}
          </span>
        </ToolbarButton>

        <ToolbarButton
          active={translationReadingMode}
          onClick={toggleTranslationReading}
          aria-pressed={translationReadingMode}
          title={labelFor(lang, "Mode livre", "Book mode")}
        >
          <Eye size={16} />
          <span className="hidden md:inline">
            {labelFor(lang, "Livre", "Book")}
          </span>
        </ToolbarButton>

        <ToolbarButton
          active={showWordByWord}
          onClick={() => set({ showWordByWord: !showWordByWord, memMode: false })}
          aria-pressed={showWordByWord}
          title={labelFor(lang, "Mot a mot", "Word by word")}
        >
          <Type size={16} />
          <span className="hidden md:inline">
            {labelFor(lang, "Mot a mot", "WbW")}
          </span>
        </ToolbarButton>

        <ToolbarButton
          active={showTajwid}
          onClick={() => set({ showTajwid: !showTajwid })}
          aria-pressed={showTajwid}
          title="Tajweed"
        >
          <Palette size={16} />
          <span className="hidden md:inline">Tajweed</span>
        </ToolbarButton>

        <ToolbarButton
          active={splitView}
          onClick={() => setSplitView((value) => !value)}
          aria-pressed={splitView}
          title={labelFor(lang, "Cote a cote", "Side by side")}
        >
          <Columns2 size={16} />
          <span className="hidden md:inline">
            {labelFor(lang, "Cote a cote", "Split")}
          </span>
        </ToolbarButton>

        <ToolbarButton
          active={focusReading}
          onClick={() => set({ focusReading: !focusReading })}
          aria-pressed={focusReading}
          title={labelFor(lang, "Lecture immersive", "Immersive reading")}
        >
          <Eye size={16} />
          <span className="hidden lg:inline">
            {labelFor(lang, "Focus", "Focus")}
          </span>
        </ToolbarButton>

        <ToolbarButton
          active={memMode}
          onClick={() =>
            set({ memMode: !memMode, mushafLayout: "list", showWordByWord: false })
          }
          aria-pressed={memMode}
          title={labelFor(lang, "Memorisation", "Memorization")}
        >
          <Brain size={16} />
          <span className="hidden lg:inline">
            {labelFor(lang, "Memo", "Memo")}
          </span>
        </ToolbarButton>

        <ToolbarButton onClick={toggleStudyMode} title={labelFor(lang, "Mode etude", "Study mode")}>
          <BookOpen size={16} />
          <span className="hidden lg:inline">
            {labelFor(lang, "Etude", "Study")}
          </span>
        </ToolbarButton>
      </div>

      <div className="reader-toolbar__right flex items-center gap-1">
        <div className="flex items-center rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] p-1">
          <button
            type="button"
            onClick={decreaseFontSize}
            className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--primary)]"
            aria-label={labelFor(lang, "Reduire la taille", "Decrease font size")}
            title="A-"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            onClick={increaseFontSize}
            className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--primary)]"
            aria-label={labelFor(lang, "Augmenter la taille", "Increase font size")}
            title="A+"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
