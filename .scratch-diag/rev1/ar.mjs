const w = (cp) => String.fromCodePoint(...cp);
const A = {
  ghayr: w([0x063a, 0x064a, 0x0631]),
  nashit: w([0x0646, 0x0634, 0x0637]),
  haddid: w([0x062d, 0x062f, 0x062f]),
  alnuqtatayn: w([0x0627, 0x0644, 0x0646, 0x0642, 0x0637, 0x062a, 0x064a, 0x0646]),
  alif: w([0x0623]),
  wa: w([0x0648]),
  ba: w([0x0628]),
  athnaa: w([0x0623, 0x0646, 0x0627, 0x0621]),
  altilawa: w([0x0627, 0x0644, 0x062a, 0x0644, 0x0627, 0x0648, 0x0629]),
  ibda: w([0x0627, 0x0628, 0x062f, 0x0623]),
  lihadid: w([0x0644, 0x062d, 0x062f, 0x064a, 0x062f]),
};
const s1 = `${A.ghayr} ${A.nashit} \u2014 ${A.haddid} ${A.alnuqtatayn} ${A.alif} ${A.wa} ${A.ba} ${A.athnaa} ${A.altilawa}`;
const s2 = `${A.ibda} ${A.altilawa} ${A.lihadid} ${A.alnuqtatayn}`;
const esc = (s) => [...s].map((c) => (c.codePointAt(0) > 127 ? `\\u${c.codePointAt(0).toString(16).padStart(4, "0")}` : c)).join("");
console.log("S1", esc(s1));
console.log("S2", esc(s2));
import { writeFileSync } from "node:fs";
writeFileSync(".scratch-diag/rev1/ar-out.txt", `${s1}\n${s2}\n`, "utf8");
console.log("S1-verify", JSON.stringify(s1) === JSON.stringify(unescapeEsc(s1)) ? "ok" : "?", "dir", /^[A-Za-z ]/.test(s1) ? "latin?" : "arabic");
function unescapeEsc(s) { return s; }
