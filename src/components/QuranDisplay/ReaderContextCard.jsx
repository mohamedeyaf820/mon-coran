import React from "react";
import { BookOpen, Layers3, Star } from "lucide-react";

export default function ReaderContextCard({
  kind = "page",
  label,
  value,
  numericValue,
  total,
  secondary,
  riwaya,
}) {
  const Icon = kind === "juz" ? Layers3 : BookOpen;
  const progress = Math.max(
    0,
    Math.min(100, (Number(numericValue ?? value) / Number(total || 1)) * 100),
  );
  const isWarsh = riwaya === "warsh";

  return (
    <section
      className="reader-context-card flex items-center justify-between gap-3 px-3.5 py-2 transition-colors"
      aria-label={`${label} ${value} / ${total}`}
      style={{ "--reader-context-progress": `${progress}%` }}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="reader-context-card__icon flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)]" aria-hidden="true">
          <Icon size={14} strokeWidth={2} />
        </div>

        <div className="reader-context-card__copy min-w-0">
          <div className="reader-context-card__title-row flex items-baseline gap-2 whitespace-nowrap">
            <h2 className="text-xs font-semibold text-[var(--text-secondary)] whitespace-nowrap">
              {label} <strong className="text-sm font-bold text-[var(--primary)]">{value}</strong>
              <span className="text-[0.72rem] opacity-75 font-normal"> / {total}</span>
            </h2>
            {secondary ? (
              <span className="text-[0.72rem] font-medium text-[var(--text-muted)] whitespace-nowrap">
                <span aria-hidden="true" className="opacity-50">·</span> {secondary}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={`reader-context-card__riwaya inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold tracking-wider uppercase ${
            isWarsh
              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/25"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
          }`}
        >
          {isWarsh ? <Star size={9} fill="currentColor" aria-hidden="true" /> : null}
          {isWarsh ? "WARSH" : "HAFS"}
        </span>
      </div>

      <span className="reader-context-card__progress absolute bottom-0 left-0 h-[2px] w-full bg-[rgba(var(--primary-rgb),0.1)] overflow-hidden" aria-hidden="true">
        <span
          className="block h-full bg-gradient-to-r from-[var(--primary)] to-amber-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </span>
    </section>
  );
}
