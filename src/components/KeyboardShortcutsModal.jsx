import React from "react";

const SHORTCUTS = [
  {
    keys: ["Ctrl", "K"],
    desc: { fr: "Rechercher", en: "Search", ar: "بحث" },
  },
  {
    keys: ["/"],
    desc: { fr: "Rechercher", en: "Search", ar: "بحث" },
  },
  {
    keys: ["Ctrl", ","],
    desc: { fr: "Paramètres", en: "Settings", ar: "الإعدادات" },
  },
  {
    keys: ["Ctrl", "B"],
    desc: { fr: "Favoris", en: "Bookmarks", ar: "المفضلة" },
  },
  {
    keys: ["Alt", "←"],
    desc: {
      fr: "Sourate précédente",
      en: "Previous surah",
      ar: "السورة السابقة",
    },
  },
  {
    keys: ["Alt", "→"],
    desc: {
      fr: "Sourate suivante",
      en: "Next surah",
      ar: "السورة التالية",
    },
  },
  {
    keys: ["Alt", "↑"],
    desc: {
      fr: "Page / Juz précédent(e)",
      en: "Previous page / juz",
      ar: "الصفحة / الجزء السابق",
    },
  },
  {
    keys: ["Alt", "↓"],
    desc: {
      fr: "Page / Juz suivant(e)",
      en: "Next page / juz",
      ar: "الصفحة / الجزء التالي",
    },
  },
  {
    keys: ["Espace"],
    desc: { fr: "Lecture / Pause", en: "Play / Pause", ar: "تشغيل / إيقاف" },
  },
  {
    keys: ["Alt", "M"],
    desc: {
      fr: "Mode mémorisation",
      en: "Memorization mode",
      ar: "وضع الحفظ",
    },
  },
  {
    keys: ["H"],
    desc: {
      fr: "Aller à l'accueil",
      en: "Go home",
      ar: "الصفحة الرئيسية",
    },
  },
  {
    keys: ["Échap"],
    desc: {
      fr: "Fermer le panneau actif",
      en: "Close active panel",
      ar: "إغلاق اللوحة الحالية",
    },
  },
  {
    keys: ["?"],
    desc: {
      fr: "Aide raccourcis clavier",
      en: "Keyboard shortcut help",
      ar: "مساعدة اختصارات لوحة المفاتيح",
    },
  },
];

/**
 * KeyboardShortcutsModal
 *
 * Props :
 *   lang     {string}    "fr" | "ar" | "en"
 *   onClose  {function}  ferme la modale
 */
export default function KeyboardShortcutsModal({ lang, onClose }) {
  const isRtl = lang === "ar";

  const title =
    lang === "fr"
      ? "Raccourcis clavier"
      : lang === "ar"
        ? "اختصارات لوحة المفاتيح"
        : "Keyboard shortcuts";

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div
        className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border)] p-6 max-h-[90dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-[var(--text)] font-[var(--font-ui)] flex items-center gap-2">
            <i className="fas fa-keyboard text-[var(--primary)]" />
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)] transition-colors"
            aria-label={
              lang === "fr"
                ? "Fermer"
                : lang === "ar"
                  ? "إغلاق"
                  : "Close"
            }
          >
            <i className="fas fa-times text-sm" />
          </button>
        </div>

        {/* Tableau des raccourcis */}
        <div className="space-y-1">
          {SHORTCUTS.map((shortcut, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0"
            >
              {/* Description */}
              <span className="text-sm text-[var(--text-secondary)] font-[var(--font-ui)]">
                {shortcut.desc[lang] ?? shortcut.desc.fr}
              </span>

              {/* Touches */}
              <div
                className={`flex items-center gap-1 ${isRtl ? "mr-3" : "ml-3"} shrink-0`}
              >
                {shortcut.keys.map((key, j) => (
                  <React.Fragment key={j}>
                    <kbd className="px-2 py-0.5 text-xs font-mono bg-[var(--bg-secondary)] border border-[var(--border)] rounded text-[var(--text)] shadow-sm leading-5">
                      {key}
                    </kbd>
                    {j < shortcut.keys.length - 1 && (
                      <span className="text-[var(--text-muted)] text-xs select-none">
                        +
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Pied : conseil d'utilisation */}
        <p className="mt-5 text-xs text-[var(--text-muted)] font-[var(--font-ui)] text-center">
          {lang === "fr"
            ? "Les raccourcis sont désactivés quand un champ de saisie est actif."
            : lang === "ar"
              ? "تُعطَّل الاختصارات عند تفعيل حقل إدخال النص."
              : "Shortcuts are disabled when a text input is focused."}
        </p>
      </div>
    </div>
  );
}
