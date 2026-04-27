import React from "react";
import { getSurah } from "../../data/surahs";
import { cn } from "../../lib/utils";

/**
 * SurahInfoPanel — Affiche les informations contextuelles de la sourate.
 * Se déclenche via un bouton "ℹ" dans le SurahHeader.
 */
export default function SurahInfoPanel({ surahNum, lang, onClose }) {
  const s = getSurah(surahNum);
  if (!s) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full max-w-md rounded-2xl overflow-hidden",
          "bg-[var(--bg-card)] border border-[var(--border)]",
          "shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header du panneau */}
        <div className="relative flex items-center justify-between p-5 border-b border-[var(--border)] bg-[radial-gradient(circle_at_50%_-30%,rgba(var(--primary-rgb),0.08),transparent_60%)]">
          <div className="flex flex-col gap-1">
            <h2 className="font-[var(--font-ui)] text-lg font-bold text-[var(--text-primary)]">
              {lang === "ar" ? s.ar : lang === "fr" ? s.fr || s.en : s.en}
            </h2>
            <p className="font-[var(--font-ui)] text-sm text-[var(--text-muted)]">
              {lang === "ar" ? s.ar : `${s.en} · ${s.ar}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors"
            aria-label="Fermer"
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Corps — infos */}
        <div className="p-5 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: "fa-hashtag",
                label:
                  lang === "fr"
                    ? "Numéro"
                    : lang === "ar"
                    ? "الرقم"
                    : "Number",
                value: surahNum,
              },
              {
                icon: "fa-star",
                label:
                  lang === "fr"
                    ? "Versets"
                    : lang === "ar"
                    ? "الآيات"
                    : "Verses",
                value: s.ayahs,
              },
              {
                icon: "fa-map-marker-alt",
                label:
                  lang === "fr"
                    ? "Révélation"
                    : lang === "ar"
                    ? "النزول"
                    : "Revelation",
                value:
                  lang === "ar"
                    ? s.type === "Meccan"
                      ? "مكية"
                      : "مدنية"
                    : lang === "fr"
                    ? s.type === "Meccan"
                      ? "Mecquoise"
                      : "Médinoise"
                    : s.type,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]"
              >
                <i
                  className={`fas ${stat.icon} text-[var(--primary)] text-sm`}
                />
                <span className="font-[var(--font-ui)] text-base font-bold text-[var(--text-primary)]">
                  {stat.value}
                </span>
                <span className="font-[var(--font-ui)] text-[0.65rem] text-[var(--text-muted)] uppercase tracking-wide text-center">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>

          {/* Nom en arabe */}
          <div className="text-center py-3 border rounded-xl border-[rgba(var(--primary-rgb),0.15)] bg-[rgba(var(--primary-rgb),0.03)]">
            <div
              className="font-[var(--font-quran)] text-3xl text-[var(--primary)] leading-loose"
              dir="rtl"
            >
              {s.ar}
            </div>
            <div className="font-[var(--font-ui)] text-xs text-[var(--text-muted)] mt-1">
              {lang === "fr"
                ? "Nom en arabe"
                : lang === "ar"
                ? "الاسم بالعربية"
                : "Arabic name"}
            </div>
          </div>

          {/* Page de début */}
          <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-secondary)]">
            <span className="font-[var(--font-ui)] text-sm text-[var(--text-secondary)]">
              {lang === "fr"
                ? "Commence à la page"
                : lang === "ar"
                ? "تبدأ من الصفحة"
                : "Starts at page"}
            </span>
            <span className="font-[var(--font-ui)] text-sm font-bold text-[var(--primary)]">
              {s.page}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl font-[var(--font-ui)] text-sm font-semibold border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors"
          >
            {lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
}
