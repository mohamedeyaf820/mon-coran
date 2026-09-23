// Scratch commit helper. Not for commit.
import { readFileSync, writeFileSync } from "node:fs";
const f = ".scratch-diag/commit/apply/src/styles/domains/footer-refonte.css";
const s = readFileSync(f, "utf8");
const old = [
  "/* The footer's small print is the one place the app shows a Quran verse",
  "   translation, a reference and a source note. The root font-size is fluid",
  "   (15-17px), so the rem-only scales below drifted to 8.4-9.2px on a phone;",
  "   each one now carries a pixel floor. */",
].join("\n");
const neu = [
  "/* The footer's small print carries the Quran verse translation and its",
  "   reference. The root font-size is fluid (15-17px), so the rem-only scales",
  "   below drifted to 8.4-9.2px on a phone; each one now carries a pixel floor. */",
].join("\n");
const count = s.split(old).length - 1;
if (count !== 1) {
  console.error("occurrences:", count);
  process.exit(1);
}
writeFileSync(f, s.replace(old, neu), "utf8");
console.log("comment trimmed");
