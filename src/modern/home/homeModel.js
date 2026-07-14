function clamp(value, min, max, fallback = min) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(number)));
}

function readingHref(surah, ayah = 1) {
  return ayah > 1
    ? `/surah/${surah}/${ayah}`
    : `/surah/${surah}`;
}

function normalizeSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("fr");
}

export function filterHomeSurahs(surahs, query) {
  const source = Array.isArray(surahs) ? surahs : [];
  const normalized = normalizeSearch(query);
  if (!normalized) return source;

  return source.filter((surah) =>
    [surah.n, surah.ar, surah.en, surah.fr]
      .map(normalizeSearch)
      .some((value) => value.includes(normalized)),
  );
}

export function buildModernHomeModel({
  settings = {},
  recentVisits = [],
  stats = {},
  surahs = [],
} = {}) {
  const safeSurahs = Array.isArray(surahs) && surahs.length ? surahs : [];
  const fallbackSurah = safeSurahs[0] || {
    n: 1,
    ar: "",
    en: "Al-Fatiha",
    fr: "L'Ouverture",
    ayahs: 7,
  };
  const requestedSurah = Number(settings?.lastPosition?.surah);
  const resumeSurah =
    safeSurahs.find((surah) => surah.n === requestedSurah) || fallbackSurah;
  const resumeAyah = clamp(
    settings?.lastPosition?.ayah,
    1,
    resumeSurah.ayahs || 1,
    1,
  );
  const seen = new Set();
  const recents = [...(Array.isArray(recentVisits) ? recentVisits : [])]
    .sort((a, b) => Number(b?.ts || 0) - Number(a?.ts || 0))
    .flatMap((visit) => {
      const surah = safeSurahs.find((item) => item.n === Number(visit?.surah));
      if (!surah || seen.has(surah.n)) return [];
      seen.add(surah.n);
      const ayah = clamp(visit?.ayah, 1, surah.ayahs || 1, 1);
      return [{ surah, ayah, href: readingHref(surah.n, ayah), ts: visit.ts }];
    })
    .slice(0, 3);

  return {
    resume: {
      surah: resumeSurah,
      ayah: resumeAyah,
      href: readingHref(resumeSurah.n, resumeAyah),
      progress: Math.round((resumeAyah / Math.max(1, resumeSurah.ayahs)) * 100),
    },
    recents,
    stats: {
      totalRead: clamp(stats.totalRead, 0, 6236, 0),
      total: 6236,
      percentage: clamp(stats.percentage, 0, 100, 0),
      completedSurahs: clamp(stats.completedSurahs, 0, 114, 0),
    },
    riwaya: String(settings.riwaya || "hafs").toUpperCase(),
    surahs: safeSurahs,
  };
}
