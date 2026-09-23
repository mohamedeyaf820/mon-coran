// Scratch commit helper. Not for commit.
// Splits a single-file `git diff -U<n>` into hunks, keeps only the requested
// ones by 1-based index, and writes a patch applyable to the HEAD baseline.
// Usage: node .scratch-diag/commit/split-hunks.mjs <in.diff> <out.diff> <keep: e.g. 3-20,22>
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath, keepSpec] = process.argv;
const lines = readFileSync(inPath, "utf8").split("\n");
const headerEnd = lines.findIndex((l) => l.startsWith("@@"));
const header = lines.slice(0, headerEnd);
const hunks = [];
let cur = null;
for (const l of lines.slice(headerEnd)) {
  if (l.startsWith("@@")) {
    if (cur) hunks.push(cur);
    cur = { lines: [l] };
  } else if (cur) {
    cur.lines.push(l);
  }
}
if (cur) hunks.push(cur);

const keep = new Set();
for (const part of keepSpec.split(",")) {
  if (!part) continue;
  const [a, b] = part.split("-").map(Number);
  if (b) for (let i = a; i <= b; i++) keep.add(i);
  else keep.add(a);
}

console.log(`hunks found: ${hunks.length}`);
for (const [i, h] of hunks.entries()) {
  const body = h.lines
    .filter((l) => /^[+-]/.test(l) && !/^(\+\+\+|---)/.test(l))
    .slice(0, 2)
    .join(" ⏎ ")
    .slice(0, 110);
  console.log(`${keep.has(i + 1) ? "KEEP" : "DROP"} #${i + 1} ${h.lines[0]}  ${body}`);
}
const kept = [...header, ...hunks.filter((_, i) => keep.has(i + 1)).flatMap((h) => h.lines)];
while (kept.length && kept[kept.length - 1] === "") kept.pop();
writeFileSync(outPath, kept.join("\n") + "\n", "utf8");
console.log(`kept ${keep.size} of ${hunks.length} -> ${outPath}`);
