export function countIntervalAyahs(fromAyah, toAyah) {
  return Math.max(0, Number(toAyah) - Number(fromAyah) + 1);
}

export function buildReadingInterval(start, end) {
  const safeEnd = { surah: Number(end?.surah), ayah: Number(end?.ayah) };
  if (!safeEnd.surah || !safeEnd.ayah) return null;
  const safeStart = start ? { surah: Number(start.surah), ayah: Number(start.ayah) } : safeEnd;
  if (safeStart.surah !== safeEnd.surah || safeStart.ayah > safeEnd.ayah) return null;
  return { surah: safeEnd.surah, fromAyah: safeStart.ayah, toAyah: safeEnd.ayah, ayahsRead: countIntervalAyahs(safeStart.ayah, safeEnd.ayah) };
}
