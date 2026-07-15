import React from "react";
import { BookOpen, Layers3, Star } from "lucide-react";

function labelFor(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

export default function ReaderContextCard({
  kind = "page",
  label,
  value,
  numericValue,
  total,
  secondary,
  riwaya,
  lang = "fr",
}) {
  const Icon = kind === "juz" ? Layers3 : BookOpen;
  const progress = Math.max(
    0,
    Math.min(100, (Number(numericValue ?? value) / Number(total || 1)) * 100),
  );
  const isWarsh = riwaya === "warsh";

  return (
    <section
      className="reader-context-card"
      aria-label={`${label} ${value} / ${total}`}
      style={{ "--reader-context-progress": `${progress}%` }}
    >
      <div className="reader-context-card__icon" aria-hidden="true">
        <Icon size={18} strokeWidth={1.8} />
      </div>

      <div className="reader-context-card__copy">
        <span className="reader-context-card__eyebrow">
          {labelFor(lang, "Mode de lecture", "Reading mode", "وضع القراءة")}
        </span>
        <div className="reader-context-card__title-row">
          <h2>
            {label} <strong>{value}</strong>
            <span> / {total}</span>
          </h2>
          {secondary ? <p>{secondary}</p> : null}
        </div>
      </div>

      <span
        className={`reader-context-card__riwaya ${
          isWarsh ? "reader-context-card__riwaya--warsh" : ""
        }`}
      >
        {isWarsh ? <Star size={10} aria-hidden="true" /> : null}
        {isWarsh ? "WARSH" : "HAFS"}
      </span>

      <span className="reader-context-card__progress" aria-hidden="true" />
    </section>
  );
}
