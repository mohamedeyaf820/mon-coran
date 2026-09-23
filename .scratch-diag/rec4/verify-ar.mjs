// scratch: prove the inserted Arabic is intact, not reordered
import { readFileSync } from "node:fs";

const p = JSON.parse(readFileSync(new URL("../../public/data/reciter-profiles.json", import.meta.url), "utf8"));
const rec = p.adel_al_kalbani;

const cp = (s) => [...s].map((c) => c.codePointAt(0).toString(16)).join(" ");
// Expected words, each built from codepoints so the check itself is trustworthy.
const expected = {
  albanna: String.fromCodePoint(0x0627, 0x0644, 0x0628, 0x0646, 0x0627),
  kalbani: String.fromCodePoint(0x0627, 0x0644, 0x0643, 0x0644, 0x0628, 0x0627, 0x0646, 0x064a),
  riyadh: String.fromCodePoint(0x0627, 0x0644, 0x0631, 0x064a, 0x0627, 0x0636),
  imam: String.fromCodePoint(0x0625, 0x0645, 0x0627, 0x0645),
  haram: String.fromCodePoint(0x0627, 0x0644, 0x062d, 0x0631, 0x0645),
};

console.log("ar:", rec.bio.ar);
console.log("len fr/en/ar:", rec.bio.fr.length, rec.bio.en.length, rec.bio.ar.length);
for (const [k, w] of Object.entries(expected)) {
  console.log(`${k} ${cp(w)} -> ${rec.bio.ar.includes(w) ? "present" : "MISSING"}`);
}
// No combining marks should have leaked in, and no Latin inside the Arabic text.
const markRe = new RegExp(`[${String.fromCodePoint(0x064b, 0x064c, 0x064d, 0x064e, 0x064f, 0x0650, 0x0651, 0x0652, 0x0653, 0x0654, 0x0670)}]`, "g");
const marks = rec.bio.ar.match(markRe) || [];
console.log("diacritics:", marks.length, "| latin chars:", (rec.bio.ar.match(/[A-Za-z]/g) || []).length);
console.log("bioSource:", rec.bioSource.provider, rec.bioSource.url);
