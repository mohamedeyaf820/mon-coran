// Scratch analyzer v2 : agrège les signatures cross-vue/cross-taille. Not for commit.
import { readFileSync, writeFileSync } from "node:fs";

const FILE = process.argv[2] || ".scratch-diag/resp/raw-full.json";
const R = JSON.parse(readFileSync(FILE, "utf8"));
const rows = R.filter((r) => !r.error);

const IGNORE = [
  /app-skip-link/, /sr-only/, /quran-word-item/, /native-ayah-marker/,
  /\.cpv-/, /tajwid-(rule|rich|tooltip)/, /watermark/, /mushaf-|verse-span|ayah-text|qc-ayah/,
];
const ign = (el) => IGNORE.some((re) => re.test(el));

// class-only signature (drop the text run)
const sig = (el) => el.replace(/\s“.*$/, "").replace(/^span\.\s/, "span:").slice(0, 70);

const agg = new Map();
const add = (kind, el, size, val, ctx) => {
  if (ign(el)) return;
  const k = `${kind}|${sig(el)}`;
  if (!agg.has(k)) agg.set(k, { kind, el: sig(el), worst: val, sizes: new Set(), views: new Set(), samples: [] });
  const a = agg.get(k);
  a.sizes.add(size);
  a.views.add(`${ctx.profile}/${ctx.view}`);
  const n = parseFloat(String(val).replace(/[^0-9.]/g, "")) || 0;
  const w = parseFloat(String(a.worst).replace(/[^0-9.]/g, "")) || 0;
  const lowerBetter = kind === "TARGET" || kind === "TINY";
  if (lowerBetter ? n < w : n > w) a.worst = val;
  if (a.samples.length < 6) a.samples.push(`${ctx.profile}/${ctx.view}@${size}:${val}`);
};

for (const r of rows) {
  if (r.overflowX > 1) add("OVERFLOW-X", r.overflowers[0]?.el || "(page)", r.w, `${r.overflowX}px`, r);
  for (const s of r.small.filter((x) => x.kind === "control")) add("TARGET", s.el, r.w, `${s.w}x${s.h}`, r);
  for (const c of r.clipped.filter((x) => !x.ellipsis)) add("CLIP-" + (c.axis || "X"), c.el, r.w, `-${c.lost}px`, r);
  // `text-overflow: ellipsis` is still lost content when the run is a sentence:
  // the home verse card truncated a whole French translation behind one "…".
  for (const c of r.clipped.filter((x) => x.ellipsis && x.lost > 24)) add("TRUNC", c.el, r.w, `-${c.lost}px`, r);
  for (const t of r.tinyText) add("TINY", t.el, r.w, `${t.fs}px`, r);
  for (const f of r.tallFixed) add("FIXED-TALL", f.el, r.w, `${f.w}x${f.h}`, r);
}

const list = [...agg.values()].sort(
  (a, b) =>
    b.views.size - a.views.size ||
    b.sizes.size - a.sizes.size ||
    a.kind.localeCompare(b.kind),
);

let out = `${list.length} signatures distinctes (${rows.length} mesures, ${[...new Set(rows.map((r) => r.view))].length} vues x ${[...new Set(rows.map((r) => r.profile))].length} profils)\n\n`;
for (const a of list) {
  out += `[${a.kind}] worst=${a.worst} vues=${a.views.size} tailles=${[...a.sizes].sort((x, y) => x - y).join(",")}\n    ${a.el}\n`;
}
writeFileSync(process.argv[3] || ".scratch-diag/resp/findings-v2.txt", out);
console.log(out.slice(0, 15000));
