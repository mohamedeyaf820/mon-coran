import assert from "node:assert/strict";
import test from "node:test";

import { getSurahAyahCount } from "../src/data/surahs.js";
import { THEMATIC_INDEX } from "../src/data/thematicIndex.js";
import {
  clearMemorizationPlan,
  getMemorizationPlan,
  getMemorizationPlanSummary,
  getTodayMemorizationQueue,
  saveMemorizationPlan,
} from "../src/services/memorizationPlanService.js";

function createMockStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("phase 7: thematic landmarks use valid and localized Quran references", () => {
  const ids = new Set();
  for (const topic of THEMATIC_INDEX) {
    assert.equal(ids.has(topic.id), false, `duplicate topic ${topic.id}`);
    ids.add(topic.id);
    assert.ok(topic.labels.fr);
    assert.ok(topic.labels.en);
    assert.ok(topic.labels.ar);
    assert.ok(topic.refs.length > 0);
    for (const ref of topic.refs) {
      assert.ok(ref.surah >= 1 && ref.surah <= 114);
      assert.ok(ref.from >= 1 && ref.from <= getSurahAyahCount(ref.surah));
      if (ref.to) {
        assert.ok(ref.to >= ref.from && ref.to <= getSurahAyahCount(ref.surah));
      }
    }
  }
});

test("phase 7: memorization journey builds a bounded daily queue", () => {
  globalThis.localStorage = createMockStorage();
  assert.equal(saveMemorizationPlan({ presetId: "fatiha", dailyGoal: 2 }), true);

  const plan = getMemorizationPlan();
  const queue = getTodayMemorizationQueue(plan);
  const summary = getMemorizationPlanSummary(plan);

  assert.equal(plan.presetId, "fatiha");
  assert.equal(queue.length, 2);
  assert.deepEqual(queue.map(({ surah, ayah }) => [surah, ayah]), [[1, 1], [1, 2]]);
  assert.deepEqual(summary, {
    total: 7,
    learned: 0,
    mastered: 0,
    inProgress: 0,
    percent: 0,
  });
});

test("phase 7: corrupt or out-of-range memorization plans are ignored", () => {
  globalThis.localStorage = createMockStorage();
  localStorage.setItem("mushafplus_memorization_plan_v1", JSON.stringify({
    presetId: "custom",
    customSurah: 999,
    dailyGoal: 200,
  }));
  assert.equal(getMemorizationPlan(), null);
  assert.equal(clearMemorizationPlan(), true);
});
