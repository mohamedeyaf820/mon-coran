import React from "react";
import { useAppLocale } from "../../context/AppContext";
import { getAyahMarkerFontFamily, getUiAyahMarker } from "../../data/fonts";
import { t } from "../../i18n";
import { toArabicNumeral } from "../../utils/arabicNumerals";

// Scalloped eight-petal khatam — the rosette the Madani prints set around the
// ayah number. The path is fixed geometry, so it is computed once at module
// load: eight points on a circle joined by outward semicircular scallops.
const ROSETTE_D = (() => {
  const c = 14;
  const r = 6.9;
  const petals = 8;
  const step = (Math.PI * 2) / petals;
  const scallop = r * Math.sin(step / 2);
  const point = (k) => {
    const angle = k * step;
    return `${(c + r * Math.cos(angle)).toFixed(2)} ${(c + r * Math.sin(angle)).toFixed(2)}`;
  };
  let d = `M${point(0)}`;
  for (let k = 1; k <= petals; k += 1) {
    d += ` A${scallop.toFixed(2)} ${scallop.toFixed(2)} 0 0 1 ${point(k % petals)}`;
  }
  return `${d} Z`;
})();

/**
 * AyahRosette — decorative gold rosette carrying an Arabic-Indic number.
 * Purely presentational (aria-hidden); the caller owns the text alternative.
 * The numeral is sized down per digit count so ١٨٦ stays inside the ring —
 * the glyph fonts stretched their rosette around the number, this one scales
 * the number instead.
 */
export function AyahRosette({ number, className = "" }) {
  const digits = toArabicNumeral(number);
  const fontSize = digits.length >= 4 ? 6.4 : digits.length === 3 ? 7.4 : digits.length === 2 ? 8.8 : 10;
  return (
    <svg
      className={`qcm-rosette${className ? ` ${className}` : ""}`}
      viewBox="0 0 28 28"
      aria-hidden="true"
      focusable="false"
    >
      <path className="qcm-rosette__ring" d={ROSETTE_D} />
      <circle className="qcm-rosette__disc" cx="14" cy="14" r="5.7" />
      <text
        className="qcm-rosette__num"
        x="14"
        y="14.3"
        textAnchor="middle"
        dominantBaseline="central"
        style={{ fontSize: `${fontSize}px` }}
      >
        {digits}
      </text>
    </svg>
  );
}

/**
 * MushafAyahMarker — the printed-page verse divider.
 *
 * On a sheet set with a proportional face (`fontFamily` reaches the component)
 * the divider is the selected font's own khatam: the same glyph the mode liste
 * prints at the end of a verse, so the medallion is drawn in the reader's face
 * and scales with the body — the way Quran.com sets it. Only the per-page QCF
 * cut, whose marker is baked into the glyph, keeps the drawn SVG rosette.
 */
export default function MushafAyahMarker({
  num,
  isPlaying = false,
  juz = false,
  onClick,
  fontFamily,
  riwaya = "hafs",
}) {
  const { lang } = useAppLocale();
  if (num == null) return null;
  const spokenNumber = lang === "ar" ? toArabicNumeral(num) : num;
  const glyph = fontFamily ? getUiAyahMarker(num, fontFamily, riwaya) : "";

  return (
    <span
      dir="rtl"
      className={[
        "qcm-ayah-marker",
        glyph ? "qcm-ayah-marker--glyph" : "",
        juz ? "qcm-ayah-marker--juz" : "",
        isPlaying ? "is-playing" : "",
      ].filter(Boolean).join(" ")}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`${t("quran.ayah", lang)} ${spokenNumber}`}
      style={glyph ? { fontFamily: getAyahMarkerFontFamily(fontFamily, riwaya) } : undefined}
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
      {glyph ? <span aria-hidden="true">{glyph}</span> : <AyahRosette number={num} />}
    </span>
  );
}
