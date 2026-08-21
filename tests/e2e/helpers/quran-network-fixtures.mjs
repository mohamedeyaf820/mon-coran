import SURAHS from "../../../src/data/surahs.js";

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
      : canonicalWords;
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
  return Array.from({ length: verseCount(surah) }, (_, index) => ({
    sura_no: Number(surah),
    aya_no: index + 1,
    aya_text:
      withWaqfSigns && Number(surah) === 3 && index === 0
        ? "أَلَٓمِّٓۖ اَ۫للَّهُ لَآ إِلَٰهَ إِلَّا هُوَۖ اَ۫لْحَيُّ اُ۫لْقَيُّومُ"
        : `نَصُّ وَرْشٍ التَّجْرِيبِيُّ ${index + 1}`,
  }));
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
}
