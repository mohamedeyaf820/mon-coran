import { readFileSync, writeFileSync } from "node:fs";

const OLD =
  "img-src 'self' data: blob: https://static.qurancdn.com https://static.quran.com https://www.assabile.com https://storage.googleapis.com";
const NEW = "img-src 'self' data: blob:";

for (const file of ["vercel.json", "netlify.toml"]) {
  const text = readFileSync(file, "utf8");
  const hits = text.split(OLD).length - 1;
  if (hits !== 1) {
    console.log(`${file}: ${hits} matches → skipped`);
    continue;
  }
  writeFileSync(file, text.replace(OLD, NEW), "utf8");
  console.log(`${file}: updated`);
}
