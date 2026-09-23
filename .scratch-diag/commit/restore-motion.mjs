// Scratch commit helper. Not for commit.
// Re-applies MY hover-media / :active work in the three blocks where the
// foreign `--theme-text-inverse` token migration is interleaved, keeping HEAD's
// literal `color: #fff` so the foreign hunk stays out of the commit.
import { readFileSync, writeFileSync } from "node:fs";
const f = ".scratch-diag/commit/apply/src/styles/domains/recitation-polish.css";
let s = readFileSync(f, "utf8");

const pairs = [
  [
    `.reciter-radio-button:hover {
    filter: brightness(1.08);
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(var(--primary-rgb), 0.32), 0 4px 8px rgba(var(--primary-rgb), 0.2);
}

.reciter-radio-button:active {
    transform: translateY(0);`,
    `@media (hover: hover) and (pointer: fine) {
    .reciter-radio-button:hover {
        filter: brightness(1.08);
        transform: translateY(-2px);
        box-shadow: 0 12px 28px rgba(var(--primary-rgb), 0.32), 0 4px 8px rgba(var(--primary-rgb), 0.2);
    }
}

.reciter-radio-button:active {
    transform: scale(0.97);`,
  ],
  [
    `.recitation-action-btn--primary:hover:not(:disabled) {
    background: color-mix(in srgb, var(--primary) 86%, #000 14%);
    color: #fff;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(var(--primary-rgb), 0.3);
}

.recitation-action-btn--primary:active:not(:disabled) {
    transform: translateY(0);`,
    `@media (hover: hover) and (pointer: fine) {
    .recitation-action-btn--primary:hover:not(:disabled) {
        background: color-mix(in srgb, var(--primary) 86%, #000 14%);
        color: #fff;
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(var(--primary-rgb), 0.3);
    }
}

.recitation-action-btn--primary:active:not(:disabled) {
    transform: scale(0.97);`,
  ],
  [
    `.app-root .reciter-card__listen:hover {
    background: var(--primary);
    border-color: var(--primary);
    color: #fff;
    transform: scale(1.04);
}
`,
    `@media (hover: hover) and (pointer: fine) {
    .app-root .reciter-card__listen:hover {
        background: var(--primary);
        border-color: var(--primary);
        color: #fff;
        transform: scale(1.04);
    }
}

.app-root .reciter-card__listen:active {
    transform: scale(0.96);
}
`,
  ],
];

for (const [i, [old, neu]] of pairs.entries()) {
  const c = s.split(old).length - 1;
  if (c !== 1) {
    console.error(`REJECT pair #${i + 1}: ${c} occurrences`);
    process.exit(1);
  }
  s = s.replace(old, () => neu);
}
writeFileSync(f, s, "utf8");
console.log("3 motion blocks restored");
