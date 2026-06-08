import React from "react";
import { getReciterVisual } from "../../data/reciters";
import { cn } from "../../lib/utils";

const COVER_SIZE_CLASSES = {
  40: "w-10 h-10",
  42: "w-[42px] h-[42px]",
  52: "w-[52px] h-[52px]",
};

const WAVE_HEIGHT_CLASSES = [
  "h-[22%]",
  "h-[26.62%]",
  "h-[31.23%]",
  "h-[35.85%]",
  "h-[40.46%]",
  "h-[45.08%]",
  "h-[49.69%]",
  "h-[54.31%]",
  "h-[58.92%]",
  "h-[63.54%]",
  "h-[68.15%]",
  "h-[72.77%]",
  "h-[77.38%]",
];

export function ProgressRail({ progress, className = "", showThumb = false }) {
  const pct = Math.max(0, Math.min(100, progress * 100));

  return (
    <div className={cn("h-full w-full", className)}>
      <svg
        viewBox="0 0 100 4"
        preserveAspectRatio="none"
        className="block h-full w-full overflow-visible"
      >
        <rect
          x="0"
          y="0"
          width="100"
          height="4"
          rx="2"
          className="fill-white/10"
        />
        <rect
          x="0"
          y="0"
          width={pct}
          height="4"
          rx="2"
          fill="var(--theme-primary, var(--gold))"
        />
        {showThumb && (
          <circle
            cx={pct}
            cy="2"
            r="1.7"
            fill="#fff7da"
            stroke="rgba(18,31,25,0.32)"
            strokeWidth="0.8"
          />
        )}
      </svg>
    </div>
  );
}

export function Waveform({ isPlaying, progress }) {
  const COUNT = 32;
  return (
    <div className="flex h-8 w-full items-end justify-center gap-0.5 rounded-xl border border-white/10 bg-white/[0.05] px-2 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      {Array.from({ length: COUNT }).map((_, i) => {
        const pct = i / COUNT;
        const filled = pct <= progress;
        const seedIndex = (i * 7 + 3) % 13;
        return (
          <div
            key={i}
            className={cn(
              "min-w-[2px] flex-1 rounded-full origin-bottom",
              WAVE_HEIGHT_CLASSES[seedIndex],
              filled
                ? "bg-gradient-to-b from-[var(--gold-bright)] to-[var(--gold)]"
                : "bg-white/12",
              isPlaying && "animate-pulse",
            )}
          />
        );
      })}
    </div>
  );
}

export function CoverArt({ isPlaying, size = 52, reciter }) {
  const visual = getReciterVisual(reciter);
  return (
    <div
      className={cn(
        "audio-cover-art relative overflow-hidden rounded-xl shrink-0 bg-[linear-gradient(135deg,var(--theme-primary)_0%,color-mix(in_srgb,var(--theme-primary)_78%,var(--theme-bg)_22%)_58%,color-mix(in_srgb,var(--theme-primary)_62%,var(--theme-bg)_38%)_100%)]",
        COVER_SIZE_CLASSES[size] || COVER_SIZE_CLASSES[52],
        isPlaying
          ? "shadow-[0_2px_12px_rgba(184,134,11,0.35)]"
          : "shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
      )}
    >
      {visual.photo ? (
        <img
          src={visual.photo}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          aria-hidden="true"
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center text-white"
          style={{ backgroundColor: visual.avatar.color }}
          aria-hidden="true"
        >
          <span
            className={cn(
              "font-black tracking-normal",
              size === 40 ? "text-sm" : "text-lg",
            )}
          >
            {visual.avatar.initials}
          </span>
        </div>
      )}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.38))]" />
      {isPlaying && (
        <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--gold-bright)] shadow-[0_0_6px_var(--gold)] animate-pulse" />
      )}
    </div>
  );
}

export function ReciterAvatar({ reciter, active = false, loading = false }) {
  const visual = getReciterVisual(reciter);
  return (
    <span
      className={cn(
        "relative mt-0.5 inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-xl border text-[0.68rem] font-black",
        active
          ? "border-[rgba(122,188,210,0.48)] bg-[rgba(122,188,210,0.24)] text-white"
          : "border-white/10 bg-white/[0.08] text-white",
      )}
    >
      {visual.photo ? (
        <img
          src={visual.photo}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          aria-hidden="true"
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center"
          style={{ backgroundColor: visual.avatar.color }}
          aria-hidden="true"
        >
          {visual.avatar.initials}
        </span>
      )}
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/35 text-white transition-opacity",
          loading || active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        <i
          className={cn(
            "fas text-[0.5rem]",
            loading ? "fa-spinner fa-spin" : active ? "fa-check" : "fa-play",
          )}
        />
      </span>
    </span>
  );
}

export function IconBtn({
  onClick,
  title,
  active,
  children,
  size = "md",
  className = "",
}) {
  const base =
    size === "sm"
      ? "w-9 h-9 text-[0.72rem]"
      : size === "lg"
        ? "w-12 h-12 text-base"
        : "w-10 h-10 text-[0.82rem]";
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={cn(
        base,
        "flex items-center justify-center rounded-full cursor-pointer outline-none transition-all duration-150",
        active
          ? "bg-[rgba(212,168,32,0.25)] text-[color-mix(in_srgb,var(--gold-bright,#f5d785)_88%,#ffffff_12%)] border border-[rgba(212,168,32,0.45)]"
          : "bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_78%,transparent_22%)] text-[color-mix(in_srgb,var(--theme-text)_88%,var(--theme-bg)_12%)] border border-[color-mix(in_srgb,var(--theme-border)_62%,transparent_38%)]",
        "hover:bg-[rgba(212,168,32,0.18)] hover:text-[color-mix(in_srgb,var(--gold-bright,#f5d785)_90%,#ffffff_10%)] hover:border-[rgba(212,168,32,0.35)] hover:scale-105",
        "active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(212,168,32,0.5)]",
        className,
      )}
    >
      {children}
    </button>
  );
}
