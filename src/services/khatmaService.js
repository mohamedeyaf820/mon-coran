/**
 * Khatma Service — Quran completion goal tracker
 * Total Quran: 604 pages (Hafs / standard mushaf)
 */

const KEY = 'mushaf_khatma_v1';

import {
  khatmaGoalSchema,
  readLocalStorageWithSchema,
  writeLocalStorageJson,
} from "./storageValidation";

const TOTAL_PAGES = 604;

export function getKhatmaGoal() {
  return readLocalStorageWithSchema(KEY, khatmaGoalSchema.nullable(), null);
}

export function setKhatmaGoal({ targetDays, startPage = 1, startDate = null }) {
  const safeTargetDays = Math.max(1, Math.min(3650, Number(targetDays) || 1));
  const safeStartPage = Math.max(1, Math.min(TOTAL_PAGES, Number(startPage) || 1));
  const goal = {
    startDate: startDate || new Date().toISOString().slice(0, 10),
    targetDays: safeTargetDays,
    startPage: safeStartPage,
  };
  writeLocalStorageJson(KEY, goal);
  return goal;
}

export function clearKhatmaGoal() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
}

export function getDailyQuota(targetDays) {
  return Math.ceil(TOTAL_PAGES / Math.max(1, targetDays));
}

export function getKhatmaStats(currentPage) {
  const goal = getKhatmaGoal();
  if (!goal) return null;

  const today = new Date().toISOString().slice(0, 10);
  const start = new Date(goal.startDate);
  const now   = new Date(today);
  const elapsedDays = Math.max(0, Math.floor((now - start) / 86_400_000));
  const remainingDays = Math.max(0, goal.targetDays - elapsedDays);

  const pagesRead = Math.max(0, currentPage - goal.startPage);
  const pagesLeft = Math.max(0, TOTAL_PAGES - goal.startPage - pagesRead);
  const dailyQuota = getDailyQuota(goal.targetDays);
  const expectedPage = Math.min(TOTAL_PAGES, goal.startPage + elapsedDays * dailyQuota);
  const pct = Math.min(100, Math.round((pagesRead / (TOTAL_PAGES - goal.startPage + 1)) * 100));

  // Estimated completion date based on current pace
  let estDoneDate = null;
  if (pagesRead > 0 && elapsedDays > 0) {
    const pacePerDay = pagesRead / elapsedDays;
    const daysNeeded = pagesLeft / pacePerDay;
    const estDate = new Date();
    estDate.setDate(estDate.getDate() + Math.ceil(daysNeeded));
    estDoneDate = estDate.toISOString().slice(0, 10);
  }

  return {
    startDate: goal.startDate,
    targetDays: goal.targetDays,
    dailyQuota,
    elapsedDays,
    remainingDays,
    pagesRead,
    pagesLeft,
    currentPage,
    expectedPage,
    onTrack: currentPage >= expectedPage,
    pct,
    estDoneDate,
    endDate: (() => {
      const d = new Date(goal.startDate);
      d.setDate(d.getDate() + goal.targetDays);
      return d.toISOString().slice(0, 10);
    })(),
  };
}

/** Preset schedules */
export const KHATMA_PRESETS = [
  { days: 7,   labelFr: '1 semaine',     labelAr: 'أسبوع',       labelEn: '1 week',      pagesDay: 87 },
  { days: 30,  labelFr: '1 mois',        labelAr: 'شهر واحد',    labelEn: '1 month',     pagesDay: 21 },
  { days: 60,  labelFr: '2 mois',        labelAr: 'شهران',       labelEn: '2 months',    pagesDay: 11 },
  { days: 90,  labelFr: '3 mois',        labelAr: 'ثلاثة أشهر',  labelEn: '3 months',    pagesDay: 7  },
  { days: 180, labelFr: '6 mois',        labelAr: 'ستة أشهر',    labelEn: '6 months',    pagesDay: 4  },
  { days: 365, labelFr: '1 an',          labelAr: 'سنة كاملة',   labelEn: '1 year',      pagesDay: 2  },
];
