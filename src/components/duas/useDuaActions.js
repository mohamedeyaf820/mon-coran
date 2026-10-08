import { useCallback } from "react";
import { useApp } from "../../context/AppContext";
import { t } from "../../i18n";

/** Copy, share-as-image and open-in-Quran, shared by every invocation card. */
export function useDuaActions(lang) {
  const { dispatch, set } = useApp();

  const copyDua = useCallback(
    async (text) => {
      let type = "success";
      let message = t("duas.copiedToast", lang);
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        type = "error";
        message = t("duas.copyFailedToast", lang);
      }
      window.dispatchEvent(new CustomEvent("quran-toast", { detail: { type, message } }));
    },
    [lang],
  );

  // Reuses the verse share studio: same SVG→canvas card, with the category as
  // the "occasion" badge and the source as reference for non-Quranic adhkar.
  const shareDua = useCallback(
    (draft) => {
      set({
        shareImageOpen: true,
        shareVerseDraft: { kind: "dua", surah: 0, ayah: 0, ...draft },
      });
    },
    [set],
  );

  const goToVerse = useCallback(
    (surah, ayah) => {
      if (!surah) return;
      set({ showDuas: false, showHome: false, displayMode: "surah" });
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
    },
    [dispatch, set],
  );

  return { copyDua, shareDua, goToVerse };
}
