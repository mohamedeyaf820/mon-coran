import React from "react";
import { BookOpen, Layers3, Star } from "lucide-react";

export default function ReaderContextCard({
  kind = "page",
  label,
  value,
  numericValue,
  total,
  secondary,
  riwaya,
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
        <div className="reader-context-card__title-row">
          <h2>
            {label} <strong>{value}</strong>
            <span> / {total}</span>
          </h2>
          {secondary ? (
            <p>
              <span aria-hidden="true">·</span> {secondary}
            </p>
          ) : null}
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
