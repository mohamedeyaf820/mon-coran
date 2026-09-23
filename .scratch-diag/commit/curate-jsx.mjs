// Scratch commit helper. Not for commit.
// Curated blob for SurahRecitationRow.jsx: HEAD + only the truncation span.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
const path = "src/components/recitation/SurahRecitationRow.jsx";
const head = execFileSync("git", ["show", `HEAD:${path}`], { encoding: "utf8" });
const old = `        <div className="recitation-row__title">\n          {label}\n`;
const neu = `        <div className="recitation-row__title">\n          <span className="recitation-row__name">{label}</span>\n`;
const c = head.split(old).length - 1;
if (c !== 1) {
  console.error("occurrences:", c);
  process.exit(1);
}
const out = ".scratch-diag/commit/jsx-SurahRecitationRow.jsx";
writeFileSync(out, head.replace(old, () => neu), "utf8");
const sha = execFileSync("git", ["hash-object", "-w", out], { encoding: "utf8" }).trim();
execFileSync("git", ["update-index", "--cacheinfo", `100644,${sha},${path}`]);
console.log("staged", path, sha.slice(0, 8));
