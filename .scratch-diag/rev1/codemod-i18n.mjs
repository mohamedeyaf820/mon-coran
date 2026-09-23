import fs from "node:fs";

function patch(file, rules) {
  const raw = fs.readFileSync(file, "utf8");
  const crlf = raw.includes("\r\n");
  let src = crlf ? raw.replace(/\r\n/g, "\n") : raw;
  const report = [];
  for (const [re, to, expect] of rules) {
    const count = (src.match(re) || []).length;
    if (count !== expect) {
      throw new Error(`${file}: ${re} matched ${count}, expected ${expect}`);
    }
    src = src.replace(re, to);
    report.push(`${count}× ${re}`);
  }
  fs.writeFileSync(file, crlf ? src.replace(/\n/g, "\r\n") : src);
  console.log(`\n### ${file}`);
  report.forEach((r) => console.log("   ", r));
}

patch("src/components/AyahActions.jsx", [
  [/lang === "fr" \? "[^"]*" : "Listen"/g, 't("actions.listen", lang)', 4],
  [/lang === "fr" \? "[^"]*" : "Play"/g, 't("actions.listen", lang)', 1],
  [/lang === "fr" \? "[^"]*" : "Bookmark"/g, 't("actions.bookmark", lang)', 4],
  [/lang === "fr" \? "[^"]*" : "Copy"/g, 't("actions.copy", lang)', 3],
  [/lang === "fr" \? "[^"]*" : "Share"/g, 't("actions.share", lang)', 3],
  [/lang === "fr" \? "[^"]*" : "Copied"/g, 't("actions.copied", lang)', 1],
  [/lang === "fr" \? "Tafsir" : lang === "ar" \? "[^"]*" : "Tafsir"/g, 't("tafsir.title", lang)', 3],
  [/title="Tafsir"/g, 'title={t("tafsir.title", lang)}', 2],
  [/<span>Tafsir<\/span>/g, '<span>{t("tafsir.title", lang)}</span>', 1],
]);
