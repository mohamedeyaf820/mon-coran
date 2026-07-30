import React from "react";
import { cn } from "../../lib/utils";
import {
  shallowEqual,
  useAppLocale,
  useAppSelector,
} from "../../context/AppContext";
import { t } from "../../i18n";
import { toArabicNumeral } from "../../utils/arabicNumerals";
import {
  getNativeAyahMarker,
  normalizeFontId,
  resolveFontFamily,
} from "../../data/fonts";

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
  const current = useAppSelector(
    (state) => ({
      fontFamily: state.fontFamily,
      riwaya: state.riwaya,
    }),
    shallowEqual,
  );
  const markerNumber = number ?? num;
  if (markerNumber == null) return null;

  const activeRiwaya = riwaya || current.riwaya || "hafs";
  const activeFontFamily = normalizeFontId(
    fontFamily || current.fontFamily,
    activeRiwaya,
  );
  const markerText = getNativeAyahMarker(markerNumber, activeFontFamily, activeRiwaya);
  const resolvedFontFamily = resolveFontFamily(activeFontFamily, activeRiwaya);

  return (
    <span
      dir="rtl"
      className={cn(
        "ayah-marker-wrap ayat-marker qurancom-ayah-marker verse-end-marker native-ayah-marker",
        "inline-block select-none",
        isPlaying && "is-playing",
        className,
      )}
      style={{
        fontFamily: resolvedFontFamily,
        fontFeatureSettings: '"liga" 1, "calt" 1, "mark" 1, "mkmk" 1',
        verticalAlign: "-0.08em",
        marginInline: "0.08em 0.12em",
        lineHeight: 1,
        cursor: onClick ? "pointer" : "default",
      }}
      title={String(markerNumber)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Verset ${markerNumber}`}
      data-marker-font={activeFontFamily}
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
      {markerText}
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
