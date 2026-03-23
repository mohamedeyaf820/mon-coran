/**
 * Recent history service — stores the last MAX_ITEMS distinct surah visits.
 * Used by HomePage to show "Reprendre" shortcuts.
 */
const KEY = 'mushafplus_recent_history_v1';
const MAX_ITEMS = 3;

function sanitizeItem(entry) {
  if (!entry || typeof entry !== "object") return null;
  const surah = Number(entry.surah);
  const ayah = Number(entry.ayah);
  const ts = Number(entry.ts);
  const surahName = typeof entry.surahName === "string" ? entry.surahName.slice(0, 120) : "";

  if (!Number.isInteger(surah) || surah < 1 || surah > 114) return null;
  if (!Number.isInteger(ayah) || ayah < 1 || ayah > 286) return null;

  return {
    surah,
    ayah,
    surahName,
    ts: Number.isFinite(ts) && ts > 0 ? ts : Date.now(),
  };
}

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(raw)) return [];
    return raw.map(sanitizeItem).filter(Boolean).slice(0, MAX_ITEMS);
  } catch {
    return [];
  }
}
function save(data) {
  try {
    const safe = (Array.isArray(data) ? data : [])
      .map(sanitizeItem)
      .filter(Boolean)
      .slice(0, MAX_ITEMS);
    localStorage.setItem(KEY, JSON.stringify(safe));
  } catch {}
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
