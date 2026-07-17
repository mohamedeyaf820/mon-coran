import SURAHS, { getSurah, getSurahAyahCount } from "../data/surahs.js";
import { getMemorizationLevel } from "./memorizationService.js";

const PLAN_KEY = "mushafplus_memorization_plan_v1";
export const MEMORIZATION_PLAN_CHANGED_EVENT = "mushafplus-memorization-plan-changed";

export const MEMORIZATION_PRESETS = [
  { id: "fatiha", surahs: [1], dailyGoal: 2 },
  { id: "last-three", surahs: [112, 113, 114], dailyGoal: 3 },
  { id: "mulk", surahs: [67], dailyGoal: 5 },
  { id: "juz-amma", surahs: Array.from({ length: 37 }, (_, index) => 78 + index), dailyGoal: 5 },
];

function emitChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(MEMORIZATION_PLAN_CHANGED_EVENT));
  }
}

function normalizePlan(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const preset = MEMORIZATION_PRESETS.find((item) => item.id === value.presetId);
  const customSurah = Number(value.customSurah);
  if (!preset && (!Number.isInteger(customSurah) || customSurah < 1 || customSurah > 114)) {
    return null;
  }
  const dailyGoal = Math.max(1, Math.min(20, Number(value.dailyGoal) || preset?.dailyGoal || 3));
  const createdAt = Number(value.createdAt);
  return {
    presetId: preset?.id || "custom",
    customSurah: preset ? null : customSurah,
    dailyGoal,
    createdAt: Number.isInteger(createdAt) && createdAt > 0 ? createdAt : Date.now(),
  };
}

export function getMemorizationPlan() {
  try {
    return normalizePlan(JSON.parse(localStorage.getItem(PLAN_KEY) || "null"));
  } catch {
    return null;
  }
}

export function saveMemorizationPlan(plan) {
  const normalized = normalizePlan(plan);
  if (!normalized) return false;
  try {
    localStorage.setItem(PLAN_KEY, JSON.stringify(normalized));
    emitChange();
    return true;
  } catch {
    return false;
  }
}

export function clearMemorizationPlan() {
  try {
    localStorage.removeItem(PLAN_KEY);
    emitChange();
    return true;
  } catch {
    return false;
  }
}

export function getPlanSurahs(plan = getMemorizationPlan()) {
  if (!plan) return [];
  if (plan.presetId === "custom") return [getSurah(plan.customSurah)].filter(Boolean);
  const preset = MEMORIZATION_PRESETS.find((item) => item.id === plan.presetId);
  return (preset?.surahs || []).map(getSurah).filter(Boolean);
}

export function getPlanVerseRefs(plan = getMemorizationPlan()) {
  return getPlanSurahs(plan).flatMap((surah) =>
    Array.from({ length: getSurahAyahCount(surah.n) }, (_, index) => ({
      surah: surah.n,
      ayah: index + 1,
      level: getMemorizationLevel(surah.n, index + 1),
    })),
  );
}

export function getMemorizationPlanSummary(plan = getMemorizationPlan()) {
  const refs = getPlanVerseRefs(plan);
  const learned = refs.filter((ref) => ref.level >= 4).length;
  const mastered = refs.filter((ref) => ref.level === 5).length;
  const inProgress = refs.filter((ref) => ref.level > 0 && ref.level < 4).length;
  return {
    total: refs.length,
    learned,
    mastered,
    inProgress,
    percent: refs.length ? Math.round((learned / refs.length) * 100) : 0,
  };
}

export function getTodayMemorizationQueue(plan = getMemorizationPlan()) {
  if (!plan) return [];
  const refs = getPlanVerseRefs(plan);
  const pending = refs
    .filter((ref) => ref.level < 4)
    .sort((a, b) => a.level - b.level || a.surah - b.surah || a.ayah - b.ayah);
  if (pending.length) return pending.slice(0, plan.dailyGoal);
  return refs
    .filter((ref) => ref.level < 5)
    .sort((a, b) => a.level - b.level || a.surah - b.surah || a.ayah - b.ayah)
    .slice(0, plan.dailyGoal);
}

export function getMemorizationPresetMeta(id, lang = "fr") {
  const labels = {
    fatiha: { fr: "Al-Fatiha", en: "Al-Fatiha", ar: "\u0627\u0644\u0641\u0627\u062a\u062d\u0629" },
    "last-three": { fr: "Les trois protectrices", en: "The last three surahs", ar: "\u0627\u0644\u0633\u0648\u0631 \u0627\u0644\u062b\u0644\u0627\u062b \u0627\u0644\u0623\u062e\u064a\u0631\u0629" },
    mulk: { fr: "Al-Mulk", en: "Al-Mulk", ar: "\u0627\u0644\u0645\u0644\u0643" },
    "juz-amma": { fr: "Juz Amma", en: "Juz Amma", ar: "\u062c\u0632\u0621 \u0639\u0645\u0651" },
  };
  return labels[id]?.[lang] || labels[id]?.fr || "";
}

export function getMemorizationCatalog() {
  return SURAHS;
}
