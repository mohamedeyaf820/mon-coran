import React from "react";
import { toAr } from "../../data/surahs";
import { cn } from "../../lib/utils";

/**
 * AyahMarker – Quran.com style octagon star marker.
 * A premium, responsive SVG-based marker for ayah endings.
 */
export const AyahMarker = React.memo(function AyahMarker({
  num,
  isPlaying = false,
  className = "",
  size = "1.32em",
}) {
  return (
    <span
      className={cn(
        "ayah-marker-wrap relative inline-flex items-center justify-center align-middle transition-transform duration-200",
        isPlaying && "scale-[1.12]",
        className
      )}
      style={{ width: size, height: size }}
      aria-label={`Verse ${num}`}
    >
      <svg
        viewBox="0 0 34 34"
        className={cn(
          "h-full w-full drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)] transition-colors duration-300",
          isPlaying ? "text-[var(--gold)]" : "text-[rgba(var(--primary-rgb),0.72)]"
        )}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="currentColor"
          d="M17 3.5c-.7 0-1.4.3-1.9.8s-.8 1.2-.8 1.9c0 .7-.3 1.4-.8 1.9s-1.2.8-1.9.8c-.7 0-1.4.3-1.9.8s-.8 1.2-.8 1.9c0 .7-.3 1.4-.8 1.9S7 14.3 7 15c0 .7-.3 1.4-.8 1.9s-.8 1.2-.8 1.9c0 .7.3 1.4.8 1.9s.8 1.2.8 1.9c0 .7.3 1.4.8 1.9s1.2.8 1.9.8c.7 0 1.4.3 1.9.8s.8 1.2.8 1.9c0 .7.3 1.4.8 1.9s1.2.8 1.9.8c.7 0 1.4-.3 1.9-.8s.8-1.2.8-1.9c0-.7.3-1.4.8-1.9s1.2-.8 1.9-.8c.7 0 1.4-.3 1.9-.8s.8-1.2.8-1.9c0-.7.3-1.4.8-1.9s1.2-.8 1.9-.8c.7 0 1.4-.3 1.9-.8s.8-1.2.8-1.9c0-.7-.3-1.4-.8-1.9s-.8-1.2-.8-1.9c0-.7-.3-1.4-.8-1.9s-1.2-.8-1.9-.8c-.7 0-1.4-.3-1.9-.8s-.8-1.2-.8-1.9c0-.7-.3-1.4-.8-1.9s-1.2-.8-1.9-.8z"
        />
        <text
          x="17.2"
          y="22.5"
          textAnchor="middle"
          fontSize="9"
          fontWeight="700"
          fontFamily="var(--font-ui, sans-serif)"
          fill="var(--bg-card, #fff)"
          className="select-none"
        >
          {toAr(num)}
        </text>
      </svg>
      {isPlaying && (
        <span className="absolute inset-0 -z-10 animate-pulse rounded-full bg-[var(--gold)] opacity-[0.16] blur-[4px]" />
      )}
    </span>
  );
});

export default AyahMarker;
