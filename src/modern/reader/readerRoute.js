import { getSurahAyahCount } from "../../data/surahs.js";

const LIMITS = { surah: 114, page: 604, juz: 30 };

function clamp(value, min, max) {
  const number = Number.parseInt(value, 10);
  return Math.max(min, Math.min(max, Number.isFinite(number) ? number : min));
}

export function parseReaderRoute(pathname = "/") {
  const match = /^\/(surah|page|juz)\/(\d+)(?:\/(\d+))?\/?$/.exec(pathname);
  if (!match) return null;

  const mode = match[1];
  const value = clamp(match[2], 1, LIMITS[mode]);
  const ayah = mode === "surah"
    ? clamp(match[3], 1, getSurahAyahCount(value))
    : null;

  return { mode, value, ayah };
}

export function buildReaderHref({ mode, value, ayah = null }) {
  const safeMode = Object.hasOwn(LIMITS, mode) ? mode : "surah";
  const safeValue = clamp(value, 1, LIMITS[safeMode]);
  if (safeMode === "surah" && Number(ayah) > 1) {
    return `/surah/${safeValue}/${clamp(ayah, 1, getSurahAyahCount(safeValue))}`;
  }
  return `/${safeMode}/${safeValue}`;
}

export function adjacentReaderHref(route, direction) {
  const delta = direction === "previous" ? -1 : 1;
  return buildReaderHref({ ...route, value: route.value + delta, ayah: null });
}
