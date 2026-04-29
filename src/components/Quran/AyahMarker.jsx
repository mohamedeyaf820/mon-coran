import React from "react";
import { toAr } from "../../data/surahs";
import { cn } from "../../lib/utils";

/**
 * Ornate verse-end marker inspired by printed Mushaf medallions.
 */
export const AyahMarker = React.memo(function AyahMarker({
  num,
  isPlaying = false,
  className = "",
  size = "1.42em",
}) {
  return (
    <span
      className={cn(
        "ayah-marker-wrap verse-stop-medallion relative inline-flex items-center justify-center align-middle transition-transform duration-200",
        isPlaying && "is-playing scale-[1.08]",
        className,
      )}
      style={{ "--verse-stop-size": size }}
      aria-label={`Verse ${num}`}
    >
      <span className="verse-stop-medallion__ring" aria-hidden="true" />
      <span className="verse-stop-number">{toAr(num)}</span>
    </span>
  );
});

export default AyahMarker;
