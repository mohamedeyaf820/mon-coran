import fs from "node:fs";

function patch(file, rules) {
  const raw = fs.readFileSync(file, "utf8");
  const crlf = raw.includes("\r\n");
  let src = crlf ? raw.replace(/\r\n/g, "\n") : raw;
  const report = [];
  for (const [re, to, expect] of rules) {
    const count = (src.match(re) || []).length;
    if (count !== expect) throw new Error(`${file}: ${re} matched ${count}, expected ${expect}`);
    src = src.replace(re, to);
    report.push(`${count}× ${re}`);
  }
  fs.writeFileSync(file, crlf ? src.replace(/\n/g, "\r\n") : src);
  console.log(`### ${file}`);
  report.forEach((r) => console.log("   ", r));
}

// "Verse 5" was announced to a screen reader in English even in Arabic.
patch("src/components/QuranDisplay/AyahList.jsx", [
  [/\$\{lang === "fr" \? "[^"]*" : "Verse"\} \$\{currentPlayingAyah\.surah\}/,
   '${t("quran.ayah", lang)} ${currentPlayingAyah.surah}', 1],
  [/^import React/m, 'import { t } from "../../i18n";\nimport React', 1],
]);

patch("src/components/QuranDisplay/QCReadingView.jsx", [
  [/\$\{lang === "fr" \? "[^"]*" : "Verse"\} \$\{ayah\.numberInSurah\}/,
   '${t("quran.ayah", lang)} ${ayah.numberInSurah}', 1],
]);

patch("src/components/QuranDisplay/JuzMode.jsx", [
  [/lang === "ar" \? undefined : lang === "fr" \? "[^"]*" : "Listen juz"/,
   'lang === "ar" ? undefined : t("audio.listenJuz", lang)', 1],
]);

patch("src/components/QuranDisplay/PageMode.jsx", [
  [/lang === "ar" \? undefined : lang === "fr" \? "[^"]*" : "Listen page"/,
   'lang === "ar" ? undefined : t("audio.listenPage", lang)', 1],
]);

patch("src/components/QuranDisplay/ModeNavigation.jsx", [
  [/lang === "ar" \? "[^"]*" : lang === "fr" \? "[^"]*" : "Reading navigation"/,
   't("nav.readingNavigation", lang)', 1],
  [/^import \{ cn \} from "\.\.\/\.\.\/lib\/utils";$/m,
   'import { cn } from "../../lib/utils";\nimport { t } from "../../i18n";', 1],
]);
