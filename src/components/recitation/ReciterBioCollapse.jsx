import React, { useEffect, useRef, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { getReciterBio } from "../../data/reciters";

export default function ReciterBioCollapse({ lang, text, reciter }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);

  const safeText =
    String(text || getReciterBio(reciter, lang) || "").trim() ||
    (lang === "fr"
      ? "Recitation authentique et reguliere."
      : lang === "ar"
        ? "تلاوة موثوقة ومنتظمة."
        : "Authentic and regular recitation.");
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
        style={{
          maxHeight:
            open || !shouldCollapse ? `${contentHeight + 20}px` : "3.6em",
        }}
      >
        <p>{safeText}</p>
      </div>
      {shouldCollapse && (
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-[rgba(var(--primary-rgb),0.08)] px-3 py-1 text-xs font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[rgba(var(--primary-rgb),0.15)]"
          onClick={() => setOpen((value) => !value)}
        >
          {open
            ? lang === "fr"
              ? "Voir moins"
              : lang === "ar"
                ? "عرض اقل"
                : "Show less"
            : lang === "fr"
              ? "Voir plus"
              : lang === "ar"
                ? "عرض المزيد"
                : "Show more"}
          {open ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
        </button>
      )}
    </div>
  );
}
