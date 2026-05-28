import React, { useState, useRef, useEffect } from "react";

export default function ReciterBioCollapse({ lang, text }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  const safeText = String(text || "").trim() || (lang === "fr" ? "Recitation authentique et régulière." : "Authentic and regular recitation.");
  const short = safeText.slice(0, 140);
  const shouldCollapse = safeText.length > 140;

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [safeText, open]);

  return (
    <div className="text-sm leading-relaxed text-[var(--text-secondary)]">
      <div
        ref={contentRef}
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: open || !shouldCollapse ? `${contentHeight + 20}px` : "3.6em" }}
      >
        <p>{safeText}</p>
      </div>
      {shouldCollapse && (
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)] hover:bg-[rgba(var(--primary-rgb),0.15)] transition-all duration-200"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (lang === "fr" ? "Voir moins" : "Show less") : (lang === "fr" ? "Voir plus" : "Show more")}
          <i className={`fas fa-chevron-${open ? "up" : "down"} text-[0.55rem]`} />
        </button>
      )}
    </div>
  );
}
