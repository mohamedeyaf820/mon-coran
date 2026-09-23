import assert from "node:assert/strict";
import test from "node:test";

import {
  prepareSearchQuery,
  terminateSearchWorker,
} from "../src/services/searchWorkerService.js";

test("search preparation sanitizes input and resolves candidates without a worker", async () => {
  const result = await prepareSearchQuery(
    "  bismillah <script>  ",
    "phonetic",
  );
  assert.equal(result.sanitized.includes("<"), false);
  assert.equal(result.effectiveMode, "phonetic");
  assert.ok(result.candidates.length > 0);
});

test("search preparation falls back when worker messaging is unavailable", async () => {
  const originalWorker = globalThis.Worker;
  globalThis.Worker = class BrokenWorker {
    addEventListener() {}
    postMessage() {
      throw new Error("worker unavailable");
    }
    terminate() {}
  };

  try {
    const result = await prepareSearchQuery("miséricorde", "fr");
    assert.equal(result.sanitized, "miséricorde");
    assert.equal(result.effectiveMode, "fr");
  } finally {
    terminateSearchWorker();
    if (originalWorker === undefined) delete globalThis.Worker;
    else globalThis.Worker = originalWorker;
  }
});
