import { getJuzForAyah } from "../../data/juz";
import SURAHS, { toAr } from "../../data/surahs";

// Composition helpers shared by the Hafs and Warsh page renderers: both
// riwayas print the same Madani sheet (15 lines, surah openings, centred
// surah endings) and differ only in how words are sourced and set.

// Normalize Arabic text to ensure proper diacritic rendering
export function normalizeArabicText(text) {
  if (!text) return "";
  return String(text).normalize("NFC");
}

export function getVerseKey(word) {
  return `${Number(word.surah)}:${Number(word.ayah)}`;
}

export function getSurahMeta(surah) {
  return SURAHS[Number(surah) - 1] || null;
}

// The words API only carries verses. In the Madani layout a surah opens on a
// fresh line under its title band and, except for Al-Fatiha (whose basmala is
// verse 1) and At-Tawbah, the basmala: those slots come back as empty lines
// above the first word, so this restores them the way the printed page reads.
// A single Warsh page may carry several small surahs (Al-Ikhlas, Al-Falaq,
// An-Nas) — every ayah-1 with an empty slot above receives its own header.
export function placeSurahOpenings(lines, { warsh = false } = {}) {
  const processed = new Set();
  lines.forEach((line, index) => {
    const first = line.words[0];
    if (!first) return;
    if (Number(first.ayah) !== 1 || Number(first.position || 1) !== 1) return;
    const surah = Number(first.surah);
    const key = `${surah}:${index}`;
    if (processed.has(key)) return;
    processed.add(key);

    const above = lines[index - 1];
    if (!above || above.words.length > 0 || above.kind) return;
    const above2 = lines[index - 2];
    const hasBasmalaLine =
      surah !== 9 && (surah !== 1 || warsh) && above2 && above2.words.length === 0 && !above2.kind;
    if (hasBasmalaLine) {
      above2.kind = "surah-header";
      above2.surah = surah;
      above.kind = "basmala";
      above.surah = surah;
    } else {
      above.kind = "surah-header";
      above.surah = surah;
    }
  });
  return lines;
}

// A surah's final line is centred when it does not fill the measure.
export function markSurahEndings(lines) {
  lines.forEach((line) => {
    const closes = line.words.some((word) => {
      if (word.charType !== "end") return false;
      const meta = getSurahMeta(word.surah);
      return meta && Number(word.ayah) === Number(meta.ayahs);
    });
    if (closes) line.endsSurah = true;
  });
  return lines;
}

export function getPageMeta(ayahs, currentPage, lang) {
  const first = ayahs[0] || {};
  const last = ayahs[ayahs.length - 1] || first;
  const juz =
    first.juz ||
    getJuzForAyah(first.surah?.number, first.numberInSurah) ||
    "";
  const hizb = first.hizb || "";
  const rub = first.rubElHizb || "";
  const page = lang === "ar" ? toAr(currentPage) : currentPage;
  // The printed folio medallion always uses Arabic-Indic digits, the way the
  // Madani Mushaf sets it, whatever the interface language.
  const folio = toAr(currentPage);
  const surahMeta = getSurahMeta(first.surah?.number);
  const surahName = surahMeta
    ? lang === "ar"
      ? surahMeta.ar
      : lang === "en"
        ? surahMeta.en
        : surahMeta.fr
    : first.surah?.name || "";

  return {
    page,
    folio,
    surahName,
    top: lang === "ar" ? `صفحة ${page}` : `Page ${page}`,
    middle:
      lang === "ar"
        ? `سورة ${first.surah?.number || ""} · ${first.numberInSurah || ""}‏–‏${last.numberInSurah || ""}`
        : `Surah ${first.surah?.number || ""} · ${first.numberInSurah || ""}–${last.numberInSurah || ""}`,
    sideA: `${lang === "ar" ? "جزء" : "Juz"} ${lang === "ar" ? toAr(juz) : juz}`,
    sideB: `${lang === "ar" ? "حزب" : "Hizb"} ${lang === "ar" ? toAr(hizb) : hizb}`,
    sideC: rub ? `${lang === "ar" ? "ربع" : "Rubʿ"} ${lang === "ar" ? toAr(rub) : rub}` : "",
  };
}
