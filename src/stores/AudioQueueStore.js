const QUEUE_KEY = "mushaf_recitation_queue_v1";
const RESUME_KEY = "mushaf_recitation_resume_v1";

function safeReadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export function getQueueState() {
  const payload = safeReadJson(QUEUE_KEY, { items: [], index: 0, updatedAt: 0 });
  return {
    items: Array.isArray(payload.items) ? payload.items.slice(0, 300) : [],
    index: Number.isFinite(payload.index) ? Math.max(0, payload.index) : 0,
    updatedAt: Number(payload.updatedAt) || 0,
  };
}

export function setQueueState(next) {
  const safeNext = {
    items: Array.isArray(next?.items) ? next.items.slice(0, 300) : [],
    index: Number.isFinite(next?.index) ? Math.max(0, next.index) : 0,
    updatedAt: Date.now(),
  };
  safeWriteJson(QUEUE_KEY, safeNext);
  return safeNext;
}

export function getResumeState() {
  const payload = safeReadJson(RESUME_KEY, null);
  if (!payload) return null;
  const surah = Number(payload.surah) || 1;
  const ayah = Number(payload.ayah) || 1;
  const reciterId = typeof payload.reciterId === "string" ? payload.reciterId : "";
  return {
    surah,
    ayah,
    reciterId,
    source: typeof payload.source === "string" ? payload.source : "manual",
    updatedAt: Number(payload.updatedAt) || 0,
  };
}

export function setResumeState(next) {
  if (!next) return;
  const safeNext = {
    surah: Number(next.surah) || 1,
    ayah: Number(next.ayah) || 1,
    reciterId: typeof next.reciterId === "string" ? next.reciterId : "",
    source: typeof next.source === "string" ? next.source : "manual",
    updatedAt: Date.now(),
  };
  safeWriteJson(RESUME_KEY, safeNext);
}
