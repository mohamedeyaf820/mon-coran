/**
 * Khatma Service — local, offline-first Quran completion planner.
 * Calculates daily targets, prayer pacing, and progress tracking
 * without any external cloud server or tracking.
 */

export const TOTAL_QURAN_PAGES = 604;
export const DEFAULT_KHATMA_DAYS = 30;
export const KHATMA_STORAGE_KEY = "mushaf_khatma_plan_v1";

export function getKhatmaPlan() {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KHATMA_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const targetDays = Number(parsed.targetDays);
    const startPage = Number(parsed.startPage);
    const currentPage = Number(parsed.currentPage);
    if (!Number.isFinite(targetDays) || targetDays < 1 || targetDays > 365) return null;
    return {
      targetDays: Math.floor(targetDays),
      startPage: Number.isFinite(startPage) && startPage >= 1 && startPage <= TOTAL_QURAN_PAGES ? Math.floor(startPage) : 1,
      currentPage: Number.isFinite(currentPage) && currentPage >= 1 && currentPage <= TOTAL_QURAN_PAGES ? Math.floor(currentPage) : 1,
      startDate: typeof parsed.startDate === "string" ? parsed.startDate : new Date().toISOString(),
      updatedAt: Number(parsed.updatedAt) || Date.now(),
      completed: Boolean(parsed.completed),
    };
  } catch {
    return null;
  }
}

export function saveKhatmaPlan(plan) {
  if (typeof localStorage === "undefined" || !plan) return false;
  try {
    const targetDays = Math.max(1, Math.min(365, Math.floor(Number(plan.targetDays) || DEFAULT_KHATMA_DAYS)));
    const startPage = Math.max(1, Math.min(TOTAL_QURAN_PAGES, Math.floor(Number(plan.startPage) || 1)));
    const currentPage = Math.max(startPage, Math.min(TOTAL_QURAN_PAGES, Math.floor(Number(plan.currentPage) || startPage)));
    const entry = {
      targetDays,
      startPage,
      currentPage,
      startDate: plan.startDate || new Date().toISOString(),
      updatedAt: Date.now(),
      completed: currentPage >= TOTAL_QURAN_PAGES,
    };
    localStorage.setItem(KHATMA_STORAGE_KEY, JSON.stringify(entry));
    return entry;
  } catch {
    return false;
  }
}

export function createKhatmaPlan(options = {}) {
  return saveKhatmaPlan(options);
}

export function deleteKhatmaPlan() {
  if (typeof localStorage === "undefined") return false;
  try {
    localStorage.removeItem(KHATMA_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

export function updateKhatmaCurrentPage(page) {
  const current = getKhatmaPlan();
  if (!current) return null;
  const newPage = Math.max(1, Math.min(TOTAL_QURAN_PAGES, Math.floor(Number(page) || 1)));
  return saveKhatmaPlan({ ...current, currentPage: newPage });
}

export function calculateKhatmaStatus(plan, explicitCurrentPage = null) {
  if (!plan) return null;
  const startPage = Math.max(1, Math.min(TOTAL_QURAN_PAGES, plan.startPage || 1));
  const currentPage = explicitCurrentPage != null
    ? Math.max(1, Math.min(TOTAL_QURAN_PAGES, Number(explicitCurrentPage)))
    : (plan.currentPage || startPage);
  const totalPagesToRead = Math.max(1, TOTAL_QURAN_PAGES - startPage + 1);
  const pagesRead = Math.max(0, Math.min(totalPagesToRead, currentPage - startPage + 1));
  const percentage = Math.min(100, Math.round((pagesRead / totalPagesToRead) * 100));

  const targetDays = Math.max(1, plan.targetDays || DEFAULT_KHATMA_DAYS);
  const dailyPages = Math.ceil(totalPagesToRead / targetDays);
  const pagesPerPrayer = Math.max(1, Math.ceil(dailyPages / 5));

  const startTime = new Date(plan.startDate).getTime();
  const now = Date.now();
  const daysElapsed = Math.max(0, Math.floor((now - startTime) / (1000 * 60 * 60 * 24)));
  const currentDayNumber = Math.min(targetDays, daysElapsed + 1);

  // The page where user should be by end of currentDayNumber
  const expectedPageToday = Math.min(
    TOTAL_QURAN_PAGES,
    startPage - 1 + Math.round(currentDayNumber * (totalPagesToRead / targetDays))
  );

  const diff = currentPage - expectedPageToday;
  let pace = "onTrack";
  if (diff >= 2) {
    pace = "ahead";
  } else if (diff <= -2) {
    pace = "behind";
  }

  const isCompleted = currentPage >= TOTAL_QURAN_PAGES || plan.completed;

  return {
    startPage,
    currentPage,
    pagesRead,
    totalPagesToRead,
    percentage,
    targetDays,
    dailyPages,
    pagesPerPrayer,
    currentDayNumber,
    expectedPageToday,
    diff,
    pace,
    isCompleted,
  };
}
