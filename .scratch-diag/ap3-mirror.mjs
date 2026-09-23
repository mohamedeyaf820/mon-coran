import { readFileSync, writeFileSync } from "node:fs";
const pairs = [
  [
    'rounded-2xl border border-primary/15 bg-bg-card/70 p-2.5 shadow-sm',
    'rounded-2xl border border-[color-mix(in_srgb,var(--primary)_15%,transparent_85%)] bg-[color-mix(in_srgb,var(--bg-card)_70%,transparent)] p-2.5 shadow-sm',
  ],
  [
    'rounded-xl border border-primary/20 bg-primary/8 px-3.5 text-[0.78rem] font-semibold text-primary transition-colors hover:bg-primary/14',
    'rounded-xl border border-[color-mix(in_srgb,var(--primary)_20%,transparent_80%)] bg-[color-mix(in_srgb,var(--primary)_8%,transparent_92%)] px-3.5 text-[0.78rem] font-semibold text-[var(--primary)] transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_14%,transparent_86%)]',
  ],
  [
    'rounded-full bg-bg-card/80 px-1.5 py-0.5 text-[0.65rem] text-text-muted',
    'rounded-full bg-[var(--bg-card)] px-1.5 py-0.5 text-[0.65rem] text-[var(--text-secondary)]',
  ],
  [
    'uppercase tracking-wide text-text-muted/60',
    'uppercase tracking-wide text-[var(--text-muted)]',
  ],
  [
    'rounded-full border border-primary/15 bg-bg-card/60 px-2.5 py-1 text-[0.67rem] font-semibold text-text-secondary transition-colors hover:border-primary/30 hover:bg-primary/8 hover:text-primary',
    'rounded-full border border-[color-mix(in_srgb,var(--primary)_15%,transparent_85%)] bg-[color-mix(in_srgb,var(--bg-card)_60%,transparent)] px-2.5 py-1 text-[0.67rem] font-semibold text-[var(--text-secondary)] transition-colors hover:border-[color-mix(in_srgb,var(--primary)_30%,transparent_70%)] hover:bg-[color-mix(in_srgb,var(--primary)_8%,transparent_92%)] hover:text-[var(--primary)]',
  ],
  [
    'rounded-full bg-primary/10 px-1 text-[0.6rem] text-primary/70',
    'rounded-full bg-[color-mix(in_srgb,var(--primary)_10%,transparent_90%)] px-1 text-[0.6rem] text-[var(--primary)]',
  ],
];
for (const target of [
  ".scratch-diag/committed3/src/components/Home/ContentSection.jsx",
]) {
  let s = readFileSync(target, "utf8");
  for (const [a, b] of pairs) {
    const n = s.split(a).length - 1;
    if (n !== 1) throw new Error(`count ${n} for ${a.slice(0, 40)}`);
    s = s.replace(a, b);
  }
  writeFileSync(target, s);
  console.log("patched", target);
}
