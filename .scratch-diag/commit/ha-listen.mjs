// Scratch commit helper — not for commit.
// Adds the 44px floor on .reciter-card__listen without importing the foreign
// --theme-text-inverse token that shares the same hunk.
import { readFileSync, writeFileSync } from "node:fs";
const path = ".scratch-diag/commit/apply/src/styles/home-audio-ux-refonte.css";
const old = `html body .app-root[data-view="home"] .reciter-card__actions .reciter-card__listen {
  min-height: 2.65rem !important;`;
const neu = `html body .app-root[data-view="home"] .reciter-card__actions .reciter-card__listen {
  /* 2.65rem = 36 px avec la racine fluide à 15 px. */
  min-width: max(2.65rem, 44px) !important;
  min-height: max(2.65rem, 44px) !important;`;
const text = readFileSync(path, "utf8");
const count = text.split(old).length - 1;
if (count !== 1) {
  console.error(`REJECT: old occurs ${count}x`);
  process.exit(1);
}
writeFileSync(path, text.replace(old, () => neu), { encoding: "utf8" });
console.log("listen floor applied");
