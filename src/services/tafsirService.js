/**
 * Tafsir Service
 * Fetches tafsir from Quran.com API (free, no auth required)
 * Supports: Ibn Kathir (fr/en), Jalalayn (ar), Maududi (ur)
 */

const QURAN_COM_API = "https://api.quran.com/api/v4";

// Tafsir IDs on Quran.com
export const TAFSIR_SOURCES = {
  ibnKathirFr: { id: 167, name: "Ibn Kathir (Français)", lang: "fr" },
  ibnKathirEn: { id: 171, name: "Ibn Kathir (English)", lang: "en" },
  jalalayn: { id: 161, name: "Jalalayn (عربي)", lang: "ar" },
  saadiFr: { id: 207, name: "As-Saadi (Français)", lang: "fr" },
  saadiEn: { id: 208, name: "As-Saadi (English)", lang: "en" },
};

// Default tafsir per language
const DEFAULT_TAFSIR = {
  fr: TAFSIR_SOURCES.ibnKathirFr.id,
  en: TAFSIR_SOURCES.ibnKathirEn.id,
  ar: TAFSIR_SOURCES.jalalayn.id,
};

/**
 * Fetch tafsir for a specific ayah
 * @param {number} surah - Surah number (1-114)
 * @param {number} ayah - Ayah number
 * @param {number} tafsirId - Tafsir ID from Quran.com
 * @returns {Promise<{text: string, tafsirId: number, source: string}>}
 */
export async function fetchTafsir(surah, ayah, tafsirId = null) {
  if (!surah || !ayah) {
    throw new Error("Surah and ayah are required");
  }

  // Determine which tafsir to use
  const lang = document.documentElement.lang || "fr";
  const effectiveId = tafsirId || DEFAULT_TAFSIR[lang] || DEFAULT_TAFSIR.fr;

  try {
    const response = await fetch(
      `${QURAN_COM_API}/tafsirs/${effectiveId}/by_ayah/${surah}:${ayah}`
    );

    if (!response.ok) {
      throw new Error(`Tafsir fetch failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract text from response
    const tafsirText = data?.tafsir?.text || "";
    
    return {
      text: cleanTafsirText(tafsirText),
      tafsirId: effectiveId,
      source: getTafsirName(effectiveId),
      surah,
      ayah,
    };
  } catch (error) {
    console.error(`[TafsirService] Error fetching tafsir for ${surah}:${ayah}:`, error);
    throw error;
  }
}

/**
 * Fetch tafsir for a range of ayahs (e.g., entire surah)
 * @param {number} surah - Surah number
 * @param {number} fromAyah - Start ayah
 * @param {number} toAyah - End ayah
 * @param {number} tafsirId - Tafsir ID
 * @returns {Promise<Array<{text: string, ayah: number}>>}
 */
export async function fetchTafsirRange(surah, fromAyah, toAyah, tafsirId = null) {
  const promises = [];
  for (let ayah = fromAyah; ayah <= toAyah; ayah++) {
    promises.push(
      fetchTafsir(surah, ayah, tafsirId).catch((err) => ({
        text: null,
        error: err.message,
        ayah,
      }))
    );
  }
  return Promise.all(promises);
}

/**
 * Get available tafsir sources for a language
 * @param {string} lang - Language code (fr, en, ar)
 * @returns {Array<{id: number, name: string}>}
 */
export function getAvailableTafsirs(lang = "fr") {
  return Object.values(TAFSIR_SOURCES).filter((t) => t.lang === lang);
}

/**
 * Get tafsir name by ID
 * @param {number} tafsirId
 * @returns {string}
 */
export function getTafsirName(tafsirId) {
  const found = Object.values(TAFSIR_SOURCES).find((t) => t.id === tafsirId);
  return found?.name || `Tafsir #${tafsirId}`;
}

/**
 * Clean HTML tags from tafsir text
 * @param {string} text - Raw tafsir text (may contain HTML)
 * @returns {string} Clean text
 */
function cleanTafsirText(text) {
  if (!text) return "";
  
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/?p>/gi, "\n")
    .replace(/<\/?b>/gi, "**")
    .replace(/<\/?i>/gi, "*")
    .replace(/<sup[^>]*>([^<]*)<\/sup>/gi, "$1")
    .replace(/<sub[^>]*>([^<]*)<\/sub>/gi, "$1")
    .replace(/<a[^>]*>([^<]*)<\/a>/gi, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default {
  fetchTafsir,
  fetchTafsirRange,
  getAvailableTafsirs,
  getTafsirName,
  TAFSIR_SOURCES,
};
