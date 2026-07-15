import React from "react";
import { Radio } from "lucide-react";

export default function ReciterRadioButton({ lang, onClick }) {
  return (
    <button
      type="button"
      className="reciter-radio-button"
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
