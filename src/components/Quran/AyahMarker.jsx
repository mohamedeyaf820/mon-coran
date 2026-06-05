import React, { useId } from "react";
import { cn } from "../../lib/utils";
import { toArabicNumeral } from "../../utils/arabicNumerals";

/**
 * AyahMarker — Medallion de fin de verset style Quran.com
 *
 * Positionnement :
 *  - inline dans le flux RTL arabe
 *  - taille 1em x 1em (suit le font-size du contexte)
 *  - verticalAlign calibre pour la baseline arabe
 *
 * Apparence :
 *  - Etoile islamique 8 branches doree
 *  - Coeur vert emeraude + numero arabe
 *  - Glow anime si isPlaying
 */
export const AyahMarker = React.memo(function AyahMarker({
  number,
  num,
  isPlaying = false,
  className = "",
  size: _size = "md",
  onClick,
}) {
  const id = useId();
  const markerNumber = number ?? num;
  if (markerNumber == null) return null;

  const arabicNumber = toArabicNumeral(markerNumber);
  const numStr = String(markerNumber);
  const textSize =
    numStr.length >= 3 ? 24
    : numStr.length === 2 ? 29
    : 34;

  return (
    <span
      dir="ltr"
      className={cn(
        "ayah-marker-wrap ayat-marker qurancom-ayah-marker verse-end-marker",
        "inline-block select-none",
        "w-[1em] h-[1em] shrink-0",
        isPlaying && "is-playing",
        className,
      )}
      style={{
        verticalAlign: "-0.15em",
        marginRight: "0.22em",
        marginLeft: "0.04em",
        lineHeight: 1,
        cursor: onClick ? "pointer" : "default",
      }}
      title={String(markerNumber)}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Verset ${markerNumber}`}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(e); } }
          : undefined
      }
    >
      <svg
        className="ayat-marker__svg"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        focusable="false"
        style={{ width: "1em", height: "1em", display: "block", overflow: "visible" }}
      >
        <defs>
          <linearGradient id={`g-gld-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%"   stopColor="rgba(218,175,40,0.96)" />
            <stop offset="50%"  stopColor="rgba(182,136,14,0.92)" />
            <stop offset="100%" stopColor="rgba(130,95,12,0.88)"  />
          </linearGradient>
          <radialGradient id={`g-grn-${id}`} cx="36%" cy="30%" r="70%">
            <stop offset="0%"   stopColor="#1d8060" />
            <stop offset="100%" stopColor="#0b3d28" />
          </radialGradient>
          <radialGradient id={`g-shi-${id}`} cx="34%" cy="28%" r="52%">
            <stop offset="0%"   stopColor="rgba(255,255,255,0.22)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)"    />
          </radialGradient>
          {isPlaying && (
            <filter id={`g-glw-${id}`} x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>

        {/* Etoile 8 pointes (petites ellipses rotatives autour du cercle) */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
          const rad = (deg * Math.PI) / 180;
          const cx = 50 + 43.5 * Math.cos(rad);
          const cy = 50 + 43.5 * Math.sin(rad);
          return (
            <ellipse
              key={deg}
              cx={cx} cy={cy}
              rx="5.6" ry="3.6"
              transform={`rotate(${deg}, ${cx}, ${cy})`}
              fill={`url(#g-gld-${id})`}
              opacity="0.9"
            />
          );
        })}

        {/* Anneau externe dore */}
        <circle cx="50" cy="50" r="42"
          fill="none"
          stroke={`url(#g-gld-${id})`}
          strokeWidth="2.8"
          opacity="0.95"
        />

        {/* Anneau interne pointille */}
        <circle cx="50" cy="50" r="34.5"
          fill="none"
          stroke={`url(#g-gld-${id})`}
          strokeWidth="1.3"
          strokeDasharray="3.8 3"
          opacity={isPlaying ? 1 : 0.62}
        />

        {/* Coeur vert */}
        <circle cx="50" cy="50" r="30.5"
          fill={`url(#g-grn-${id})`}
          filter={isPlaying ? `url(#g-glw-${id})` : undefined}
        />

        {/* Shine */}
        <circle cx="50" cy="50" r="30.5"
          fill={`url(#g-shi-${id})`}
        />

        {/* Numero en chiffres arabes */}
        <text
          className="ayat-marker__number qurancom-ayah-marker__number"
          x="50" y="50"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={textSize}
          fontFamily="Amiri, 'Scheherazade New', 'Noto Naskh Arabic', serif"
          fill="#fdfbf0"
          fontWeight="bold"
          style={{ userSelect: "none" }}
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
    <span className="sajda-marker inline-flex items-center align-middle mx-1" aria-label="Sajda" title="Sajda">
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
