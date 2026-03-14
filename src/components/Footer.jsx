import React from "react";
import { useApp } from "../context/AppContext";
import PlatformLogo from "./PlatformLogo";

const STARTER_SURAHS = [
  {
    n: 1,
    ar: "\u0627\u0644\u0641\u0627\u062A\u062D\u0629",
    fr: "Al-Fatiha",
    en: "The Opening",
    ayat: 7,
  },
  {
    n: 18,
    ar: "\u0627\u0644\u0643\u0647\u0641",
    fr: "Al-Kahf",
    en: "The Cave",
    ayat: 110,
  },
  {
    n: 36,
    ar: "\u064A\u0633",
    fr: "Ya-Sin",
    en: "Ya-Sin",
    ayat: 83,
  },
  {
    n: 55,
    ar: "\u0627\u0644\u0631\u062D\u0645\u0646",
    fr: "Ar-Rahman",
    en: "The Beneficent",
    ayat: 78,
  },
  {
    n: 67,
    ar: "\u0627\u0644\u0645\u0644\u0643",
    fr: "Al-Mulk",
    en: "The Sovereignty",
    ayat: 30,
  },
  {
    n: 112,
    ar: "\u0627\u0644\u0625\u062E\u0644\u0627\u0635",
    fr: "Al-Ikhlas",
    en: "Sincerity",
    ayat: 4,
  },
];

const QUICK_JUZ = [1, 18, 30];

const EXPERIENCE_PILLS = [
  {
    icon: "fa-palette",
    fr: "Tajwid colore",
    en: "Color tajweed",
    ar: "\u062A\u062C\u0648\u064A\u062F \u0645\u0644\u0648\u0646",
  },
  {
    icon: "fa-language",
    fr: "Mot a mot",
    en: "Word by word",
    ar: "\u0643\u0644\u0645\u0629 \u0628\u0643\u0644\u0645\u0629",
  },
  {
    icon: "fa-headphones",
    fr: "Audio fluide",
    en: "Smooth audio",
    ar: "\u0635\u0648\u062A \u0633\u0644\u0633",
  },
  {
    icon: "fa-repeat",
    fr: "Memorisation",
    en: "Memorization",
    ar: "\u0645\u0631\u0627\u062C\u0639\u0629",
  },
  {
    icon: "fa-bookmark",
    fr: "Favoris",
    en: "Bookmarks",
    ar: "\u0625\u0634\u0627\u0631\u0627\u062A",
  },
  {
    icon: "fa-moon",
    fr: "Themes calmes",
    en: "Calm themes",
    ar: "\u0633\u0645\u0627\u062A \u0647\u0627\u062F\u0626\u0629",
  },
];

const FOOTER_STATS = [
  {
    icon: "fa-book-open",
    value: "114",
    label: { fr: "sourates", en: "surahs", ar: "\u0633\u0648\u0631\u0629" },
  },
  {
    icon: "fa-layer-group",
    value: "30",
    label: { fr: "juz", en: "juz", ar: "\u062C\u0632\u0621" },
  },
  {
    icon: "fa-headphones",
    value: "18+",
    label: { fr: "recitateurs", en: "reciters", ar: "\u0642\u0627\u0631\u0626" },
  },
];

const ARABIC_DIGITS = [
  "\u0660",
  "\u0661",
  "\u0662",
  "\u0663",
  "\u0664",
  "\u0665",
  "\u0666",
  "\u0667",
  "\u0668",
  "\u0669",
];

const toArabicDigits = (value) =>
  String(value)
    .split("")
    .map((char) => (/[0-9]/.test(char) ? ARABIC_DIGITS[Number(char)] : char))
    .join("");

