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

function compareNames(a, b) {
  const aName = a?.nameEn || a?.nameFr || a?.name || a?.id || "";
  const bName = b?.nameEn || b?.nameFr || b?.name || b?.id || "";
  return aName.localeCompare(bName);
}

export function sortRecitersByPreference(
  reciters,
  { currentReciterId = "", favoriteReciters = [], latencyByKey = {} } = {},
) {
  const favorites = new Set(
    Array.isArray(favoriteReciters)
      ? favoriteReciters.filter((value) => typeof value === "string")
      : [],
  );

  return [...(reciters || [])].sort((a, b) => {
    const aFav = favorites.has(a.id);
    const bFav = favorites.has(b.id);
    if (aFav !== bFav) return aFav ? -1 : 1;

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

    const aCurrent = a.id === currentReciterId;
    const bCurrent = b.id === currentReciterId;
    if (aCurrent !== bCurrent) return aCurrent ? -1 : 1;

    if ((a.cdnType || "islamic") !== (b.cdnType || "islamic")) {
      return (a.cdnType || "islamic").localeCompare(b.cdnType || "islamic");
    }

    return compareNames(a, b);
  });
}

export function getPreferredReciterId(
  riwaya,
  { currentReciterId = "", favoriteReciters = [], latencyByKey = {} } = {},
) {
  const reciters = getRecitersByRiwaya(riwaya);
  const sorted = sortRecitersByPreference(reciters, {
    currentReciterId,
    favoriteReciters,
    latencyByKey,
  });
  return sorted[0]?.id || getDefaultReciterId(riwaya);
}
