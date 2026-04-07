import React from "react";
import { cn } from "../../lib/utils";

/**
 * ProgressRail – Specialized progress bar for the audio player.
 * Uses SVG for crisp rendering and a gold gradient for premium feel.
 */
export function ProgressRail({ progress, className = "", showThumb = false }) {
  const pct = Math.max(0, Math.min(100, progress * 100));

  return (
    <div className={cn("h-full w-full", className)}>
      <svg
        viewBox="0 0 100 4"
        preserveAspectRatio="none"
        className="block h-full w-full overflow-visible"
      >
        <defs>
          <linearGradient
            id="audio-progress-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="var(--gold, #d4a820)" />
            <stop offset="100%" stopColor="var(--gold-bright, #f5d785)" />
          </linearGradient>
        </defs>
        <rect
          x="0"
          y="0"
          width="100"
          height="4"
          rx="2"
          className="fill-white/10 dark:fill-white/5"
        />
        <rect
          x="0"
          y="0"
          width={pct}
          height="4"
          rx="2"
          fill="url(#audio-progress-gradient)"
        />
        {showThumb && (
          <circle
            cx={pct}
            cy="2"
            r="2.2"
            fill="#fff7da"
            stroke="rgba(18,31,25,0.4)"
            strokeWidth="0.8"
            className="drop-shadow-sm transition-[cx] duration-150 ease-linear"
          />
        )}
      </svg>
    </div>
  );
}

export default ProgressRail;