export default function Footer({ goSurah }) {
  const { state, dispatch, set } = useApp();
  const { lang } = state;
  const isRtl = lang === "ar";
  const currentYear = new Date().getFullYear();

  const t = (obj) => (lang === "ar" ? obj.ar : lang === "fr" ? obj.fr : obj.en);
  const readNum = (n) => (isRtl ? toArabicDigits(n) : n);
  const ayahWord =
    lang === "ar" ? "\u0622\u064A\u0629" : lang === "fr" ? "ayat" : "ayahs";
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleSurah = (n) => {
    if (!goSurah) return;
    goSurah(n);
    scrollTop();
  };

  const handleJuz = (juz) => {
    set({ showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
    scrollTop();
  };

  const handleDuas = () => {
    set({ showHome: false, showDuas: true });
    scrollTop();
  };

  const handleHome = () => {
    set({ showHome: true, showDuas: false });
    scrollTop();
  };

  const handleSearch = () => dispatch({ type: "TOGGLE_SEARCH" });
  const handleSettings = () => dispatch({ type: "TOGGLE_SETTINGS" });
  const handleBookmarks = () => dispatch({ type: "TOGGLE_BOOKMARKS" });

  const utilityItems = [
    {
      icon: "fa-house",
      label: t({
        fr: "Accueil",
        en: "Home",
        ar: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
      }),
      hint: t({
        fr: "Retour dashboard",
        en: "Back to dashboard",
        ar: "\u0627\u0644\u0639\u0648\u062F\u0629 \u0644\u0644\u0648\u0627\u062C\u0647\u0629",
      }),
      onClick: handleHome,
    },
    {
      icon: "fa-magnifying-glass",
      label: t({ fr: "Recherche", en: "Search", ar: "\u0628\u062D\u062B" }),
      hint: t({
        fr: "Trouver vite",
        en: "Find quickly",
        ar: "\u0648\u0635\u0648\u0644 \u0633\u0631\u064A\u0639",
      }),
      onClick: handleSearch,
    },
    {
      icon: "fa-bookmark",
      label: t({ fr: "Favoris", en: "Bookmarks", ar: "\u0625\u0634\u0627\u0631\u0627\u062A" }),
      hint: t({
        fr: "Reprendre lecture",
        en: "Resume reading",
        ar: "\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0642\u0631\u0627\u0621\u0629",
      }),
      onClick: handleBookmarks,
    },
    {
      icon: "fa-hands-praying",
      label: t({ fr: "Douas", en: "Duas", ar: "\u0627\u0644\u0623\u062F\u0639\u064A\u0629" }),
      hint: t({
        fr: "Invocations",
        en: "Supplications",
        ar: "\u0623\u0630\u0643\u0627\u0631 \u0648\u062F\u0639\u0627\u0621",
      }),
      onClick: handleDuas,
    },
    {
      icon: "fa-gear",
      label: t({
        fr: "Parametres",
        en: "Settings",
        ar: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
      }),
      hint: t({
        fr: "Personnaliser",
        en: "Customize",
        ar: "\u062A\u062E\u0635\u064A\u0635",
      }),
      onClick: handleSettings,
    },
  ];

  const bottomLinks = [
    { label: "Al-Fatiha", onClick: () => handleSurah(1) },
    { label: "Ya-Sin", onClick: () => handleSurah(36) },
    { label: "Al-Mulk", onClick: () => handleSurah(67) },
    {
      label: t({ fr: "Douas", en: "Duas", ar: "\u0627\u0644\u0623\u062F\u0639\u064A\u0629" }),
      onClick: handleDuas,
    },
    {
      label: t({ fr: "Recherche", en: "Search", ar: "\u0628\u062D\u062B" }),
      onClick: handleSearch,
    },
  ];

  return (
    <footer
      className="mp-footer relative mx-auto mt-10 w-full max-w-[1640px] px-3 pb-6 sm:px-5 lg:px-7"
      role="contentinfo"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--theme-panel-border,var(--border))] bg-[var(--theme-panel-bg,var(--bg-card))] text-[var(--text-primary)] shadow-[0_20px_60px_rgba(2,8,23,0.16)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold,#d4a820)] to-transparent" />
        <div className="pointer-events-none absolute -top-20 -left-8 h-44 w-44 rounded-full bg-[rgba(var(--primary-rgb),0.2)] blur-3xl" />
        <div className="pointer-events-none absolute -right-8 -bottom-20 h-44 w-44 rounded-full bg-[rgba(212,168,32,0.15)] blur-3xl" />

        <div className="relative border-b border-[var(--theme-panel-border,var(--border-light))] px-4 py-4 sm:px-7">
          <div
            className={`flex flex-wrap items-center gap-3 ${isRtl ? "sm:flex-row-reverse sm:text-right" : "sm:text-left"}`}
          >
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--theme-chip-border,rgba(var(--primary-rgb),0.2))] bg-[var(--theme-chip-bg,rgba(var(--primary-rgb),0.12))] text-[var(--gold,#d4a820)]"
              aria-hidden="true"
            >
              <i className="fas fa-star-and-crescent text-xs" />
            </span>
            <p
              className="min-w-0 flex-1 truncate text-[1.16rem] leading-relaxed text-[var(--text-primary)] [font-family:var(--font-quran,serif)]"
              dir="rtl"
              lang="ar"
            >
              {"\u0648\u064E\u0645\u064E\u0627 \u062E\u064E\u0644\u064E\u0642\u0652\u062A\u064F \u0627\u0644\u0652\u062C\u0650\u0646\u0651\u064E \u0648\u064E\u0627\u0644\u0652\u0625\u0650\u0646\u0633\u064E \u0625\u0650\u0644\u0651\u064E\u0627 \u0644\u0650\u064A\u064E\u0639\u0652\u0628\u064F\u062F\u064F\u0648\u0646\u0650"}
            </p>
            <span className="rounded-full border border-[var(--theme-chip-border,rgba(var(--primary-rgb),0.2))] bg-[var(--theme-chip-bg,rgba(var(--primary-rgb),0.1))] px-3 py-1 text-xs font-semibold tracking-wide text-[var(--theme-muted,var(--text-tertiary))]">
              {t({
                fr: "Sourate Adh-Dhariyat - 51:56",
                en: "Surat Adh-Dhariyat - 51:56",
                ar: "\u0633\u0648\u0631\u0629 \u0627\u0644\u0630\u0627\u0631\u064A\u0627\u062A - \u0665\u0661:\u0665\u0666",
              })}
            </span>
          </div>
        </div>

        <div className="relative grid gap-4 p-4 sm:p-7 lg:grid-cols-12">
          <section className="rounded-3xl border border-[var(--theme-panel-border,var(--border-light))] bg-[var(--theme-panel-bg-strong,var(--bg-secondary))] p-4 sm:p-5 lg:col-span-5">
            <button
              type="button"
              className={`group flex w-full items-start gap-3 rounded-2xl border border-[var(--theme-panel-border,var(--border-light))] bg-[var(--theme-panel-bg,var(--bg-card))] p-3 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--primary-rgb),0.35)] ${isRtl ? "flex-row-reverse text-right" : ""}`}
              onClick={handleHome}
              title="MushafPlus"
              aria-label="MushafPlus home"
            >
              <PlatformLogo className="shrink-0" imgClassName="h-11 w-11 rounded-xl" decorative />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[1.24rem] font-extrabold tracking-tight text-[var(--text-primary)]">
                  MushafPlus
                </span>
                <span className="text-sm text-[var(--theme-muted,var(--text-tertiary))]">
                  {t({
                    fr: "Lecture claire, ecoute fluide, memorisation guidee",
                    en: "Clear reading, smooth listening, guided memorization",
                    ar: "\u0642\u0631\u0627\u0621\u0629 \u0648\u0627\u0636\u062D\u0629 \u0648\u0627\u0633\u062A\u0645\u0627\u0639 \u0633\u0644\u0633 \u0648\u0645\u0631\u0627\u062C\u0639\u0629 \u0645\u0648\u062C\u0647\u0629",
                  })}
                </span>
              </span>
            </button>

            <p className="mt-4 text-sm leading-relaxed text-[var(--theme-muted,var(--text-tertiary))]">
              {t({
                fr: "Le footer est recentre sur le principal: reprendre vite, trouver les pages utiles et continuer sans distraction.",
                en: "The footer is now focused on what matters: resume quickly, find useful pages and continue without distraction.",
                ar: "\u0627\u0644\u062A\u0630\u064A\u064A\u0644 \u0623\u0635\u0628\u062D \u0645\u0631\u0643\u0632\u0627 \u0639\u0644\u0649 \u0627\u0644\u0645\u0647\u0645: \u0627\u0644\u0639\u0648\u062F\u0629 \u0627\u0644\u0633\u0631\u064A\u0639\u0629 \u0648\u0648\u0635\u0648\u0644 \u0623\u0633\u0647\u0644 \u0648\u0645\u0648\u0627\u0635\u0644\u0629 \u0628\u062F\u0648\u0646 \u062A\u0634\u062A\u064A\u062A.",
              })}
            </p>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {FOOTER_STATS.map((stat) => (
                <div
                  key={stat.icon}
                  className="rounded-2xl border border-[var(--theme-panel-border,var(--border-light))] bg-[var(--theme-panel-bg,var(--bg-card))] px-3 py-2"
                >
                  <span className="inline-flex items-center gap-2 text-[var(--gold,#d4a820)]">
                    <i className={`fas ${stat.icon}`} aria-hidden="true" />
                    <strong className="text-sm text-[var(--text-primary)]">{stat.value}</strong>
                  </span>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-[var(--theme-muted,var(--text-tertiary))]">
                    {t(stat.label)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {EXPERIENCE_PILLS.map((feature) => (
                <span
                  key={feature.icon}
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--theme-chip-border,rgba(var(--primary-rgb),0.2))] bg-[var(--theme-chip-bg,rgba(var(--primary-rgb),0.08))] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)]"
                >
                  <i className={`fas ${feature.icon} text-[var(--gold,#d4a820)]`} aria-hidden="true" />
                  {t(feature)}
                </span>
              ))}
            </div>
          </section>

          <section className="grid gap-4 lg:col-span-7 xl:grid-cols-2">
            <div className="rounded-3xl border border-[var(--theme-panel-border,var(--border-light))] bg-[var(--theme-panel-bg-strong,var(--bg-secondary))] p-4">
              <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-[var(--theme-muted,var(--text-tertiary))]">
                <span className="inline-block h-4 w-0.5 rounded bg-[var(--gold,#d4a820)]" aria-hidden="true" />
                {t({
                  fr: "Commencer",
                  en: "Start reading",
                  ar: "\u0627\u0628\u062F\u0623 \u0627\u0644\u0642\u0631\u0627\u0621\u0629",
                })}
              </h3>
              <p className="mt-2 text-sm text-[var(--theme-muted,var(--text-tertiary))]">
                {t({
                  fr: "Les sourates les plus utiles pour reprendre en douceur.",
                  en: "Helpful surahs to jump back in smoothly.",
                  ar: "\u0633\u0648\u0631 \u0646\u0627\u0641\u0639\u0629 \u0644\u0644\u0639\u0648\u062F\u0629 \u0628\u0633\u0631\u0639\u0629 \u0648\u0647\u062F\u0648\u0621.",
                })}
              </p>

              <div className="mt-4 grid gap-2">
                {STARTER_SURAHS.map((surah) => (
                  <button
                    key={surah.n}
                    type="button"
                    className={`group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-[var(--theme-panel-border,var(--border-light))] bg-[var(--theme-panel-bg,var(--bg-card))] px-3 py-2.5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--primary-rgb),0.34)] ${isRtl ? "text-right" : ""}`}
                    onClick={() => handleSurah(surah.n)}
                  >
                    <span className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-[var(--theme-chip-bg,rgba(var(--primary-rgb),0.12))] px-2 text-xs font-bold text-[var(--primary)]">
                      {readNum(surah.n)}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[var(--text-primary)]">
                        {lang === "ar" ? surah.ar : lang === "fr" ? surah.fr : surah.en}
                      </span>
                      <span className="block text-xs text-[var(--theme-muted,var(--text-tertiary))]">
                        {surah.ayat} {ayahWord}
                      </span>
                    </span>
                    <span
                      className="truncate text-[1.1rem] text-[var(--gold,#d4a820)] [font-family:var(--font-quran,serif)]"
                      dir="rtl"
                      lang="ar"
                    >
                      {surah.ar}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--theme-panel-border,var(--border-light))] bg-[var(--theme-panel-bg-strong,var(--bg-secondary))] p-4">
              <h3 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-[var(--theme-muted,var(--text-tertiary))]">
                <span className="inline-block h-4 w-0.5 rounded bg-[var(--gold,#d4a820)]" aria-hidden="true" />
                {t({
                  fr: "Acces rapide",
                  en: "Quick tools",
                  ar: "\u0648\u0635\u0648\u0644 \u0633\u0631\u064A\u0639",
                })}
              </h3>
              <p className="mt-2 text-sm text-[var(--theme-muted,var(--text-tertiary))]">
                {t({
                  fr: "Navigation utile sans la barre d'actions encombrante.",
                  en: "Useful navigation without the cluttered floating action bar.",
                  ar: "\u062A\u0646\u0642\u0644 \u0639\u0645\u0644\u064A \u0628\u062F\u0648\u0646 \u0627\u0644\u0634\u0631\u064A\u0637 \u0627\u0644\u0645\u0632\u062F\u062D\u0645.",
                })}
              </p>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {utilityItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    className={`rounded-2xl border border-[var(--theme-panel-border,var(--border-light))] bg-[var(--theme-panel-bg,var(--bg-card))] px-3 py-2 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--primary-rgb),0.34)] ${isRtl ? "text-right" : ""}`}
                    onClick={item.onClick}
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <i className={`fas ${item.icon} text-[var(--gold,#d4a820)]`} aria-hidden="true" />
                      {item.label}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--theme-muted,var(--text-tertiary))]">
                      {item.hint}
                    </span>
                  </button>
                ))}
              </div>

              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--theme-muted,var(--text-tertiary))]">
                  {t({
                    fr: "Raccourcis juz",
                    en: "Juz shortcuts",
                    ar: "\u0627\u062E\u062A\u0635\u0627\u0631\u0627\u062A \u0627\u0644\u062C\u0632\u0621",
                  })}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {QUICK_JUZ.map((juz) => (
                    <button
                      key={juz}
                      type="button"
                      className="rounded-xl border border-[var(--theme-chip-border,rgba(var(--primary-rgb),0.2))] bg-[var(--theme-chip-bg,rgba(var(--primary-rgb),0.1))] px-2 py-2 text-sm font-bold text-[var(--primary)] transition duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--primary-rgb),0.4)]"
                      onClick={() => handleJuz(juz)}
                    >
                      Juz {readNum(juz)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="relative border-t border-[var(--theme-panel-border,var(--border-light))] px-4 py-4 sm:px-7">
          <div className={`flex flex-wrap items-center gap-3 ${isRtl ? "sm:flex-row-reverse" : ""}`}>
            <div className={`min-w-0 flex-1 ${isRtl ? "text-right" : ""}`}>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {lang === "ar"
                  ? `\u00A9 ${currentYear} \u0645\u0635\u062D\u0641 \u0628\u0644\u0633`
                  : `\u00A9 ${currentYear} MushafPlus`}
              </p>
              <p className="text-xs text-[var(--theme-muted,var(--text-tertiary))]">
                {t({
                  fr: "Hafs - Warsh - Tajwid - Audio - Mot a mot",
                  en: "Hafs - Warsh - Tajweed - Audio - Word by word",
                  ar: "\u062D\u0641\u0635 - \u0648\u0631\u0634 - \u062A\u062C\u0648\u064A\u062F - \u0635\u0648\u062A - \u0643\u0644\u0645\u0629 \u0628\u0643\u0644\u0645\u0629",
                })}
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-2" aria-label="Quick links">
              {bottomLinks.map((link) => (
                <button
                  key={link.label}
                  type="button"
                  className="rounded-full border border-[var(--theme-chip-border,rgba(var(--primary-rgb),0.2))] bg-[var(--theme-chip-bg,rgba(var(--primary-rgb),0.1))] px-3 py-1.5 text-xs font-semibold text-[var(--text-secondary)] transition duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--primary-rgb),0.38)] hover:text-[var(--text-primary)]"
                  onClick={link.onClick}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            <span
              className="ml-auto text-[1.25rem] text-[var(--gold,#d4a820)]"
              aria-hidden="true"
              dir="rtl"
              lang="ar"
            >
              {"\uFDFD"}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
