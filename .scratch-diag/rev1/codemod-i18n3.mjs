import fs from "node:fs";
import ar from "../../src/i18n/ar.js";

const bookmarked = `في ${ar.actions.bookmark}`;

function addBookmarkKey(file, value) {
  const raw = fs.readFileSync(file, "utf8");
  const crlf = raw.includes("\r\n");
  let src = crlf ? raw.replace(/\r\n/g, "\n") : raw;
  const re = /^(\s*bookmark: '[^']*',\n)/m;
  if (!re.test(src)) throw new Error(`${file}: bookmark line missing`);
  src = src.replace(re, `$1    bookmarked: '${value}',\n`);
  fs.writeFileSync(file, crlf ? src.replace(/\n/g, "\r\n") : src);
  console.log("added actions.bookmarked to", file);
}

addBookmarkKey("src/i18n/fr.js", "Favori");
addBookmarkKey("src/i18n/en.js", "Bookmarked");
addBookmarkKey("src/i18n/ar.js", bookmarked);

function patch(file, rules) {
  const raw = fs.readFileSync(file, "utf8");
  const crlf = raw.includes("\r\n");
  let src = crlf ? raw.replace(/\r\n/g, "\n") : raw;
  for (const [re, to, expect] of rules) {
    const count = (src.match(re) || []).length;
    if (count !== expect) throw new Error(`${file}: ${re} matched ${count}, expected ${expect}`);
    src = src.replace(re, to);
    console.log(`   ${count}× ${re}`);
  }
  fs.writeFileSync(file, crlf ? src.replace(/\n/g, "\r\n") : src);
}

patch("src/components/AyahActions.jsx", [
  [/\(lang === "fr" \? "[^"]*" : "Bookmarked"\)/g, 't("actions.bookmarked", lang)', 1],
  [/\(lang === "fr" \? "[^"]*" : "Pause"\)/g, 't("audio.pause", lang)', 1],
  [/ \? "Pause" : \(t\("actions\.listen", lang\)\)/g, ' ? t("audio.pause", lang) : t("actions.listen", lang)', 3],
  [/\(t\((\"[^\"]+\"), lang\)\)/g, 't($1, lang)', 8],
]);
