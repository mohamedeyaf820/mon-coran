import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  BookOpen,
  ExternalLink,
  Languages,
  RefreshCw,
  X,
  Info,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { getSurah } from "../data/surahs";
import {
  getQuranComVerseUrl,
  getVerseTafsir,
  getVerseTranslation,
} from "../services/quranComStudyService";
import { cn } from "../lib/utils";

const TAFSIR_OPTIONS = [
  {
    key: "en-kathir",
    id: 169,
    name: "Ibn Kathir",
    lang: "en",
    langBadge: "EN",
    labelFr: "Ibn Kathir",
    labelEn: "Ibn Kathir",
    labelAr: "ابن كثير",
  },
  {
    key: "ar-kathir",
    id: 14,
    name: "Ibn Kathir",
    lang: "ar",
    langBadge: "AR",
    labelFr: "Ibn Kathir",
    labelEn: "Ibn Kathir",
    labelAr: "ابن كثير",
  },
  {
    key: "ar-muyassar",
    id: 16,
    name: "Al-Muyassar",
    lang: "ar",
    langBadge: "AR",
    labelFr: "Al-Muyassar",
    labelEn: "Al-Muyassar",
    labelAr: "التفسير الميسر",
  },
  {
    key: "ar-saadi",
    id: 91,
    name: "Al-Saadi",
    lang: "ar",
    langBadge: "AR",
    labelFr: "Al-Saadi",
    labelEn: "Al-Saadi",
    labelAr: "تفسير السعدي",
  },
  {
    key: "en-maarif",
    id: 168,
    name: "Ma'arif al-Qur'an",
    lang: "en",
    langBadge: "EN",
    labelFr: "Ma'arif al-Qur'an",
    labelEn: "Ma'arif al-Qur'an",
    labelAr: "معارف القرآن",
  },
];

