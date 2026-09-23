import ar from "../../src/i18n/ar.js";

// Take the noun phrases the app already writes elsewhere, so a new label never
// invents a second Arabic word for the same thing.
const page = ar.quran.nextPage.split(" ")[0];
const juz = ar.quran.nextJuz.split(" ")[0];

export const AR = {
  bookmark: ar.actions.addBookmark.split(" ").pop(),
  listenPage: `${ar.actions.listen} ${page}`,
  listenJuz: `${ar.actions.listen} ${juz}`,
  readingNav: `تنقل ${ar.header.reading}`,
};
console.log(JSON.stringify({ page, juz, AR }, null, 1));
