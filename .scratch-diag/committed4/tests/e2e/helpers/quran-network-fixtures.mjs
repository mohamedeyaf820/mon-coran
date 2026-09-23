import SURAHS from "../../../src/data/surahs.js";
import { getWarshSurahAyahCount } from "../../../src/constants/warshSource.js";

const SURAH_COUNTS = new Map(
  SURAHS.map((surah) => [Number(surah.n), Number(surah.ayahs)]),
);

function verseCount(surah) {
  return SURAH_COUNTS.get(Number(surah)) || 20;
}

const FATIHA_WORDS = {
  1: ["بِسْمِ", "اللَّهِ", "الرَّحْمَٰنِ", "الرَّحِيمِ"],
  2: ["الْحَمْدُ", "لِلَّهِ", "رَبِّ", "الْعَالَمِينَ"],
};

function mockQuranComVerse(
  surah,
  ayah,
  page = 1,
  juz = 1,
  { corruptFatihaWords = false, withWaqfSigns = false } = {},
) {
  const isNajmFourthAyah = Number(surah) === 53 && Number(ayah) === 4;
  const isFatiha = Number(surah) === 1;
  const canonicalWords = isNajmFourthAyah
    ? ["إِنْ", "هُوَ", "إِلَّا", "وَحْيٌ", "يُوحَىٰ"]
    : (isFatiha ? FATIHA_WORDS[Number(ayah)] || [] : []);
  const baseText = canonicalWords.length > 0
    ? canonicalWords.join(" ")
    : `نَصُّ حَفْصٍ التَّجْرِيبِيُّ ${ayah}`;
  const text = withWaqfSigns && Number(ayah) === 2
    ? `${baseText}\u06D7 وَقْفٌ\u06DA مُبِينٌ\u06D6`
    : baseText;
  const wordPayload = corruptFatihaWords && Number(surah) === 1 && Number(ayah) === 1
    ? FATIHA_WORDS[2]
    : withWaqfSigns && Number(ayah) === 2
      ? text.split(/\s+/)
      : canonicalWords.length > 0 ? canonicalWords : text.split(/\s+/);
  return {
    id: Number(surah) * 1000 + ayah,
    chapter_id: Number(surah),
    verse_key: `${surah}:${ayah}`,
    verse_number: ayah,
    page_number: page,
    juz_number: juz,
    hizb_number: 1,
    rub_el_hizb_number: 1,
    ruku_number: 1,
    manzil_number: 1,
    text_uthmani: text,
    text_uthmani_simple: text,
    text_uthmani_tajweed: isNajmFourthAyah
      ? '<span class="tajweed-ghunnah">إِنْ</span> هُوَ إِلَّا <span class="tajweed-madda_normal">وَحْيٌ</span> يُوحَىٰ'
      : text,
    text_qpc_hafs: text,
    text_qpc_nastaleeq_hafs: text,
    translations: [
      {
        resource_id: 136,
        text: `Traduction française de test ${surah}:${ayah}`,
      },
      {
        resource_id: 131,
        text: `Test English translation ${surah}:${ayah}`,
      },
    ],
    words: wordPayload.map((word, index) => ({
      id: Number(surah) * 100000 + Number(ayah) * 100 + index + 1,
      chapter_id: Number(surah),
      verse_key: `${surah}:${ayah}`,
      location: `${surah}:${ayah}:${index + 1}`,
      position: index + 1,
      page_number: page,
      line_number: 1 + ((Number(ayah) - 1) % 15),
      text_uthmani: word,
      text_uthmani_tajweed:
        index === 0
          ? `<span class="tajweed-ghunnah">${word}</span>`
          : index === 3
            ? `<span class="tajweed-madda_normal">${word}</span>`
            : word,
      text_qpc_hafs: word,
      char_type_name: "word",
    })),
  };
}

