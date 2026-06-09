import React from "react";

export default function ReciterRadioButton({ lang, onClick }) {
  return (
    <button
      type="button"
      className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-[0.78rem] font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.97]"
      onClick={onClick}
    >
      <i className="fas fa-play text-[0.6rem]" />
      <span>{lang === "fr" ? "Lancer la radio" : lang === "ar" ? "تشغيل الراديو" : "Play radio"}</span>
    </button>
  );
}