function label(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

function getTafsirLabel(option, lang) {
  const name =
    lang === "ar"
      ? option.labelAr
      : lang === "fr"
        ? option.labelFr
        : option.labelEn;
  return `${name} [${option.langBadge}]`;
}

export default function TafsirSidebar() {
  const { state, set } = useApp();
  const { lang, tafsirSidebarVerse } = state;
  const closeButtonRef = useRef(null);
  const sidebarRef = useRef(null);

  const defaultTafsirKey = lang === "ar" ? "ar-muyassar" : "en-kathir";
  const [selectedTafsirKey, setSelectedTafsirKey] = useState(defaultTafsirKey);
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
  const [showTranslation, setShowTranslation] = useState(true);
  const [retryToken, setRetryToken] = useState(0);

  const verse = tafsirSidebarVerse || {};
  const surahNumber = Number(verse.surah);
  const ayahNumber = Number(verse.ayah);
  const surahInfo = useMemo(() => getSurah(surahNumber), [surahNumber]);
  const selectedOption =
    TAFSIR_OPTIONS.find((o) => o.key === selectedTafsirKey) ||
    TAFSIR_OPTIONS[0];
  const isArabicTafsir = selectedOption.lang === "ar";
  const quranComUrl = getQuranComVerseUrl(surahNumber, ayahNumber);

  useEffect(() => {
    setSelectedTafsirKey(lang === "ar" ? "ar-muyassar" : "en-kathir");
    setShowTranslation(lang !== "ar");
  }, [lang]);

  useEffect(() => {
    closeButtonRef.current?.focus?.();
  }, []);

  // Fetch tafsir
  useEffect(() => {
    if (!surahNumber || !ayahNumber) return undefined;
    const controller = new AbortController();
    setTafsirState({ status: "loading", data: null, error: null });
    getVerseTafsir({
      surah: surahNumber,
      ayah: ayahNumber,
      lang,
      tafsirId: selectedTafsirKey,
      signal: controller.signal,
    })
      .then((data) => setTafsirState({ status: "ready", data, error: null }))
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
            ),
        });
      });
    return () => controller.abort();
  }, [ayahNumber, lang, retryToken, selectedTafsirKey, surahNumber]);

  // Fetch French translation (always shown for fr/en users)
  useEffect(() => {
    if (!surahNumber || !ayahNumber || lang === "ar") {
      setTranslationState({ status: "idle", data: null, error: null });
      return undefined;
    }
    const controller = new AbortController();
    setTranslationState({ status: "loading", data: null, error: null });
    getVerseTranslation({
      surah: surahNumber,
      ayah: ayahNumber,
      lang: lang === "en" ? "en" : "fr",
      signal: controller.signal,
    })
      .then((data) =>
        setTranslationState({ status: "ready", data, error: null }),
      )
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setTranslationState({
          status: "error",
          data: null,
          error: error?.message,
        });
      });
    return () => controller.abort();
  }, [ayahNumber, lang, surahNumber]);

  const closeSidebar = () =>
    set({ tafsirSidebarOpen: false, tafsirSidebarVerse: null });
  const retry = () => setRetryToken((v) => v + 1);

  const surahDisplayName = surahInfo
    ? lang === "ar"
      ? surahInfo.ar
      : lang === "fr"
        ? surahInfo.fr || surahInfo.en
        : surahInfo.en
    : `${surahNumber}`;

  return (
    <Dialog.Root
      open
      onOpenChange={(o) => {
        if (!o) closeSidebar();
      }}
    >
      <Dialog.Portal>
        {/* Backdrop semi-transparent cliquable pour fermer */}
        <Dialog.Overlay
          className="fixed inset-0 z-[389] bg-black/30 backdrop-blur-[2px]"
          onClick={closeSidebar}
        />
        {/* Panel latéral avec asChild pour garder l'<aside> */}
        <Dialog.Content
          asChild
          aria-labelledby="tafsir-sidebar-title"
          onEscapeKeyDown={closeSidebar}
          onInteractOutside={closeSidebar}
        >
            <Dialog.Title className="sr-only">Dialog</Dialog.Title>
          <aside
            ref={sidebarRef}
            className="fixed inset-y-0 right-0 z-[390] flex w-full max-w-[min(100vw,34rem)] flex-col border-l border-[color-mix(in_srgb,var(--theme-border)_70%,transparent_30%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_96%,#ffffff_4%)] text-[color-mix(in_srgb,var(--theme-text)_92%,#ffffff_8%)] shadow-[-28px_0_70px_rgba(3,10,18,0.34)] backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="mb-1 flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--theme-primary)_72%,var(--theme-text)_28%)]">
                  <BookOpen size={15} />
                  Tafsir
                </p>
                <h2
                  id="tafsir-sidebar-title"
                  className="truncate text-lg font-black leading-tight"
                >
                  {surahDisplayName} {surahNumber}:{ayahNumber}
                </h2>
                <p className="mt-1 text-sm text-[color-mix(in_srgb,var(--theme-text-muted)_88%,var(--theme-bg)_12%)]">
                  {label(
                    lang,
                    "Explication du verset",
                    "Verse explanation",
                    "تفسير الآية",
                  )}
                </p>
              </div>
              <button
                type="button"
                ref={closeButtonRef}
                onClick={closeSidebar}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_80%,transparent_20%)] text-[color-mix(in_srgb,var(--theme-text)_82%,var(--theme-bg)_18%)] transition hover:border-[color-mix(in_srgb,var(--theme-primary)_44%,transparent_56%)] hover:text-[color-mix(in_srgb,var(--theme-text)_96%,#ffffff_4%)]"
                aria-label={label(lang, "Fermer", "Close", "إغلاق")}
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {/* Tafsir source selector */}
              <section className="mb-4 rounded-2xl border border-[color-mix(in_srgb,var(--theme-border)_56%,transparent_44%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_78%,transparent_22%)] p-3">
                <label
                  htmlFor="tafsir-source-select"
                  className="mb-2 block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--theme-primary)_72%,var(--theme-text)_28%)]"
                >
                  {label(
                    lang,
                    "Source du tafsir",
                    "Tafsir source",
                    "مصدر التفسير",
                  )}
                </label>
                <select
                  id="tafsir-source-select"
                  value={selectedTafsirKey}
                  onChange={(e) => setSelectedTafsirKey(e.target.value)}
                  className="w-full rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_88%,transparent_12%)] px-3 py-2 text-sm font-semibold outline-none focus:border-[color-mix(in_srgb,var(--theme-primary)_52%,transparent_48%)] focus:ring-2 focus:ring-[rgba(var(--theme-primary-rgb),0.16)]"
                >
                  {TAFSIR_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>
                      {getTafsirLabel(opt, lang)}
                    </option>
                  ))}
                </select>
                {lang !== "ar" && (
                  <div className="mt-2 flex items-start gap-1.5 text-[0.7rem] text-[color-mix(in_srgb,var(--theme-text-muted)_80%,var(--theme-text)_20%)]">
                    <Languages size={12} className="mt-0.5 shrink-0" />
                    <span>
                      {selectedOption.lang === "en"
                        ? label(
                            lang,
                            "Ce tafsir est affiché en anglais. Sélectionnez une source [AR] pour lire en arabe.",
                            "This tafsir is shown in English. Select an [AR] source to read in Arabic.",
                          )
                        : label(
                            lang,
                            "Ce tafsir est affiché en arabe.",
                            "This tafsir is shown in Arabic.",
                          )}
                    </span>
                  </div>
                )}
              </section>

              {/* French/English translation of the verse (shown for fr/en users) */}
              {lang !== "ar" ? (
                <section className="mb-4 rounded-2xl border border-[color-mix(in_srgb,var(--theme-border)_56%,transparent_44%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_72%,transparent_28%)] p-3">
                  <button
                    type="button"
                    onClick={() => setShowTranslation((v) => !v)}
                    aria-expanded={showTranslation}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-black">
                      <Languages size={17} />
                      {label(lang, "Traduction française", "Translation")}
                    </span>
                    <span className="text-xs font-bold text-[color-mix(in_srgb,var(--theme-primary)_72%,var(--theme-text)_28%)]">
                      {showTranslation
                        ? label(lang, "Masquer", "Hide")
                        : label(lang, "Afficher", "Show")}
                    </span>
                  </button>
                  {showTranslation ? (
                    <div className="mt-3 text-sm leading-7 text-[color-mix(in_srgb,var(--theme-text)_88%,var(--theme-bg)_12%)]">
                      {translationState.status === "loading" ? (
                        <span className="inline-flex items-center gap-2">
                          <RefreshCw size={14} className="animate-spin" />
                          {label(lang, "Chargement...", "Loading...")}
                        </span>
                      ) : translationState.status === "error" ? (
                        <span className="text-rose-300">
                          {translationState.error ||
                            label(
                              lang,
                              "Traduction indisponible.",
                              "Translation unavailable.",
                            )}
                        </span>
                      ) : (
                        translationState.data?.text ||
                        label(
                          lang,
                          "Traduction indisponible.",
                          "Translation unavailable.",
                        )
                      )}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {/* Tafsir content */}
              <section className="rounded-3xl border border-[color-mix(in_srgb,var(--theme-border)_58%,transparent_42%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_76%,transparent_24%)] p-4">
                {tafsirState.status === "loading" ? (
                  <div className="flex min-h-[14rem] items-center justify-center">
                    <div className="flex items-center gap-3 text-sm font-semibold text-[color-mix(in_srgb,var(--theme-text-muted)_88%,var(--theme-bg)_12%)]">
                      <RefreshCw size={17} className="animate-spin" />
                      {label(
                        lang,
                        "Chargement du tafsir...",
                        "Loading tafsir...",
                        "جاري التحميل...",
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
                      className="inline-flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--theme-primary)_48%,transparent_52%)] bg-[rgba(var(--theme-primary-rgb),0.14)] px-3 py-2 text-sm font-bold"
                    >
                      <RefreshCw size={15} />
                      {label(lang, "Réessayer", "Retry", "أعد المحاولة")}
                    </button>
                  </div>
                ) : tafsirState.data?.text ? (
                  <>
                    {/* Language badge */}
                    <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--theme-primary)_28%,transparent_72%)] bg-[rgba(var(--theme-primary-rgb),0.08)] px-2.5 py-1 text-[0.68rem] font-bold text-[color-mix(in_srgb,var(--theme-primary)_80%,var(--theme-text)_20%)]">
                      <BookOpen size={11} />
                      {getTafsirLabel(selectedOption, lang)}
                    </div>
                    <article
                      dir={isArabicTafsir ? "rtl" : "ltr"}
                      lang={
                        isArabicTafsir
                          ? "ar"
                          : tafsirState.data.language || "en"
                      }
                      className={cn(
                        "whitespace-pre-wrap text-[0.96rem] leading-8 text-[color-mix(in_srgb,var(--theme-text)_92%,#ffffff_8%)]",
                        isArabicTafsir &&
                          "text-right text-[1.08rem] leading-10",
                      )}
                    >
                      {tafsirState.data.text}
                    </article>
                  </>
                ) : (
                  <div className="flex min-h-[14rem] items-center justify-center text-sm text-[color-mix(in_srgb,var(--theme-text-muted)_88%,var(--theme-bg)_12%)]">
                    {label(
                      lang,
                      "Aucune donnée disponible.",
                      "No data available.",
                      "لا توجد بيانات.",
                    )}
                  </div>
                )}
              </section>
            </div>

            {/* Footer */}
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
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
