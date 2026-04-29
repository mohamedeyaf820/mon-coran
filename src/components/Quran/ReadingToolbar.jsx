import React from "react";
import {
  BookOpen,
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

const FONT_SIZE_MIN = 32;
const FONT_SIZE_MAX = 64;
const FONT_SIZE_STEP = 4;

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
  onPlay,
  onPlaySurah,
  playLabel,
  preparingSurah,
  surahNum,
}) {
  const { state, dispatch, set } = useApp();
  const {
    lang,
    mushafLayout,
    quranFontSize,
    riwaya,
    showTajwid,
    showTranslation,
    showWordByWord,
  } = state;

  const playHandler = onPlay || onPlaySurah;
  const isPreparing = Boolean(preparingSurah && preparingSurah === surahNum);
  const mushafIsOn = mushafLayout === "mushaf";
  const currentFontSize = Math.max(
    FONT_SIZE_MIN,
    Math.min(FONT_SIZE_MAX, Number(quranFontSize) || 42),
  );

  const toggleMushaf = () =>
    set({
      mushafLayout: mushafIsOn ? "list" : "mushaf",
      memMode: false,
      showWordByWord: false,
      showTajwid: true,
      fontFamily: riwaya === "warsh" ? "mushaf-warsh" : "mushaf-kfgqpc",
    });

  const setFontSize = (nextSize) =>
    dispatch({
      type: "SET_QURAN_FONT_SIZE",
      payload: Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, nextSize)),
    });

  const decreaseFontSize = () =>
    setFontSize(currentFontSize - FONT_SIZE_STEP);
  const increaseFontSize = () =>
    setFontSize(currentFontSize + FONT_SIZE_STEP);

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

      </div>

      <div className="reader-toolbar__center flex flex-1 items-center justify-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ToolbarButton
          active={mushafIsOn}
          onClick={toggleMushaf}
          aria-pressed={mushafIsOn}
          title={mushafIsOn ? labelFor(lang, "Vue liste", "List view") : "Mushaf"}
        >
          {mushafIsOn ? <List size={16} /> : <BookOpen size={16} />}
          <span className="hidden lg:inline">
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
          <span className="hidden lg:inline">
            {labelFor(lang, "Traduction", "Translation")}
          </span>
        </ToolbarButton>

        <ToolbarButton
          active={showWordByWord}
          onClick={() => set({ showWordByWord: !showWordByWord, memMode: false })}
          aria-pressed={showWordByWord}
          title={labelFor(lang, "Mot a mot", "Word by word")}
        >
          <Type size={16} />
          <span className="hidden lg:inline">
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
          <span className="hidden lg:inline">Tajweed</span>
        </ToolbarButton>
      </div>

      <div className="reader-toolbar__right flex items-center gap-1">
        <div className="reader-toolbar__font-stepper flex items-center rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] p-1">
          <button
            type="button"
            onClick={decreaseFontSize}
            disabled={currentFontSize <= FONT_SIZE_MIN}
            className="flex h-7 w-7 items-center justify-center rounded-[8px] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--primary)]"
            aria-label={labelFor(lang, "Reduire la taille", "Decrease font size")}
            title="A-"
          >
            <Minus size={14} />
          </button>
          <span className="reader-toolbar__font-value min-w-7 text-center font-[var(--font-ui)] text-[0.68rem] font-extrabold text-[var(--text-tertiary)]">
            {currentFontSize}
          </span>
          <button
            type="button"
            onClick={increaseFontSize}
            disabled={currentFontSize >= FONT_SIZE_MAX}
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
