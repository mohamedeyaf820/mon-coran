import {
  getJuz,
  getPage,
  getSurahText,
} from "../../services/quranAPI";
import { stripBasmala } from "../../utils/quranUtils";
import { getOfflineArabicData } from "../../data/offlineQuranFallback";
import {
  getWarshJuzVerses,
  getWarshPageVerses,
  getWarshSurahFormatted,
} from "../../services/warshService";
import { startPerformanceTimer } from "../../services/performanceMetrics";
import { READER_LOAD, createReaderDataError } from "./readerLoadError.js";

export function describeArabicDataSource(arabicData, riwaya) {
  if (arabicData?.isOfflineFallback || arabicData?.source === "offline-fallback") {
    return { id: "offline", label: "Secours hors ligne", degraded: true };
  }
  if (riwaya === "warsh") {
    return { id: "warsh-dataset", label: "Jeu de données Warsh dédié", degraded: Boolean(arabicData?.isTextFallback) };
  }
  if (arabicData?.source === "quran.com" || arabicData?.usedEdition === "quran.com-v4") {
    return { id: "quran-com", label: "Quran.com API", degraded: false };
  }
  return {
    id: "alquran-cloud",
    label: arabicData?.usedEdition ? `AlQuran Cloud · ${arabicData.usedEdition}` : "AlQuran Cloud",
    degraded: false,
  };
}

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

  // Canonical Hafs text is Unicode `text_uthmani` (already resolved into
  // ayah.text by the API layer). Font-locked payloads like the nastaleeq or
  // qpc-hafs variants stay in quranCom fields and are picked per font by
  // getAyahTextForFont — never flattened into the shared text here.
  const hafsText =
    ayah?.text ||
    ayah?.quranCom?.textUthmani ||
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
    try {
      return await getPage(currentPage, riwaya, signal);
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      const fallback = getOfflineArabicData({
        currentJuz,
        currentPage,
        currentSurah,
        displayMode,
        riwaya,
      });
      if (fallback) {
        console.warn("Using offline Quran text fallback after page fetch failure:", error);
        return fallback;
      }
      throw error;
    }
  }

  try {
    return displayMode === "juz"
      ? await getJuz(currentJuz, riwaya, signal)
      : await getSurahText(currentSurah, riwaya, signal);
  } catch (error) {
    if (error?.name === "AbortError") throw error;
    const fallback = getOfflineArabicData({
      currentJuz,
      currentPage,
      currentSurah,
      displayMode,
      riwaya,
    });
    if (fallback) {
      console.warn("Using offline Quran text fallback after fetch failure:", error);
      return fallback;
    }
    throw error;
  }
}

export function preloadArabicData(options) {
  const finishMetric = startPerformanceTimer("riwaya_preload_ms");
  return loadArabicData({ ...options, signal: undefined })
    .then((value) => {
      finishMetric();
      return value;
    })
    .catch(() => {
      finishMetric();
      return null;
    });
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

export function assertWarshStrict({ arabicData, riwaya, warshStrictMode }) {
  if (
    riwaya === "warsh" &&
    warshStrictMode &&
    arabicData?.isTextFallback
  ) {
    // Typed, not translated in place: the reader owns the wording. A raw
    // localised Error used to surface here as if the app had crashed.
    throw createReaderDataError(
      READER_LOAD.WARSH_TEXT,
      "Warsh strict mode: Warsh text unavailable (Hafs fallback blocked).",
    );
  }

  const fetchedAyahs = arabicData?.ayahs || [];
  if (!Array.isArray(fetchedAyahs) || fetchedAyahs.length === 0) {
    throw createReaderDataError(
      READER_LOAD.EMPTY,
      "Empty payload for the requested reading",
    );
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
