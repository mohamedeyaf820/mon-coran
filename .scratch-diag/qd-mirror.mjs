import { execSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
const REL = "src/components/QuranDisplay.jsx";
const head = execSync(`git show HEAD:${REL}`, { encoding: "utf8", maxBuffer: 1 << 26 });
const pairs = [
  [
    'rounded-2xl border border-border bg-bg-card p-6 text-center shadow-sm',
    'rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-6 text-center shadow-sm',
  ],
  [
    '<p className="text-lg text-text-main font-medium mb-3">',
    '<p className="text-lg text-[var(--text-primary)] font-medium mb-3">',
  ],
  [
    '<p className="text-lg text-text-main mb-8">',
    '<p className="text-lg text-[var(--text-primary)] mb-8">',
  ],
  [
    'backdrop-blur-xl bg-bg-card/90 m-4 rounded-3xl shadow-xl border border-white/10',
    'backdrop-blur-xl bg-[color-mix(in_srgb,var(--bg-card)_90%,transparent)] m-4 rounded-3xl shadow-xl border border-[var(--border)]',
  ],
  [
    'className="mb-5 text-primary/70"',
    'className="mb-5 text-[color-mix(in_srgb,var(--primary)_70%,transparent)]"',
  ],
  [
    '<p className="text-lg text-text-main font-medium mb-8">',
    '<p className="text-lg text-[var(--text-primary)] font-medium mb-8">',
  ],
];
let s = head;
for (const [a, b] of pairs) {
  const n = s.split(a).length - 1;
  if (n !== 1) throw new Error(`count ${n} for ${a.slice(0, 45)}`);
  s = s.replace(a, b);
}
const work = readFileSync(REL, "utf8");
for (const [, b] of pairs) {
  if (!work.includes(b.replace(/>$/, ""))) throw new Error(`worktree missing: ${b.slice(0, 45)}`);
}
writeFileSync(`.scratch-diag/committed3/${REL}`, s.replace("if (error)", 'if (error || localStorage.getItem("forceState") === "error")').replace("if (!loading && ayahs.length === 0)", 'if ((!loading && ayahs.length === 0) || localStorage.getItem("forceState") === "empty")'));
console.log("export patched + worktree consistency ok");
