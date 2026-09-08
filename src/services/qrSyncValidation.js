export const MAX_SYNC_TOKEN_LENGTH = 90000;

function check(condition) {
  if (!condition) throw new Error("Invalid or unsupported sync data");
}
const integer = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
function object(value) {
  check(value !== null && typeof value === "object" && !Array.isArray(value));
  check(Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
  for (const key of Object.keys(value)) check(!["__proto__", "constructor", "prototype"].includes(key));
}
function position(value) {
  object(value);
  // Structural bounds only: this format does not attest riwaya-specific numbering.
  check(integer(value.s, 1, 114) && integer(value.a, 1, 286));
}
export function validateSyncPayload(value) {
  object(value);
  check(value.app === "MushafPlus" && value.v === 1);
  check(integer(value.t, 0, Number.MAX_SAFE_INTEGER));
  position(value.pos);
  check(integer(value.pos.p, 1, 604) && integer(value.pos.j, 1, 30));
  check(["hafs", "warsh"].includes(value.rw));
  check(["light", "sepia", "dark"].includes(value.th));
  check(["surah", "page", "juz"].includes(value.dm));
  check(typeof value.rc === "string" && /^[a-z0-9._-]{1,80}$/i.test(value.rc));
  check(integer(value.fs, 12, 96));
  check(Array.isArray(value.bm) && value.bm.length <= 150);
  check(Array.isArray(value.nt) && value.nt.length <= 100);
  const bm = value.bm.map(record => {
    position(record);
    check(typeof record.l === "string" && record.l.length <= 200 && integer(record.t, 0, Number.MAX_SAFE_INTEGER));
    return { s: record.s, a: record.a, l: record.l, t: record.t };
  });
  const nt = value.nt.map(record => {
    position(record);
    check(typeof record.t === "string" && record.t.length <= 8000 && integer(record.u, 0, Number.MAX_SAFE_INTEGER));
    return { s: record.s, a: record.a, t: record.t, u: record.u };
  });
  for (const records of [bm, nt]) check(new Set(records.map(r => `${r.s}:${r.a}`)).size === records.length);
  const result = { app: "MushafPlus", v: 1, t: value.t, pos: { s: value.pos.s, a: value.pos.a, p: value.pos.p, j: value.pos.j }, rw: value.rw, th: value.th, rc: value.rc, fs: value.fs, dm: value.dm, bm, nt };
  check(new TextEncoder().encode(JSON.stringify(result)).length <= 64000);
  return result;
}
