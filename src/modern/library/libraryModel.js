function normalize(value) {
  return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("fr").trim();
}

export function normalizeSearchMatches(data) {
  return (Array.isArray(data?.matches) ? data.matches : []).slice(0, 100).map((match) => {
    const surah = Number(match?.surah?.number || match?.surah) || 1;
    const ayah = Number(match?.numberInSurah || match?.ayah) || 1;
    return { surah, ayah, text: String(match?.text || ""), href: `/surah/${surah}/${ayah}` };
  });
}

export function filterLibraryItems(items, query) {
  const needle = normalize(query);
  if (!needle) return items || [];
  return (items || []).filter((item) => normalize(`${item.surah}:${item.ayah} ${item.text || item.label || ""}`).includes(needle));
}
