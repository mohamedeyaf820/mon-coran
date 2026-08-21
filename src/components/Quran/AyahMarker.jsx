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
 * AyahMarker - native mushaf ayah marker rendered by the active Quran font.
 */
export const AyahMarker = React.memo(function AyahMarker({
  number,
  num,
  isPlaying = false,
  className = "",
  fontFamily,
  riwaya,
  size: _size = "md",
  onClick,
}) {
  const markerNumber = number ?? num;
  if (markerNumber == null) return null;

  // The standalone marker is always shaped with the same font that supplies
  // its glyph. Mixing a Scheherazade/Amiri U+06DD prefix with the QPC font
  // forced by the visual layer renders two medallions for one ayah.
  const markerFontFamily = resolveFontFamily(UI_AYAH_MARKER_FONT_ID, "hafs");
  const markerText = getUiAyahMarker(markerNumber);

  return (
    <span
      dir="rtl"
      className={cn(
        "ayah-marker-wrap ayat-marker qurancom-ayah-marker verse-end-marker native-ayah-marker",
        "inline-block select-none",
        isPlaying && "is-playing",
        className,
      )}
      title={String(markerNumber)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Verset ${markerNumber}`}
      data-marker-font={UI_AYAH_MARKER_FONT_ID}
      style={{ fontFamily: markerFontFamily }}
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
      <span aria-hidden="true">{markerText}</span>
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
