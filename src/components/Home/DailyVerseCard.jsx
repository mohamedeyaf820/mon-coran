import { cn } from "../../lib/utils";

/**
 * DailyVerseCard — Carte "Verset du Jour".
 *
 * Props :
 *   lang               {string}   "fr" | "ar" | "en"
 *   isRtl              {boolean}
 *   now                {Date}
 *   dailyVerse         {object}   { text, ref, trans_fr }
 *   vodSurahNum        {number|null}
 *   goSurah            {function}
 *   shouldReduceHomeFx {boolean}
 *   t                  {function}
 */
export default function DailyVerseCard({
  lang,
  isRtl,
  now,
  dailyVerse,
  vodSurahNum,
  goSurah,
  shouldReduceHomeFx,
  t,
}) {
  return (
    <div
      className={cn(
        /* structure */
        "relative overflow-hidden rounded-[1.2rem]",
        /* bordure */
        "border border-[var(--border)]",
        /* espacement */
        "p-4",
        /* fond teinté primary à 5 % */
        "bg-[color-mix(in_srgb,var(--bg-secondary)_95%,var(--primary)_5%)]",
        /* ombre */
        "shadow-[0_4px_16px_rgba(0,0,0,0.05)]",
        /* transitions */
        "transition-all duration-300",
        /* hover */
        "hover:scale-[1.01] hover:shadow-[0_6px_20px_rgba(var(--primary-rgb),0.12)]",
      )}
    >
      {/* ── Orbe décoratif (désactivé en mode perf réduit) ── */}
      {!shouldReduceHomeFx && (
        <div
          className={cn(
            "pointer-events-none",
            "absolute -top-8 right-4 w-24 h-24",
            "rounded-full blur-2xl",
            "bg-[var(--primary)] opacity-10",
            "motion-safe:animate-pulse [animation-duration:8s]",
          )}
          aria-hidden="true"
        />
      )}

      {/* ── En-tête : label + date ── */}
      <div className="relative z-10 flex items-center justify-between mb-3">
        <span
          className={cn(
            "inline-flex items-center gap-1.5",
            "text-[0.62rem] font-[800] text-[var(--primary)]",
            "uppercase tracking-[0.1em] [font-family:var(--font-ui)]",
            "border border-[rgba(var(--primary-rgb),0.25)]",
            "bg-[rgba(var(--primary-rgb),0.08)]",
            "px-[0.6rem] py-[0.25rem] rounded-full",
          )}
        >
          <i className="fas fa-star-and-crescent" aria-hidden="true" />
          {t("verseOfDay")}
        </span>

        <span className="text-[0.62rem] text-[var(--text-muted)] [font-family:var(--font-ui)]">
          {now.toLocaleDateString(
            lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
            { day: "numeric", month: "short" },
          )}
        </span>
      </div>

      {/* ── Texte arabe ── */}
      <p
        className={cn(
          "relative z-10",
          "text-[1.45rem] leading-[1.95]",
          "[font-family:var(--font-quran,'Scheherazade_New',serif)]",
          "text-[var(--text-quran)]",
          "my-2 text-right",
          /* mobile */
          "max-[520px]:text-[1.2rem] max-[520px]:leading-[1.8]",
        )}
        dir="rtl"
      >
        {dailyVerse.text}
      </p>

      {/* ── Traduction (français uniquement) ── */}
      {lang === "fr" && dailyVerse.trans_fr && (
        <p
          className={cn(
            "relative z-10",
            "text-[0.85rem] leading-relaxed",
            "text-[var(--text-secondary)] [font-family:var(--font-ui)]",
            "italic mt-1",
            "line-clamp-3",
          )}
        >
          {dailyVerse.trans_fr}
        </p>
      )}

      {/* ── Référence ── */}
      <span
        className={cn(
          "relative z-10 block",
          "text-[0.68rem] font-[700]",
          "text-[var(--primary)] [font-family:var(--font-ui)]",
          "uppercase tracking-[0.08em] mt-2",
        )}
      >
        {dailyVerse.ref}
      </span>

      {/* ── Bouton "Lire la sourate" ── */}
      {vodSurahNum && (
        <button
          type="button"
          className={cn(
            "relative z-10 inline-flex items-center gap-2 mt-3",
            "text-[0.75rem] font-[700] [font-family:var(--font-ui)]",
            "text-[var(--primary)]",
            "border border-[rgba(var(--primary-rgb),0.3)]",
            "bg-[rgba(var(--primary-rgb),0.06)]",
            "px-[0.875rem] py-2 rounded-xl",
            "transition-all duration-300",
            "hover:-translate-y-0.5 hover:bg-[rgba(var(--primary-rgb),0.12)]",
          )}
          onClick={() => goSurah(vodSurahNum)}
        >
          <i className="fas fa-book-open" aria-hidden="true" />
          {lang === "fr"
            ? "Lire la sourate"
            : lang === "ar"
              ? "اقرأ السورة"
              : "Read surah"}
          <i
            className={`fas fa-arrow-${isRtl ? "left" : "right"}`}
            aria-hidden="true"
          />
        </button>
      )}
    </div>
  );
}
