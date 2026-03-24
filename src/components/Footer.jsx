import React from "react";
import { useApp } from "../context/AppContext";
export default function Footer() {
  const { state, dispatch, set } = useApp();
  const { lang } = state;
  const isRtl = lang === "ar";

  const t = (obj) => (lang === "ar" ? obj.ar : lang === "fr" ? obj.fr : obj.en);
  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

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

  const essentialActions = [
    {
      icon: "fa-house",
      label: t({
        fr: "Accueil",
        en: "Home",
        ar: "\u0627\u0644\u0631\u0626\u064A\u0633\u064A\u0629",
      }),
      onClick: handleHome,
    },
    {
      icon: "fa-magnifying-glass",
      label: t({ fr: "Recherche", en: "Search", ar: "\u0628\u062D\u062B" }),
      onClick: handleSearch,
    },
    {
      icon: "fa-bookmark",
      label: t({ fr: "Favoris", en: "Bookmarks", ar: "\u0625\u0634\u0627\u0631\u0627\u062A" }),
      onClick: handleBookmarks,
    },
    {
      icon: "fa-hands-praying",
      label: t({ fr: "Douas", en: "Duas", ar: "\u0627\u0644\u0623\u062F\u0639\u064A\u0629" }),
      onClick: handleDuas,
    },
    {
      icon: "fa-gear",
      label: t({
        fr: "Parametres",
        en: "Settings",
        ar: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",
      }),
      onClick: handleSettings,
    },
  ];

  return (
    <footer
      className="mp-footer mp-footer--premium-plus relative mx-auto mt-10 w-full max-w-[980px] px-3 pb-6 sm:px-5"
      role="contentinfo"
    >
      <div className="mp-footer__shell relative overflow-hidden rounded-[1.6rem] border border-[var(--theme-panel-border,var(--border))] bg-[var(--theme-panel-bg,var(--bg-card))] text-[var(--text-primary)] shadow-[0_18px_48px_rgba(2,8,23,0.14)] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--gold,#d4a820)] to-transparent" />
        <div className="pointer-events-none absolute -top-20 -left-8 h-44 w-44 rounded-full bg-[rgba(var(--primary-rgb),0.2)] blur-3xl" />
        <div className="pointer-events-none absolute -right-8 -bottom-20 h-44 w-44 rounded-full bg-[rgba(212,168,32,0.15)] blur-3xl" />

        <div className="mp-footer__verse relative border-b border-[var(--theme-panel-border,var(--border-light))] px-4 py-4 sm:px-6">
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

        <div className="mp-footer__body relative p-4 sm:p-6">
          <nav
            className="mp-footer__tool-grid grid grid-cols-2 gap-2 sm:grid-cols-5"
            aria-label={t({ fr: "Actions essentielles", en: "Essential actions", ar: "الإجراءات الأساسية" })}
          >
            {essentialActions.map((item) => (
              <button
                key={item.label}
                type="button"
                className={`rounded-2xl border border-[var(--theme-panel-border,var(--border-light))] bg-[var(--theme-panel-bg,var(--bg-card))] px-3 py-2.5 text-left transition duration-300 hover:-translate-y-0.5 hover:border-[rgba(var(--primary-rgb),0.34)] ${isRtl ? "text-right" : ""}`}
                onClick={item.onClick}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                  <i className={`fas ${item.icon} text-[var(--gold,#d4a820)]`} aria-hidden="true" />
                  {item.label}
                </span>
              </button>
            ))}
          </nav>
          <div className="mt-3 text-center text-xs text-[var(--theme-muted,var(--text-tertiary))]">
            {t({
              fr: "Le Saint Coran",
              en: "The Holy Quran",
              ar: "القرآن الكريم",
            })}
          </div>
        </div>
      </div>
    </footer>
  );
}
