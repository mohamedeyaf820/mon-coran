// Scratch diagnostic — not for commit.
// Trace one sweep finding across the records that produced it.
// usage: node resp-probe.mjs <raw.json> small|tiny|clip|trunc "<text needle>"
import { readFileSync } from "node:fs";
const [file, kind, needle] = process.argv.slice(2);
if (!file || !kind) {
  console.error("usage: resp-probe.mjs <raw.json> small|tiny|clip|trunc <needle>");
  process.exit(2);
}
const raw = JSON.parse(readFileSync(file, "utf8"));
const key = { small: "small", tiny: "tiny", clip: "clipped", trunc: "truncated" }[kind] ?? kind;
const first = raw.find((r) => Array.isArray(r[key]));
if (!first) {
  console.error(`no "${key}" arrays; record keys = ${Object.keys(first || raw[0]).join(",")}`);
  console.error("sample small entry:", JSON.stringify((first?.small || [])[0]));
  console.error("sample clipped entry:", JSON.stringify((first?.clipped || [])[0]));
  process.exit(1);
}
console.log("entry shape:", JSON.stringify((first[key] || [])[0]));
for (const r of raw) {
  for (const e of r[key] || []) {
    const label = e.el ?? e.sel ?? JSON.stringify(e);
    if (needle && !label.includes(needle)) continue;
    const size = e.w && e.h ? `${e.w}x${e.h}` : e.w !== undefined ? `w=${e.w}` : "";
    console.log(
      `${r.appView ?? r.view} | ${r.w}x${r.h} | ${r.profile} | ${size} ${e.lost !== undefined ? `lost=${e.lost}` : ""} | ${label.slice(0, 90)}`,
    );
  }
}
