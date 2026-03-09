/**
 * Recent history service — stores the last MAX_ITEMS distinct surah visits.
 * Used by HomePage to show "Reprendre" shortcuts.
 */
const KEY = 'mushafplus_recent_history_v1';
const MAX_ITEMS = 3;

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}

/**
 * Record a visit to a surah/ayah.
 * @param {number} surah
 * @param {number} ayah
 * @param {string} surahName - display name (fr / en)
 */
export function addRecentVisit(surah, ayah, surahName) {
  if (!surah || surah < 1 || surah > 114) return;
  const list = load().filter(
    v => !(v.surah === surah) // remove previous entry of same surah
  );
  list.unshift({ surah, ayah: ayah || 1, surahName: surahName || '', ts: Date.now() });
  save(list.slice(0, MAX_ITEMS));
}

/**
 * Get recent visits (newest first).
 * @returns {{ surah: number, ayah: number, surahName: string, ts: number }[]}
 */
export function getRecentVisits() {
  return load().slice(0, MAX_ITEMS);
}

/** Clear history. */
export function clearRecentHistory() {
  localStorage.removeItem(KEY);
}
