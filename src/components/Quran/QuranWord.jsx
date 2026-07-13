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
  const wordText = word?.textQpcHafs || word?.text || "";
  const translationDirection = /[\u0600-\u06ff]/.test(word?.translation || "")
    ? "rtl"
    : "ltr";
  const actionLabel =
    lang === "ar"
      ? hasAudio
        ? `تشغيل كلمة ${wordText}`
        : `تشغيل الآية التي تحتوي على ${wordText}`
      : lang === "en"
        ? hasAudio
          ? `Play the word ${wordText}`
          : `Play the verse containing ${wordText}`
        : hasAudio
          ? `Lire le mot ${wordText}`
          : `Lire le verset contenant ${wordText}`;
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
      aria-label={actionLabel}
      onClick={onSelect}
      style={{ "--wbw-arabic-size": `${fontSize}px` }}
    >
      <span className="wbw-arabic" dir="rtl" lang="ar">
        <TajweedText
          text={wordText}
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
        <span
          className="wbw-translation"
          dir={translationDirection}
          lang={translationDirection === "rtl" ? "ar" : lang}
        >
          {word.translation}
        </span>
      ) : null}
      <span className="wbw-tooltip-anchor" id={`${wordId}-tooltip`}>
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
