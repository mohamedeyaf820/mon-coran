import assert from "node:assert/strict";
import test from "node:test";

import {
  getAdaptiveAudioPreloadCount,
  isLowPerformanceDevice,
  shouldAvoidBackgroundWork,
  shouldSkipSpeculativePrefetch,
} from "../src/utils/networkPolicy.js";

test("network policy disables background work and audio warming with data saver", () => {
  const nav = {
    onLine: true,
    connection: { saveData: true, effectiveType: "4g", downlink: 20 },
  };
  assert.equal(shouldAvoidBackgroundWork(nav), true);
  assert.equal(getAdaptiveAudioPreloadCount(nav), 0);
});

test("network policy scales audio warming to the connection", () => {
  assert.equal(
    getAdaptiveAudioPreloadCount({
      onLine: true,
      deviceMemory: 2,
      connection: { effectiveType: "3g", downlink: 1.8 },
    }),
    1,
  );
  assert.equal(
    getAdaptiveAudioPreloadCount({
      onLine: true,
      deviceMemory: 8,
      connection: { effectiveType: "4g", downlink: 10 },
    }),
    3,
  );
});

test("low performance detection combines device and viewport signals", () => {
  const windowObject = {
    matchMedia: (query) => ({ matches: query.includes("max-width") }),
  };
  assert.equal(
    isLowPerformanceDevice({
      navigatorObject: {
        deviceMemory: 2,
        hardwareConcurrency: 2,
        connection: { effectiveType: "3g" },
      },
      windowObject,
    }),
    true,
  );
});

test("speculative prefetch needs bandwidth to spare, plain reading does not", () => {
  const slow4g = { onLine: true, connection: { effectiveType: "4g", downlink: 1.5 } };
  // Background work stays allowed on a 1.5 Mbps 4G link, a neighbour download is not.
  assert.equal(shouldAvoidBackgroundWork(slow4g), false);
  assert.equal(shouldSkipSpeculativePrefetch(slow4g), true);
  assert.equal(
    shouldSkipSpeculativePrefetch({ onLine: true, connection: { effectiveType: "4g", downlink: 9.4 } }),
    false,
  );
  // Browsers without the Network Information API are not penalised.
  assert.equal(shouldSkipSpeculativePrefetch({ onLine: true }), false);
  assert.equal(shouldSkipSpeculativePrefetch({ onLine: true, connection: { saveData: true } }), true);
});
