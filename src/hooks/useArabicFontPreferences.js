import { useCallback, useEffect } from "react";
import { shallowEqual, useAppActions, useAppSelector } from "../context/AppContext";
import { normalizeFontId } from "../data/fonts";
import { ensureFontLoaded } from "../services/fontLoader";

const STORAGE_KEY = "mushaf-plus-arabic-font-preferences";
export const ARABIC_FONT_SIZE_MIN = 12;
export const ARABIC_FONT_SIZE_MAX = 96;

function clampSize(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 25;
  return Math.max(ARABIC_FONT_SIZE_MIN, Math.min(ARABIC_FONT_SIZE_MAX, numeric));
}

function readStoredFontPreference(riwaya) {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const hasScopedStore =
      parsed.byRiwaya && typeof parsed.byRiwaya === "object" && !Array.isArray(parsed.byRiwaya);
    const scoped = hasScopedStore ? parsed.byRiwaya?.[riwaya] || {} : {};
    const storedFont = scoped.fontFamily || (!hasScopedStore ? parsed.fontFamily : null);
    return storedFont ? normalizeFontId(storedFont, riwaya) : null;
  } catch {
    return null;
  }
}

export default function useArabicFontPreferences() {
  const { fontFamily, quranFontSize, riwaya } = useAppSelector(
    (state) => ({
      fontFamily: state.fontFamily,
      quranFontSize: state.quranFontSize,
      riwaya: state.riwaya,
    }),
    shallowEqual,
  );
  const { dispatch } = useAppActions();

  useEffect(() => {
    const storedFont = readStoredFontPreference(riwaya);
    if (storedFont && storedFont !== fontFamily) {
      dispatch({ type: "SET", payload: { fontFamily: storedFont } });
    }
  }, [dispatch, fontFamily, riwaya]);

  useEffect(() => {
    try {
      const previous = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      const previousByRiwaya =
        previous.byRiwaya && typeof previous.byRiwaya === "object" && !Array.isArray(previous.byRiwaya)
          ? previous.byRiwaya
          : {};
      const byRiwaya = {
        ...previousByRiwaya,
        [riwaya]: {
          ...(previousByRiwaya[riwaya] || {}),
          fontFamily: normalizeFontId(fontFamily, riwaya),
        },
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ byRiwaya }),
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
    riwaya,
    setArabicFontFamily,
    setArabicFontSize,
  };
}
