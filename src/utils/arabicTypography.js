export const ARABIC_FONT_SIZE_MIN = 12;
export const ARABIC_FONT_SIZE_MAX = 96;

export function clampArabicFontSize(value, fallback = 25) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.max(
    ARABIC_FONT_SIZE_MIN,
    Math.min(ARABIC_FONT_SIZE_MAX, numeric),
  );
}

/**
 * Convert the user's neutral reading preference into a device-aware size.
 * The preference always remains adjustable; device tiers only change its
 * scale and upper safety bound, never impose a large fixed minimum.
 */
export function getResponsiveArabicFontSize({
  preferredSize,
  viewportWidth,
  mushafLayout = "list",
}) {
  const baseSize = clampArabicFontSize(preferredSize);
  const width = Number.isFinite(Number(viewportWidth))
    ? Number(viewportWidth)
    : 1024;

  let deviceScale;
  let deviceMaximum;

  if (width <= 420) {
    deviceScale = 0.96;
    deviceMaximum = mushafLayout === "mushaf" ? 46 : 56;
  } else if (width <= 640) {
    deviceScale = 0.92;
    deviceMaximum = mushafLayout === "mushaf" ? 52 : 64;
  } else if (width <= 1024) {
    deviceScale = 1.08;
    deviceMaximum = mushafLayout === "mushaf" ? 60 : 76;
  } else if (width < 1440) {
    deviceScale = 1.24;
    deviceMaximum = mushafLayout === "mushaf" ? 72 : 88;
  } else {
    deviceScale = 1.34;
    deviceMaximum = mushafLayout === "mushaf" ? 80 : 96;
  }

  const layoutScale = mushafLayout === "mushaf" ? 0.94 : 1;
  return Math.max(
    ARABIC_FONT_SIZE_MIN,
    Math.min(deviceMaximum, Math.round(baseSize * deviceScale * layoutScale)),
  );
}

/**
 * Keep Quran lines visually connected without clipping tall Arabic marks.
 * Nastaleeq and Warsh faces need a little more breathing room than Naskh
 * faces, but none of the continuous-reader fonts need the legacy 2.48 ratio.
 */
export function getArabicReadingLineHeight({
  displayMode = "surah",
  fontFamily = "qpc-hafs",
  mushafLayout = "list",
  riwaya = "hafs",
}) {
  if (displayMode === "page") return 3.05;

  const isContinuousMushaf = mushafLayout === "mushaf";
  const normalizedFont = String(fontFamily || "").toLowerCase();

  if (normalizedFont.includes("indopak")) {
    return isContinuousMushaf ? 2.08 : 2.16;
  }

  if (riwaya === "warsh") {
    return isContinuousMushaf ? 2.04 : 2.12;
  }

  if (normalizedFont.includes("scheherazade")) {
    return isContinuousMushaf ? 1.98 : 2.08;
  }

  if (
    normalizedFont.includes("amiri") ||
    normalizedFont.includes("noto-naskh")
  ) {
    return isContinuousMushaf ? 1.88 : 2;
  }

  return isContinuousMushaf ? 1.94 : 2.04;
}
