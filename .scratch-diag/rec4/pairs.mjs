// scratch: pair each <img> src with its alt, and flag the Basfar row by codepoints
import { readFileSync } from "node:fs";

const BASFAR = String.fromCodePoint(0x0639, 0x0628, 0x062f, 0x0627, 0x0644, 0x0644, 0x0647, 0x0020, 0x0628, 0x0635, 0x0641, 0x0631);
const MATROOD = String.fromCodePoint(0x0639, 0x0628, 0x062f, 0x0627, 0x0644, 0x0644, 0x0647, 0x0020, 0x0627, 0x0644, 0x0645, 0x0637, 0x0631, 0x0648, 0x062f);

const html = readFileSync(new URL("./sq_basfar.html", import.meta.url), "utf8");
for (const tag of html.match(/<img[^>]*>/g) || []) {
  const src = tag.match(/src="([^"]+)"/)?.[1];
  const alt = (tag.match(/alt="([^"]*)"/)?.[1] || "").trim();
  if (!src) continue;
  const mark = alt.includes(BASFAR) ? "  <<< BASFAR" : alt.includes(MATROOD) ? "  <<< MATROOD" : "";
  if (mark) console.log(`alt-codepoints=[${[...alt].map((c) => c.codePointAt(0).toString(16)).join(" ")}]\nsrc=${src}${mark}`);
}
