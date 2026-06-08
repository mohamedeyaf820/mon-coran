import React, { useState, useEffect, useRef } from "react";
import {
  Palette,
  BookOpen,
  Volume2,
  X,
  Search,
  Trash2,
  Download,
  Upload,
  Info
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { getRecitersByRiwaya, getReciterVisual } from "../data/reciters";
import { THEMES as UI_THEMES } from "../data/themes";
import { ensureFontLoaded } from "../services/fontLoader";
import { getSettings, saveSettings } from "../services/storageService";
import { downloadExport, importFromFile } from "../services/exportService";
import { clearCache } from "../services/quranAPI";
import { toast } from "../lib/utils";


const RIWAYA_FONT_OPTIONS = [
  {
    id: "qpc-hafs",
    label: "Quran.com Hafs",
    hint: "Police Hafs depuis Quran Foundation",
    riwaya: "hafs",
  },
  {
    id: "qpc-indopak",
    label: "Quran.com IndoPak",
    hint: "Police IndoPak avec marqueurs de waqf",
    riwaya: "hafs",
  },
  {
    id: "qpc-warsh",
    label: "QPC Warsh",
    hint: "Police riwaya Warsh",
    riwaya: "warsh",
  },
  {
    id: "kfgqpc-warsh",
    label: "KFGQPC Warsh",
    hint: "Warsh Unicode KFGQPC, charge via CDN",
    riwaya: "warsh",
  },
];

function SettingsReciterAvatar({ reciter }) {
  const visual = getReciterVisual(reciter);
  if (visual.type === "photo") {
    return (
      <span className="settings-reciter-avatar settings-reciter-avatar--photo">
        <img src={visual.photo} alt="" loading="lazy" />
      </span>
    );
  }
  return (
    <span
      className="settings-reciter-avatar"
      style={{ "--avatar-bg": visual.avatar.color }}
      aria-hidden="true"
    >
      {visual.avatar.initials}
    </span>
  );
}

export default function SettingsModal() {
  const { state, dispatch, set } = useApp();
  const {
    lang,
    theme,
    riwaya,
    reciter,
    quranFontSize,
    quranTranslationFontSize = 18,
    showTranslation,
    showTajwid,
    showWordByWord,
    showTransliteration,
    showWordTranslation,
    fontFamily,
    audioSpeed,
    volume,
    autoNightMode,
    nightStart,
    nightEnd
  } = state;

  const [activeTab, setActiveTab] = useState("apparence"); // 'apparence' | 'affichage' | 'audio'
  const [reciterSearch, setReciterSearch] = useState("");
  const panelRef = useRef(null);
  const activeRiwaya = riwaya || "hafs";
  const availableFontOptions = RIWAYA_FONT_OPTIONS.filter((font) => font.riwaya === activeRiwaya);
  const selectedFontFamily = availableFontOptions.some((font) => font.id === fontFamily)
    ? fontFamily
    : availableFontOptions[0]?.id || "qpc-hafs";

  const close = () => dispatch({ type: "TOGGLE_SETTINGS" });

  // Ensure font loaded when font family changes
  useEffect(() => {
    ensureFontLoaded(selectedFontFamily).catch(() => {});
  }, [selectedFontFamily]);

  // Reciters matching search query
  const recitersList = getRecitersByRiwaya(activeRiwaya);
  const filteredReciters = recitersList.filter((r) => {
    const q = reciterSearch.toLowerCase();
    return (
      (r.name || "").toLowerCase().includes(q) ||
      (r.nameFr || "").toLowerCase().includes(q) ||
      (r.nameEn || "").toLowerCase().includes(q)
    );
  });

  const handleClearCache = async () => {
    try {
      await clearCache();
      toast(t("settings.cacheCleared", lang), "success");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) {
      console.error(err);
      toast(t("errors.generic", lang), "error");
    }
  };

  const handleExport = () => {
    downloadExport();
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const ok = await importFromFile(file);
      if (ok) {
        toast(t("settings.importSettingsSuccess", lang), "success");
        setTimeout(() => window.location.reload(), 1500);
      } else {
        toast(t("settings.importSettingsFailed", lang), "error");
      }
    } catch {
      toast(t("settings.importSettingsFailed", lang), "error");
    }
  };

  return (
    <div className="settings-overlay fixed inset-0 z-[500] flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="settings-backdrop fixed inset-0 bg-black/35 backdrop-blur-md transition-opacity"
        onClick={close}
      />

      {/* Settings Drawer Panel */}
      <div
        ref={panelRef}
        className="settings-drawer relative h-full w-full max-w-md bg-[var(--bg-card)] border-l border-[var(--border)] shadow-2xl flex flex-col z-10 transition-transform duration-300 transform translate-x-0"
        style={{
          boxShadow: "-10px 0 40px -6px rgba(0, 0, 0, 0.15)",
          color: "var(--text-primary)"
        }}
      >
        {/* Header */}
        <header className="settings-drawer__header flex items-center justify-between px-6 py-4.5 border-b border-[var(--border)]">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)] shadow-sm">
              <BookOpen size={18} />
            </span>
            <h2 className="text-md font-extrabold font-[var(--font-ui)] tracking-tight">
              {t("settings.readingSettings", lang)}
            </h2>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all cursor-pointer hover:scale-105 active:scale-95"
            aria-label={lang === "ar" ? "\u0625\u063a\u0644\u0627\u0642" : lang === "en" ? "Close settings" : "Fermer les paramètres"}
            title={lang === "ar" ? "\u0625\u063a\u0644\u0627\u0642" : lang === "en" ? "Close settings" : "Fermer les paramètres"}
          >
            <X size={18} />
          </button>
        </header>

        {/* Tab Selection */}
        <nav className="settings-drawer__tabs flex gap-1 border-b border-[var(--border)] p-1.5 bg-[var(--bg-secondary)]" aria-label="Tabs" role="tablist">
          <button
            id="tab-apparence"
            role="tab"
            aria-selected={activeTab === "apparence"}
            aria-controls="panel-apparence"
            onClick={() => setActiveTab("apparence")}
            className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.55)] ${
              activeTab === "apparence"
                ? "bg-[var(--primary)] text-white shadow-md shadow-[rgba(var(--primary-rgb),0.2)] font-extrabold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(var(--primary-rgb),0.04)]"
            }`}
          >
            <Palette size={14} />
            <span>{t("settings.general", lang)}</span>
          </button>
          <button
            id="tab-affichage"
            role="tab"
            aria-selected={activeTab === "affichage"}
            aria-controls="panel-affichage"
            onClick={() => setActiveTab("affichage")}
            className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.55)] ${
              activeTab === "affichage"
                ? "bg-[var(--primary)] text-white shadow-md shadow-[rgba(var(--primary-rgb),0.2)] font-extrabold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(var(--primary-rgb),0.04)]"
            }`}
          >
            <BookOpen size={14} />
            <span>{t("settings.display", lang)}</span>
          </button>
          <button
            id="tab-audio"
            role="tab"
            aria-selected={activeTab === "audio"}
            aria-controls="panel-audio"
            onClick={() => setActiveTab("audio")}
            className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.55)] ${
              activeTab === "audio"
                ? "bg-[var(--primary)] text-white shadow-md shadow-[rgba(var(--primary-rgb),0.2)] font-extrabold"
                : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[rgba(var(--primary-rgb),0.04)]"
            }`}
          >
            <Volume2 size={14} />
            <span>{t("settings.audio", lang)}</span>
          </button>
        </nav>

        {/* Panel Content (Scrollable) */}
        <div className="settings-drawer__content flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* TAB 1: Apparence */}
          {activeTab === "apparence" && (
            <div
              id="panel-apparence"
              role="tabpanel"
              aria-labelledby="tab-apparence"
              className="space-y-6 animate-fade-in"
            >
              {/* App Language */}
              <div className="space-y-2">
                <label htmlFor="settings-lang-select" className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                  {t("settings.appLanguage", lang)}
                </label>
                <select
                  id="settings-lang-select"
                  value={lang}
                  onChange={(e) => set({ lang: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>

              {/* Theme Mode */}
              <div className="space-y-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)] block">
                  {t("settings.visualTheme", lang)}
                </span>
                <div className="grid grid-cols-2 gap-3" role="group" aria-label={t("settings.visualTheme", lang)}>
                  {UI_THEMES.map((thm) => {
                    const label = lang === "ar" ? thm.ar : lang === "fr" ? thm.fr : thm.en;
                    const isActive = theme === thm.id;
                    return (
                      <button
                        key={thm.id}
                        type="button"
                        onClick={() => set({ theme: thm.id })}
                        className={`relative flex flex-col items-center justify-center p-4.5 rounded-2xl border text-center transition-all cursor-pointer ${
                          isActive
                            ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.06)] shadow-md scale-[1.02]"
                            : "border-[var(--border)] hover:bg-[var(--bg-secondary)] hover:scale-[1.01]"
                        }`}
                        aria-pressed={isActive}
                      >
                        {/* Theme color preview swatch */}
                        <div
                          className="w-11 h-11 rounded-full border border-black/10 shadow-inner mb-2.5 flex items-center justify-center relative overflow-hidden shrink-0"
                          style={{ background: thm.palette?.bg || "var(--bg-primary)" }}
                        >
                          {/* Inner color details */}
                          <div className="absolute inset-0 flex">
                            <div className="w-1/2 h-full opacity-10" style={{ backgroundColor: thm.palette?.primary || "var(--primary)" }} />
                            <div className="w-1/2 h-full opacity-20" style={{ backgroundColor: thm.palette?.text || "var(--text-primary)" }} />
                          </div>
                          {isActive && (
                            <i className="fas fa-check text-[0.62rem] text-[var(--primary)] bg-[var(--bg-card)] p-1 rounded-full shadow-sm z-10" />
                          )}
                        </div>
                        <span className={`text-xs font-bold tracking-tight ${
                          isActive ? "text-[var(--primary)] font-extrabold" : "text-[var(--text-primary)]"
                        }`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Auto Night Mode */}
              <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="settings-auto-night" className="cursor-pointer">
                    <h3 className="text-sm font-semibold">{t("settings.autoNightMode", lang)}</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {t("settings.autoNightHint", lang)}
                    </p>
                  </label>
                  <input
                    id="settings-auto-night"
                    type="checkbox"
                    checked={autoNightMode}
                    onChange={(e) => set({ autoNightMode: e.target.checked })}
                    className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)] cursor-pointer"
                  />
                </div>

                {autoNightMode && (
                  <div className="flex items-center gap-4 pt-2 border-t border-[var(--border)]">
                    <div className="flex-1 flex flex-col gap-1 text-xs text-[var(--text-muted)]">
                      <label htmlFor="settings-night-start">{t("settings.start", lang)}</label>
                      <input
                        id="settings-night-start"
                        type="time"
                        value={nightStart || "20:00"}
                        onChange={(e) => set({ nightStart: e.target.value })}
                        className="px-2 py-1 bg-[var(--bg-card)] rounded border border-[var(--border)] focus:outline-none"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1 text-xs text-[var(--text-muted)]">
                      <label htmlFor="settings-night-end">{t("settings.end", lang)}</label>
                      <input
                        id="settings-night-end"
                        type="time"
                        value={nightEnd || "06:00"}
                        onChange={(e) => set({ nightEnd: e.target.value })}
                        className="px-2 py-1 bg-[var(--bg-card)] rounded border border-[var(--border)] focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Import/Export simple parameters */}
              <div className="pt-4 border-t border-[var(--border)] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  {t("settings.backupRestore", lang)}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="flex-1 py-2 px-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Download size={15} />
                    <span>{t("export.export", lang)}</span>
                  </button>
                  <label htmlFor="settings-import-file" className="flex-1 py-2 px-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer">
                    <Upload size={15} />
                    <span>{t("export.import", lang)}</span>
                    <input
                      id="settings-import-file"
                      type="file"
                      accept=".json"
                      onChange={handleImport}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Espace Outils */}
              <div className="pt-4 border-t border-[var(--border)] space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  {lang === "ar" ? "الأدوات" : lang === "fr" ? "Outils" : "Tools"}
                </span>
                <button
                  onClick={() => {
                    set({ toolsHubOpen: true });
                    close();
                  }}
                  className="w-full py-3 px-4 rounded-xl border border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.05)] hover:bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)] text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <i className="fas fa-shapes text-lg" />
                    <div className="text-left">
                      <p className="font-bold">{lang === "ar" ? "مركز الأدوات" : lang === "fr" ? "Espace Outils" : "Tools Hub"}</p>
                      <p className="text-[0.71rem] text-[var(--text-muted)]">
                        {lang === "ar" ? "البطاقات التعليمية، الإحصائيات، الحفظ والمزيد" : lang === "fr" ? "Flashcards, statistiques, mémorisation et plus" : "Flashcards, stats, memorization and more"}
                      </p>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-xs opacity-60" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Affichage & Coran */}
          {activeTab === "affichage" && (
            <div
              id="panel-affichage"
              role="tabpanel"
              aria-labelledby="tab-affichage"
              className="space-y-6 animate-fade-in"
            >
              {/* Riwaya */}
              <div className="space-y-2">
                <span id="settings-riwaya-label" className="text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)] block">
                  Riwaya
                </span>
                <div className="relative p-1 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] flex gap-1" role="group" aria-labelledby="settings-riwaya-label">
                  <button
                    onClick={() => set({ riwaya: "hafs" })}
                    className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                      riwaya === "hafs"
                        ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Hafs (حفص)
                  </button>
                  <button
                    onClick={() => set({ riwaya: "warsh" })}
                    className={`flex-1 py-2 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                      riwaya === "warsh"
                        ? "bg-[var(--bg-card)] text-[var(--primary)] shadow-sm"
                        : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    Warsh (ورش)
                  </button>
                </div>
              </div>

              {/* Font selection */}
              <div className="space-y-2">
                <label htmlFor="settings-font-family" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  {t("settings.arabicFontFamily", lang)}
                </label>
                <select
                  id="settings-font-family"
                  value={selectedFontFamily}
                  onChange={(e) => set({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(var(--primary-rgb),0.5)]"
                >
                  {availableFontOptions.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label} ({f.hint})
                    </option>
                  ))}
                </select>
              </div>

              {/* Font sizes sliders */}
              <div className="space-y-4 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                {/* Quran font size */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase text-[var(--text-muted)]">
                    <label htmlFor="settings-font-size-quran">{t("settings.arabicFontSize", lang)}</label>
                    <span>{quranFontSize}px</span>
                  </div>
                  <input
                    id="settings-font-size-quran"
                    type="range"
                    min="12"
                    max="96"
                    step="1"
                    value={quranFontSize}
                    onChange={(e) => set({ quranFontSize: Number(e.target.value) })}
                    className="w-full accent-[var(--primary)] cursor-pointer"
                  />
                </div>

                {/* Translation font size */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold uppercase text-[var(--text-muted)]">
                    <label htmlFor="settings-font-size-translation">{t("settings.translationFontSize", lang)}</label>
                    <span>{quranTranslationFontSize}px</span>
                  </div>
                  <input
                    id="settings-font-size-translation"
                    type="range"
                    min="14"
                    max="28"
                    step="1"
                    value={quranTranslationFontSize}
                    onChange={(e) => set({ quranTranslationFontSize: Number(e.target.value) })}
                    className="w-full accent-[var(--primary)] cursor-pointer"
                  />
                </div>
              </div>

              {/* Display checkboxes helpers */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  {t("settings.readingHelpers", lang)}
                </span>
                <div className="space-y-2">
                  <label htmlFor="settings-show-tajwid" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] cursor-pointer select-none">
                    <input
                      id="settings-show-tajwid"
                      type="checkbox"
                      checked={showTajwid}
                      onChange={(e) => set({ showTajwid: e.target.checked })}
                      className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold">{t("settings.tajweedColors", lang)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{t("settings.tajweedDesc", lang)}</p>
                    </div>
                  </label>

                  <label htmlFor="settings-show-translation" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] cursor-pointer select-none">
                    <input
                      id="settings-show-translation"
                      type="checkbox"
                      checked={showTranslation}
                      onChange={(e) => set({ showTranslation: e.target.checked })}
                      className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold">{t("settings.showTranslationsDetail", lang)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{t("settings.showTranslationsDesc", lang)}</p>
                    </div>
                  </label>

                  <label htmlFor="settings-show-transliteration" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] cursor-pointer select-none">
                    <input
                      id="settings-show-transliteration"
                      type="checkbox"
                      checked={showTransliteration}
                      onChange={(e) => set({ showTransliteration: e.target.checked })}
                      className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold">{t("settings.showTransliteration", lang)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{t("settings.showTransliterationDesc", lang)}</p>
                    </div>
                  </label>

                  <label htmlFor="settings-show-word-by-word" className="flex items-center gap-3 p-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] cursor-pointer select-none">
                    <input
                      id="settings-show-word-by-word"
                      type="checkbox"
                      checked={showWordByWord}
                      onChange={(e) => set({ showWordByWord: e.target.checked })}
                      className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]"
                    />
                    <div className="text-left">
                      <p className="text-sm font-semibold">{t("settings.wordByWordMode", lang)}</p>
                      <p className="text-xs text-[var(--text-muted)]">{t("settings.wordByWordDesc", lang)}</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Audio */}
          {activeTab === "audio" && (
            <div
              id="panel-audio"
              role="tabpanel"
              aria-labelledby="tab-audio"
              className="space-y-6 animate-fade-in"
            >
              {/* Reciter searchable selector */}
              <div className="space-y-2">
                <label htmlFor="settings-reciter-search" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  {t("settings.selectReciter", lang)}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[var(--text-muted)]">
                    <Search size={16} />
                  </span>
                  <input
                    id="settings-reciter-search"
                    type="text"
                    placeholder={t("settings.searchReciters", lang)}
                    value={reciterSearch}
                    onChange={(e) => setReciterSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(var(--primary-rgb),0.5)]"
                  />
                </div>

                <div className="settings-reciter-list border border-[var(--border)] rounded-2xl max-h-72 overflow-y-auto bg-[var(--bg-card)]">
                  {filteredReciters.length > 0 ? (
                    <div className="settings-reciter-grid p-2 grid grid-cols-1 min-[380px]:grid-cols-2 gap-2">
                      {filteredReciters.map((r) => {
                        const isActive = r.id === reciter;
                        return (
                          <button
                            key={r.id}
                            onClick={() => set({ reciter: r.id })}
                            className={`settings-reciter-option w-full px-3 py-2 rounded-xl text-left text-sm font-semibold transition-all border flex items-center justify-between gap-2.5 cursor-pointer ${
                              isActive
                                ? "border-[rgba(var(--primary-rgb),0.32)] bg-[rgba(var(--primary-rgb),0.06)] text-[var(--primary)] font-bold shadow-sm"
                                : "border-transparent hover:bg-[var(--bg-secondary)] text-[var(--text-primary)]"
                            }`}
                          >
                            <span className="flex min-w-0 items-center gap-2.5">
                              <SettingsReciterAvatar reciter={r} />
                              <span className="min-w-0">
                                <span className="block truncate text-xs font-bold leading-tight">
                                  {lang === "fr" ? r.nameFr || r.name : lang === "en" ? r.nameEn || r.name : r.name}
                                </span>
                                <span className="settings-reciter-option__meta block truncate text-[0.62rem] mt-0.5">
                                  {r.style || "murattal"}
                                </span>
                              </span>
                            </span>
                            {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                      {t("settings.noReciterFound", lang)}
                    </div>
                  )}
                </div>
              </div>

              {/* Playback speed */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-[var(--text-muted)]">
                  <label htmlFor="settings-audio-speed">{t("settings.playbackSpeed", lang)}</label>
                  <span>{audioSpeed}x</span>
                </div>
                <input
                  id="settings-audio-speed"
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={audioSpeed}
                  onChange={(e) => set({ audioSpeed: Number(e.target.value) })}
                  className="w-full accent-[var(--primary)] cursor-pointer"
                />
              </div>

              {/* Volume */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-[var(--text-muted)]">
                  <label htmlFor="settings-audio-volume">Volume</label>
                  <span>{Math.round(volume * 100)}%</span>
                </div>
                <input
                  id="settings-audio-volume"
                  type="range"
                  min="0"
                  max="1.0"
                  step="0.05"
                  value={volume}
                  onChange={(e) => set({ volume: Number(e.target.value) })}
                  className="w-full accent-[var(--primary)] cursor-pointer"
                />
              </div>

              {/* Clear cache & cleanup */}
              <div className="pt-4 border-t border-[var(--border)] space-y-3">
                <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                  <Info size={14} />
                  <span>{t("settings.cacheInfo", lang)}</span>
                </div>
                <button
                  onClick={handleClearCache}
                  className="w-full py-2.5 px-4 rounded-xl border border-red-500/20 hover:bg-red-500/5 text-red-500 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>{t("settings.clearCache", lang)}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
