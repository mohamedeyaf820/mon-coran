import React from "react";
import {
  getMemorizationLabel,
  getMemorizationTitle,
  getWordModeLabel,
  getWordModeTitle,
} from "./displayHelpers";

export default function ModeToggleBar({
  className,
  separatorClassName,
  getButtonClassName,
  lang,
  mushafLayout,
  memMode,
  showWordByWord,
  onToggleWordByWord,
  onToggleMushaf,
  onToggleMemorization,
}) {
  return (
    <div className={className}>
      <button
        className={getButtonClassName(showWordByWord)}
        onClick={onToggleWordByWord}
        title={getWordModeTitle(lang, showWordByWord)}
      >
        <i className={`fas ${showWordByWord ? "fa-language" : "fa-list-ul"}`}></i>
        <span>{getWordModeLabel(lang, showWordByWord)}</span>
      </button>
      <span className={separatorClassName} aria-hidden="true" />
      <button
        className={getButtonClassName(mushafLayout === "mushaf")}
        onClick={onToggleMushaf}
        title={lang === "fr" ? "Vue Mushaf" : "Mushaf view"}
      >
        <i className="fas fa-book-open"></i>
        <span>Mushaf</span>
      </button>
      <span className={separatorClassName} aria-hidden="true" />
      <button
        className={getButtonClassName(memMode)}
        onClick={onToggleMemorization}
        title={getMemorizationTitle(lang)}
      >
        <i className="fas fa-graduation-cap"></i>
        <span>{getMemorizationLabel(lang)}</span>
      </button>
    </div>
  );
}
