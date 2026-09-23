// Scratch analyzer over .scratch-diag/resp/<raw>. Not for commit.
import { readFileSync, writeFileSync } from "node:fs";

const RAW = (process.argv[2] || "raw.json").replace(/^--?/, "");
const OUT = (process.argv[3] || "findings.txt").replace(/^--?/, "");
const R = JSON.parse(readFileSync(`.scratch-diag/resp/${RAW}`, "utf8"));
const rows = R.filter((r) => !r.error);
const errs = R.filter((r) => r.error);

const ignore = (el) =>
  /app-skip-link|sr-only|quran-word-item|native-ayah-marker|word-item|\.cpv-|tajwid/.test(el);

const bucket = new Map();
const key = (p) => `${p.profile}|${p.view}`;

for (const r of rows) {
  const g = [];
  if (r.overflowX > 1)
    g.push({ kind: "OVERFLOW-X", detail: `${r.overflowX}px`, el: (r.overflowers[0]?.el || "?") + (r.overflowers.length > 1 ? ` (+${r.overflowers.length - 1})` : "") });
  for (const s of r.small.filter((x) => x.kind === "control" && !ignore(x.el)))
    g.push({ kind: "TARGET", detail: `${s.w}x${s.h}`, el: s.el });
  for (const c of r.clipped.filter((x) => !x.ellipsis && !ignore(x.el)))
    g.push({ kind: "CLIP-" + (c.axis || "X"), detail: `-${c.lost}px`, el: c.el });
  for (const t of r.tinyText.filter((x) => !ignore(x.el)))
    g.push({ kind: "TINY", detail: `${t.fs}px`, el: t.el });
  for (const o of r.outside.filter((x) => x.pos === "fixed" && !ignore(x.el)))
    g.push({ kind: "PAINTS-PAST", detail: `right ${o.right}`, el: o.el });
  for (const f of r.tallFixed.filter((x) => !ignore(x.el)))
    g.push({ kind: "FIXED-TALL", detail: `${f.w}x${f.h} of ${r.w}x${r.h}`, el: f.el });

  for (const item of g) {
    const sig = `${r.profile}|${r.view}|${item.kind}|${item.el}`;
    if (!bucket.has(sig)) bucket.set(sig, { ...item, profile: r.profile, view: r.view, sizes: [], worst: item.detail });
    const b = bucket.get(sig);
    b.sizes.push(r.w);
    const num = parseFloat(item.detail.replace(/[^0-9.]/g, ""));
    const wnum = parseFloat(b.worst.replace(/[^0-9.]/g, ""));
    if ((item.kind === "TARGET" || item.kind === "TINY") && num < wnum) b.worst = item.detail;
    if ((item.kind.startsWith("CLIP") || item.kind === "OVERFLOW-X") && num > wnum) b.worst = item.detail;
  }
}

const byView = new Map();
for (const b of bucket.values()) {
  const k = key(b);
  if (!byView.has(k)) byView.set(k, []);
  byView.get(k).push(b);
}

const KIND_ORDER = ["OVERFLOW-X", "PAINTS-PAST", "FIXED-TALL", "TARGET", "CLIP-X", "CLIP-Y", "TINY"];
let out = "";
for (const [k, items] of byView) {
  const [p, v] = k.split("|");
  items.sort((a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind) || a.el.localeCompare(b.el));
  out += `\n===== ${p} / ${v} =====\n`;
  for (const it of items) {
    out += `  ${it.kind.padEnd(11)} ${String(it.worst).padEnd(10)} @${it.sizes.length ? Math.min(...it.sizes) : "?"}-${Math.max(...it.sizes)}px  ${it.el}\n`;
  }
}

const counts = {};
for (const b of bucket.values()) counts[b.kind] = (counts[b.kind] || 0) + 1;
out = `TOTAL signatures: ${bucket.size}  ${JSON.stringify(counts)}\n` +
  `nav failures: ${[...new Set(errs.map((e) => e.profile + "/" + e.view))].join(", ") || "none"}\n` +
  `rows: ${rows.length}/${R.length}\n` + out;

// per-view overflow summary across sizes
out += "\n===== overflowX par vue/taille =====\n";
for (const r of rows.filter((x) => x.overflowX > 1)) {
  out += `  ${r.profile}/${r.view} @${r.w}px -> ${r.overflowX}px  ${r.overflowers.slice(0, 2).map((o) => o.el).join(" | ")}\n`;
}
writeFileSync(`.scratch-diag/resp/${OUT}`, out);
console.log(out.slice(0, 12000));
