import React from "react";
import { t } from "../../i18n";

/**
 * AyahSkeleton — placeholder animé affiché pendant le chargement des versets.
 * Ressemble à la structure d'un AyahBlock (texte arabe + traduction éventuelle).
 */
function SkeletonLine({ width = "100%", height = "1rem", className = "" }) {
  return (
    <div
      className={`skeleton-line animate-pulse rounded-md bg-[var(--bg-secondary)] ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

function AyahSkeletonCard({ showTranslation = false, index = 0 }) {
  // Varier la largeur des lignes pour un effet réaliste
  const lineWidths = ["95%", "88%", "92%", "78%", "85%"];
  const arabicWidth = lineWidths[index % lineWidths.length];

  return (
    <div
      className="qc-list-card skeleton-card rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-5 mb-3"
      aria-hidden="true"
    >
      {/* Numéro de verset */}
      <div className="mb-3 flex items-center justify-between">
        <SkeletonLine width="var(--space-8, 2rem)" height="var(--space-8, 2rem)" className="rounded-full" />
        <div className="flex gap-2">
          <SkeletonLine width="var(--space-8, 2rem)" height="var(--space-8, 2rem)" className="rounded-lg" />
          <SkeletonLine width="var(--space-8, 2rem)" height="var(--space-8, 2rem)" className="rounded-lg" />
        </div>
      </div>

      {/* Texte arabe — 2-3 lignes */}
      <div className="mb-4 space-y-3 text-right" dir="rtl">
        <SkeletonLine width={arabicWidth} height="var(--ts-2xl, 2.2rem)" className="rounded-lg ml-auto" />
        <SkeletonLine width="82%" height="var(--ts-2xl, 2.2rem)" className="rounded-lg ml-auto" />
        {index % 3 === 0 && (
          <SkeletonLine width="60%" height="var(--ts-2xl, 2.2rem)" className="rounded-lg ml-auto" />
        )}
      </div>

      {/* Traduction (optionnelle) */}
      {showTranslation && (
        <div className="space-y-2 border-t border-[var(--border)] pt-3">
          <SkeletonLine width="96%" height="var(--ts-xs, 0.75rem)" />
          <SkeletonLine width="78%" height="var(--ts-xs, 0.75rem)" />
          <SkeletonLine width="88%" height="var(--ts-xs, 0.75rem)" />
        </div>
      )}
    </div>
  );
}

export default function AyahSkeleton({
  count = 5,
  showTranslation = false,
  className = "",
  lang = "fr",
}) {
  return (
    <div
      className={`ayah-skeleton-list ${className}`}
      role="status"
      aria-label={t("quran.loading", lang)}
      aria-live="polite"
      aria-busy="true"
    >
      <span className="sr-only">{t("quran.loadingAria", lang)}</span>
      {Array.from({ length: count }, (_, i) => (
        <AyahSkeletonCard key={i} index={i} showTranslation={showTranslation} />
      ))}
    </div>
  );
}
