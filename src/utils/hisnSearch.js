import { foldSearchText } from "./searchIntelligence.js";

/**
 * Search over the Hisn al-Muslim chapters and invocations. Each haystack is
 * folded once when the library loads, not on every keystroke, and a query
 * narrows by requiring every typed term (Arabic is folded without vowel signs).
 */
export function buildHisnSearchIndex(chapters, translation = { chapters: {}, items: {} }) {
  const chapterRows = [];
  const itemRows = [];
  for (const chapter of chapters) {
    const title = translation.chapters?.[chapter.id] || "";
    chapterRows.push({ chapter, haystack: foldSearchText(`${chapter.ar} ${title}`) });
    for (const item of chapter.items) {
      const text = translation.items?.[item.id] || "";
      itemRows.push({
        chapter,
        item,
        haystack: foldSearchText(`${item.ar} ${text} ${chapter.ar} ${title}`),
      });
    }
  }
  return { chapterRows, itemRows };
}

export function searchHisnIndex(index, query, itemLimit = 40) {
  const terms = foldSearchText(query).split(" ").filter(Boolean);
  if (!terms.length) return null;
  const matches = (row) => terms.every((term) => row.haystack.includes(term));
  const itemMatches = index.itemRows.filter(matches);
  return {
    chapters: index.chapterRows.filter(matches).map((row) => row.chapter),
    items: itemMatches.slice(0, itemLimit).map(({ chapter, item }) => ({ chapter, item })),
    itemTotal: itemMatches.length,
  };
}