function quranComVersesForUrl(url, options) {
  const chapterMatch = url.pathname.match(/\/verses\/by_chapter\/(\d+)$/);
  if (chapterMatch) {
    const surah = Number(chapterMatch[1]);
    return Array.from({ length: verseCount(surah) }, (_, index) =>
      mockQuranComVerse(surah, index + 1, 1 + Math.floor(index / 8), 1, options),
    );
  }

  const pageMatch = url.pathname.match(/\/verses\/by_page\/(\d+)$/);
  if (pageMatch) {
    const page = Number(pageMatch[1]);
    return Array.from({ length: 24 }, (_, index) =>
      mockQuranComVerse(2, index + 1, page, 1, options),
    );
  }

  const juzMatch = url.pathname.match(/\/verses\/by_juz\/(\d+)$/);
  if (juzMatch) {
    const juz = Number(juzMatch[1]);
    return Array.from({ length: 60 }, (_, index) =>
      mockQuranComVerse(2, index + 1, 2, juz, options),
    );
  }

  return [mockQuranComVerse(1, 1, 1, 1, options)];
}

function mockWarshVerses(surah, { withWaqfSigns = false } = {}) {
  const count = getWarshSurahAyahCount(surah) || verseCount(surah);
  return Array.from({ length: count }, (_, index) => ({
    sura_no: Number(surah),
    aya_no: index + 1,
    aya_text:
      withWaqfSigns && Number(surah) === 3 && index === 0
        ? "أَلَٓمِّٓۖ اَ۫للَّهُ لَآ إِلَٰهَ إِلَّا هُوَۖ اَ۫لْحَيُّ اُ۫لْقَيُّومُ"
        : `نَصُّ وَرْشٍ التَّجْرِيبِيُّ ${index + 1}`,
  }));
}

function mockLegacyWarshPage(page = 50) {
  const ranges = [[1, 4, 35], [4, 9, 41], [9, 11, 21], [11, 13, 14], [13, 15, 20]];
  const vocabulary = ["وَبَشِّرِ", "اَ۬لذِينَ", "ءَامَنُواْ", "وَعَمِلُواْ", "اُ۬لصَّٰلِحَٰتِ", "رُزِقُواْ", "مُتَشَٰبِهاٗ"];
  return ranges.map(([lineStart, lineEnd, wordCount], index) => ({
    id: page * 100 + index + 1,
    sura_no: 3,
    aya_no: index + 1,
    page: String(page),
    jozz: 3,
    line_start: lineStart,
    line_end: lineEnd,
    aya_text: `${Array.from({ length: wordCount }, (_, wordIndex) => vocabulary[(wordIndex + index) % vocabulary.length]).join(" ")}\u00A0${String.fromCharCode(0xFC00 + index)}`,
  }));
}

