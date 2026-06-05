import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { isAllowedExternalUrl } from "../src/lib/security.js";
import { buildCspPolicy } from "../scripts/cspPolicy.mjs";
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
  assert.equal(isAllowedExternalUrl("https://ia800304.us.archive.org/audio/test.mp3"), false);
  assert.equal(isAllowedExternalUrl("javascript:alert(1)"), false);
});

test("security: production CSP excludes dev-only and unused risky sources", () => {
  const csp = buildCspPolicy("production");
  assert.equal(csp.includes("'unsafe-eval'"), false);
  assert.equal(csp.includes("ia800304.us.archive.org"), false);
  assert.equal(csp.includes("ws://localhost"), false);
});

test("security: deployment CSP headers match the generated production policy", () => {
  const generated = buildCspPolicy("production");
  const netlify = readFileSync("netlify.toml", "utf8").match(
    /Content-Security-Policy = "([^"]+)"/,
  )?.[1];
  const vercelRoot = JSON.parse(readFileSync("vercel.json", "utf8")).headers.find(
    (entry) => entry.source === "/(.*)",
  );
  const vercel = vercelRoot?.headers.find(
    (header) => header.key === "Content-Security-Policy",
  )?.value;

  assert.equal(netlify, generated);
  assert.equal(vercel, generated);
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
