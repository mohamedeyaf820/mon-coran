import React, { useEffect, useId, useRef, useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import { getReciterBio } from "../../data/reciters";
import { useReciterProfile } from "../../hooks/useReciterProfile";

export default function ReciterBioCollapse({ lang, text, reciter }) {
  const [open, setOpen] = useState(false);
  const contentRef = useRef(null);
  const [contentHeight, setContentHeight] = useState(0);
  const contentId = useId();
  const profile = useReciterProfile(reciter?.id);
  const researchedBio =
    profile?.bio?.[lang] || profile?.bio?.fr || profile?.bio?.en || "";

  const safeText =
    String(text || researchedBio || getReciterBio(reciter, lang) || "").trim() ||
    (lang === "fr"
      ? "Profil de récitation disponible dans la bibliothèque audio."
      : lang === "ar"
        ? "ملف تلاوة متاح في المكتبة الصوتية."
        : "Recitation profile available in the audio library.");
  const shouldCollapse = safeText.length > 140;

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [safeText, open]);

  return (
    <div
      className={`reciter-bio-collapse text-sm leading-relaxed text-[var(--text-secondary)]${
        open || !shouldCollapse ? " is-open" : ""
      }`}
    >
      <div
        ref={contentRef}
        id={contentId}
        className="reciter-bio-collapse__content overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{
          maxHeight:
            open || !shouldCollapse ? `${contentHeight + 20}px` : "4.8em",
        }}
      >
        <p>{safeText}</p>
      </div>
      {shouldCollapse && (
        <button
          type="button"
          className="mt-2 inline-flex items-center gap-1 rounded-full bg-[rgba(var(--primary-rgb),0.08)] px-3 py-1 text-xs font-semibold text-[var(--primary)] transition-all duration-200 hover:bg-[rgba(var(--primary-rgb),0.15)]"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={contentId}
        >
          {open
            ? lang === "fr"
              ? "Voir moins"
              : lang === "ar"
                ? "عرض أقل"
                : "Show less"
            : lang === "fr"
              ? "Voir plus"
              : lang === "ar"
                ? "عرض المزيد"
                : "Show more"}
          {open ? (
            <ChevronUp size={9} aria-hidden="true" />
          ) : (
            <ChevronDown size={9} aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}
