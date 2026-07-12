function keyOf(ayah) {
  return `${Number(ayah?.surah?.number) || 1}:${Number(ayah?.numberInSurah) || 1}`;
}

export function buildReaderVerses({ arabic = {}, translations = [] } = {}) {
  const translation = Array.isArray(translations) ? translations[0] : null;
  const translatedByKey = new Map(
    (translation?.ayahs || []).map((ayah) => [keyOf(ayah), ayah.text || ""]),
  );

  return (arabic?.ayahs || []).map((ayah) => ({
    ...ayah,
    key: keyOf(ayah),
    surahNumber: Number(ayah?.surah?.number) || 1,
    ayahNumber: Number(ayah?.numberInSurah) || 1,
    translation: translatedByKey.get(keyOf(ayah)) || "",
    tajweedText: ayah?.quranCom?.textTajweed || "",
  }));
}

export function parseTajweedSegments(value = "") {
  const source = String(value);
  if (!source.includes("<")) return source ? [{ text: source, rule: null }] : [];

  const segments = [];
  const pattern = /<tajweed[^>]*class=["']([^"']+)["'][^>]*>([\s\S]*?)<\/tajweed>|([^<]+)/gi;
  let match;
  while ((match = pattern.exec(source))) {
    const text = (match[2] || match[3] || "").replace(/<[^>]+>/g, "");
    if (text) segments.push({ text, rule: match[1] || null });
  }
  return segments.length ? segments : [{ text: source.replace(/<[^>]+>/g, ""), rule: null }];
}
