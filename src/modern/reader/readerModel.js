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
  const source = String(value).replace(
    /<span[^>]*class=(?:["']?end["']?)[^>]*>[\s\S]*?<\/span>/gi,
    "",
  );
  if (!source.includes("<")) return source ? [{ text: source, rule: null }] : [];

  const segments = [];
  const pattern = /<tajweed[^>]*class=(?:["']([^"']+)["']|([^\s>]+))[^>]*>([\s\S]*?)<\/tajweed>|([^<]+)/gi;
  let match;
  while ((match = pattern.exec(source))) {
    const text = (match[3] || match[4] || "").replace(/<[^>]+>/g, "");
    const rule = (match[1] || match[2] || "").replaceAll("_", "-") || null;
    if (text) segments.push({ text, rule });
  }
  return segments.length ? segments : [{ text: source.replace(/<[^>]+>/g, ""), rule: null }];
}