function mockLegacyWarshOpeningPages() {
  const records = [
    [2, 1, 3, 4, "أَلَٓمِّٓۖ ذَٰلِكَ اَ۬لْكِتَٰبُ لَا رَيْبَۖ فِيهِ هُدىٗ لِّلْمُتَّقِينَ"],
    [2, 2, 4, 5, "اَ۬لذِينَ يُومِنُونَ بِالْغَيْبِ وَيُقِيمُونَ اَ۬لصَّلَوٰةَ وَمِمَّا رَزَقْنَٰهُمْ يُنفِقُونَۖ"],
    [2, 3, 5, 6, "وَالذِينَ يُومِنُونَ بِمَآ أُنزِلَ إِلَيْكَ وَمَآ أُنزِلَ مِن قَبْلِكَ وَبِالَاخِرَةِ هُمْ يُوقِنُونَ"],
    [2, 4, 7, 8, "أُوْلَٰٓئِكَ عَلَىٰ هُدىٗ مِّن رَّبِّهِمْۖ وَأُوْلَٰٓئِكَ هُمُ اُ۬لْمُفْلِحُونَۖ"],
    [3, 5, 1, 3, "إِنَّ اَ۬لذِينَ كَفَرُواْ سَوَآءٌ عَلَيْهِمُۥٓ ءَآنذَرْتَهُمُۥٓ أَمْ لَمْ تُنذِرْهُمْ لَا يُومِنُونَۖ"],
    [3, 6, 3, 7, "خَتَمَ اَ۬للَّهُ عَلَىٰ قُلُوبِهِمْ وَعَلَىٰ سَمْعِهِمْۖ وَعَلَىٰٓ أَبْصٰ۪رِهِمْ غِشَٰوَةٞۖ وَلَهُمْ عَذَابٌ عَظِيمٞۖ"],
    [3, 7, 7, 11, "وَمِنَ اَ۬لنَّاسِ مَنْ يَّقُولُ ءَامَنَّا بِاللَّهِ وَبِالْيَوْمِ اِ۬لَاخِرِ وَمَا هُم بِمُومِنِينَۖ"],
    [3, 8, 11, 15, "يُخَٰدِعُونَ اَ۬للَّهَ وَالذِينَ ءَامَنُواْۖ وَمَا يُخَٰدِعُونَ إِلَّآ أَنفُسَهُمْ وَمَا يَشْعُرُونَۖ"],
  ];
  return records.map(([page, ayah, lineStart, lineEnd, text]) => ({
    id: page * 100 + ayah,
    sura_no: 2,
    aya_no: ayah,
    page: String(page),
    jozz: 1,
    line_start: lineStart,
    line_end: lineEnd,
    aya_text: `${text}\u00A0${String.fromCharCode(0xFC00 + ayah - 1)}`,
  }));
}

function mockLegacyWarshDataset() {
  return [
    ...mockLegacyWarshOpeningPages(),
    ...[49, 50, 51].flatMap((page) => mockLegacyWarshPage(page)),
  ];
}

export async function installQuranNetworkFixtures(page, options = {}) {
  await page.route(
    (url) =>
      url.hostname === "api.quran.com" &&
      /\/api\/v4\/chapters\/\d+\/info$/.test(url.pathname),
    async (route) => {
      const match = new URL(route.request().url()).pathname.match(
        /\/chapters\/(\d+)\/info$/,
      );
      const surah = Number(match?.[1] || 1);
      await route.fulfill({
        json: {
          chapter_info: {
            chapter_id: surah,
            language_name: "english",
            short_text: `Editorial overview for surah ${surah}.`,
            text: `<p>Editorial overview for surah ${surah}.</p><p>Complete historical context for testing.</p>`,
            source: "Quran.com test fixture",
          },
        },
      });
    },
  );

  await page.route(
    (url) =>
      url.hostname === "api.quran.com" &&
      /\/api\/v4\/chapters\/\d+$/.test(url.pathname),
    async (route) => {
      await route.fulfill({ json: { chapter: { revelation_order: 89, revelation_place: "madinah", pages: [50, 76], translated_name: { name: "The Family of Imran" } } } });
    },
  );

  await page.route(
    (url) =>
      url.hostname === "api.quran.com" &&
      url.pathname.includes("/api/v4/verses/"),
    async (route) => {
      const url = new URL(route.request().url());
      await route.fulfill({
        json: {
          verses: quranComVersesForUrl(url, options),
          pagination: { current_page: 1, total_pages: 1 },
        },
      });
    },
  );

  await page.route(
    (url) => /\/warsh_text\/\d{3}\.json$/.test(url.pathname),
    async (route) => {
      const match = new URL(route.request().url()).pathname.match(
        /\/warsh_text\/(\d{3})\.json$/,
      );
      await route.fulfill({
        json: mockWarshVerses(Number(match?.[1] || 1), options),
      });
    },
  );

  await page.route(
    (url) => url.pathname.endsWith("/warshData_v2-1.json"),
    async (route) => {
      await route.fulfill({ json: mockLegacyWarshDataset() });
    },
  );
}
