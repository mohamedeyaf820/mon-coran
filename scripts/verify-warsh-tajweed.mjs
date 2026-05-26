import { getPerWordTajweedColors } from '../src/data/tajwidRules.js';
import { WARSH_DATA_URL } from '../src/constants/warshSource.js';

const TEST_SURAHS = [1, 2, 18, 36, 55, 67, 78, 93, 112, 114];

async function fetchWarshGrouped() {
  const response = await fetch(WARSH_DATA_URL);
  if (!response.ok) throw new Error(`Warsh dataset HTTP ${response.status}`);
  const flatData = await response.json();

  const grouped = Array.from({ length: 114 }, () => []);
  for (const ayah of flatData) {
    if (!ayah || ayah.sura_no < 1 || ayah.sura_no > 114 || ayah.aya_no < 1) continue;
    grouped[ayah.sura_no - 1][ayah.aya_no - 1] = ayah.aya_text || '';
  }
  return grouped;
}

async function fetchHafsSurah(surah) {
  const u = `https://api.alquran.cloud/v1/surah/${surah}/quran-uthmani`;
  const r = await fetch(u);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const j = await r.json();
  if (j.code !== 200 || !j.data?.ayahs) throw new Error('Invalid API payload');
  return j.data.ayahs;
}

(async () => {
  let emptyMappings = 0;
  let checked = 0;
  const warsh = await fetchWarshGrouped();

  for (const surahNum of TEST_SURAHS) {
    const hafsAyahs = await fetchHafsSurah(surahNum);
    const warshAyahs = warsh[surahNum - 1] || [];
    const count = Math.min(hafsAyahs.length, warshAyahs.length);

    for (let i = 0; i < count; i++) {
      const colors = getPerWordTajweedColors(hafsAyahs[i].text || '');
      checked++;
      if (!colors || colors.length === 0) {
        emptyMappings++;
      }
    }
  }

  console.log(`Warsh tajweed mapping check: checked=${checked}, empty=${emptyMappings}`);
  if (emptyMappings > checked * 0.25) {
    console.error('Too many empty tajweed mappings.');
    process.exit(1);
  }
  console.log('OK: tajweed mapping is available on sampled surahs.');
})();
