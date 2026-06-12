import React from "react";
import TajweedText from "./TajweedText";
import WordTooltip from "./WordTooltip";

function QuranWordComponent({
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
  inline = false,
}) {
  const hasAudio = Boolean(word?.audioUrl);
  const classes = [
    "wbw-word-block",
    inline ? "wbw-word-block--inline" : "",
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

function areQuranWordEqual(prev, next) {
  return (
    prev.word === next.word &&
    prev.wordId === next.wordId &&
    prev.active === next.active &&
    prev.current === next.current &&
    prev.read === next.read &&
    prev.fontSize === next.fontSize &&
    prev.lang === next.lang &&
    prev.riwaya === next.riwaya &&
    prev.showTajwid === next.showTajwid &&
    prev.showTransliteration === next.showTransliteration &&
    prev.showWordTranslation === next.showWordTranslation &&
    prev.inline === next.inline &&
    prev.onSelect === next.onSelect
  );
}

export default React.memo(QuranWordComponent, areQuranWordEqual);
