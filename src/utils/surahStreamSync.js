function getAyahNumber(item) {
  return Number(item?.ayah || item?.numberInSurah);
}

function getSurahStreamAyahs(ayahs, surah) {
  return (Array.isArray(ayahs) ? ayahs : [])
    .filter(
      (item) =>
        Number(item?.surah || item?.surahNumber) === Number(surah) &&
        getAyahNumber(item) > 0,
    )
    .sort((a, b) => getAyahNumber(a) - getAyahNumber(b));
}

function getAyahWeight(item) {
  const textLength = String(item?.text || "")
    .replace(/\s+/g, "")
    .length;
  return Math.max(18, Math.min(260, textLength || 36));
}

export function getSurahStreamProgressForAyah(ayahs, surah, ayahNumber) {
  const source = getSurahStreamAyahs(ayahs, surah);
  const targetIndex = source.findIndex(
    (item) => getAyahNumber(item) === Number(ayahNumber),
  );
  if (targetIndex <= 0) return 0;

  const weights = source.map(getAyahWeight);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (!totalWeight) return targetIndex / source.length;
  return (
    weights.slice(0, targetIndex).reduce((sum, weight) => sum + weight, 0) /
    totalWeight
  );
}

export function resolveSurahStreamAyah(
  ayahs,
  streamItem,
  currentTime = 0,
  duration = 0,
  preferredAyah = null,
) {
  const source = getSurahStreamAyahs(ayahs, streamItem?.surah);
  if (source.length === 0) return streamItem;

  let activeIndex = source.findIndex(
    (item) => getAyahNumber(item) === Number(preferredAyah),
  );
  if (activeIndex < 0) {
    activeIndex = 0;
    if (
      Number.isFinite(currentTime) &&
      Number.isFinite(duration) &&
      duration > 0
    ) {
      const progress = Math.max(0, Math.min(0.999999, currentTime / duration));
      const weights = source.map(getAyahWeight);
      const targetWeight =
        progress * weights.reduce((sum, weight) => sum + weight, 0);
      let traversed = 0;
      activeIndex = weights.findIndex((weight) => {
        traversed += weight;
        return targetWeight < traversed;
      });
      if (activeIndex < 0) activeIndex = source.length - 1;
    }
  }

  const active = source[activeIndex];
  const ayahNumber = getAyahNumber(active);
  return {
    ...streamItem,
    ...active,
    surah: Number(active.surah || active.surahNumber || streamItem.surah),
    ayah: ayahNumber,
    numberInSurah: ayahNumber,
    globalNumber: active.number || active.globalNumber,
    url: streamItem.url,
    urls: streamItem.urls,
    estimatedTiming: true,
  };
}
