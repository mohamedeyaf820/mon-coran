import test from "node:test";
import assert from "node:assert/strict";
import { encodeSyncToken, decodeSyncToken, applySyncPayload } from "../src/services/qrSyncService.js";
const payload = () => ({ app: "MushafPlus", v: 1, t: 1, pos: { s: 1, a: 1, p: 1, j: 1 }, rw: "hafs", th: "light", rc: "ar.alafasy", fs: 25, dm: "surah", bm: [], nt: [{ s: 1, a: 1, t: "ملاحظة personnelle", u: 1 }] });
test("QR preserves UTF-8 notes and accepts a full fragment URL", () => {
  const data = payload();
  assert.deepEqual(decodeSyncToken(`https://example.com/#sync=${encodeSyncToken(data)}`), data);
});
test("QR rejects unsupported versions, invalid coordinates and oversized arrays", () => {
  for (const patch of [{ v: 2 }, { fs: NaN }, { rw: "unknown" }, { pos: { s: -1, a: 1, p: 1, j: 1 } }, { bm: Array(151).fill({ s: 1, a: 1, l: "", t: 1 }) }]) {
    assert.throws(() => encodeSyncToken({ ...payload(), ...patch }));
  }
  assert.throws(() => decodeSyncToken("a".repeat(90001)));
});
test("QR rejects prototype keys and duplicate note IDs", () => {
  const dangerous = JSON.parse(JSON.stringify(payload()).replace('"app":', '"__proto__":{},"app":'));
  assert.throws(() => encodeSyncToken(dangerous));
  const duplicate = payload(); duplicate.nt.push(duplicate.nt[0]);
  assert.throws(() => encodeSyncToken(duplicate));
});
test("QR validates direct imports before accessing storage", async () => {
  await assert.rejects(applySyncPayload({ ...payload(), v: 200 }));
});
