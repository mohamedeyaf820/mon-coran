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
  const baseUserPreference = clampArabicFontSize(preferredSize);
  const offset = baseUserPreference - 25; // Delta relative to neutral 25px default
  const width = Number.isFinite(Number(viewportWidth))
    ? Number(viewportWidth)
    : 1024;

  let deviceBaseline;
  let deviceMaximum;
  const isMushaf = mushafLayout === "mushaf";

  if (width <= 480) {
    deviceBaseline = isMushaf ? 22 : 24;
    deviceMaximum = isMushaf ? 72 : 72;
  } else if (width <= 768) {
    deviceBaseline = isMushaf ? 26 : 28;
    deviceMaximum = isMushaf ? 80 : 80;
  } else if (width <= 1024) {
    deviceBaseline = isMushaf ? 30 : 34;
    deviceMaximum = isMushaf ? 88 : 88;
  } else if (width <= 1280) {
    deviceBaseline = isMushaf ? 34 : 42;
    deviceMaximum = isMushaf ? 96 : 96;
  } else {
    deviceBaseline = isMushaf ? 34 : 34;
    deviceMaximum = isMushaf ? 96 : 96;
  }

  const layoutScale = mushafLayout === "mushaf" ? 0.94 : 1;
  const targetSize = Math.round((deviceBaseline + offset) * layoutScale);

  return Math.max(
    ARABIC_FONT_SIZE_MIN,
    Math.min(deviceMaximum, targetSize),
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
    return isContinuousMushaf ? 1.85 : 2.16;
  }

  if (riwaya === "warsh") {
    return isContinuousMushaf ? 1.9 : 2.12;
  }

  if (normalizedFont.includes("scheherazade")) {
    return isContinuousMushaf ? 1.9 : 2.08;
  }

  if (
    normalizedFont.includes("amiri") ||
    normalizedFont.includes("noto-naskh")
  ) {
    return isContinuousMushaf ? 1.88 : 2;
  }

  return isContinuousMushaf ? 1.9 : 2.04;
}
