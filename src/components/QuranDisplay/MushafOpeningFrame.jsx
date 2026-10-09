import React from "react";

/**
 * MushafOpeningFrame — the illumination of the two opening leaves (pages 1-2).
 * Purely decorative: an inner panel rule with khatam rosettes at its corners,
 * painted behind the ink. The Quranic text, the surah name and every
 * interaction stay live DOM; nothing here carries meaning or text.
 */
function Khatam({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      aria-hidden="true"
      focusable="false"
    >
      <g fill="none" stroke="currentColor" strokeWidth="1.1">
        <rect x="3.6" y="3.6" width="12.8" height="12.8" />
        <path d="M10 0.9 19.1 10 10 19.1 0.9 10Z" />
        <circle cx="10" cy="10" r="2.7" />
      </g>
      <circle cx="10" cy="10" r="0.9" fill="currentColor" />
    </svg>
  );
}

export default function MushafOpeningFrame() {
  return (
    <div className="qcm-opening-frame" aria-hidden="true">
      <div className="qcm-opening-frame__panel">
        <Khatam className="qcm-opening-frame__rosette qcm-opening-frame__rosette--tl" />
        <Khatam className="qcm-opening-frame__rosette qcm-opening-frame__rosette--tr" />
        <Khatam className="qcm-opening-frame__rosette qcm-opening-frame__rosette--bl" />
        <Khatam className="qcm-opening-frame__rosette qcm-opening-frame__rosette--br" />
      </div>
    </div>
  );
}
