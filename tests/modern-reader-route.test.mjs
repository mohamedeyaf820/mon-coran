import test from "node:test";
import assert from "node:assert/strict";

import { buildReaderHref, parseReaderRoute } from "../src/modern/reader/readerRoute.js";

test("parses and clamps modern reader routes", () => {
  assert.deepEqual(parseReaderRoute("/surah/2/255"), { mode: "surah", value: 2, ayah: 255 });
  assert.deepEqual(parseReaderRoute("/surah/999/999"), { mode: "surah", value: 114, ayah: 6 });
  assert.deepEqual(parseReaderRoute("/page/0"), { mode: "page", value: 1, ayah: null });
  assert.deepEqual(parseReaderRoute("/juz/44"), { mode: "juz", value: 30, ayah: null });
  assert.equal(parseReaderRoute("/settings"), null);
});

test("builds canonical reader links", () => {
  assert.equal(buildReaderHref({ mode: "surah", value: 36, ayah: 12 }), "/surah/36/12");
  assert.equal(buildReaderHref({ mode: "surah", value: 1, ayah: 1 }), "/surah/1");
  assert.equal(buildReaderHref({ mode: "page", value: 604 }), "/page/604");
  assert.equal(buildReaderHref({ mode: "juz", value: 30 }), "/juz/30");
});
