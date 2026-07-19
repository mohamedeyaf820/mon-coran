import assert from "node:assert/strict";
import test from "node:test";

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");

async function withStorage(storage, callback) {
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: { storage },
  });
  try {
    await callback();
  } finally {
    if (originalNavigator) {
      Object.defineProperty(globalThis, "navigator", originalNavigator);
    } else {
      delete globalThis.navigator;
    }
  }
}

const {
  ensureStorageCapacity,
  estimateAudioDownloadBytes,
  getStorageSnapshot,
} = await import("../src/services/storageQuotaService.js");

test("storage quota reports usage, remaining capacity and persistence", async () => {
  await withStorage(
    {
      estimate: async () => ({ usage: 20, quota: 100 }),
      persisted: async () => true,
    },
    async () => {
      assert.deepEqual(await getStorageSnapshot(), {
        supported: true,
        usage: 20,
        quota: 100,
        available: 80,
        usageRatio: 0.2,
        persisted: true,
      });
    },
  );
});

test("storage quota blocks a download that would consume the reserve", async () => {
  await withStorage(
    {
      estimate: async () => ({
        usage: 90 * 1024 * 1024,
        quota: 100 * 1024 * 1024,
      }),
      persisted: async () => false,
    },
    async () => {
      const result = await ensureStorageCapacity({
        estimatedAdditionalBytes: 2 * 1024 * 1024,
        reserveBytes: 12 * 1024 * 1024,
      });
      assert.equal(result.allowed, false);
      assert.equal(result.reason, "quota");
    },
  );
});

test("audio estimates account for stream and verse downloads", () => {
  assert.equal(estimateAudioDownloadBytes(1, true), 24 * 1024 * 1024);
  assert.equal(estimateAudioDownloadBytes(10, false), 10 * 384 * 1024);
});
