import assert from "node:assert/strict";
import test from "node:test";

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
};

const {
  clearPerformanceReport,
  getPerformanceReport,
  recordPerformanceMetric,
} = await import("../src/services/performanceMetrics.js");

test("performance metrics remain local and aggregate repeated samples", () => {
  clearPerformanceReport();
  recordPerformanceMetric("audio_start_ms", 400);
  recordPerformanceMetric("audio_start_ms", 600);
  const metric = getPerformanceReport().audio_start_ms;

  assert.equal(metric.count, 2);
  assert.equal(metric.min, 400);
  assert.equal(metric.max, 600);
  assert.equal(metric.average, 500);
  assert.equal(metric.last, 600);
});

test("performance metrics reject unsafe names and non-finite values", () => {
  clearPerformanceReport();
  assert.equal(recordPerformanceMetric("../secret", 1), null);
  assert.equal(recordPerformanceMetric("valid_metric", Number.NaN), null);
  assert.deepEqual(getPerformanceReport(), {});
});
