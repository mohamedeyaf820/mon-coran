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
import { getRecitersByRiwaya, getReciter } from "../data/reciters";
import { THEMES as UI_THEMES } from "../data/themes";
import { ensureFontLoaded } from "../services/fontLoader";
import { getSettings, saveSettings } from "../services/storageService";
import { downloadExport, importFromFile } from "../services/exportService";
import { clearCache } from "../services/quranAPI";

const THEMES = [
  { id: "light", fr: "Clair", en: "Light", ar: "فاتح" },
  { id: "dark", fr: "Sombre", en: "Dark", ar: "داكن" },
  { id: "sepia", fr: "Sépia", en: "Sepia", ar: "سيبيا" }
];

const FONT_OPTIONS = [
  {
    id: "qpc-hafs",
    label: "QPC Hafs",
    hint: "Police officielle Uthmani",
    css: "'QPC Hafs','KFGQPC Uthmanic Script HAFS','ME Quran',serif",
  },
  {
    id: "amiri-quran",
    label: "Amiri",
    hint: "Naskh élégante classique",
    css: "'Amiri Quran','Amiri','Scheherazade New',serif",
  },
  {
    id: "scheherazade-new",
    label: "Scheherazade",
    hint: "Naskh aéré lisible",
    css: "'Scheherazade New','Amiri Quran','Noto Naskh Arabic',serif",
  },
  {
    id: "noto-naskh-arabic",
    label: "Noto Naskh",
    hint: "Robuste sur tous écrans",
    css: "'Noto Naskh Arabic','Scheherazade New','Amiri Quran',serif",
  },
  {
    id: "qpc-indopak",
    label: "IndoPak",
    hint: "Script indo-pakistanais",
    css: "'QPC IndoPak','IndoPak','Noto Nastaliq Urdu',serif",
  },
  {
    id: "qpc-nastaleeq",
    label: "Nastaleeq",
    hint: "Style script Nastaliq",
    css: "'QPC Nastaleeq','KFGQPC Nastaleeq','Noto Nastaliq Urdu',serif",
  },
  {
    id: "qcf-v2",
    label: "QCF V2",
    hint: "Rendu Mushaf imprimé",
    css: "'QCF V2','KFGQPC Uthmanic Script HAFS','QPC Hafs',serif",
  },
  {
    id: "qpc-warsh",
    label: "QPC Warsh",
    hint: "Police riwaya Warsh",
    css: "'QPC Warsh','KFGQPC Uthmanic Script WARSH','QPC Hafs',serif",
  }
];

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

  const close = () => dispatch({ type: "TOGGLE_SETTINGS" });

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Ensure font loaded when font family changes
  useEffect(() => {
    ensureFontLoaded(fontFamily).catch(() => {});
  }, [fontFamily]);

  // Reciters matching search query
  const recitersList = getRecitersByRiwaya(riwaya || "hafs");
  const filteredReciters = recitersList.filter((r) =>
    r.name.toLowerCase().includes(reciterSearch.toLowerCase())
  );

  const handleClearCache = async () => {
    try {
      await clearCache();
      alert(lang === "fr" ? "Le cache de l'application a été vidé." : "App cache cleared.");
      window.location.reload();
    } catch (err) {
      console.error(err);
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
        alert(lang === "fr" ? "Paramètres importés avec succès." : "Settings imported successfully.");
        window.location.reload();
      }
    } catch {
      alert(lang === "fr" ? "Échec de l'import." : "Import failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex justify-end" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/45 backdrop-blur-sm transition-opacity"
        onClick={close}
      />

      {/* Settings Drawer Panel */}
      <div
        ref={panelRef}
        className="relative w-full max-w-md h-full bg-[var(--bg-card)] border-l border-[var(--border)] shadow-2xl flex flex-col z-10 transition-transform duration-300 transform translate-x-0"
        style={{
          boxShadow: "-10px 0 30px -5px rgba(0, 0, 0, 0.15)",
          color: "var(--text-primary)"
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)]">
              <BookOpen size={20} />
            </span>
            <h2 className="text-lg font-bold font-[var(--font-ui)]">
              {lang === "fr" ? "Paramètres de lecture" : lang === "ar" ? "خيارات القراءة" : "Reading Settings"}
            </h2>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        {/* Tab Selection */}
        <nav className="flex border-b border-[var(--border)] px-4 bg-[var(--bg-secondary)]" aria-label="Tabs" role="tablist">
          <button
            id="tab-apparence"
            role="tab"
            aria-selected={activeTab === "apparence"}
            aria-controls="panel-apparence"
            onClick={() => setActiveTab("apparence")}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === "apparence"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Palette size={16} />
            <span>{lang === "fr" ? "Général" : "General"}</span>
          </button>
          <button
            id="tab-affichage"
            role="tab"
            aria-selected={activeTab === "affichage"}
            aria-controls="panel-affichage"
            onClick={() => setActiveTab("affichage")}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === "affichage"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <BookOpen size={16} />
            <span>{lang === "fr" ? "Affichage" : "Display"}</span>
          </button>
          <button
            id="tab-audio"
            role="tab"
            aria-selected={activeTab === "audio"}
            aria-controls="panel-audio"
            onClick={() => setActiveTab("audio")}
            className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all ${
              activeTab === "audio"
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            }`}
          >
            <Volume2 size={16} />
            <span>Audio</span>
          </button>
        </nav>

        {/* Panel Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
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
                <label htmlFor="settings-lang-select" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                  {lang === "fr" ? "Langue de l'application" : "Application Language"}
                </label>
                <select
                  id="settings-lang-select"
                  value={lang}
                  onChange={(e) => set({ lang: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(var(--primary-rgb),0.5)]"
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>

              {/* Theme Mode */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  {lang === "fr" ? "Thème visuel" : "Visual Theme"}
                </span>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label={lang === "fr" ? "Thème visuel" : "Visual Theme"}>
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => set({ theme: t.id })}
                      className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                        theme === t.id
                          ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)] shadow-sm"
                          : "border-[var(--border)] hover:bg-[var(--bg-secondary)]"
                      }`}
                    >
                      {lang === "fr" ? t.fr : lang === "ar" ? t.ar : t.en}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Night Mode */}
              <div className="p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor="settings-auto-night" className="cursor-pointer">
                    <h3 className="text-sm font-semibold">{lang === "fr" ? "Mode nuit automatique" : "Auto Night Mode"}</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      {lang === "fr" ? "Bascule automatique selon l'heure" : "Automatic switch based on time"}
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
                      <label htmlFor="settings-night-start">{lang === "fr" ? "Début" : "Start"}</label>
                      <input
                        id="settings-night-start"
                        type="time"
                        value={nightStart || "20:00"}
                        onChange={(e) => set({ nightStart: e.target.value })}
                        className="px-2 py-1 bg-[var(--bg-card)] rounded border border-[var(--border)] focus:outline-none"
                      />
                    </div>
                    <div className="flex-1 flex flex-col gap-1 text-xs text-[var(--text-muted)]">
                      <label htmlFor="settings-night-end">{lang === "fr" ? "Fin" : "End"}</label>
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
                  {lang === "fr" ? "Sauvegarde & Restauration" : "Backup & Restore"}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="flex-1 py-2 px-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-sm font-semibold flex items-center justify-center gap-2"
                  >
                    <Download size={15} />
                    <span>Exporter</span>
                  </button>
                  <label htmlFor="settings-import-file" className="flex-1 py-2 px-3 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer">
                    <Upload size={15} />
                    <span>Importer</span>
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
                <span id="settings-riwaya-label" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  Riwaya
                </span>
                <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="settings-riwaya-label">
                  <button
                    onClick={() => set({ riwaya: "hafs" })}
                    aria-pressed={riwaya === "hafs"}
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                      riwaya === "hafs"
                        ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)] shadow-sm"
                        : "border-[var(--border)] hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    Hafs (حفص)
                  </button>
                  <button
                    onClick={() => set({ riwaya: "warsh" })}
                    aria-pressed={riwaya === "warsh"}
                    className={`py-2 px-3 rounded-xl border text-sm font-semibold transition-all ${
                      riwaya === "warsh"
                        ? "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)] shadow-sm"
                        : "border-[var(--border)] hover:bg-[var(--bg-secondary)]"
                    }`}
                  >
                    Warsh (ورش)
                  </button>
                </div>
              </div>

              {/* Font selection */}
              <div className="space-y-2">
                <label htmlFor="settings-font-family" className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                  {lang === "fr" ? "Police d'écriture Arabe" : "Arabic Font Family"}
                </label>
                <select
                  id="settings-font-family"
                  value={fontFamily}
                  onChange={(e) => set({ fontFamily: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] font-medium text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(var(--primary-rgb),0.5)]"
                >
                  {FONT_OPTIONS.map((f) => (
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
                    <label htmlFor="settings-font-size-quran">{lang === "fr" ? "Taille texte Arabe" : "Arabic Font Size"}</label>
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
                    <label htmlFor="settings-font-size-translation">{lang === "fr" ? "Taille Traductions" : "Translation Font Size"}</label>
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
                  {lang === "fr" ? "Aides de lecture" : "Reading helpers"}
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
                      <p className="text-sm font-semibold">{lang === "fr" ? "Colorisation Tajwid" : "Tajweed Colors"}</p>
                      <p className="text-xs text-[var(--text-muted)]">{lang === "fr" ? "Colore les règles de prononciation" : "Colors rules of recitation"}</p>
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
                      <p className="text-sm font-semibold">{lang === "fr" ? "Afficher les Traductions" : "Show Translations"}</p>
                      <p className="text-xs text-[var(--text-muted)]">{lang === "fr" ? "Affiche la traduction sous le verset" : "Shows translations below verses"}</p>
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
                      <p className="text-sm font-semibold">{lang === "fr" ? "Afficher la Translittération" : "Show Transliteration"}</p>
                      <p className="text-xs text-[var(--text-muted)]">{lang === "fr" ? "Phonétique en caractères latins" : "Phonetics in latin characters"}</p>
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
                      <p className="text-sm font-semibold">{lang === "fr" ? "Mode Mot-à-mot" : "Word-by-Word Mode"}</p>
                      <p className="text-xs text-[var(--text-muted)]">{lang === "fr" ? "Affiche la traduction individuelle sous chaque mot" : "Shows individual translation below each word"}</p>
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
                  {lang === "fr" ? "Sélection du Récitateur" : "Select Reciter"}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[var(--text-muted)]">
                    <Search size={16} />
                  </span>
                  <input
                    id="settings-reciter-search"
                    type="text"
                    placeholder={lang === "fr" ? "Rechercher un récitant..." : "Search reciters..."}
                    value={reciterSearch}
                    onChange={(e) => setReciterSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-sm focus:outline-none focus:ring-2 focus:ring-[rgba(var(--primary-rgb),0.5)]"
                  />
                </div>

                <div className="border border-[var(--border)] rounded-2xl max-h-56 overflow-y-auto divide-y divide-[var(--border)] bg-[var(--bg-card)]">
                  {filteredReciters.length > 0 ? (
                    filteredReciters.map((r) => {
                      const isActive = r.id === reciter;
                      return (
                        <button
                          key={r.id}
                          onClick={() => set({ reciter: r.id })}
                          className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition-all hover:bg-[var(--bg-secondary)] flex items-center justify-between ${
                            isActive ? "bg-[rgba(var(--primary-rgb),0.06)] text-[var(--primary)]" : ""
                          }`}
                        >
                          <span>{r.name}</span>
                          {isActive && <span className="w-2 h-2 rounded-full bg-[var(--primary)]" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-xs text-[var(--text-muted)]">
                      {lang === "fr" ? "Aucun récitant trouvé" : "No reciter found"}
                    </div>
                  )}
                </div>
              </div>

              {/* Playback speed */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase text-[var(--text-muted)]">
                  <label htmlFor="settings-audio-speed">{lang === "fr" ? "Vitesse de lecture" : "Playback Speed"}</label>
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
                  <span>{lang === "fr" ? "Videz le cache si vous rencontrez des problèmes audio." : "Clear cache if you experience audio issues."}</span>
                </div>
                <button
                  onClick={handleClearCache}
                  className="w-full py-2.5 px-4 rounded-xl border border-red-500/20 hover:bg-red-500/5 text-red-500 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 size={16} />
                  <span>{lang === "fr" ? "Vider le cache de l'application" : "Clear Application Cache"}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
