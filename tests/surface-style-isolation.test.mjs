import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("keeps legacy styles out of the shared entrypoint", async () => {
  const main = await read("../src/main.jsx");
  assert.doesNotMatch(main, /styles\/(domains|responsive|ui-polish)/);
  assert.match(main, /resolveAppSurface/);
});

test("mounts a dynamic surface without top-level await", async () => {
  const main = await read("../src/main.jsx");
  assert.doesNotMatch(main, /\?\s*await import|:\s*await import/);
  assert.match(main, /\.then\(/);
});

test("loads existing styles only from the legacy surface", async () => {
  const legacyStyles = await read("../src/legacy/legacyStyles.js");
  const modernRoot = await read("../src/modern/ModernRoot.jsx");

  assert.match(legacyStyles, /styles\/tailwind\.css/);
  assert.match(legacyStyles, /styles\/expert-overhaul\.css/);
  assert.doesNotMatch(modernRoot, /legacyStyles|styles\/domains|expert-overhaul/);
  assert.match(modernRoot, /modern\.css/);
});
