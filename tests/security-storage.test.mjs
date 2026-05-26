import test from "node:test";
import assert from "node:assert/strict";

import { isAllowedExternalUrl } from "../src/lib/security.js";
import {
  readLocalStorageWithSchema,
  writeLocalStorageJson,
  memorizationMapSchema,
} from "../src/services/storageValidation.js";

function createMockStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

test("security: allows only whitelisted https hosts", () => {
  assert.equal(isAllowedExternalUrl("https://wa.me/?text=ok"), true);
  assert.equal(isAllowedExternalUrl("https://twitter.com/test"), true);
  assert.equal(isAllowedExternalUrl("https://evil.example.com"), false);
  assert.equal(isAllowedExternalUrl("javascript:alert(1)"), false);
});

test("storage: rejects invalid localStorage key format", () => {
  globalThis.localStorage = createMockStorage();
  const ok = writeLocalStorageJson("bad key with space", { a: 1 });
  assert.equal(ok, false);
});

test("storage: validates schema and returns fallback on corruption", () => {
  globalThis.localStorage = createMockStorage();
  localStorage.setItem("mushafplus_memorization_v1", JSON.stringify({ "x:y": 99 }));

  const fallback = {};
  const value = readLocalStorageWithSchema(
    "mushafplus_memorization_v1",
    memorizationMapSchema,
    fallback,
  );

  assert.deepEqual(value, fallback);
});
