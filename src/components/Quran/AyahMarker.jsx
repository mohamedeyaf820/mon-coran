import React from "react";
import { cn } from "../../lib/utils";
import { useAppLocale } from "../../context/AppContext";
import {
  getUiAyahMarker,
  resolveFontFamily,
  UI_AYAH_MARKER_FONT_ID,
} from "../../data/fonts";
import { t } from "../../i18n";
import { toArabicNumeral } from "../../utils/arabicNumerals";

/**
 * AyahMarker - authentic ornate Quran.com-style Mushaf Ayah medallion.
 */
export const AyahMarker = React.memo(function AyahMarker({
  number,
  num,
  isPlaying = false,
  className = "",
  fontFamily: _fontFamily,
  riwaya: _riwaya,
  size: _size = "md",
  onClick,
}) {
  const markerNumber = number ?? num;
  if (markerNumber == null) return null;

  const arabicNum = toArabicNumeral(markerNumber);

  return (
    <span
      dir="rtl"
      className={cn(
        "ayah-marker-wrap ayat-marker qurancom-ayah-marker verse-end-marker native-ayah-marker",
        "inline-flex items-center justify-center select-none align-middle",
        isPlaying && "is-playing",
        className,
      )}
      title={`Verset ${markerNumber}`}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Verset ${markerNumber}`}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
    >
      <svg
        viewBox="0 0 44 44"
        className="ayah-rosette-svg w-[1.18em] h-[1.18em] inline-block align-middle"
        aria-hidden="true"
        style={{
          color: "var(--color-gold, #c5a04b)",
          filter: "drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15))",
        }}
      >
        {/* Outer decorative rosette path */}
        <circle
          cx="22"
          cy="22"
          r="19.5"
          fill="color-mix(in srgb, var(--primary) 12%, var(--bg-card))"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        {/* Inner dotted/accent ring */}
        <circle
          cx="22"
          cy="22"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          strokeDasharray="2,2"
          opacity="0.8"
        />
        {/* 8-point subtle star points */}
        <polygon
          points="22,3.5 24,19.5 40.5,22 24,24.5 22,40.5 20,24.5 3.5,22 20,19.5"
          fill="currentColor"
          opacity="0.18"
        />
        {/* Centered Arabic numeral */}
        <text
          x="22"
          y="26.5"
          textAnchor="middle"
          fontSize={arabicNum.length > 2 ? "12" : "14"}
          fontWeight="bold"
          fontFamily="var(--font-quran, serif)"
          fill="var(--text-primary, currentColor)"
        >
          {arabicNum}
        </text>
      </svg>
    </span>
  );
});

export function SajdaMarker() {
  const { lang } = useAppLocale();
  const label = t("quran.sajda", lang);

  return (
    <span
      className="sajda-marker inline-flex items-center align-middle mx-1"
      aria-label={label}
      title={label}
    >
      <svg width="1.1em" height="1.1em" viewBox="0 0 100 100" aria-hidden="true" style={{ display: "block" }}>
        <ellipse cx="50" cy="50" rx="47" ry="30"
          fill="rgba(212,168,32,0.1)"
          stroke="rgba(180,134,11,0.65)"
          strokeWidth="3"
        />
        <text x="50" y="60" textAnchor="middle" fontSize="30" fontFamily="Amiri, serif" fill="rgba(130,93,10,0.88)">
          ۩
        </text>
      </svg>
    </span>
  );
}

export function HizbMarker({ type = "full" }) {
  const labels = { quarter: "۞¼", half: "۞½", threeQuarter: "۞¾", full: "۞" };
  return (
    <span
      className="hizb-marker inline align-middle mx-0.5"
      style={{ color: "rgba(180,134,11,0.82)", fontSize: "0.72em" }}
      aria-hidden="true"
    >
      {labels[type] || labels.full}
    </span>
  );
}

export function JuzBanner({ number, lang }) {
  const label = lang === "ar" ? `\u0627\u0644\u062c\u0632\u0621 ${toArabicNumeral(number)}` : `Juz ${number}`;
  return (
    <div className="juz-banner flex items-center gap-3 my-5 select-none" aria-hidden="true">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[rgba(180,134,11,0.35)]" />
      <span className="flex items-center gap-1.5 rounded-full border border-[rgba(180,134,11,0.4)] bg-[rgba(212,168,32,0.06)] px-3 py-1 text-[0.67rem] font-bold tracking-wide text-[rgba(120,86,8,0.9)]">
        <span style={{ fontSize: "0.85em" }}>۞</span>
        {label}
      </span>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[rgba(180,134,11,0.35)]" />
    </div>
  );
}

export default AyahMarker;
