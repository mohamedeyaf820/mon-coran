import test from "node:test";
import assert from "node:assert/strict";

import { resolveAppSurface } from "../src/routing/appSurface.js";

test("routes legacy paths to the legacy surface", () => {
  for (const pathname of ["/legacy", "/legacy/", "/legacy/surah/1"]) {
    assert.equal(resolveAppSurface(pathname), "legacy", pathname);
  }
});

test("routes every other path to the modern surface", () => {
  for (const pathname of [
    "/",
    "/surah/1",
    "/legacy-copy",
    "/legacyish/surah/1",
  ]) {
    assert.equal(resolveAppSurface(pathname), "modern", pathname);
  }
});

test("uses the modern surface for missing or malformed pathnames", () => {
  for (const pathname of [undefined, null, "", "legacy", 42]) {
    assert.equal(resolveAppSurface(pathname), "modern");
  }
});
