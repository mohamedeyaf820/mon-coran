// scratch: keep only the hunks of a patch whose body mentions a pattern
import { readFileSync, writeFileSync } from "node:fs";

const [,, inFile, pattern, outFile] = process.argv;
const text = readFileSync(inFile, "utf8").replace(/\r\n/g, "\n");
const lines = text.split("\n");
const header = [];
const hunks = [];
let cur = null;
for (const line of lines) {
  if (line.startsWith("@@")) {
    if (cur) hunks.push(cur);
    cur = [line];
  } else if (cur) {
    cur.push(line);
  } else {
    header.push(line);
  }
}
if (cur) hunks.push(cur);

const re = new RegExp(pattern);
const kept = hunks.filter((h) => re.test(h.join("\n")));
console.error(`hunks: ${hunks.length} total, ${kept.length} kept`);
writeFileSync(outFile, header.join("\n") + "\n" + kept.map((h) => h.join("\n").replace(/\n+$/, "")).join("\n") + "\n");
