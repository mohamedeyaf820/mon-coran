import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  AlertCircle,
  BookOpen,
  Flag,
  Languages,
  RefreshCw,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { getSurah } from "../data/surahs";
import {
  getVerseTafsir,
  getVerseTranslation,
} from "../services/quranComStudyService";
import {
  FRENCH_TAFSIR_EDITION_ID,
  getFrenchTafsirAttribution,
} from "../services/frenchTafsirService";
import { cn } from "../lib/utils";
import { t } from "../i18n";
import siteConfig from "../../site.config.json";

const TAFSIR_OPTIONS = [
  {
    key: FRENCH_TAFSIR_EDITION_ID,
    id: 259,
    name: "Al-Mukhtasar",
    lang: "fr",
    langBadge: "FR",
    local: true,
    labelFr: "Al-Mukhtasar",
    labelEn: "Al-Mukhtasar",
    labelAr: "المختصر في التفسير",
  },
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
    key: "ar-tabari",
    id: 15,
    name: "Al-Tabari",
    lang: "ar",
    langBadge: "AR",
    labelFr: "Al-Tabari",
    labelEn: "Al-Tabari",
    labelAr: "\u0627\u0644\u0637\u0628\u0631\u064a",
    qiraat: true,
  },
  {
    key: "ar-qurtubi",
    id: 90,
    name: "Al-Qurtubi",
    lang: "ar",
    langBadge: "AR",
    labelFr: "Al-Qurtubi",
    labelEn: "Al-Qurtubi",
    labelAr: "\u0627\u0644\u0642\u0631\u0637\u0628\u064a",
    qiraat: true,
  },
  {
    key: "ar-baghawi",
    id: 94,
    name: "Al-Baghawi",
    lang: "ar",
    langBadge: "AR",
    labelFr: "Al-Baghawi",
    labelEn: "Al-Baghawi",
    labelAr: "\u0627\u0644\u0628\u063a\u0648\u064a",
    qiraat: true,
  },
  {
    // Al-Wasit by Tantawi was already routable in quranComStudyService but was
    // never listed here, so no reader could actually select it. It carries no
    // `qiraat` flag on purpose: that badge is an explicit claim that the text
    // cites the reciters and readings, and it has not been measured for Wasit.
    // Flagging it unverified would overstate the source to the reader.
    key: "ar-wasit",
    id: 93,
    name: "Al-Wasit (Tantawi)",
    lang: "ar",
    langBadge: "AR",
    labelFr: "Al-Wasit (Tantawi)",
    labelEn: "Al-Wasit (Tantawi)",
    labelAr: "الوسيط",
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

// Grouped by the language each tafsir is written in. French leads for a French
// reader: it is the only corpus in their own language and it is the default.
// Within Arabic, the readings-aware sources sort first — a Warsh reader is
// looking for them. The `qiraat` flag is measured over 1:5, 2:189, 5:6 and
// 36:52: Al-Tabari, Al-Qurtubi and Al-Baghawi cite the reciters and readings
// while Al-Muyassar and Al-Saadi never do.
const GROUP_LABEL_KEYS = { fr: "groupFrench", ar: "groupArabic", en: "groupEnglish" };
const TAFSIR_GROUPS = ["fr", "ar", "en"]
  .map((code) => ({
    code,
    labelKey: `tafsir.${GROUP_LABEL_KEYS[code]}`,
    options: TAFSIR_OPTIONS.filter((o) => o.lang === code).sort(
      (a, b) => Number(Boolean(b.qiraat)) - Number(Boolean(a.qiraat)),
    ),
  }))
  .filter((group) => group.options.length);

function getTafsirLabel(option, lang) {
  const name =
    lang === "ar"
      ? option.labelAr
      : lang === "fr"
        ? option.labelFr
        : option.labelEn;
  const badge = option.qiraat
    ? ` \u00b7 ${t("tafsir.qiraatBadge", lang)}`
    : "";
  return `${name} [${option.langBadge}]${badge}`;
}

// A French reader defaults to the vendored French commentary; everyone else to
// the English Ibn Kathir, an Arabic reader to Al-Muyassar.
function defaultTafsirKeyFor(lang) {
  if (lang === "ar") return "ar-muyassar";
  if (lang === "fr") return FRENCH_TAFSIR_EDITION_ID;
  return "en-kathir";
}

export default function TafsirSidebar() {
  const { state, set } = useApp();
  const { lang, riwaya, tafsirSidebarVerse } = state;
  const closeButtonRef = useRef(null);
  const sidebarRef = useRef(null);

  const [selectedTafsirKey, setSelectedTafsirKey] = useState(() =>
    defaultTafsirKeyFor(lang),
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
  const [showTranslation, setShowTranslation] = useState(true);
  const [retryToken, setRetryToken] = useState(0);
  const [attribution, setAttribution] = useState(null);

  useEffect(() => {
    let active = true;
    getFrenchTafsirAttribution()
      .then((data) => {
        if (active) setAttribution(data);
      })
      .catch(() => {
        // The attribution is a footer nicety; its absence must not hide the tafsir.
      });
    return () => {
      active = false;
    };
  }, []);

  const verse = tafsirSidebarVerse || {};
  const surahNumber = Number(verse.surah);
  const ayahNumber = Number(verse.ayah);
  // `ayah` is the Hafs coordinate every tafsir resource is keyed on. In Warsh
  // the title quotes the number shown in the reader.
  const displayAyahNumber = Number(verse.displayAyah) || ayahNumber;
  const surahInfo = useMemo(() => getSurah(surahNumber), [surahNumber]);
  const selectedOption =
    TAFSIR_OPTIONS.find((o) => o.key === selectedTafsirKey) ||
    TAFSIR_OPTIONS[0];
  const displayedOption =
    TAFSIR_OPTIONS.find((o) => o.key === tafsirState.data?.tafsirId) ||
    selectedOption;
  const isArabicTafsir = displayedOption.lang === "ar";
  const displayedIsFrench =
    tafsirState.data?.tafsirId === FRENCH_TAFSIR_EDITION_ID;

  // The report affordance reuses the app's existing GitHub-issue flow (the same
  // one the Legal page drives), prefilled with the exact verse and source so a
  // content error is traceable. No data leaves the device until the reader sends
  // the issue.
  const reportUrl = useMemo(() => {
    const repository = String(siteConfig.repositoryUrl || "").replace(/\/$/, "");
    if (!repository) return null;
    const url = new URL(`${repository}/issues/new`);
    const reference = `${surahNumber}:${displayAyahNumber}`;
    url.searchParams.set(
      "title",
      `[Tafsir] ${getTafsirLabel(displayedOption, lang)} ${reference}`,
    );
    url.searchParams.set(
      "body",
      [
        "## Signalement d'une erreur de tafsir",
        "",
        `- **Référence :** ${reference}`,
        `- **Source :** ${displayedOption.name}`,
        ...(displayedIsFrench && attribution?.source?.version
          ? [`- **Jeu de données :** ${attribution.source.owner} ${attribution.source.slug} v${attribution.source.version}`]
          : []),
        `- **Version :** ${siteConfig.version}`,
        "",
        "## Description de l'erreur",
        "",
        "",
      ].join("\n"),
    );
    return url.toString();
  }, [
    attribution,
    displayAyahNumber,
    displayedIsFrench,
    displayedOption,
    lang,
    surahNumber,
  ]);

  useEffect(() => {
    // Only reset tafsir key if the current selection is no longer valid for this lang;
    // preserve user's explicit choice otherwise.
    const currentOption = TAFSIR_OPTIONS.find((o) => o.key === selectedTafsirKey);
    if (!currentOption) {
      setSelectedTafsirKey(defaultTafsirKeyFor(lang));
    }
    setShowTranslation(lang !== "ar");
  }, [lang, selectedTafsirKey]);

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
          // The raw message is an English transport error ("Failed to fetch"),
          // which reads as a crash and tells an Arabic reader nothing.
          error: t(
            typeof navigator !== "undefined" && navigator.onLine === false
              ? "tafsir.offline"
              : "tafsir.loadError",
            lang,
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
        />
        {/* Panel latéral avec asChild pour garder l'<aside> */}
        <Dialog.Content
          asChild
          aria-labelledby="tafsir-sidebar-title"
          onEscapeKeyDown={closeSidebar}
          onInteractOutside={(e) => { e.preventDefault(); closeSidebar(); }}
        >
          <aside
            ref={sidebarRef}
            className="fixed inset-y-0 right-0 z-[390] flex w-full max-w-[min(100vw,34rem)] flex-col border-l border-[color-mix(in_srgb,var(--theme-border)_70%,transparent_30%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_96%,#ffffff_4%)] text-[color-mix(in_srgb,var(--theme-text)_92%,#ffffff_8%)] shadow-[-28px_0_70px_rgba(3,10,18,0.34)] backdrop-blur-2xl"
          >
            <Dialog.Title className="sr-only">
              {t("tafsir.title", lang)}
            </Dialog.Title>
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="mb-1 flex items-center gap-2 text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--theme-primary)_72%,var(--theme-text)_28%)]">
                  <BookOpen size={15} />
                  {t("tafsir.title", lang)}
                </p>
                <h2
                  id="tafsir-sidebar-title"
                  className="truncate text-lg font-black leading-tight"
                >
                  {surahDisplayName} {surahNumber}:{displayAyahNumber}
                </h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                  {t("tafsir.subtitle", lang)}
                </p>
              </div>
              <button
                type="button"
                ref={closeButtonRef}
                onClick={closeSidebar}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_80%,transparent_20%)] text-[color-mix(in_srgb,var(--theme-text)_82%,var(--theme-bg)_18%)] transition hover:border-[color-mix(in_srgb,var(--theme-primary)_44%,transparent_56%)] hover:text-[color-mix(in_srgb,var(--theme-text)_96%,#ffffff_4%)]"
                aria-label={t("common.close", lang)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              {/* Tafsir source selector */}
              <section className="mb-4 rounded-lg border border-[color-mix(in_srgb,var(--theme-border)_56%,transparent_44%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_78%,transparent_22%)] p-3">
                <label
                  htmlFor="tafsir-source-select"
                  className="mb-2 block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-[color-mix(in_srgb,var(--theme-primary)_72%,var(--theme-text)_28%)]"
                >
                  {t("tafsir.sourceLabel", lang)}
                </label>
                <select
                  id="tafsir-source-select"
                  value={selectedTafsirKey}
                  onChange={(e) => setSelectedTafsirKey(e.target.value)}
                  style={{ appearance: "auto", backgroundImage: "none" }}
                  className="min-h-11 w-full rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_88%,transparent_12%)] px-3 py-2 text-sm font-semibold outline-none focus:border-[color-mix(in_srgb,var(--theme-primary)_52%,transparent_48%)] focus:ring-2 focus:ring-[rgba(var(--theme-primary-rgb),0.16)]"
                >
                  {TAFSIR_GROUPS.map((group) => (
                    <optgroup key={group.code} label={t(group.labelKey, lang)}>
                      {group.options.map((opt) => (
                        <option key={opt.key} value={opt.key}>
                          {getTafsirLabel(opt, lang)}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {displayedOption.lang !== lang && (
                  <div className="mt-2 flex items-start gap-1.5 text-[0.7rem] text-[color-mix(in_srgb,var(--theme-text-muted)_80%,var(--theme-text)_20%)]">
                    <Languages size={12} className="mt-0.5 shrink-0" />
                    <span>
                      {tafsirState.data?.note ||
                        (displayedOption.lang === "en"
                          ? t("tafsir.shownInEnglish", lang)
                          : displayedOption.lang === "ar"
                            ? t("tafsir.shownInArabic", lang)
                            : t("tafsir.shownInFrench", lang))}
                    </span>
                  </div>
                )}
                {riwaya === "warsh" && (
                  <div className="mt-2 flex items-start gap-1.5 text-[0.7rem] text-[color-mix(in_srgb,var(--theme-text-muted)_80%,var(--theme-text)_20%)]">
                    <BookOpen size={12} className="mt-0.5 shrink-0" />
                    <span>{t("tafsir.warshHint", lang)}</span>
                  </div>
                )}
              </section>

              {/* French/English translation of the verse (shown for fr/en users) */}
              {lang !== "ar" ? (
                <section className="mb-4 rounded-lg border border-[color-mix(in_srgb,var(--theme-border)_56%,transparent_44%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_72%,transparent_28%)] p-3">
                  <button
                    type="button"
                    onClick={() => setShowTranslation((v) => !v)}
                    aria-expanded={showTranslation}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <span className="inline-flex items-center gap-2 text-sm font-black">
                      <Languages size={17} />
                      {t("tafsir.translationLabel", lang)}
                    </span>
                    <span className="text-xs font-bold text-[color-mix(in_srgb,var(--theme-primary)_72%,var(--theme-text)_28%)]">
                      {showTranslation
                        ? t("tafsir.hide", lang)
                        : t("tafsir.show", lang)}
                    </span>
                  </button>
                  {showTranslation ? (
                    <div className="mt-3 text-sm leading-7 text-[color-mix(in_srgb,var(--theme-text)_88%,var(--theme-bg)_12%)]">
                      {translationState.status === "loading" ? (
                        <span className="inline-flex items-center gap-2">
                          <RefreshCw size={14} className="animate-spin" />
                          {t("tafsir.loading", lang)}
                        </span>
                      ) : translationState.status === "error" ? (
                        <span className="tafsir-error-text">
                          {translationState.error ||
                            t("tafsir.translationUnavailable", lang)}
                        </span>
                      ) : (
                        translationState.data?.text ||
                        t("tafsir.translationUnavailable", lang)
                      )}
                    </div>
                  ) : null}
                </section>
              ) : null}

              {/* Tafsir content */}
              <section className="rounded-lg border border-[color-mix(in_srgb,var(--theme-border)_58%,transparent_42%)] bg-[color-mix(in_srgb,var(--theme-panel-bg)_76%,transparent_24%)] p-4">
                {tafsirState.status === "loading" ? (
                  <div className="flex min-h-[14rem] items-center justify-center">
                    <div className="flex items-center gap-3 text-sm font-semibold text-[var(--text-secondary)]">
                      <RefreshCw size={17} className="animate-spin" />
                      {t("tafsir.loadingTafsir", lang)}
                    </div>
                  </div>
                ) : tafsirState.status === "error" ? (
                  <div className="flex min-h-[14rem] flex-col items-center justify-center gap-3 text-center">
                    <AlertCircle className="tafsir-error-text" size={28} />
                    <p className="text-sm text-[color-mix(in_srgb,var(--theme-text)_86%,var(--theme-bg)_14%)]">
                      {tafsirState.error}
                    </p>
                    <button
                      type="button"
                      onClick={retry}
                      className="inline-flex items-center gap-2 rounded-xl border border-[color-mix(in_srgb,var(--theme-primary)_48%,transparent_52%)] bg-[rgba(var(--theme-primary-rgb),0.14)] px-3 py-2 text-sm font-bold"
                    >
                      <RefreshCw size={15} />
                      {t("tafsir.retry", lang)}
                    </button>
                  </div>
                ) : tafsirState.data?.text ? (
                  <>
                    {/* Language badge */}
                    <div className="mb-3 flex flex-wrap items-center gap-2 text-[0.68rem]">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--theme-primary)_28%,transparent_72%)] bg-[rgba(var(--theme-primary-rgb),0.08)] px-2.5 py-1 font-bold text-[color-mix(in_srgb,var(--theme-primary)_80%,var(--theme-text)_20%)]">
                        <BookOpen size={11} />
                        {getTafsirLabel(displayedOption, lang)}
                        {tafsirState.data.cached
                          ? ` - ${t("tafsir.offlineBadge", lang)}`
                          : ""}
                      </span>
                      <span className="text-[var(--text-secondary)]">
                        {displayedIsFrench ? "QuranEnc.com" : "Quran.com"}
                      </span>
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
                    {displayedIsFrench ? (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[color-mix(in_srgb,var(--theme-border)_52%,transparent_48%)] pt-3 text-[0.7rem] text-[color-mix(in_srgb,var(--theme-text-muted)_82%,var(--theme-text)_18%)]">
                        <span className="min-w-0 flex-1">
                          {attribution?.attribution ||
                            t("tafsir.frenchAttribution", lang)}
                        </span>
                        {reportUrl ? (
                          <a
                            href={reportUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl border border-[color-mix(in_srgb,var(--theme-primary)_44%,transparent_56%)] px-3 font-bold text-[color-mix(in_srgb,var(--theme-primary)_76%,var(--theme-text)_24%)]"
                          >
                            <Flag size={13} />
                            {t("tafsir.reportError", lang)}
                          </a>
                        ) : null}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="flex min-h-[14rem] items-center justify-center text-sm text-[var(--text-secondary)]">
                    {t("tafsir.noData", lang)}
                  </div>
                )}
              </section>
            </div>

          </aside>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
