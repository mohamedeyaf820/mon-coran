import { cn } from "../../lib/utils";
import { HOME_DEFERRED_SECTION_STYLE } from "./homeConstants";

/**
 * StatsStrip — bande des 4 statistiques du Coran.
 *
 * Props :
 *   lang  {string}  "fr" | "ar" | "en"
 */

const STATS = [
  {
    num: "114",
    icon: "fa-quran",
    labelFr: "Sourates",
    labelEn: "Surahs",
    labelAr: "سور",
  },
  {
    num: "30",
    icon: "fa-layer-group",
    labelFr: "Juz'",
    labelEn: "Juz",
    labelAr: "جزء",
  },
  {
    num: "6 236",
    icon: "fa-star",
    labelFr: "Versets",
    labelEn: "Ayahs",
    labelAr: "آية",
  },
  {
    num: "77 430",
    icon: "fa-font",
    labelFr: "Mots",
    labelEn: "Words",
    labelAr: "كلمة",
  },
];

export default function StatsStrip({ lang }) {
  return (
    <div
      className={cn(
        /* layout mobile : grille 2×2 */
        "max-[560px]:grid max-[560px]:grid-cols-2 max-[560px]:gap-2",
        /* layout desktop : strip horizontal */
        "flex items-center justify-between gap-3",
        /* fond + bordure */
        "bg-[var(--bg-secondary)] border border-[var(--border)]",
        /* forme */
        "rounded-[1.2rem] px-4 py-2.5",
        /* ombre + espacement */
        "shadow-[0_2px_10px_rgba(0,0,0,0.04)] mb-3",
      )}
      style={HOME_DEFERRED_SECTION_STYLE}
    >
      {STATS.map((s, i) => (
        <div
          key={s.num}
          className={cn(
            /* layout interne */
            "flex items-center gap-2 flex-1 py-1 px-2",
            /* forme + interaction */
            "rounded-xl transition-all duration-200 cursor-default",
            "hover:bg-[rgba(var(--primary-rgb),0.04)]",
            /* séparateur vertical entre items (desktop uniquement) */
            i > 0 && "border-l border-[var(--border)] max-[560px]:border-l-0",
          )}
        >
          {/* Icône */}
          <span
            className={cn(
              "w-7 h-7 flex items-center justify-center",
              "rounded-lg text-[0.75rem] flex-shrink-0",
              "bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)]",
            )}
          >
            <i className={`fas ${s.icon}`} aria-hidden="true" />
          </span>

          {/* Nombre + libellé empilés */}
          <div className="flex flex-col min-w-0">
            <span
              className={cn(
                "text-[1.05rem] font-[800] [font-family:var(--font-ui)]",
                "bg-gradient-to-br from-[var(--primary)] to-[#d4a820]",
                "bg-clip-text text-transparent",
                "leading-tight",
              )}
            >
              {s.num}
            </span>
            <span
              className={cn(
                "text-[0.6rem] font-[600] uppercase tracking-[0.06em]",
                "text-[var(--text-muted)] [font-family:var(--font-ui)]",
                "leading-tight whitespace-nowrap",
              )}
            >
              {lang === "ar"
                ? s.labelAr
                : lang === "fr"
                  ? s.labelFr
                  : s.labelEn}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
