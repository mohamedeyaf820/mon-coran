import React, { useState } from "react";
import { X, BookOpen, Languages, Type, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { useApp } from "../../context/AppContext";
import { TRANSLATION_LANGUAGE_META } from "./displayHelpers";
import { QURAN_COM_FONT_IDS, DEFAULT_FONT_ID, DEFAULT_WARSH_FONT_ID } from "../../data/fonts";

const FONT_LABELS = {
  "qpc-hafs": { label: "QPC Hafs (Uthmanic)", sample: "بِسْمِ ٱللَّهِ" },
  "qpc-indopak": { label: "IndoPak", sample: "بِسْمِ اللَّهِ" },
  "qpc-nastaleeq": { label: "Nastaleeq", sample: "بِسْمِ اللَّهِ" },
  "qcf-v2": { label: "QCF V2 (Mushaf)", sample: null },
  "qcf-v4-tajweed": { label: "QCF V4 Tajweed", sample: null },
  "qpc-warsh": { label: "QPC Warsh", sample: "بِسْمِ اللَّهِ" },
};

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
const FONT_SIZES = [36, 40, 44, 48, 52, 56, 60, 64, 68, 72];

function Tab({ id, label, icon: Icon, active, onClick }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onClick(id)}
      className={cn(
        "flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.68rem] font-semibold transition-all duration-200",
        "border-b-2",
        active
          ? "border-[var(--primary)] text-[var(--primary)]"
          : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]",
      )}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[0.66rem] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">
      {children}
    </p>
  );
}

function ToggleSwitch({ checked, onChange, label }) {
  return (
    <label className="flex items-center justify-between cursor-pointer py-2">
      <span className="text-[0.82rem] text-[var(--text-primary)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative w-10 h-5.5 h-[22px] rounded-full transition-colors duration-200",
          checked ? "bg-[var(--primary)]" : "bg-[var(--border)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-transform duration-200",
            checked && "translate-x-[18px]",
          )}
        />
      </button>
    </label>
  );
}

