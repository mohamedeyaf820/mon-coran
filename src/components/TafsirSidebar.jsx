import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  ExternalLink,
  Languages,
  RefreshCw,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { getSurah } from "../data/surahs";
import {
  getAvailableTafsirs,
  getQuranComVerseUrl,
  getVerseTafsir,
  getVerseTranslation,
} from "../services/quranComStudyService";
import { cn } from "../lib/utils";

const DEFAULT_TAFSIR_BY_LANG = {
  ar: "ar-muyassar",
  fr: "en-kathir",
  en: "en-kathir",
};

function label(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

function getSourceName(source, lang) {
  if (!source) return "";
  return lang === "fr" ? source.nameFr || source.name : source.name;
}

export default function TafsirSidebar() {
  const { state, set } = useApp();
  const { lang, tafsirSidebarVerse } = state;
  const closeButtonRef = useRef(null);
  const [selectedTafsirId, setSelectedTafsirId] = useState(
    DEFAULT_TAFSIR_BY_LANG[lang] || DEFAULT_TAFSIR_BY_LANG.en,
  );
  const [tafsirState, setTafsirState] = useState({
    status: "idle",
    data: null,
    error: null,
  });
  const [translationState, setTranslationState] = useState({
    status: "idle",
    data: null,
    error: null,
  });
  const [showTranslation, setShowTranslation] = useState(lang === "fr");
  const [retryToken, setRetryToken] = useState(0);

  const verse = tafsirSidebarVerse || {};
  const surahNumber = Number(verse.surah);
  const ayahNumber = Number(verse.ayah);
  const surahInfo = useMemo(() => getSurah(surahNumber), [surahNumber]);
  const tafsirOptions = useMemo(() => getAvailableTafsirs(), []);
  const selectedSource = tafsirOptions.find(
    (item) => item.id === selectedTafsirId,
  );
  const isArabicTafsir = selectedSource?.lang === "ar";
  const quranComUrl = getQuranComVerseUrl(surahNumber, ayahNumber);

  useEffect(() => {
    setSelectedTafsirId(DEFAULT_TAFSIR_BY_LANG[lang] || DEFAULT_TAFSIR_BY_LANG.en);
    setShowTranslation(lang === "fr");
  }, [lang]);

  useEffect(() => {
    closeButtonRef.current?.focus?.();
  }, []);

  useEffect(() => {
    if (!surahNumber || !ayahNumber) return undefined;

    const controller = new AbortController();
    setTafsirState({ status: "loading", data: null, error: null });

    getVerseTafsir({
      surah: surahNumber,
      ayah: ayahNumber,
      lang,
      tafsirId: selectedTafsirId,
      signal: controller.signal,
    })
      .then((data) => {
        setTafsirState({ status: "ready", data, error: null });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setTafsirState({
          status: "error",
          data: null,
          error:
            error?.message ||
            label(
              lang,
              "Impossible de charger le tafsir.",
              "Unable to load tafsir.",
              "Unable to load tafsir.",
            ),
        });
      });

    return () => controller.abort();
  }, [ayahNumber, lang, retryToken, selectedTafsirId, surahNumber]);

  useEffect(() => {
    if (!surahNumber || !ayahNumber || lang !== "fr") {
      setTranslationState({ status: "idle", data: null, error: null });
      return undefined;
    }

    const controller = new AbortController();
    setTranslationState({ status: "loading", data: null, error: null });

    getVerseTranslation({
      surah: surahNumber,
      ayah: ayahNumber,
      lang: "fr",
      signal: controller.signal,
    })
      .then((data) => {
        setTranslationState({ status: "ready", data, error: null });
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setTranslationState({
          status: "error",
          data: null,
          error: error?.message || "Traduction indisponible.",
        });
      });

    return () => controller.abort();
  }, [ayahNumber, lang, surahNumber]);

  const closeSidebar = () => {
    set({ tafsirSidebarOpen: false, tafsirSidebarVerse: null });
  };

  const retry = () => {
    setRetryToken((value) => value + 1);
  };

  return (
    <aside
      className="fixed inset-y-0 right-0 z-[390] flex w-full max-w-[min(100vw,34rem)] flex-col border-l border-[color-mix(in_srgb,var(--theme-border)_70%,transparent_30%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_96%,#ffffff_4%)] text-[color-mix(in_srgb,var(--theme-text)_92%,#ffffff_8%)] shadow-[-28px_0_70px_rgba(3,10,18,0.34)] backdrop-blur-2xl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tafsir-sidebar-title"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] px-4 py-4 sm:px-5">
        <div className="min-w-0">
          <p className="mb-1 flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--theme-primary)_72%,var(--theme-text)_28%)]">
            <BookOpen size={15} />
            {label(lang, "Tafsir", "Tafsir", "Tafsir")}
          </p>
          <h2
            id="tafsir-sidebar-title"
            className="truncate text-lg font-black leading-tight"
          >
            {surahInfo
              ? `${lang === "fr" ? surahInfo.fr : surahInfo.en} ${surahNumber}:${ayahNumber}`
              : `${surahNumber}:${ayahNumber}`}
          </h2>
          <p className="mt-1 text-sm text-[color-mix(in_srgb,var(--theme-text-muted)_88%,var(--theme-bg)_12%)]">
            {label(
              lang,
              "Explication du verset",
              "Verse explanation",
              "Verse explanation",
            )}
          </p>
        </div>
        <button
          type="button"
          ref={closeButtonRef}
          onClick={closeSidebar}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_80%,transparent_20%)] text-[color-mix(in_srgb,var(--theme-text)_82%,var(--theme-bg)_18%)] transition hover:border-[color-mix(in_srgb,var(--theme-primary)_44%,transparent_56%)] hover:text-[color-mix(in_srgb,var(--theme-text)_96%,#ffffff_4%)]"
          aria-label={label(lang, "Fermer", "Close", "Close")}
        >
          <X size={18} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
        <section className="mb-4 rounded-2xl border border-[color-mix(in_srgb,var(--theme-border)_56%,transparent_44%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_78%,transparent_22%)] p-3">
          <label
            htmlFor="tafsir-source-select"
            className="mb-2 block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--theme-primary)_72%,var(--theme-text)_28%)]"
          >
            {label(lang, "Source du tafsir", "Tafsir source", "Tafsir source")}
          </label>
          <select
            id="tafsir-source-select"
            value={selectedTafsirId}
            onChange={(event) => setSelectedTafsirId(event.target.value)}
            className="w-full rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_88%,transparent_12%)] px-3 py-2 text-sm font-semibold outline-none focus:border-[color-mix(in_srgb,var(--theme-primary)_52%,transparent_48%)] focus:ring-2 focus:ring-[rgba(var(--theme-primary-rgb),0.16)]"
          >
            {tafsirOptions.map((source) => (
              <option key={source.id} value={source.id}>
                {getSourceName(source, lang)}
              </option>
            ))}
          </select>
        </section>

        {lang === "fr" && selectedSource?.lang !== "fr" ? (
          <div className="mb-4 flex gap-2 rounded-2xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm leading-relaxed text-[color-mix(in_srgb,var(--theme-text)_88%,#fff2cf_12%)]">
            <AlertCircle size={17} className="mt-0.5 shrink-0 text-amber-300" />
            <p>
              Quran.com ne propose pas de tafsir fiable en francais pour cette
              source. Le commentaire est affiche dans sa langue d'origine.
            </p>
          </div>
        ) : null}

        <section className="rounded-3xl border border-[color-mix(in_srgb,var(--theme-border)_58%,transparent_42%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_76%,transparent_24%)] p-4">
          {tafsirState.status === "loading" ? (
            <div className="flex min-h-[14rem] items-center justify-center">
              <div className="flex items-center gap-3 text-sm font-semibold text-[color-mix(in_srgb,var(--theme-text-muted)_88%,var(--theme-bg)_12%)]">
                <RefreshCw size={17} className="animate-spin" />
                {label(
                  lang,
                  "Chargement du tafsir...",
                  "Loading tafsir...",
                  "Loading tafsir...",
                )}
              </div>
            </div>
          ) : tafsirState.status === "error" ? (
            <div className="flex min-h-[14rem] flex-col items-center justify-center gap-3 text-center">
              <AlertCircle className="text-rose-300" size={28} />
              <p className="text-sm text-[color-mix(in_srgb,var(--theme-text)_86%,var(--theme-bg)_14%)]">
                {tafsirState.error}
              </p>
              <button
                type="button"
                onClick={retry}
                className="inline-flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--theme-primary)_48%,transparent_52%)] bg-[rgba(var(--theme-primary-rgb),0.14)] px-3 py-2 text-sm font-bold text-[color-mix(in_srgb,var(--theme-text)_94%,#ffffff_6%)]"
              >
                <RefreshCw size={15} />
                {label(lang, "Reessayer", "Retry", "Retry")}
              </button>
            </div>
          ) : tafsirState.data?.text ? (
            <article
              dir={isArabicTafsir ? "rtl" : "ltr"}
              lang={isArabicTafsir ? "ar" : tafsirState.data.language || "en"}
              className={cn(
                "whitespace-pre-wrap text-[0.96rem] leading-8 text-[color-mix(in_srgb,var(--theme-text)_92%,#ffffff_8%)]",
                isArabicTafsir && "text-right text-[1.08rem] leading-10",
              )}
            >
              {tafsirState.data.text}
            </article>
          ) : (
            <div className="flex min-h-[14rem] items-center justify-center text-sm text-[color-mix(in_srgb,var(--theme-text-muted)_88%,var(--theme-bg)_12%)]">
              {label(
                lang,
                "Aucune donnee disponible.",
                "No data available.",
                "No data available.",
              )}
            </div>
          )}
        </section>

        {lang === "fr" ? (
          <section className="mt-4 rounded-3xl border border-[color-mix(in_srgb,var(--theme-border)_58%,transparent_42%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_72%,transparent_28%)] p-4">
            <button
              type="button"
              onClick={() => setShowTranslation((value) => !value)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <span className="inline-flex items-center gap-2 text-sm font-black">
                <Languages size={17} />
                Traduction francaise du verset
              </span>
              <span className="text-xs font-bold text-[color-mix(in_srgb,var(--theme-primary)_72%,var(--theme-text)_28%)]">
                {showTranslation ? "Masquer" : "Afficher"}
              </span>
            </button>

            {showTranslation ? (
              <div className="mt-3 text-sm leading-7 text-[color-mix(in_srgb,var(--theme-text)_88%,var(--theme-bg)_12%)]">
                {translationState.status === "loading" ? (
                  <span className="inline-flex items-center gap-2">
                    <RefreshCw size={14} className="animate-spin" />
                    Chargement...
                  </span>
                ) : translationState.status === "error" ? (
                  <span className="text-rose-200">
                    {translationState.error || "Traduction indisponible."}
                  </span>
                ) : (
                  translationState.data?.text || "Traduction indisponible."
                )}
              </div>
            ) : null}
          </section>
        ) : null}
      </div>

      <div className="border-t border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] px-4 py-3 sm:px-5">
        <a
          href={quranComUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[color-mix(in_srgb,var(--theme-border)_58%,transparent_42%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_78%,transparent_22%)] px-3 py-2 text-sm font-bold transition hover:border-[color-mix(in_srgb,var(--theme-primary)_46%,transparent_54%)]"
        >
          <ExternalLink size={16} />
          Quran.com {surahNumber}:{ayahNumber}
        </a>
      </div>
    </aside>
  );
}
