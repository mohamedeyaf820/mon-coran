import React, { useId } from "react";
import { cn } from "../../lib/utils";
import { toArabicNumeral } from "../../utils/arabicNumerals";

/**
 * AyahMarker - Decorative verse end marker in traditional mushaf style
 * Features: circular border, ornamental ring, Arabic numeral center
 */
export const AyahMarker = React.memo(function AyahMarker({
  number,
  num,
  isPlaying = false,
  className = "",
  size = "md",
  onClick,
}) {
  const markerNumber = number ?? num;
  const gradientId = useId().replace(/:/g, "");
  const sizes = {
    sm: { box: "2em", inner: 0.78, strokeWidth: 1.2, fontSize: 22 },
    md: { box: "2.4em", inner: 0.8, strokeWidth: 1.5, fontSize: 26 },
    lg: { box: "2.8em", inner: 0.82, strokeWidth: 1.8, fontSize: 30 },
  };
  const preset = sizes[size] || sizes.md;
  const arabicNum = toArabicNumeral(markerNumber);

  return (
    <span
      dir="rtl"
      className={cn(
        "ayah-marker-wrap ayat-marker qurancom-ayah-marker verse-end-marker inline-flex select-none items-center justify-center align-middle",
        isPlaying && "is-playing",
        className,
      )}
      onClick={onClick}
      style={{
        width: preset.box,
        height: preset.box,
        verticalAlign: "middle",
        marginInline: "0.15em",
      }}
      title={`Verset ${markerNumber}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Aller au verset ${markerNumber}`}
    >
      <svg
        className="ayat-marker__svg"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          {/* Gold gradient for center */}
          <radialGradient id={`bg-${gradientId}`} cx="50%" cy="45%">
            <stop offset="0%" stopColor="#FDF3DC" />
            <stop offset="50%" stopColor="#F5E0A0" />
            <stop offset="100%" stopColor="#E8C84A" />
          </radialGradient>
          {/* Outer glow */}
          <radialGradient id={`glow-${gradientId}`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#C8A84B" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#C8A84B" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer decorative border - thick circle */}
        <circle
          cx="50"
          cy="50"
          r="48"
          fill="none"
          stroke="#B8983A"
          strokeWidth="2.5"
          opacity="0.9"
        />

        {/* Middle ornamental ring - dashed pattern */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="none"
          stroke="#C8A84B"
          strokeWidth="1"
          strokeDasharray="3 2"
          opacity="0.7"
        />

        {/* Inner filled circle with gold gradient */}
        <circle
          cx="50"
          cy="50"
          r="36"
          fill={`url(#bg-${gradientId})`}
          stroke="#D4A820"
          strokeWidth="1.5"
        />

        {/* 8 decorative dots around the border */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = (i * 45) * (Math.PI / 180);
          const r = 44;
          return (
            <circle
              key={i}
              cx={50 + r * Math.cos(angle)}
              cy={50 + r * Math.sin(angle)}
              r="2"
              fill="#C8A84B"
              opacity="0.8"
            />
          );
        })}

        {/* 4 corner ornaments */}
        {[0, 90, 180, 270].map((deg) => {
          const angle = deg * (Math.PI / 180);
          const r = 40;
          return (
            <circle
              key={`corner-${deg}`}
              cx={50 + r * Math.cos(angle)}
              cy={50 + r * Math.sin(angle)}
              r="1.5"
              fill="#A07820"
              opacity="0.5"
            />
          );
        })}

        {/* Arabic numeral */}
        <text
          className="qurancom-ayah-marker__number verse-number-arabic ayat-marker__number"
          x="50"
          y={arabicNum.length <= 2 ? "57" : "55"}
          textAnchor="middle"
          fontSize={arabicNum.length <= 2 ? preset.fontSize : preset.fontSize - 2}
          fontFamily="'Amiri', 'Scheherazade New', serif"
          fill="#5C3D00"
          fontWeight="bold"
          direction="rtl"
        >
          {arabicNum}
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
