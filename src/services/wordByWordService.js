/**
 * Word-by-Word Service
 * 
 * Fetches word-by-word data including:
 * - Arabic text (word)
 * - Transliteration
 * - Translation (per word)
 * 
 * Uses quran.com API for word-by-word data
 */

import { dbGet, dbSet } from './dbService';

const BASE_URL = 'https://api.quran.com/api/v4';
const WBW_AUDIO_BASE = 'https://audio.qurancdn.com/';
const WBW_CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const IDB_STORE = 'cache';
const IDB_PREFIX = 'wbw:';

// In-memory cache
const memCache = new Map();
const inflight = new Map();

function normalizeWordAudioUrl(audioPath) {
  if (typeof audioPath !== 'string' || audioPath.trim() === '') return null;
  if (/^https?:\/\//i.test(audioPath)) return audioPath;
  return `${WBW_AUDIO_BASE}${audioPath.replace(/^\/+/, '')}`;
}

/**
 * Get word-by-word data for a specific ayah
 * @param {number} surah - Surah number (1-114)
 * @param {number} ayah - Ayah number
 * @param {string} translationLang - Language code ('en', 'fr', 'ar')
 * @returns {Promise<Array>} Array of word objects
 */
export async function getWordByWord(surah, ayah, translationLang = 'en') {
  const cacheKey = `${IDB_PREFIX}${surah}:${ayah}:${translationLang}`;
  
  // Check memory cache
  if (memCache.has(cacheKey)) {
    return memCache.get(cacheKey);
  }
  
  // Check IndexedDB cache
  try {
    const cached = await dbGet(IDB_STORE, cacheKey);
    if (cached && cached.data && cached.ts && (Date.now() - cached.ts < WBW_CACHE_TTL)) {
      memCache.set(cacheKey, cached.data);
      return cached.data;
    }
  } catch (e) {
    console.warn('WBW cache read failed:', e);
  }

  // Deduplicate concurrent requests for the same ayah/lang
  if (inflight.has(cacheKey)) {
    return inflight.get(cacheKey);
  }
  
  // Fetch from API
  const requestPromise = (async () => {
    try {
      const translationIds = {
        en: 131,
        fr: 136,
        ar: null,
      };
      const translationId = translationIds[translationLang] ?? translationIds.en;
      const wordFields = 'text_uthmani,text_imlaei,transliteration,translation,root,grammar';
      const params = new URLSearchParams({
        words: 'true',
        word_fields: wordFields,
        translation_fields: 'text',
      });
      if (translationId) {
        params.set('translations', String(translationId));
      }
      const url = `${BASE_URL}/verses/by_key/${surah}:${ayah}?${params.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const json = await response.json();

      if (!json.verse || !json.verse.words) {
        throw new Error('Invalid API response');
      }

      // Process words
      const words = json.verse.words.map(word => ({
        id: word.id,
        position: word.position,
        text: word.text_uthmani || word.text,
        textSimple: word.text_imlaei || word.text,
        transliteration: word.transliteration?.text || '',
        translation: word.translation?.text || '',
        charType: word.char_type_name, // 'word' or 'end'
        audioUrl: normalizeWordAudioUrl(word.audio_url),
        location: word.location,
        root: word.root?.text || word.root || null,
        grammar: word.grammar?.text || word.grammar || null,
      })).filter(w => w.charType === 'word'); // Filter out end markers

      // Cache the result
      memCache.set(cacheKey, words);
      try {
        await dbSet(IDB_STORE, { key: cacheKey, data: words, ts: Date.now() });
      } catch (e) {
        console.warn('WBW cache write failed:', e);
      }

      return words;
    } catch (error) {
      console.error('Failed to fetch word-by-word data:', error);
      return [];
    } finally {
      inflight.delete(cacheKey);
    }
  })();

  inflight.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Get word-by-word data for multiple ayahs (batch)
 * @param {number} surah - Surah number
 * @param {number} startAyah - Start ayah number
 * @param {number} endAyah - End ayah number
 * @param {string} translationLang - Language code
 * @returns {Promise<Map>} Map of ayah number to word array
 */
export async function getWordByWordBatch(surah, startAyah, endAyah, translationLang = 'en') {
  const results = new Map();
  
  // Fetch in parallel with concurrency limit
  const CONCURRENCY = 5;
  const ayahNumbers = [];
  for (let i = startAyah; i <= endAyah; i++) {
    ayahNumbers.push(i);
  }
  
  for (let i = 0; i < ayahNumbers.length; i += CONCURRENCY) {
    const batch = ayahNumbers.slice(i, i + CONCURRENCY);
    const promises = batch.map(ayah => 
      getWordByWord(surah, ayah, translationLang)
        .then(words => ({ ayah, words }))
        .catch(() => ({ ayah, words: [] }))
    );
    
    const batchResults = await Promise.all(promises);
    for (const { ayah, words } of batchResults) {
      results.set(ayah, words);
    }
  }
  
  return results;
}

/**
 * Preload word-by-word data for a surah
 * @param {number} surah - Surah number
 * @param {number} totalAyahs - Total number of ayahs in the surah
 * @param {string} translationLang - Language code
 */
export async function preloadSurahWBW(surah, totalAyahs, translationLang = 'en') {
  // Fire and forget - preload in background
  getWordByWordBatch(surah, 1, totalAyahs, translationLang).catch(() => {});
}

/**
 * Clear word-by-word cache
 */
export function clearWBWCache() {
  memCache.clear();
}

export default {
  getWordByWord,
  getWordByWordBatch,
  preloadSurahWBW,
  clearWBWCache,
};
