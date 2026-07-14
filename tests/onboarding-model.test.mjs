import test from "node:test";
import assert from "node:assert/strict";
import { completeOnboarding, shouldShowOnboarding } from "../src/modern/onboarding/onboardingModel.js";

function memoryStorage(entries = {}) {
  const values = new Map(Object.entries(entries));
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

test("onboarding opens for a genuinely new interactive user", () => {
  assert.equal(shouldShowOnboarding(memoryStorage()), true);
});

test("onboarding leaves configured legacy and automated users alone", () => {
  assert.equal(shouldShowOnboarding(memoryStorage({ "mushaf-plus-settings": "saved" })), false);
  assert.equal(shouldShowOnboarding(memoryStorage(), true), false);
});

test("onboarding can be forced from preferences and completed", () => {
  const storage = memoryStorage({ "mon-coran-force-onboarding": "1" });
  assert.equal(shouldShowOnboarding(storage, true), true);
  completeOnboarding(storage);
  assert.equal(shouldShowOnboarding(storage), false);
});
