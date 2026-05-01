import React, { useId } from "react";
import { cn } from "../../lib/utils";
import { toArabicNumeral } from "../../utils/arabicNumerals";

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
    sm: { box: "0.72em", fontSize: 28, stroke: 1.5 },
    md: { box: "0.88em", fontSize: 31, stroke: 2 },
    lg: { box: "1.05em", fontSize: 34, stroke: 2 },
  };
  const preset = sizes[size] || {
    box: size || "1.25em",
    fontSize: 34,
    stroke: 2,
  };
  const arabicNum = toArabicNumeral(markerNumber);

  return (
    <span
      dir="rtl"
      className={cn(
        "ayah-marker-wrap ayat-marker qurancom-ayah-marker verse-end-marker inline-flex select-none items-center justify-center align-middle transition-transform hover:scale-110",
        isPlaying && "is-playing",
        className,
      )}
      onClick={onClick}
      style={{
        width: preset.box,
        height: preset.box,
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
          <radialGradient id={`gold-${gradientId}`} cx="40%" cy="35%">
            <stop offset="0%" stopColor="#FDF3DC" />
            <stop offset="60%" stopColor="#F5E0A0" />
            <stop offset="100%" stopColor="#E8C84A" />
          </radialGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="none"
          stroke="#C8A84B"
          strokeWidth={preset.stroke * 1.5}
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#C8A84B"
          strokeWidth={preset.stroke * 0.6}
          strokeDasharray="4 3"
        />
        <circle cx="50" cy="50" r="39" fill={`url(#gold-${gradientId})`} />
        {Array.from({ length: 8 }).map((_, index) => {
          const angle = (index * 45 - 22.5) * (Math.PI / 180);
          const radius = 43.5;
          return (
            <circle
              key={index}
              cx={50 + radius * Math.cos(angle)}
              cy={50 + radius * Math.sin(angle)}
              r="2.2"
              fill="#C8A84B"
            />
          );
        })}
        <path
          d="M50 18 L54 46 L82 50 L54 54 L50 82 L46 54 L18 50 L46 46 Z"
          fill="none"
          stroke="#C8A84B"
          strokeWidth="0.8"
          opacity="0.5"
        />
        <text
          className="qurancom-ayah-marker__number verse-number-arabic ayat-marker__number"
          x="50"
          y={arabicNum.length <= 2 ? "58" : "56"}
          textAnchor="middle"
          fontSize={arabicNum.length <= 2 ? preset.fontSize + 3 : preset.fontSize}
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
