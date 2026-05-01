import { useCallback, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { normalizeFontId } from "../data/fonts";
import { ensureFontLoaded } from "../services/fontLoader";

const STORAGE_KEY = "mushaf-plus-arabic-font-preferences";
export const ARABIC_FONT_SIZE_MIN = 32;
export const ARABIC_FONT_SIZE_MAX = 64;

function clampSize(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 42;
  return Math.max(ARABIC_FONT_SIZE_MIN, Math.min(ARABIC_FONT_SIZE_MAX, numeric));
}

function readStoredPreferences(riwaya) {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return {
      fontFamily: normalizeFontId(parsed.fontFamily, riwaya),
      quranFontSize: clampSize(parsed.quranFontSize),
    };
  } catch {
    return null;
  }
}

export default function useArabicFontPreferences() {
  const { state, dispatch } = useApp();
  const { fontFamily, quranFontSize, riwaya } = state;

  useEffect(() => {
    const stored = readStoredPreferences(riwaya);
    if (!stored) return;

    const payload = {};
    if (stored.fontFamily && stored.fontFamily !== fontFamily) {
      payload.fontFamily = stored.fontFamily;
    }
    if (stored.quranFontSize && stored.quranFontSize !== quranFontSize) {
      payload.quranFontSize = stored.quranFontSize;
    }
    if (Object.keys(payload).length > 0) {
      dispatch({ type: "SET", payload });
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          fontFamily: normalizeFontId(fontFamily, riwaya),
          quranFontSize: clampSize(quranFontSize),
        }),
      );
    } catch {
      // Preferences are also persisted by AppContext; this key is a light fallback.
    }
  }, [fontFamily, quranFontSize, riwaya]);

  const setArabicFontFamily = useCallback(
    async (nextFontFamily) => {
      const normalized = normalizeFontId(nextFontFamily, riwaya);
      await ensureFontLoaded(normalized);
      dispatch({ type: "SET_FONT_FAMILY", payload: normalized });
    },
    [dispatch, riwaya],
  );

  const setArabicFontSize = useCallback(
    (nextSize) => {
      dispatch({
        type: "SET_QURAN_FONT_SIZE",
        payload: clampSize(nextSize),
      });
    },
    [dispatch],
  );

  return {
    arabicFontFamily: normalizeFontId(fontFamily, riwaya),
    arabicFontSize: clampSize(quranFontSize),
    setArabicFontFamily,
    setArabicFontSize,
  };
}
