import React from "react";
import { Minus, Plus, Type } from "lucide-react";
import useArabicFontPreferences, {
  ARABIC_FONT_SIZE_MAX,
  ARABIC_FONT_SIZE_MIN,
} from "../hooks/useArabicFontPreferences";
import {
  getFontOptionsForRiwaya,
  getNativeAyahMarker,
  resolveFontFamily,
} from "../data/fonts";
import { cn } from "../lib/utils";

function labelFor(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

export default function ArabicFontControls({ lang = "fr", compact = false }) {
  const {
    arabicFontFamily,
    arabicFontSize,
    riwaya,
    setArabicFontFamily,
    setArabicFontSize,
  } = useArabicFontPreferences();

  const currentSize = Math.round(arabicFontSize);
  const availableFonts = getFontOptionsForRiwaya(riwaya);
  const selectedFont = availableFonts.some((font) => font.id === arabicFontFamily)
    ? arabicFontFamily
    : availableFonts[0]?.id || "qpc-hafs";
  const markerPreview = getNativeAyahMarker(1, selectedFont, riwaya);
  const markerFontFamily = resolveFontFamily(selectedFont, riwaya);

  return (
    <div
      className={cn(
        "arabic-font-controls flex shrink-0 items-center gap-2",
        compact && "arabic-font-controls--compact",
      )}
      aria-label={labelFor(lang, "Police arabe", "Arabic font", "الخط العربي")}
    >
      <div className="afc-font-group" role="group" aria-label={labelFor(lang, "Choisir la police arabe", "Choose Arabic font", "اختيار الخط العربي")}>
        <Type size={14} className="afc-leading-icon" aria-hidden="true" />
        <span
          className="afc-marker-preview native-ayah-marker"
          dir="rtl"
          aria-hidden="true"
          style={{ fontFamily: markerFontFamily }}
        >
          {markerPreview}
        </span>
        <select
          className="afc-select"
          value={selectedFont}
          onChange={(event) => setArabicFontFamily(event.target.value)}
          aria-label={labelFor(lang, "Police arabe", "Arabic font", "الخط العربي")}
        >
          {availableFonts.map((font) => (
            <option key={font.id} value={font.id}>
              {font.label}
            </option>
          ))}
        </select>
      </div>

      <div className="afc-size-group" role="group" aria-label={labelFor(lang, "Taille du texte arabe", "Arabic text size", "حجم النص العربي")}>
        <button
          type="button"
          className="afc-size-btn"
          onClick={() => setArabicFontSize(currentSize - 2)}
          disabled={currentSize <= ARABIC_FONT_SIZE_MIN}
          aria-label={labelFor(lang, "Réduire la taille arabe", "Decrease Arabic size", "تصغير الخط العربي")}
          title="A-"
        >
          <Minus size={13} />
        </button>
        <input
          className="afc-range"
          type="range"
          min={ARABIC_FONT_SIZE_MIN}
          max={ARABIC_FONT_SIZE_MAX}
          step="1"
          value={currentSize}
          onChange={(event) => setArabicFontSize(event.target.value)}
          aria-label={labelFor(lang, "Taille de police arabe", "Arabic font size", "حجم الخط العربي")}
        />
        <span className="afc-size-value" aria-live="polite">
          {currentSize}
        </span>
        <button
          type="button"
          className="afc-size-btn"
          onClick={() => setArabicFontSize(currentSize + 2)}
          disabled={currentSize >= ARABIC_FONT_SIZE_MAX}
          aria-label={labelFor(lang, "Augmenter la taille arabe", "Increase Arabic size", "تكبير الخط العربي")}
          title="A+"
        >
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}
