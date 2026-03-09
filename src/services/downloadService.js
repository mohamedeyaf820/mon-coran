/**
 * Download Service — offline caching for surah audio via Cache API
 * Uses the browser's Cache API to store MP3 files locally.
 */

const CACHE_NAME = 'mushafplus-audio-v1';
const PROGRESS_KEY = 'mushaf_offline_progress';

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}'); }
  catch { return {}; }
}
function saveProgress(p) {
  try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); }
  catch {}
}

/** Get all downloaded surah IDs */
export function getDownloadedSurahs() {
  const p = loadProgress();
  return Object.keys(p).filter(k => p[k] === 'done').map(Number);
}

/** Estimated number of ayahs for a surah */
function surahAyahCount(surahMeta) {
  return surahMeta?.ayahs || 7;
}

/**
 * Download all audio for a surah.
 * @param {object} surahMeta  - { n, ayahs }
 * @param {string} reciterCdn - the CDN ID
 * @param {string} cdnType    - 'islamic' | 'everyayah'
 * @param {Function} onProgress - (downloaded, total) callback
 * @returns Promise<'done'|'partial'|'error'>
 */
export async function downloadSurah(surahMeta, reciterCdn, cdnType = 'islamic', onProgress) {
  if (!('caches' in window)) {
    console.warn('Cache API not available');
    return 'error';
  }

  const surahNum = surahMeta.n;
  const total = surahAyahCount(surahMeta);
  let done = 0;

  const progress = loadProgress();
  progress[surahNum] = 'partial';
  saveProgress(progress);

  try {
    const cache = await caches.open(CACHE_NAME);

    // Compute global ayah start for Islamic Network CDN
    let globalStart = 0;
    // We can't import SURAHS here without circular deps, so we accept a pre-computed offset
    // Caller must pass the first globalAyah number via surahMeta.globalStart
    const globalBase = surahMeta.globalStart || 1;

    for (let i = 1; i <= total; i++) {
      let url;
      if (cdnType === 'everyayah') {
        const s = String(surahNum).padStart(3, '0');
        const a = String(i).padStart(3, '0');
        url = `https://everyayah.com/data/${reciterCdn}/${s}${a}.mp3`;
      } else {
        const globalNum = globalBase + i - 1;
        url = `https://cdn.islamic.network/quran/audio/128/${reciterCdn}/${globalNum}.mp3`;
      }

      // Skip if already cached
      const existing = await cache.match(url);
      if (!existing) {
        try {
          const resp = await fetch(url, { mode: 'cors' });
          if (resp.ok) await cache.put(url, resp);
        } catch {
          // Best-effort: skip this ayah
        }
      }
      done++;
      onProgress?.(done, total);
      // Micro-yield to not freeze UI
      if (done % 5 === 0) await new Promise(r => setTimeout(r, 0));
    }

    progress[surahNum] = 'done';
    saveProgress(progress);
    return 'done';
  } catch (err) {
    console.error('Download error:', err);
    progress[surahNum] = 'error';
    saveProgress(progress);
    return 'error';
  }
}

/** Remove cached audio for a surah */
export async function removeSurahCache(surahMeta, reciterCdn, cdnType = 'islamic') {
  if (!('caches' in window)) return;
  const surahNum = surahMeta.n;
  const total = surahAyahCount(surahMeta);
  const globalBase = surahMeta.globalStart || 1;

  try {
    const cache = await caches.open(CACHE_NAME);
    for (let i = 1; i <= total; i++) {
      let url;
      if (cdnType === 'everyayah') {
        const s = String(surahNum).padStart(3, '0');
        const a = String(i).padStart(3, '0');
        url = `https://everyayah.com/data/${reciterCdn}/${s}${a}.mp3`;
      } else {
        url = `https://cdn.islamic.network/quran/audio/128/${reciterCdn}/${globalBase + i - 1}.mp3`;
      }
      await cache.delete(url);
    }
    const progress = loadProgress();
    delete progress[surahNum];
    saveProgress(progress);
  } catch {}
}

/** Returns 'done' | 'partial' | null for a surah */
export function getSurahDownloadStatus(surahNum) {
  return loadProgress()[surahNum] || null;
}

/** Approximate total cache size in MB */
export async function getCacheSize() {
  if (!('caches' in window)) return 0;
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    let totalBytes = 0;
    for (const req of keys.slice(0, 20)) { // Sample first 20
      const resp = await cache.match(req);
      const blob = await resp?.blob();
      if (blob) totalBytes += blob.size;
    }
    const avgPerFile = keys.length > 0 ? totalBytes / Math.min(20, keys.length) : 0;
    return Math.round((avgPerFile * keys.length) / 1_048_576 * 10) / 10;
  } catch {
    return 0;
  }
}
