import React, { useState, useEffect } from "react";
import { BookOpen, Loader2, X, ChevronDown, ExternalLink } from "lucide-react";
import { fetchTafsir, getAvailableTafsirs, getTafsirName } from "../../services/tafsirService";
import { useAppSelector } from "../../context/AppContext";
import { cn } from "../../lib/utils";

function labelFor(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

/**
 * TafsirPanel - Displays tafsir/explanation for a verse
 * Inspired by Quran.com's tafsir feature
 */
export default function TafsirPanel({ surah, ayah, onClose }) {
  const lang = useAppSelector((state) => state.lang);
  
  const [tafsirText, setTafsirText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTafsir, setSelectedTafsir] = useState(null);
  const [showSourcePicker, setShowSourcePicker] = useState(false);

  const availableTafsirs = getAvailableTafsirs(lang);
  const defaultTafsirId = availableTafsirs[0]?.key || "en-kathir";

  useEffect(() => {
    if (!surah || !ayah) return;
    
    loadTafsir(selectedTafsir || defaultTafsirId);
  }, [surah, ayah, selectedTafsir]);

  const loadTafsir = async (tafsirId) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await fetchTafsir(surah, ayah, tafsirId);
      setTafsirText(result.text);
      setSelectedTafsir(result.tafsirId);
    } catch (err) {
      setError(err.message || "Failed to load tafsir");
      setTafsirText("");
    } finally {
      setLoading(false);
    }
  };

  const handleSourceChange = (tafsirId) => {
    setSelectedTafsir(tafsirId);
    setShowSourcePicker(false);
  };

  return (
    <div className="tafsir-panel" dir="auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-[var(--primary)]" />
          <h3 className="font-semibold text-[var(--text-primary)]">
            {labelFor(lang, "Tafsir", "Tafsir", "تفسير")}
          </h3>
          <span className="text-xs text-[var(--text-muted)]">
            ({surah}:{ayah})
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Source selector */}
          <div className="relative">
            <button
              onClick={() => setShowSourcePicker(!showSourcePicker)}
              className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              {getTafsirName(selectedTafsir || defaultTafsirId)}
              <ChevronDown size={12} />
            </button>
            
            {showSourcePicker && (
              <div className="absolute top-full right-0 mt-1 w-56 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg shadow-lg z-10 overflow-hidden">
                {availableTafsirs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => handleSourceChange(t.key)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 text-sm hover:bg-[rgba(var(--primary-rgb),0.06)] transition-colors flex items-center justify-between gap-2",
                      (selectedTafsir || defaultTafsirId) === t.key && "bg-[rgba(var(--primary-rgb),0.08)] font-semibold"
                    )}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className={cn(
                      "shrink-0 text-[0.6rem] font-bold uppercase px-1.5 py-0.5 rounded",
                      t.lang === "ar" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    )}>
                      {t.lang === "ar" ? "AR" : "EN"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--bg-secondary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-h-[400px] overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-[var(--primary)]" />
          </div>
        )}
        
        {error && (
          <div className="text-center py-8">
            <p className="text-sm text-[var(--color-error)]">{error}</p>
            <button
              onClick={() => loadTafsir(selectedTafsir || defaultTafsirId)}
              className="mt-2 text-xs text-[var(--primary)] hover:underline"
            >
              {labelFor(lang, "Réessayer", "Retry", "إعادة المحاولة")}
            </button>
          </div>
        )}
        
        {!loading && !error && tafsirText && (
          <div className="prose prose-sm max-w-none">
            {lang === "fr" && (
              <p className="mb-3 text-[0.7rem] text-[var(--text-muted)] italic border-b border-[var(--border)] pb-2">
                Tafsir affiché en anglais/arabe — aucun tafsir français vérifié n'est disponible via l'API.
              </p>
            )}
            <p className="text-[var(--text-primary)] text-[0.88rem] leading-[1.75] whitespace-pre-wrap">
              {tafsirText}
            </p>
          </div>
        )}
        
        {!loading && !error && !tafsirText && (
          <div className="text-center py-8 text-[var(--text-muted)]">
            <BookOpen size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {labelFor(lang, "Sélectionnez un verset pour voir le tafsir", "Select a verse to see tafsir", "اختر آية لرؤية التفسير")}
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-secondary)]">
        <p className="text-[10px] text-[var(--text-muted)] text-center">
          {labelFor(lang, 
            "Source: Quran.com API - Tafsir gratuit", 
            "Source: Quran.com API - Free tafsir",
            "المصدر: API القرآن.קום - تفسير مجاني"
          )}
        </p>
      </div>
    </div>
  );
}
