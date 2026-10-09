import SURAHS from "../../data/surahs";
import { hadithCollectionName } from "../../data/hadithCollections";
import { hubText } from "../../utils/duasHubText";

/** Title of a chapter in the reading language; Arabic readers see the Arabic title alone. */
export function chapterTitleFor(chapter, translation, lang) {
  if (lang === "ar") return chapter.ar;
  return translation?.chapters?.[chapter.id] || chapter.ar;
}

export function surahName(surah, lang) {
  const meta = SURAHS[surah - 1];
  if (!meta) return String(surah);
  return lang === "ar" ? meta.ar : lang === "fr" ? meta.fr : meta.en;
}

export function quranRangeLabel([surah, from, to], lang) {
  const verses = to > from ? `${from}-${to}` : String(from);
  return `${surahName(surah, lang)} ${surah}:${verses}`;
}

/** How close the wording of the hadith is to the invocation, only when it is not the whole text. */
export function matchNote(match, lang) {
  if (match === "fuzzy") return hubText("closeMatch", lang);
  if (match === "partial" || match === "fragment") return hubText("excerptMatch", lang);
  return null;
}

/** Plain-text sources of one item, for the copy action and the share card. */
export function hisnSourceLines(item, lang) {
  const lines = [];
  for (const range of item.q || []) lines.push(`${hubText("quranRefLabel", lang)} ${quranRangeLabel(range, lang)}`);
  for (const ref of item.h || []) lines.push(`${hadithCollectionName(ref.c, lang)} ${ref.n}`);
  return lines;
}
