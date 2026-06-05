import { getDefaultReciterId, getRecitersByRiwaya } from "../data/reciters";

export function getReciterLatencyKey(reciter) {
  if (!reciter) return "islamic:";
  return `${reciter.cdnType || "islamic"}:${reciter.cdn || ""}`;
}

export function getLatencyForReciter(reciter, latencyByKey = {}) {
  if (!reciter) return null;
  const value = latencyByKey?.[getReciterLatencyKey(reciter)];
  return Number.isFinite(value) ? value : null;
}

function normalizeAvailabilityEntry(entry) {
  if (!entry || typeof entry !== "object") return null;
  const cooldownUntil = Number(entry.cooldownUntil);
  const failCount = Number(entry.failCount);
  const lastFailAt = Number(entry.lastFailAt);
  return {
    cooldownUntil: Number.isFinite(cooldownUntil) ? cooldownUntil : 0,
    failCount: Number.isFinite(failCount) ? failCount : 0,
    lastFailAt: Number.isFinite(lastFailAt) ? lastFailAt : 0,
  };
}

export function getReciterAvailabilityEntry(reciterId, availabilityById = {}) {
  if (typeof reciterId !== "string" || !reciterId) return null;
  return normalizeAvailabilityEntry(availabilityById?.[reciterId]);
}

export function getReciterUnavailableRemainingMs(
  reciterId,
  availabilityById = {},
  now = Date.now(),
) {
  const entry = getReciterAvailabilityEntry(reciterId, availabilityById);
  if (!entry?.cooldownUntil || entry.cooldownUntil <= now) return 0;
  return Math.max(0, entry.cooldownUntil - now);
}

export function isReciterTemporarilyUnavailable(
  reciterId,
  availabilityById = {},
  now = Date.now(),
) {
  return getReciterUnavailableRemainingMs(reciterId, availabilityById, now) > 0;
}

function compareNames(a, b) {
  const aName = a?.nameEn || a?.nameFr || a?.name || a?.id || "";
  const bName = b?.nameEn || b?.nameFr || b?.name || b?.id || "";
  return aName.localeCompare(bName);
}

export function sortRecitersByPreference(
  reciters,
  {
    currentReciterId = "",
    favoriteReciters = [],
    latencyByKey = {},
    availabilityById = {},
  } = {},
) {
  const favorites = new Set(
    Array.isArray(favoriteReciters)
      ? favoriteReciters.filter((value) => typeof value === "string")
      : [],
  );
  const now = Date.now();

  return [...(reciters || [])].sort((a, b) => {
    const aCurrent = a.id === currentReciterId;
    const bCurrent = b.id === currentReciterId;
    if (aCurrent !== bCurrent) return aCurrent ? -1 : 1;

    const aUnavailableMs = getReciterUnavailableRemainingMs(
      a.id,
      availabilityById,
      now,
    );
    const bUnavailableMs = getReciterUnavailableRemainingMs(
      b.id,
      availabilityById,
      now,
    );
    const aUnavailable = aUnavailableMs > 0;
    const bUnavailable = bUnavailableMs > 0;
    if (aUnavailable !== bUnavailable) return aUnavailable ? 1 : -1;
    if (aUnavailable && bUnavailable && aUnavailableMs !== bUnavailableMs) {
      return aUnavailableMs - bUnavailableMs;
    }

    const aFav = favorites.has(a.id);
    const bFav = favorites.has(b.id);
    if (aFav !== bFav) return aFav ? -1 : 1;

    const aSurahOnly = a?.audioMode === "surah";
    const bSurahOnly = b?.audioMode === "surah";
    if (aSurahOnly !== bSurahOnly) return aSurahOnly ? 1 : -1;

    const aLatency = getLatencyForReciter(a, latencyByKey);
    const bLatency = getLatencyForReciter(b, latencyByKey);
    const aHasLatency = Number.isFinite(aLatency);
    const bHasLatency = Number.isFinite(bLatency);

    if (aHasLatency && bHasLatency) {
      const delta = aLatency - bLatency;
      if (Math.abs(delta) > 0.015) return delta;
    } else if (aHasLatency !== bHasLatency) {
      return aHasLatency ? -1 : 1;
    }

    if ((a.cdnType || "islamic") !== (b.cdnType || "islamic")) {
      return (a.cdnType || "islamic").localeCompare(b.cdnType || "islamic");
    }

    return compareNames(a, b);
  });
}

export function getPreferredReciterId(
  riwaya,
  {
    currentReciterId = "",
    favoriteReciters = [],
    latencyByKey = {},
    availabilityById = {},
  } = {},
) {
  const reciters = getRecitersByRiwaya(riwaya);
  const sorted = sortRecitersByPreference(reciters, {
    currentReciterId,
    favoriteReciters,
    latencyByKey,
    availabilityById,
  });
  const firstAvailable = sorted.find(
    (item) => !isReciterTemporarilyUnavailable(item.id, availabilityById),
  );
  return firstAvailable?.id || sorted[0]?.id || getDefaultReciterId(riwaya);
}
