export const MOBILE_BREAKPOINT = 1024;

const CARD_STORAGE_KEY = "mushaf_player_card_pos_v6";
const RECITER_COOLDOWN_STEPS_MS = [
  30 * 1000,
  8 * 60 * 1000,
  25 * 60 * 1000,
  90 * 60 * 1000,
  4 * 60 * 60 * 1000,
];

function isValidCardPos(pos) {
  return (
    pos &&
    typeof pos === "object" &&
    Number.isFinite(pos.x) &&
    Number.isFinite(pos.y)
  );
}

export function loadCardPos() {
  try {
    const raw = localStorage.getItem(CARD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (isValidCardPos(parsed)) return parsed;
    localStorage.removeItem(CARD_STORAGE_KEY);
  } catch {}
  return null;
}

export function saveCardPos(pos) {
  if (!isValidCardPos(pos)) return;
  try {
    localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(pos));
  } catch {}
}

export function clearCardPos() {
  try {
    localStorage.removeItem(CARD_STORAGE_KEY);
  } catch {}
}

export function clampCardPosition(x, y, w, h, margin = 12, viewport) {
  const viewportWidth = viewport?.width ?? window.innerWidth;
  const viewportHeight = viewport?.height ?? window.innerHeight;
  const safeWidth = Math.max(1, Math.min(Number(w) || 1, viewportWidth - margin * 2));
  const safeHeight = Math.max(
    1,
    Math.min(Number(h) || 1, viewportHeight - margin * 2),
  );
  const maxX = Math.max(margin, viewportWidth - safeWidth - margin);
  const maxY = Math.max(margin, viewportHeight - safeHeight - margin);
  const fallbackX = maxX;
  const fallbackY = Math.max(Math.min(88, maxY), viewportHeight - safeHeight - 24);
  const safeX = Number.isFinite(x) ? x : fallbackX;
  const safeY = Number.isFinite(y) ? y : fallbackY;
  return {
    x: Math.max(margin, Math.min(maxX, safeX)),
    y: Math.max(margin, Math.min(maxY, safeY)),
  };
}

export function getReciterCooldownMs(failCount) {
  const safeFails = Math.max(1, Number(failCount) || 1);
  const idx = Math.min(RECITER_COOLDOWN_STEPS_MS.length - 1, safeFails - 1);
  return RECITER_COOLDOWN_STEPS_MS[idx];
}

export function formatAudioTime(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
