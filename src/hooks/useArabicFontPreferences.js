import { useCallback, useEffect } from "react";
import { shallowEqual, useAppActions, useAppSelector } from "../context/AppContext";
import { normalizeFontId } from "../data/fonts";
import { ensureFontLoaded } from "../services/fontLoader";
import {
  ARABIC_FONT_SIZE_MAX,
  ARABIC_FONT_SIZE_MIN,
  clampArabicFontSize,
} from "../utils/arabicTypography";

const STORAGE_KEY = "mushaf-plus-arabic-font-preferences";

export { ARABIC_FONT_SIZE_MAX, ARABIC_FONT_SIZE_MIN };

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
  }, [fontFamily, riwaya]);

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
        payload: clampArabicFontSize(nextSize),
      });
    },
    [dispatch],
  );

  return {
    arabicFontFamily: normalizeFontId(fontFamily, riwaya),
    arabicFontSize: clampArabicFontSize(quranFontSize),
    riwaya,
    setArabicFontFamily,
    setArabicFontSize,
  };
}
