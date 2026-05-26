import React, { useId } from "react";
import { cn } from "../../lib/utils";
import { toArabicNumeral } from "../../utils/arabicNumerals";

/**
 * AyahMarker - High-fidelity Madinah Mushaf verse-end medallion
 *
 * Design philosophy (matching Quran.com):
 * - Size is driven by `font-size: 1em` so it scales with the surrounding Arabic text
 * - In list mode: displayed inline at the END of the verse text
 * - In mushaf/flow mode: same inline medallion, slightly smaller
 * - SVG uses `em` units so it scales fluidly
 */
export const AyahMarker = React.memo(function AyahMarker({
  number,
  num,
  isPlaying = false,
  className = "",
  size = "md",
  onClick,
}) {
  const id = useId();
  const markerNumber = number ?? num;
  const arabicNumber = toArabicNumeral(markerNumber);
  const numStr = String(markerNumber);
  // Font size inside SVG viewBox (out of 100px): 3 digits need smaller text
  const svgFontSize = numStr.length > 2 ? "20" : numStr.length === 2 ? "26" : "32";

  return (
    <span
      dir="rtl"
      className={cn(
        // Core classes for CSS targetting
        "ayah-marker-wrap ayat-marker qurancom-ayah-marker verse-end-marker",
        // Layout
        "inline-flex select-none items-center justify-center",
        // Sizing: 1em × 1em – scales with current Arabic font-size
        "w-[1em] h-[1em]",
        isPlaying && "is-playing",
        className,
      )}
      style={{
        verticalAlign: "-0.2em",   // nudge down to center with Arabic baseline
        marginInline: "0.1em 0.2em",
        flexShrink: 0,
      }}
      title={`Verset ${markerNumber}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Aller au verset ${markerNumber}`}
      onClick={onClick}
    >
      <svg
        className="ayat-marker__svg"
        width="1em"
        height="1em"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          {/* Gold gradient for outer ring and crown petals */}
          <linearGradient id={`gold-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0c040" />
            <stop offset="50%" stopColor="#c8a84b" />
            <stop offset="100%" stopColor="#8a6520" />
          </linearGradient>
          {/* Deep emerald green fill for core */}
          <radialGradient id={`emerald-${id}`} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor="#2b7a5e" />
            <stop offset="50%" stopColor="#1a5040" />
            <stop offset="100%" stopColor="#0d3028" />
          </radialGradient>
          {/* Inner highlight shine on green */}
          <radialGradient id={`shine-${id}`} cx="38%" cy="32%" r="55%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>

        {/* ── Outer gold decorative ring (8 small petals / dots around perimeter) ── */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const cx = 50 + 44 * Math.cos(rad);
          const cy = 50 + 44 * Math.sin(rad);
          return (
            <circle
              key={angle}
              cx={cx}
              cy={cy}
              r="4.5"
              fill={`url(#gold-${id})`}
              opacity="0.82"
            />
          );
        })}

        {/* ── Outer gold stroke ring ── */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke={`url(#gold-${id})`}
          strokeWidth="3"
          opacity="0.9"
        />

        {/* ── Inner dashed gold ring ── */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke={`url(#gold-${id})`}
          strokeWidth="1.2"
          strokeDasharray="4 3"
          opacity="0.7"
        />

        {/* ── Emerald green core disc ── */}
        <circle
          cx="50"
          cy="50"
          r="31"
          fill={`url(#emerald-${id})`}
        />

        {/* ── Subtle inner shine ── */}
        <circle
          cx="50"
          cy="50"
          r="31"
          fill={`url(#shine-${id})`}
        />

        {/* ── Verse number in Eastern Arabic numerals ── */}
        <text
          className="ayat-marker__number qurancom-ayah-marker__number"
          x="50"
          y="50"
          textAnchor="middle"
          fontSize={svgFontSize}
          fontFamily="Amiri, Scheherazade New, serif"
          fill="#fdfbf5"
          fontWeight="bold"
          dominantBaseline="central"
          letterSpacing="0"
        >
          {arabicNumber}
        </text>
      </svg>
    </span>
  );
});

export const AyatMarker = AyahMarker;

export function SajdaMarker() {
  return (
    <span className="sajda-marker inline-flex items-center align-middle" aria-label="Sajda">
      <svg width="1.1em" height="1.1em" viewBox="0 0 100 100" aria-hidden="true">
        <ellipse
          cx="50"
          cy="50"
          rx="48"
          ry="30"
          fill="#d4edda"
          stroke="#2d6a4f"
          strokeWidth="3"
        />
        <text
          x="50"
          y="58"
          textAnchor="middle"
          fontSize="28"
          fontFamily="Amiri, Scheherazade New, serif"
          fill="#2d6a4f"
        >
          ۩
        </text>
      </svg>
    </span>
  );
}

export function HizbMarker({ type = "full" }) {
  const labels = { quarter: "۞", half: "۞", threeQuarter: "۞", full: "۞" };
  return (
    <span className="hizb-marker inline align-middle text-amber-600">
      {labels[type] || labels.full}
    </span>
  );
}

export function JuzBanner({ number }) {
  return (
    <div className="juz-banner flex items-center gap-2 my-4 text-xs text-amber-800">
      <div className="h-px flex-1 bg-amber-300" />
      <span className="rounded border border-amber-400 bg-amber-50 px-2 py-0.5">
        الجزء {toArabicNumeral(number)}
      </span>
      <div className="h-px flex-1 bg-amber-300" />
    </div>
  );
}

export default AyahMarker;
