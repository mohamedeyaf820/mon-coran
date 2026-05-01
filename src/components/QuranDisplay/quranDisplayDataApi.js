import { t } from "../../i18n";
import {
  getJuz,
  getPage,
  getSurahText,
} from "../../services/quranAPI";
import { stripBasmala } from "../../utils/quranUtils";
import {
  getWarshJuzVerses,
  getWarshPageVerses,
  getWarshSurahFormatted,
} from "../../services/warshService";

function ayahSortKey(ayah) {
  const globalNumber = Number(ayah?.number);
  if (Number.isFinite(globalNumber) && globalNumber > 0) return globalNumber;
  const surah = Number(ayah?.surah?.number) || 0;
  const ayahNumber = Number(ayah?.numberInSurah) || 0;
  return surah * 1000 + ayahNumber;
}

function normalizeRiwayaText(ayah, riwaya) {
  if (riwaya === "warsh") {
    const text = String(ayah?.text || "").trim();
    return {
      ...ayah,
      text,
      warshWords: ayah?.warshWords?.length
        ? ayah.warshWords
        : text.split(/\s+/).filter(Boolean),
      quranCom: null,
      requestedRiwaya: "warsh",
    };
  }

  const hafsText =
    ayah?.quranCom?.textUthmani ||
    ayah?.text ||
    ayah?.quranCom?.textQpcHafs ||
    "";

  return {
    ...ayah,
    text: String(hafsText).trim(),
    warshWords: undefined,
    hafsText: undefined,
    requestedRiwaya: "hafs",
  };
}

export async function loadArabicData({
  currentJuz,
  currentPage,
  currentSurah,
  displayMode,
  riwaya,
  signal,
}) {
  if (riwaya === "warsh") {
    if (displayMode === "page") return getWarshPageVerses(currentPage);
    if (displayMode === "juz") return getWarshJuzVerses(currentJuz);
    return getWarshSurahFormatted(currentSurah);
  }

  if (displayMode === "page") {
    return getPage(currentPage, riwaya, signal);
  }

  return displayMode === "juz"
    ? getJuz(currentJuz, riwaya, signal)
    : getSurahText(currentSurah, riwaya, signal);
}

export function ensureRequestedRiwaya(ayahs, riwaya) {
  return [...ayahs]
    .map((ayah) => normalizeRiwayaText(ayah, riwaya))
    .sort((a, b) => ayahSortKey(a) - ayahSortKey(b))
    .map((ayah) => {
      const nextAyah = { ...ayah, requestedRiwaya: riwaya };
      if (riwaya === "warsh" || nextAyah.warshWords || !nextAyah.text || nextAyah.numberInSurah !== 1) {
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
    arabicData?.isTextFallback
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
  currentPage,
  currentSurah,
  displayMode,
  signal,
}) {
  if (displayMode === "page") {
    return getPage(currentPage, "hafs", signal);
  }

  return displayMode === "juz"
    ? getJuz(currentJuz, "hafs", signal)
    : getSurahText(currentSurah, "hafs", signal);
}
