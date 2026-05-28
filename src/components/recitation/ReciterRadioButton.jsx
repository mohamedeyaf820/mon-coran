import React from "react";

export default function ReciterRadioButton({ lang, onClick }) {
  return (
    <button type="button" className="reciter-radio-btn hp2-btn hp2-btn--soft min-h-10 rounded-xl px-3" onClick={onClick}>
      <i className="fas fa-play" />
      <span>{lang === "fr" ? "Lancer la radio" : lang === "ar" ? "تشغيل الراديو" : "Play radio"}</span>
    </button>
  );
}
