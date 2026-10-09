import { useCallback, useEffect, useState } from "react";
import { arabicToLatin } from "../../data/transliteration";
import {
  getTransliterationText,
  requestTransliterationSurah,
  subscribeTransliteration,
} from "../../services/transliterationService";

/**
 * Latin transliteration lines for the reading surfaces.
 *
 * Hafs reads the pinned offline lines (scripts/build-transliteration.mjs).
 * Warsh keeps the rule-based approximation: a transliteration is a
 * pronunciation, and the Hafs phrasing would misrepresent the Warsh recitation
 * shown above it. While a Hafs surah is still loading, that same approximation
 * answers for it, so the reader never shows a blank line.
 */
export default function useTransliterationData({ riwaya, showTransliteration }) {
  const active = Boolean(showTransliteration) && riwaya === "hafs";
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    return subscribeTransliteration(() => setRevision((current) => current + 1));
  }, [active]);

  const getTransliterationForAyah = useCallback(
    (ayah) => {
      if (!ayah?.text) return "";
      if (active) {
        const surah = Number(ayah.surah?.number ?? ayah.surah);
        const ayahNumber = Number(ayah.numberInSurah);
        if (Number.isInteger(surah) && Number.isInteger(ayahNumber) && ayahNumber > 0) {
          const pinned = getTransliterationText(surah, ayahNumber);
          if (pinned) return pinned;
          requestTransliterationSurah(surah);
        }
      }
      return arabicToLatin(ayah.text, riwaya);
    },
    // The cards are memoized on this function's identity: keeping the revision
    // in the dependencies is what swaps the approximation for the pinned line
    // once its surah has loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [active, riwaya, revision],
  );

  return { getTransliterationForAyah };
}
