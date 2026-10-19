import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

// Vercel applies every matching header rule in order and a later Cache-Control
// replaces an earlier one: the catch-all must come first or it overrides the
// long cache of hashed assets and fonts (seen in production, 2026-10-18).
test("vercel.json: the catch-all header rule precedes the immutable asset rules", () => {
  const { headers } = JSON.parse(readFileSync("vercel.json", "utf8"));
  const index = (source) => headers.findIndex((entry) => entry.source === source);
  const root = index("/(.*)");
  assert.ok(root >= 0, "catch-all rule exists");
  for (const source of ["/assets/(.*)", "/fonts/(.*)", "/data/(.*)"]) {
    assert.ok(index(source) > root, `${source} must come after the catch-all rule`);
  }
});
