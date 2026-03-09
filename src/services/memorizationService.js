/**
 * Memorization service — star rating (0-5) per verse, persisted in localStorage.
 */
const KEY = 'mushafplus_memorization_v1';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}
function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* quota */ }
}

/** Stable string key for a verse. */
const vKey = (surah, ayah) => `${surah}:${ayah}`;

/** Get memorization level 0–5 for a verse. */
export function getMemorizationLevel(surah, ayah) {
  return load()[vKey(surah, ayah)] ?? 0;
}

/** Set memorization level 0–5. */
export function setMemorizationLevel(surah, ayah, level) {
  const data = load();
  const k = vKey(surah, ayah);
  if (level === 0) {
    delete data[k];
  } else {
    data[k] = Math.max(0, Math.min(5, Number(level) | 0));
  }
  save(data);
}

/** Get all memorized verses as array of { surah, ayah, level }. */
export function getAllMemorized() {
  const data = load();
  return Object.entries(data).map(([k, level]) => {
    const [surah, ayah] = k.split(':').map(Number);
    return { surah, ayah, level };
  });
}

/** Count of verses per level (for stats). */
export function getMemorizationStats() {
  const data = load();
  const counts = [0, 0, 0, 0, 0, 0]; // index = level
  Object.values(data).forEach(l => { counts[l] = (counts[l] || 0) + 1; });
  return counts;
}
