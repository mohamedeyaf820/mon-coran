import React from "react";
import {
  BookOpen,
  Languages,
  List,
  Loader2,
  Palette,
  Play,
  Type,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { cn } from "../../lib/utils";
import ArabicFontControls from "../ArabicFontControls";

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
        "inline-flex h-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4",
        "font-[var(--font-ui)] text-[0.82rem] font-semibold tracking-wide transition-all duration-300",
        primary
          ? "bg-[var(--primary)] text-white shadow-[0_4px_14px_rgba(var(--primary-rgb),0.35)] hover:shadow-[0_6px_20px_rgba(var(--primary-rgb),0.45)] hover:-translate-y-0.5 active:scale-[0.96] disabled:opacity-50 disabled:hover:translate-y-0"
          : active
            ? "bg-[rgba(var(--primary-rgb),0.12)] text-[var(--primary)] ring-1 ring-[color-mix(in_srgb,var(--primary)_40%,transparent_60%)] shadow-sm"
            : "text-[var(--text-secondary)] hover:bg-[color-mix(in_srgb,var(--text-primary)_6%,transparent_94%)] hover:text-[var(--text-primary)] active:scale-[0.96]",
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
  const { state, set } = useApp();
  const {
    lang,
    mushafLayout,
    riwaya,
    showTajwid,
    showTranslation,
    showWordByWord,
  } = state;

  const playHandler = onPlay || onPlaySurah;
  const isPreparing = Boolean(preparingSurah && preparingSurah === surahNum);
  const mushafIsOn = mushafLayout === "mushaf";

  const toggleMushaf = () =>
    set({
      mushafLayout: mushafIsOn ? "list" : "mushaf",
      memMode: false,
      showWordByWord: false,
      showTajwid: true,
      fontFamily: riwaya === "warsh" ? "qpc-warsh" : "qpc-hafs",
    });

  return (
    <div
      className="sticky top-[var(--header-h,68px)] z-50 mx-auto mb-7 flex w-full max-w-[920px] items-center gap-1.5 rounded-2xl border border-[color-mix(in_srgb,var(--border)_50%,transparent_50%)] bg-[color-mix(in_srgb,var(--bg-card)_70%,transparent_30%)] px-3 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-300 hover:bg-[color-mix(in_srgb,var(--bg-card)_85%,transparent_15%)] max-md:overflow-x-auto max-md:[scrollbar-width:none] max-md:[&::-webkit-scrollbar]:hidden"
      role="toolbar"
      aria-label={labelFor(lang, "Outils de lecture", "Reading tools")}
    >
      {playHandler ? (
        <ToolbarButton
          primary
          onClick={playHandler}
          disabled={isPreparing}
          aria-label={playLabel || labelFor(lang, "Ecouter", "Listen")}
          title={playLabel || labelFor(lang, "Ecouter", "Listen")}
        >
          {isPreparing ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Play size={15} fill="currentColor" />
          )}
          <span className="max-sm:hidden">
            {isPreparing
              ? labelFor(lang, "Chargement...", "Loading...")
              : labelFor(lang, "Ecouter", "Listen")}
          </span>
        </ToolbarButton>
      ) : null}

      <div className="h-5 w-px shrink-0 bg-[var(--border)] opacity-60" />

      <ToolbarButton
        active={mushafIsOn}
        onClick={toggleMushaf}
        aria-pressed={mushafIsOn}
        title={mushafIsOn ? labelFor(lang, "Vue liste", "List view") : "Mushaf"}
      >
        {mushafIsOn ? <List size={15} /> : <BookOpen size={15} />}
        <span className="max-sm:hidden">
          {mushafIsOn ? labelFor(lang, "Liste", "List") : "Mushaf"}
        </span>
      </ToolbarButton>

      <ToolbarButton
        active={showTranslation}
        onClick={() => set({ showTranslation: !showTranslation })}
        aria-pressed={showTranslation}
        title={labelFor(lang, "Traduction", "Translation")}
      >
        <Languages size={15} />
        <span className="max-sm:hidden">
          {labelFor(lang, "Trad.", "Trans.")}
        </span>
      </ToolbarButton>

      <ToolbarButton
        active={showWordByWord}
        onClick={() => set({ showWordByWord: !showWordByWord, memMode: false })}
        aria-pressed={showWordByWord}
        title={labelFor(lang, "Mot a mot", "Word by word")}
      >
        <Type size={15} />
        <span className="max-sm:hidden">
          {labelFor(lang, "Mot/mot", "WbW")}
        </span>
      </ToolbarButton>

      <ToolbarButton
        active={showTajwid}
        onClick={() => set({ showTajwid: !showTajwid })}
        aria-pressed={showTajwid}
        title="Tajweed"
      >
        <Palette size={15} />
        <span className="max-sm:hidden">Tajweed</span>
      </ToolbarButton>

      <div className="flex-1" />
      <ArabicFontControls lang={lang} compact />
    </div>
  );
}
