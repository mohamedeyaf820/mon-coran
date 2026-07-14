export const ONBOARDING_KEY = "mon-coran-modern-onboarding";
export const FORCE_ONBOARDING_KEY = "mon-coran-force-onboarding";

const LEGACY_KEYS = [
  "mushaf-plus-settings",
  "mushafplus_read_progress",
  "mushaf_khatma_v1",
  "reading-history",
];

export function shouldShowOnboarding(storage, isAutomated = false) {
  if (!storage) return false;
  if (storage.getItem(FORCE_ONBOARDING_KEY) === "1") return true;
  if (storage.getItem(ONBOARDING_KEY) === "complete") return false;
  if (isAutomated) return false;
  return !LEGACY_KEYS.some((key) => storage.getItem(key));
}

export function completeOnboarding(storage) {
  storage?.setItem(ONBOARDING_KEY, "complete");
  storage?.removeItem(FORCE_ONBOARDING_KEY);
}
