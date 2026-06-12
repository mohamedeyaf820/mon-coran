import React from "react";
import {
  getMemorizationLabel,
  getMemorizationTitle,
  getWordModeLabel,
  getWordModeTitle,
} from "./displayHelpers";
import { Icon } from "../ui/icon";

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
        <Icon name={showWordByWord ? "language" : "list-ul"} size={14} />
        <span>{getWordModeLabel(lang, showWordByWord)}</span>
      </button>
      <span className={separatorClassName} aria-hidden="true" />
      <button
        className={getButtonClassName(mushafLayout === "mushaf")}
        onClick={onToggleMushaf}
        title={lang === "fr" ? "Vue Mushaf" : "Mushaf view"}
      >
        <Icon name="book-open" size={14} />
        <span>Mushaf</span>
      </button>
      <span className={separatorClassName} aria-hidden="true" />
      <button
        className={getButtonClassName(memMode)}
        onClick={onToggleMemorization}
        title={getMemorizationTitle(lang)}
      >
        <Icon name="graduation-cap" size={14} />
        <span>{getMemorizationLabel(lang)}</span>
      </button>
    </div>
  );
}
