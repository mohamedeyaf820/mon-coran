import fs from "node:fs";
import { execSync } from "node:child_process";

execSync('git show HEAD:src/styles/mushaf-book.css > .scratch-diag/curated2/mb.css', { shell: true });
execSync('git show HEAD:tests/reader-ui-contract.test.mjs > .scratch-diag/curated2/ct.test.mjs', { shell: true });

let mb = fs.readFileSync(".scratch-diag/curated2/mb.css", "utf8");
const oldMb = `#root ~ .mfp-portal-root .qcm-page::before {
  content: "";
  position: absolute;
  z-index: 0;
  inset: 5px;`;
const newMb = `#root ~ .mfp-portal-root .qcm-page::before {
  content: "";
  position: absolute;
  /* Behind the page text: Mushaf glyph ink overflows the line measure at
     line ends, and a positioned z-index:0 layer paints over static text —
     its paper inset-shadow would then shear the overflowing ink. */
  z-index: -1;
  inset: 5px;`;
if (!mb.includes(oldMb)) throw new Error("mb anchor missing");
fs.writeFileSync(".scratch-diag/curated2/mb.css", mb.replace(oldMb, newMb));

let ct = fs.readFileSync(".scratch-diag/curated2/ct.test.mjs", "utf8");
const oldCt = "  assert.match(mushafBook, /--qcm-flow-fit/);";
const newCt = [
  "  assert.match(mushafBook, /--qcm-flow-fit/);",
  "  // The printed frame sits behind the text: a positioned z-index:0 layer",
  "  // paints over static flow ink, and its paper inset-shadow would shear",
  "  // any glyph that overflows the line measure at a line end.",
  "  assert.match(mushafBook, /\\.qcm-page::before \\{[\\s\\S]*?z-index: -1;/);",
].join("\n");
if (!ct.includes(oldCt)) throw new Error("ct anchor missing");
fs.writeFileSync(".scratch-diag/curated2/ct.test.mjs", ct.replace(oldCt, newCt));
console.log("curated blobs written");
