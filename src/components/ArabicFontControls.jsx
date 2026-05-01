import React from "react";
import { Minus, Plus, Type } from "lucide-react";
import useArabicFontPreferences, {
  ARABIC_FONT_SIZE_MAX,
  ARABIC_FONT_SIZE_MIN,
} from "../hooks/useArabicFontPreferences";
import { cn } from "../lib/utils";

const ARABIC_FONT_OPTIONS = [
  { id: "qpc-hafs", label: "Uthmanic" },
  { id: "amiri-quran", label: "Amiri" },
  { id: "noto-naskh-arabic", label: "Noto Naskh" },
  { id: "qpc-warsh", label: "Warsh" },
];

function labelFor(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

export default function ArabicFontControls({ lang = "fr", compact = false }) {
  const {
    arabicFontFamily,
    arabicFontSize,
    setArabicFontFamily,
    setArabicFontSize,
  } = useArabicFontPreferences();

  const currentSize = Math.round(arabicFontSize);

  return (
    <div
      className={cn(
        "arabic-font-controls flex shrink-0 items-center gap-2",
        compact && "arabic-font-controls--compact",
      )}
      aria-label={labelFor(lang, "Police arabe", "Arabic font")}
    >
      <div className="afc-font-group" role="group" aria-label={labelFor(lang, "Choisir la police arabe", "Choose Arabic font")}>
        <Type size={14} className="afc-leading-icon" aria-hidden="true" />
        <select
          className="afc-select"
          value={arabicFontFamily}
          onChange={(event) => setArabicFontFamily(event.target.value)}
          aria-label={labelFor(lang, "Police arabe", "Arabic font")}
        >
          {ARABIC_FONT_OPTIONS.map((font) => (
            <option key={font.id} value={font.id}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      <div className="afc-size-group" role="group" aria-label={labelFor(lang, "Taille du texte arabe", "Arabic text size")}>
        <button
          type="button"
          className="afc-size-btn"
          onClick={() => setArabicFontSize(currentSize - 2)}
          disabled={currentSize <= ARABIC_FONT_SIZE_MIN}
          aria-label={labelFor(lang, "Reduire la taille arabe", "Decrease Arabic size")}
          title="A-"
        >
          <Minus size={13} />
        </button>
        <input
          className="afc-range"
          type="range"
          min={ARABIC_FONT_SIZE_MIN}
          max={ARABIC_FONT_SIZE_MAX}
          step="2"
          value={currentSize}
          onChange={(event) => setArabicFontSize(event.target.value)}
          aria-label={labelFor(lang, "Taille de police arabe", "Arabic font size")}
        />
        <span className="afc-size-value" aria-live="polite">
          {currentSize}
        </span>
        <button
          type="button"
          className="afc-size-btn"
          onClick={() => setArabicFontSize(currentSize + 2)}
          disabled={currentSize >= ARABIC_FONT_SIZE_MAX}
          aria-label={labelFor(lang, "Augmenter la taille arabe", "Increase Arabic size")}
          title="A+"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}