export default function QCDisplaySettingsDrawer({ open, onClose, lang, reciters = [], riwaya }) {
  const { state, set, dispatch } = useApp();
  const [tab, setTab] = useState("display");

  const fontList = QURAN_COM_FONT_IDS
    .filter((id) => riwaya === "warsh" ? true : id !== "qpc-warsh")
    .map((id) => ({ id, ...(FONT_LABELS[id] || { label: id, sample: null }) }));

  const translationLangs = Object.entries(TRANSLATION_LANGUAGE_META);

  const handleFontSizeChange = (size) => {
    dispatch({ type: "SET_QURAN_FONT_SIZE", payload: size });
  };

  const handleTranslationLangToggle = (code) => {
    dispatch({ type: "TOGGLE_TRANSLATION", payload: code });
  };

  const handleReciterChange = (id) => {
    dispatch({ type: "SET_RECITER", payload: id });
  };

  const handleSpeedChange = (speed) => {
    set({ audioSpeed: speed });
    import("../../services/audioService").then((m) => m.default.setSpeed(speed)).catch(() => {});
  };

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-[450] bg-black/40 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer panel */}
      <aside
        className={cn(
          "fixed top-0 right-0 z-[460] h-full w-full max-w-[360px]",
          "bg-[var(--bg-card)] border-l border-[var(--border)]",
          "flex flex-col shadow-2xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
        role="dialog"
        aria-modal="true"
        aria-label={lang === "fr" ? "Paramètres d'affichage" : "Display settings"}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            {lang === "fr" ? "Paramètres" : lang === "ar" ? "الإعدادات" : "Settings"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text-primary)] transition-all"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex border-b border-[var(--border)] px-2"
          role="tablist"
        >
          <Tab id="display" label={lang === "fr" ? "Affichage" : "Display"} icon={BookOpen} active={tab === "display"} onClick={setTab} />
          <Tab id="translation" label={lang === "fr" ? "Traduction" : "Translation"} icon={Languages} active={tab === "translation"} onClick={setTab} />
          <Tab id="audio" label="Audio" icon={Type} active={tab === "audio"} onClick={setTab} />
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

          {/* ── Display Tab ── */}
          {tab === "display" && (
            <>
              {/* Font size */}
              <div>
                <SectionLabel>{lang === "fr" ? "Taille du texte arabe" : "Arabic font size"}</SectionLabel>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleFontSizeChange(Math.max(36, state.quranFontSize - 4))}
                    disabled={state.quranFontSize <= 36}
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 transition-all"
                  >
                    <span className="text-lg font-bold leading-none">A</span>
                    <span className="text-[0.55rem] font-bold leading-none">−</span>
                  </button>
                  <div className="flex-1">
                    <input
                      type="range"
                      min={36} max={72} step={4}
                      value={state.quranFontSize}
                      onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                      className="w-full h-2 appearance-none rounded-full bg-[var(--border)] accent-[var(--primary)]"
                      aria-label="Taille de police"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleFontSizeChange(Math.min(72, state.quranFontSize + 4))}
                    disabled={state.quranFontSize >= 72}
                    className="h-9 w-9 flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 transition-all"
                  >
                    <span className="text-lg font-bold leading-none">A</span>
                    <span className="text-[0.55rem] font-bold leading-none">+</span>
                  </button>
                </div>
                <p className="text-center text-[0.7rem] text-[var(--text-muted)] mt-1">{state.quranFontSize}px</p>
              </div>

              {/* Font family */}
              {fontList.length > 0 && (
                <div>
                  <SectionLabel>{lang === "fr" ? "Police de lecture" : "Reading font"}</SectionLabel>
                  <div className="grid grid-cols-1 gap-1.5">
                    {fontList.map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => dispatch({ type: "SET_FONT_FAMILY", payload: font.id })}
                        className={cn(
                          "flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-left transition-all",
                          state.fontFamily === font.id
                            ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.06)] text-[var(--primary)]"
                            : "border-[var(--border)] text-[var(--text-primary)] hover:border-[rgba(var(--primary-rgb),0.3)]",
                        )}
                      >
                        <div>
                          <div className="text-[0.8rem] font-semibold">{font.label || font.id}</div>
                          {font.sample && (
                            <div className="text-[0.72rem] text-[var(--text-muted)] mt-0.5 font-[var(--font-quran)] dir-rtl" dir="rtl">
                              {font.sample}
                            </div>
                          )}
                        </div>
                        {state.fontFamily === font.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-0 divide-y divide-[var(--border)]">
                <SectionLabel>{lang === "fr" ? "Options de lecture" : "Reading options"}</SectionLabel>
                <ToggleSwitch
                  checked={state.showTajwid}
                  onChange={(v) => set({ showTajwid: v })}
                  label={lang === "fr" ? "Couleurs Tajweed" : "Tajweed colors"}
                />
                <ToggleSwitch
                  checked={state.showTransliteration}
                  onChange={(v) => set({ showTransliteration: v })}
                  label={lang === "fr" ? "Translittération" : "Transliteration"}
                />
                <ToggleSwitch
                  checked={state.showWordByWord}
                  onChange={(v) => set({ showWordByWord: v, memMode: false })}
                  label={lang === "fr" ? "Mot à mot" : "Word by word"}
                />
                <ToggleSwitch
                  checked={state.memMode}
                  onChange={(v) => set({ memMode: v, showWordByWord: false })}
                  label={lang === "fr" ? "Mode mémorisation" : "Memorization mode"}
                />
              </div>

              {/* Riwaya */}
              <div>
                <SectionLabel>{lang === "fr" ? "Riwaya (lecture)" : "Riwaya"}</SectionLabel>
                <div className="grid grid-cols-2 gap-2">
                  {["hafs", "warsh"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => set({ riwaya: r })}
                      className={cn(
                        "py-2.5 rounded-xl border text-[0.8rem] font-bold uppercase tracking-wide transition-all",
                        state.riwaya === r
                          ? r === "warsh"
                            ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                            : "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[rgba(var(--primary-rgb),0.3)]",
                      )}
                    >
                      {r === "warsh" ? "Warsh" : "Hafs"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── Translation Tab ── */}
          {tab === "translation" && (
            <>
              <div>
                <SectionLabel>{lang === "fr" ? "Afficher la traduction" : "Show translation"}</SectionLabel>
                <ToggleSwitch
                  checked={state.showTranslation}
                  onChange={(v) => set({ showTranslation: v })}
                  label={lang === "fr" ? "Traduction activée" : "Translation enabled"}
                />
              </div>

              {state.showTranslation && (
                <div>
                  <SectionLabel>{lang === "fr" ? "Langues de traduction" : "Translation languages"}</SectionLabel>
                  <div className="space-y-1.5">
                    {translationLangs.map(([code, meta]) => {
                      const isActive = state.translationLangs?.includes(code);
                      return (
                        <button
                          key={code}
                          type="button"
                          onClick={() => handleTranslationLangToggle(code)}
                          className={cn(
                            "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all",
                            isActive
                              ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.06)]"
                              : "border-[var(--border)] hover:border-[rgba(var(--primary-rgb),0.3)]",
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className={cn(
                              "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                              isActive ? "border-[var(--primary)] bg-[var(--primary)]" : "border-[var(--border)]",
                            )}>
                              {isActive && <Check size={10} className="text-white" />}
                            </span>
                            <span className="text-[0.8rem] font-semibold text-[var(--text-primary)]">
                              {lang === "fr" ? meta.fr : lang === "ar" ? meta.ar : meta.en}
                            </span>
                          </div>
                          <span className="text-[0.62rem] font-mono text-[var(--text-muted)] uppercase">{code}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Translation font size */}
              <div>
                <SectionLabel>{lang === "fr" ? "Taille de la traduction" : "Translation font size"}</SectionLabel>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "SET_TRANSLATION_FONT_SIZE", payload: Math.max(12, state.quranTranslationFontSize - 2) })}
                    disabled={state.quranTranslationFontSize <= 12}
                    className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 transition-all text-sm font-bold"
                  >−</button>
                  <div className="flex-1">
                    <input
                      type="range" min={12} max={28} step={2}
                      value={state.quranTranslationFontSize}
                      onChange={(e) => dispatch({ type: "SET_TRANSLATION_FONT_SIZE", payload: Number(e.target.value) })}
                      className="w-full h-2 appearance-none rounded-full bg-[var(--border)] accent-[var(--primary)]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "SET_TRANSLATION_FONT_SIZE", payload: Math.min(28, state.quranTranslationFontSize + 2) })}
                    disabled={state.quranTranslationFontSize >= 28}
                    className="h-8 w-8 flex items-center justify-center rounded-full border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)] hover:text-[var(--primary)] disabled:opacity-30 transition-all text-sm font-bold"
                  >+</button>
                </div>
                <p className="text-center text-[0.7rem] text-[var(--text-muted)] mt-1">{state.quranTranslationFontSize}px</p>
              </div>
            </>
          )}

          {/* ── Audio Tab ── */}
          {tab === "audio" && (
            <>
              {/* Reciter list */}
              {reciters.length > 0 && (
                <div>
                  <SectionLabel>{lang === "fr" ? "Récitateur" : "Reciter"}</SectionLabel>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {reciters.map((reciter) => {
                      const isActive = state.reciter === reciter.id;
                      return (
                        <button
                          key={reciter.id}
                          type="button"
                          onClick={() => handleReciterChange(reciter.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all",
                            isActive
                              ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.06)]"
                              : "border-[var(--border)] hover:border-[rgba(var(--primary-rgb),0.3)]",
                          )}
                        >
                          <div className="w-8 h-8 rounded-full bg-[rgba(var(--primary-rgb),0.1)] flex items-center justify-center shrink-0">
                            <i className="fas fa-microphone text-[0.65rem] text-[var(--primary)]" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[0.78rem] font-semibold text-[var(--text-primary)] truncate">
                              {reciter.name || reciter.id}
                            </div>
                            {reciter.style && (
                              <div className="text-[0.62rem] text-[var(--text-muted)]">{reciter.style}</div>
                            )}
                          </div>
                          {isActive && <Check size={14} className="text-[var(--primary)] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Playback speed */}
              <div>
                <SectionLabel>{lang === "fr" ? "Vitesse de lecture" : "Playback speed"}</SectionLabel>
                <div className="grid grid-cols-3 gap-2">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSpeedChange(s)}
                      className={cn(
                        "py-2 rounded-xl border text-[0.78rem] font-bold transition-all",
                        state.audioSpeed === s
                          ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)]"
                          : "border-[var(--border)] text-[var(--text-muted)] hover:border-[rgba(var(--primary-rgb),0.3)]",
                      )}
                    >
                      {s}×
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio options */}
              <div className="space-y-0 divide-y divide-[var(--border)]">
                <SectionLabel>{lang === "fr" ? "Options audio" : "Audio options"}</SectionLabel>
                <ToggleSwitch
                  checked={state.continuousPlay}
                  onChange={(v) => set({ continuousPlay: v })}
                  label={lang === "fr" ? "Lecture continue" : "Continuous play"}
                />
                <ToggleSwitch
                  checked={state.karaokeFollow}
                  onChange={(v) => set({ karaokeFollow: v })}
                  label={lang === "fr" ? "Suivi du verset en lecture" : "Follow playing verse"}
                />
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
