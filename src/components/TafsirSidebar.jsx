import React, { useState, useEffect, useRef } from "react";
import { X, BookOpen, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import { useApp } from "../context/AppContext";
import { getVerseTafsir, getAvailableTafsirs } from "../services/quranComStudyService";
import { getSurah } from "../data/surahs";

export default function TafsirSidebar() {
  const { state, set } = useApp();
  const { lang, tafsirSidebarOpen, tafsirSidebarVerse } = state;

  const [tafsirData, setTafsirData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTafsirId, setSelectedTafsirId] = useState(() => {
    return lang === "ar" ? "ar-muyassar" : lang === "fr" ? "fr-kathir" : "en-kathir";
  });

  const sidebarRef = useRef(null);

  // Close sidebar
  const close = () => {
    set({ tafsirSidebarOpen: false });
  };

  // Fetch Tafsir on verse or selection change
  useEffect(() => {
    if (!tafsirSidebarOpen || !tafsirSidebarVerse) return;

    let active = true;
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    getVerseTafsir({
      surah: tafsirSidebarVerse.surah,
      ayah: tafsirSidebarVerse.ayah,
      lang,
      tafsirId: selectedTafsirId,
      signal: controller.signal
    })
      .then((data) => {
        if (active) {
          setTafsirData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active && err.name !== "AbortError") {
          console.error("Failed to load tafsir:", err);
          setError(err.message || "Failed to load tafsir");
          setLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [tafsirSidebarOpen, tafsirSidebarVerse, selectedTafsirId, lang]);

  if (!tafsirSidebarOpen || !tafsirSidebarVerse) return null;

  const surahInfo = getSurah(tafsirSidebarVerse.surah);
  const surahName = surahInfo
    ? lang === "fr"
      ? surahInfo.fr || surahInfo.en
      : lang === "ar"
      ? surahInfo.ar
      : surahInfo.en
    : `Sourate ${tafsirSidebarVerse.surah}`;

  const availableTafsirs = getAvailableTafsirs();

  return (
    <div
      className="fixed inset-y-0 right-0 z-[450] flex"
      role="dialog"
      aria-modal="true"
      aria-label="Tafsir"
    >
      {/* Backdrop for mobile only (closes sidebar when clicking outside) */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-[1px] md:hidden"
        onClick={close}
      />

      {/* Sidebar Panel */}
      <div
        ref={sidebarRef}
        className="relative w-full max-w-md md:max-w-lg h-full bg-[var(--bg-card)] border-l border-[var(--border)] shadow-2xl flex flex-col z-10 transition-transform duration-300"
        style={{
          boxShadow: "-10px 0 30px -5px rgba(0, 0, 0, 0.15)",
          color: "var(--text-primary)"
        }}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)]">
              <BookOpen size={18} />
            </span>
            <div>
              <h2 className="text-sm font-bold font-[var(--font-ui)]">
                Tafsir {surahName} ({tafsirSidebarVerse.surah}:{tafsirSidebarVerse.ayah})
              </h2>
              <p className="text-[0.68rem] text-[var(--text-muted)] font-[var(--font-ui)]">
                {lang === "fr" ? "Explication détaillée du verset" : "Detailed verse explanation"}
              </p>
            </div>
          </div>
          <button
            onClick={close}
            className="p-1.5 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </header>

        {/* Tafsir Source Dropdown Selector */}
        <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex items-center justify-between gap-3">
          <label htmlFor="tafsir-selector" className="text-xs font-semibold text-[var(--text-muted)] font-[var(--font-ui)] shrink-0">
            {lang === "fr" ? "Source du Tafsir :" : "Tafsir Source:"}
          </label>
          <select
            id="tafsir-selector"
            value={selectedTafsirId}
            onChange={(e) => setSelectedTafsirId(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-primary)] outline-none focus:border-[var(--primary)] max-w-[220px]"
          >
            {availableTafsirs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.lang.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <RefreshCw className="animate-spin text-[var(--primary)]" size={24} />
              <p className="text-xs text-[var(--text-muted)] font-[var(--font-ui)]">
                {lang === "fr" ? "Chargement du tafsir..." : "Loading tafsir..."}
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center px-4">
              <AlertCircle className="text-red-500" size={28} />
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {lang === "fr" ? "Erreur de chargement" : "Error loading tafsir"}
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-xs leading-relaxed">
                {error}
              </p>
              <button
                onClick={() => setSelectedTafsirId(selectedTafsirId)} // trigger reload
                className="mt-2 px-3.5 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold hover:brightness-110 active:scale-95 transition-all cursor-pointer"
              >
                {lang === "fr" ? "Réessayer" : "Retry"}
              </button>
            </div>
          ) : tafsirData ? (
            <article className="space-y-4">
              {/* Tafsir source display */}
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--primary)] bg-[rgba(var(--primary-rgb),0.06)] px-3 py-1.5 rounded-lg">
                <BookOpen size={14} />
                <span>
                  {lang === "fr" ? tafsirData.sourceFr || tafsirData.source : tafsirData.source}
                </span>
              </div>

              {/* Tafsir Text (support Arabic RTL text formatting if source language is arabic) */}
              <div
                dir={tafsirData.language === "ar" ? "rtl" : "ltr"}
                className={`text-[0.95rem] leading-relaxed text-[var(--text-secondary)] whitespace-pre-wrap select-text selection:bg-[rgba(var(--primary-rgb),0.2)] ${
                  tafsirData.language === "ar"
                    ? "font-[var(--font-quran)] text-right text-lg [word-spacing:0.04em]"
                    : "text-left font-sans"
                }`}
              >
                {tafsirData.text}
              </div>

              {/* Note */}
              {tafsirData.note && (
                <div className="mt-6 border-t border-[var(--border)] pt-4 text-[0.72rem] text-[var(--text-muted)] italic leading-relaxed">
                  {tafsirData.note}
                </div>
              )}
            </article>
          ) : (
            <div className="text-center text-xs text-[var(--text-muted)] py-12">
              {lang === "fr" ? "Aucune donnée disponible." : "No data available."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
