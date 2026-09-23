import fs from "node:fs";
import ar from "../../src/i18n/ar.js";

const page = ar.quran.nextPage.split(" ")[0];
const juz = ar.quran.nextJuz.split(" ")[0];
const A = {
  bookmark: ar.actions.addBookmark.split(" ").pop(),
  listenPage: `${ar.actions.listen} ${page}`,
  listenJuz: `${ar.actions.listen} ${juz}`,
  readingNav: `تنقل ${ar.header.reading}`,
};

const blocks = {
  fr: { actions: "Favori", audio: "Écouter la page|Écouter le juz", nav: "Navigation de lecture" },
  en: { actions: "Bookmark", audio: "Listen page|Listen juz", nav: "Reading navigation" },
  ar: { actions: A.bookmark, audio: `${A.listenPage}|${A.listenJuz}`, nav: A.readingNav },
};

function insert(file, values) {
  const raw = fs.readFileSync(file, "utf8");
  const crlf = raw.includes("\r\n");
  let src = crlf ? raw.replace(/\r\n/g, "\n") : raw;
  const [listenPage, listenJuz] = values.audio.split("|");
  const edits = [
    [
      /^(\s*actions: \{\n)/m,
      `$1    bookmark: '${values.actions}',\n`,
    ],
    [
      /^(\s*audio: \{\n)/m,
      `$1    listenPage: '${listenPage}', listenJuz: '${listenJuz}',\n`,
    ],
    [/^(\s*nav: \{\n)/m, `$1    readingNavigation: '${values.nav}',\n`],
  ];
  for (const [re, to] of edits) {
    if (!re.test(src)) throw new Error(`${file}: missing block ${re}`);
    src = src.replace(re, to);
  }
  fs.writeFileSync(file, crlf ? src.replace(/\n/g, "\r\n") : src);
  console.log("patched", file);
}

insert("src/i18n/fr.js", blocks.fr);
insert("src/i18n/en.js", blocks.en);
insert("src/i18n/ar.js", blocks.ar);
