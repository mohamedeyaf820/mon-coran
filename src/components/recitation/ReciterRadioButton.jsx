import React from "react";
import { Radio } from "lucide-react";

export default function ReciterRadioButton({ lang, onClick }) {
  return (
    <button
      type="button"
      className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-[0.78rem] font-semibold text-white shadow-sm transition-all hover:bg-primary-dark active:scale-[0.97]"
      onClick={onClick}
    >
      <Radio size={14} aria-hidden="true" />
      <span>
        {lang === "fr"
          ? "Radio continue"
          : lang === "ar"
            ? "راديو مستمر"
            : "Continuous radio"}
      </span>
    </button>
  );
}
