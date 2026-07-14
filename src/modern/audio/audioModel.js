const RESUME_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function formatAudioTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function buildAudioQueueState(items = [], currentGlobalNumber = null) {
  const normalized = (Array.isArray(items) ? items : []).slice(0, 300).map((item, index) => ({
    surah: Number(item?.surah || item?.surahNumber) || 1,
    ayah: Number(item?.ayah || item?.numberInSurah) || index + 1,
    number: Number(item?.number || item?.globalNumber) || null,
    text: String(item?.text || ""),
  }));
  const requestedIndex = normalized.findIndex((item) => item.number === Number(currentGlobalNumber));
  return { items: normalized, index: Math.max(0, requestedIndex), updatedAt: Date.now() };
}

export function normalizeAudioResume(value, now = Date.now()) {
  const surah = Number(value?.surah);
  const ayah = Number(value?.ayah);
  const reciter = typeof value?.reciter === "string" ? value.reciter : "";
  const timestamp = Number(value?.timestamp);
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) return null;
  if (!Number.isInteger(ayah) || ayah < 1 || ayah > 286 || !reciter) return null;
  if (!Number.isFinite(timestamp) || now - timestamp > RESUME_MAX_AGE) return null;
  return {
    surah,
    ayah,
    reciter,
    currentTime: Math.max(0, Number(value.currentTime) || 0),
    duration: Math.max(0, Number(value.duration) || 0),
    timestamp,
  };
}
