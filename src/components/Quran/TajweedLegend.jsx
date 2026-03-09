import React, { useState, useRef, useEffect } from "react";
import { getRulesForRiwaya } from "../../data/tajwidRules";

/**
 * TajweedLegend — quran.com-style sticky legend.
 *
 * Renders a compact centred pill button "Tajweed colors ∨".
 * Clicking it expands a horizontal strip of colour-coded rule chips
 * directly below, matching the quran.com legend bar.
 */
const TajweedLegend = React.memo(function TajweedLegend({
  lang,
  visible,
  riwaya,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!visible) return null;

  const rules = getRulesForRiwaya(riwaya);
  const isWarsh = riwaya === "warsh";

  const label =
    lang === "ar"
      ? isWarsh
        ? "ألوان ورش"
        : "ألوان التجويد"
      : lang === "fr"
        ? isWarsh
          ? "Couleurs Warsh"
          : "Couleurs Tajweed"
        : isWarsh
          ? "Warsh colours"
          : "Tajweed colors";

  const labelKey =
    lang === "ar" ? "nameAr" : lang === "fr" ? "nameFr" : "nameEn";

  return (
    <div ref={ref} className="tjl-root">
      {/* ── Pill toggle button ── */}
      <div className="tjl-toggle-row">
        <button
          className={`tjl-toggle-btn${open ? " tjl-toggle-btn--open" : ""}`}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={label}
        >
          <span className="tjl-toggle-label">{label}</span>
          <svg
            className={`tjl-chevron${open ? " tjl-chevron--up" : ""}`}
            viewBox="0 0 16 16"
            width="12"
            height="12"
            aria-hidden="true"
          >
            <path
              d="M2 5l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* ── Colour chips strip ── */}
      {open && (
        <div className="tjl-strip" role="list" aria-label={label}>
          {rules.map((rule) => (
            <span key={rule.id} className="tjl-chip" role="listitem">
              <span
                className="tjl-dot"
                style={{ background: rule.color }}
                aria-hidden="true"
              />
              <span className="tjl-chip-label">{rule[labelKey]}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

export default TajweedLegend;
