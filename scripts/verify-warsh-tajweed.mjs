import { getPerWordTajweedColors } from '../src/data/tajwidRules.js';
import {
  WARSH_DATA_BASE_URL,
  WARSH_LEGACY_JSON_URL,
} from '../src/constants/warshSource.js';

const EXPECTED_SURAH_COUNT = 114;
const EXPECTED_AYAH_COUNT = 6214;
const BATCH_SIZE = 8;
const FETCH_TIMEOUT_MS = 15_000;

function normalizeForComparison(value) {
  return String(value || '')
    .normalize('NFC')
    // The legacy source appends a presentation-form ayah marker.
    .replace(/[\uFB50-\uFDFF]+$/u, '')
    // Hizb markers are layout metadata and can move inside an ayah.
    .replace(/\u06DE/gu, '')
    .replace(/[\s\u00A0]+/gu, ' ')
    .trim();
}

async function fetchJson(url, label, attempts = 2) {
  let lastError = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 250));
      }
    }
  }

  throw new Error(`${label}: ${lastError?.message || 'request failed'}`);
}

async function fetchPrimarySurahs() {
  const payloads = [];

  for (let start = 1; start <= EXPECTED_SURAH_COUNT; start += BATCH_SIZE) {
    const numbers = Array.from(
      { length: Math.min(BATCH_SIZE, EXPECTED_SURAH_COUNT - start + 1) },
      (_, index) => start + index,
    );
    const batch = await Promise.all(
      numbers.map((surahNumber) => {
        const padded = String(surahNumber).padStart(3, '0');
        return fetchJson(
          `${WARSH_DATA_BASE_URL}${padded}.json`,
          `Warsh surah ${surahNumber}`,
        );
      }),
    );
    payloads.push(...batch);
  }

  return payloads;
}

function validatePrimarySurahs(payloads) {
  if (payloads.length !== EXPECTED_SURAH_COUNT) {
    throw new Error(`Expected ${EXPECTED_SURAH_COUNT} surahs, received ${payloads.length}`);
  }

  const ayahsByKey = new Map();

  payloads.forEach((payload, index) => {
    const expectedSurah = index + 1;
    const surahNumber = Number(payload?.surah_number);
    const ayahs = Array.isArray(payload?.ayahs) ? payload.ayahs : [];
    const declaredCount = Number(payload?.number_of_ayahs);

    if (surahNumber !== expectedSurah) {
      throw new Error(`Surah order mismatch: expected ${expectedSurah}, received ${surahNumber}`);
    }
    if (!ayahs.length || declaredCount !== ayahs.length) {
      throw new Error(
        `Surah ${surahNumber}: declared ${declaredCount} ayahs, received ${ayahs.length}`,
      );
    }

    ayahs.forEach((ayah, ayahIndex) => {
      const ayahNumber = Number(ayah?.ayah_number);
      const text = String(ayah?.text || '').trim();
      if (ayahNumber !== ayahIndex + 1 || !text) {
        throw new Error(`Invalid Warsh ayah ${surahNumber}:${ayahIndex + 1}`);
      }
      ayahsByKey.set(`${surahNumber}:${ayahNumber}`, text);
    });
  });

  if (ayahsByKey.size !== EXPECTED_AYAH_COUNT) {
    throw new Error(
      `Expected ${EXPECTED_AYAH_COUNT} Warsh ayahs, received ${ayahsByKey.size}`,
    );
  }

  const firstAyah = normalizeForComparison(ayahsByKey.get('1:1'));
  if (!firstAyah || firstAyah.includes('بِسْمِ')) {
    throw new Error('Warsh Al-Fatiha numbering sentinel is invalid');
  }

  return ayahsByKey;
}

function validateAgainstLegacy(primaryByKey, legacyRows) {
  if (!Array.isArray(legacyRows) || legacyRows.length !== EXPECTED_AYAH_COUNT) {
    throw new Error(
      `Legacy Warsh source should contain ${EXPECTED_AYAH_COUNT} ayahs`,
    );
  }

  const legacyByKey = new Map();
  for (const row of legacyRows) {
    const surahNumber = Number(row?.sura_no);
    const ayahNumber = Number(row?.aya_no);
    const text = normalizeForComparison(row?.aya_text);
    if (!surahNumber || !ayahNumber || !text) {
      throw new Error('Legacy Warsh source contains an invalid ayah');
    }
    legacyByKey.set(`${surahNumber}:${ayahNumber}`, text);
  }

  const mismatches = [];
  for (const [key, primaryText] of primaryByKey) {
    const legacyText = legacyByKey.get(key);
    if (normalizeForComparison(primaryText) !== legacyText) {
      mismatches.push(key);
      if (mismatches.length >= 10) break;
    }
  }

  if (legacyByKey.size !== primaryByKey.size || mismatches.length) {
    throw new Error(
      `Warsh sources disagree${mismatches.length ? ` at ${mismatches.join(', ')}` : ''}`,
    );
  }
}

function validateTajweedMappings(primaryByKey) {
  let taggedWords = 0;

  for (const [key, text] of primaryByKey) {
    const words = text.split(/\s+/u).filter(Boolean);
    const colors = getPerWordTajweedColors(text);
    if (!Array.isArray(colors) || colors.length !== words.length) {
      throw new Error(
        `Tajweed mapping length mismatch at ${key}: words=${words.length}, colors=${colors?.length || 0}`,
      );
    }
    taggedWords += colors.filter(Boolean).length;
  }

  if (taggedWords === 0) {
    throw new Error('No Tajweed rules were mapped on the Warsh text');
  }

  return taggedWords;
}

async function main() {
  const [primaryPayloads, legacyRows] = await Promise.all([
    fetchPrimarySurahs(),
    fetchJson(WARSH_LEGACY_JSON_URL, 'Legacy Warsh dataset'),
  ]);
  const primaryByKey = validatePrimarySurahs(primaryPayloads);
  validateAgainstLegacy(primaryByKey, legacyRows);
  const taggedWords = validateTajweedMappings(primaryByKey);

  console.log(
    `Warsh integrity check: surahs=${primaryPayloads.length}, ayahs=${primaryByKey.size}, tajweedTags=${taggedWords}`,
  );
  console.log('OK: both Warsh sources agree and Tajweed maps the Warsh text.');
}

await main();
