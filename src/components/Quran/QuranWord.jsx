import React from "react";
import TajweedText from "./TajweedText";
import WordTooltip from "./WordTooltip";

export default function QuranWord({
  active,
  current,
  fontSize,
  lang,
  onSelect,
  read,
  riwaya,
  showTajwid,
  showTransliteration,
  showWordTranslation,
  word,
  wordId,
}) {
  const hasAudio = Boolean(word?.audioUrl);
  const classes = [
    "wbw-word-block",
    current ? "wbw-current" : "",
    read ? "wbw-read" : "",
    active ? "wbw-word-block--selected" : "",
    hasAudio ? "wbw-word-block--has-audio" : "wbw-word-block--no-audio",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      data-word-position={word?.position}
      data-has-audio={hasAudio ? "true" : "false"}
      aria-describedby={`${wordId}-tooltip`}
      aria-label={
        hasAudio
          ? `Lire le mot ${word?.text || ""}`
          : `Lire le verset contenant ${word?.text || ""}`
      }
      onClick={onSelect}
    >
      <span className="wbw-arabic" style={{ fontSize: `${fontSize}px` }}>
        <TajweedText
          text={word?.textQpcHafs || word?.text || ""}
          enabled={showTajwid}
          riwaya={riwaya}
          tajweedColors={null}
        />
      </span>
      {showTransliteration && word?.transliteration ? (
        <span className="wbw-transliteration" dir="ltr">
          {word.transliteration}
        </span>
      ) : null}
      {showWordTranslation && word?.translation ? (
        <span className="wbw-translation">{word.translation}</span>
      ) : null}
      <span id={`${wordId}-tooltip`}>
        <WordTooltip lang={lang} word={word} />
      </span>
    </button>
  );
}
