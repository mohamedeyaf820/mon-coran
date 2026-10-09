import React, { useEffect, useState } from "react";
import { getReciterVisual } from "../../data/reciters";
import { cn } from "../../lib/utils";
import { Loader2, Check, Play } from "lucide-react";

const COVER_SIZE_CLASSES = {
  36: "w-9 h-9",
  40: "w-10 h-10",
  42: "w-[42px] h-[42px]",
  52: "w-[52px] h-[52px]",
};

export function ReciterPhoto({ src, className = "", style }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) return null;

  return (
    <img
      src={src}
      alt=""
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      aria-hidden="true"
      onError={() => setFailed(true)}
    />
  );
}

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
          className="simple-player__progress-track"
        />
        <rect
          x="0"
          y="0"
          width={pct}
          height="4"
          rx="2"
          fill="var(--theme-primary, var(--gold))"
        />
        {showThumb && pct > 0.5 && (
          <circle
            cx={Math.min(98.3, pct)}
            cy="2"
            r="1.7"
            fill="var(--gold-pale, #fff7da)"
            stroke="rgba(18,31,25,0.32)"
            strokeWidth="0.8"
          />
        )}
      </svg>
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
          ? "shadow-[0_2px_12px_color-mix(in_srgb,var(--gold)_35%,transparent_65%)]"
          : "shadow-[0_2px_8px_rgba(0,0,0,0.3)]",
      )}
    >
      <div
        className="absolute inset-0 flex items-center justify-center text-white"
        style={{ background: visual.avatar.gradient }}
        aria-hidden="true"
      >
        <span
          className={cn(
            "font-black tracking-normal",
            size <= 40 ? "text-sm" : "text-lg",
          )}
        >
          {visual.avatar.initials}
        </span>
      </div>
      <ReciterPhoto
        src={visual.photo}
        className="reciter-photo absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: visual.focalPoint }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.38))]" />
      {isPlaying && (
        <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[var(--gold-bright)] shadow-[0_0_6px_var(--gold)]" />
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
          ? "border-[rgba(var(--theme-primary-rgb),0.48)] bg-[rgba(var(--theme-primary-rgb),0.24)] text-white"
          : "border-white/10 bg-white/[0.08] text-white",
      )}
    >
      <span
        className="flex h-full w-full items-center justify-center"
        style={{ background: visual.avatar.gradient }}
        aria-hidden="true"
      >
        {visual.avatar.initials}
      </span>
      <ReciterPhoto
        src={visual.photo}
        className="reciter-photo absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition: visual.focalPoint }}
      />
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center bg-black/35 text-white transition-opacity",
          loading || active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
      >
        {loading ? <Loader2 size={8} className="animate-spin" /> : active ? <Check size={8} /> : <Play size={8} />}
      </span>
    </span>
  );
}

