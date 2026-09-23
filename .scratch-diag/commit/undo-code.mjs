// Scratch: remove my tajweed class-map extraction hunks from the working tree,
// preserving each file's real line endings. Not for commit.
import { readFileSync, writeFileSync } from "node:fs";

const EOL_OF = (s) => (s.includes("\r\n") ? "\r\n" : "\n");
const toEol = (s, eol) => s.replace(/\r?\n/g, eol);

// --- 1. src/components/Quran/TajweedText.jsx -------------------------------
const twPath = "src/components/Quran/TajweedText.jsx";
let tw = readFileSync(twPath, "utf8");
const twEol = EOL_OF(tw);

const twImport = "import { ruleFromClassName } from '../../utils/quranComTajweedClasses';" + twEol;
if (!tw.includes(twImport)) throw new Error("TajweedText: my import line not found");
tw = tw.replace(twImport, "");

// HEAD keeps the local map + helper right before parseQuranComTajweedHtml.
const head = readFileSync(".scratch-diag/commit/base-tw.jsx", "utf8");
const start = head.indexOf("const QURAN_COM_CLASS_MAP = {");
const end = head.indexOf("function parseQuranComTajweedHtml");
if (start < 0 || end < 0 || end < start) throw new Error("HEAD block bounds not found");
const block = toEol(head.slice(start, end).replace(/\s+$/, "") + "\n\n", twEol);

const anchor = "function parseQuranComTajweedHtml";
const at = tw.indexOf(anchor);
if (at < 0) throw new Error("TajweedText: anchor not found");
tw = tw.slice(0, at) + block + tw.slice(at);
writeFileSync(twPath, tw);

// --- 2. tests/tajwid-segments.test.mjs ------------------------------------
const tPath = "tests/tajwid-segments.test.mjs";
let t = readFileSync(tPath, "utf8");
const tEol = EOL_OF(t);

const tImport = 'import { ruleFromClassName } from "../src/utils/quranComTajweedClasses.js";' + tEol;
if (!t.includes(tImport)) throw new Error("test: my import line not found");
t = t.replace(tImport, "");

const marker = "// Census of every class name Quran.com emits";
const cut = t.indexOf(marker);
if (cut < 0) throw new Error("test: my census block not found");
t = t.slice(0, cut).replace(/[\r\n]+$/, tEol);
writeFileSync(tPath, t);

console.log("removed my hunks from both files");
