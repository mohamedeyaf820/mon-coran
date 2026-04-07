import { t } from "../../i18n";
import {
  getJuz,
  getPage,
  getSurahText,
} from "../../services/quranAPI";
import { stripBasmala } from "../../utils/quranUtils";
import {
  getWarshJuzVerses,
  getWarshSurahFormatted,
  loadFontsForVerses,
  loadWarshData,
} from "../../services/warshService";

async function enrichPageForWarsh(arabicData) {
  try {
    const warshJson = await loadWarshData();
    const ayahs = (arabicData?.ayahs || []).map((ayah) => {
      try {
        const surahNumber = ayah.surah?.number;
        const ayahNumber = ayah.numberInSurah;
        const words = warshJson?.[surahNumber - 1]?.[ayahNumber - 1];
        const validWords = Array.isArray(words)
          ? words.filter(
              (word) =>
                word &&
                typeof word === "object" &&
                Number.isFinite(Number(word.p)) &&
                Number.isFinite(Number(word.c)),
            )
          : [];

        return validWords.length === 0
          ? ayah
          : {
              ...ayah,
              warshWords: validWords,
              hafsText: ayah.text,
              requestedRiwaya: "warsh",
            };
      } catch {
        return ayah;
      }
    });

    loadFontsForVerses(ayahs.map((ayah) => ayah.warshWords || [])).catch(() => {});
    return {
      ...arabicData,
      ayahs,
      isTextFallback: !ayahs.every((ayah) => ayah.warshWords?.length > 0),
      isQCF4: ayahs.every((ayah) => ayah.warshWords?.length > 0),
      requestedRiwaya: "warsh",
    };
  } catch {
    return {
      ...arabicData,
      isTextFallback: true,
      requestedRiwaya: "warsh",
    };
  }
}

export async function loadArabicData({
  currentJuz,
  currentPage,
  currentSurah,
  displayMode,
  riwaya,
  signal,
}) {
  if (displayMode === "page") {
    const pageData = await getPage(currentPage, "hafs", signal);
    return riwaya === "warsh" ? enrichPageForWarsh(pageData) : pageData;
  }

  if (riwaya === "warsh") {
    return displayMode === "juz"
      ? getWarshJuzVerses(currentJuz)
      : getWarshSurahFormatted(currentSurah);
  }

  return displayMode === "juz"
    ? getJuz(currentJuz, riwaya, signal)
    : getSurahText(currentSurah, riwaya, signal);
}

export function ensureRequestedRiwaya(ayahs, riwaya) {
  return ayahs.map((ayah) => {
    const nextAyah = { ...ayah, requestedRiwaya: riwaya };
    if (nextAyah.warshWords || !nextAyah.text || nextAyah.numberInSurah !== 1) {
      return nextAyah;
    }

    const surahNumber = nextAyah.surah?.number;
    if (surahNumber && surahNumber !== 1 && surahNumber !== 9) {
      nextAyah.text = stripBasmala(nextAyah.text, surahNumber, 1);
    }
    return nextAyah;
  });
}

export function assertWarshStrict({
  arabicData,
  displayMode,
  lang,
  riwaya,
  warshStrictMode,
}) {
  if (
    riwaya === "warsh" &&
    warshStrictMode &&
    arabicData?.isTextFallback &&
    displayMode !== "page"
  ) {
    throw new Error(
      lang === "fr"
        ? "Mode Warsh strict: texte Warsh indisponible (fallback Hafs refuse)."
        : lang === "ar"
          ? "\u0648\u0636\u0639 \u0648\u0631\u0634 \u0627\u0644\u0635\u0627\u0631\u0645: \u0646\u0635 \u0648\u0631\u0634 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d (\u062a\u0645 \u0631\u0641\u0636 \u0628\u062f\u064a\u0644 \u062d\u0641\u0635)."
          : "Warsh strict mode: Warsh text unavailable (Hafs fallback blocked).",
    );
  }

  const fetchedAyahs = arabicData?.ayahs || [];
  if (!Array.isArray(fetchedAyahs) || fetchedAyahs.length === 0) {
    throw new Error(t("errors.emptyData", lang));
  }
}

export function loadHafsSupportData({
  currentJuz,
  currentSurah,
  displayMode,
  signal,
}) {
  return displayMode === "juz"
    ? getJuz(currentJuz, "hafs", signal)
    : getSurahText(currentSurah, "hafs", signal);
}
