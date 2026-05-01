import React from "react";

export default function WordTooltip({ lang = "fr", word }) {
  if (!word) return null;

  const translationLabel = lang === "fr" ? "Traduction" : "Translation";
  const transliterationLabel =
    lang === "fr" ? "Translitt\u00e9ration" : "Transliteration";
  const rootLabel = lang === "fr" ? "Racine" : "Root";
  const grammarLabel = lang === "fr" ? "Grammaire" : "Grammar";

  return (
    <span className="wbw-tooltip" role="tooltip">
      <span className="wbw-tooltip__arabic" dir="rtl">
        {word.textQpcHafs || word.text}
      </span>
      {word.translation ? (
        <span className="wbw-tooltip__row">
          <span>{translationLabel}</span>
          <strong>{word.translation}</strong>
        </span>
      ) : null}
      {word.transliteration ? (
        <span className="wbw-tooltip__row">
          <span>{transliterationLabel}</span>
          <strong dir="ltr">{word.transliteration}</strong>
        </span>
      ) : null}
      {word.root ? (
        <span className="wbw-tooltip__row">
          <span>{rootLabel}</span>
          <strong dir="rtl">{word.root}</strong>
        </span>
      ) : null}
      {word.grammar ? (
        <span className="wbw-tooltip__row">
          <span>{grammarLabel}</span>
          <strong>{word.grammar}</strong>
        </span>
      ) : null}
    </span>
  );
}
