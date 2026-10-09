export const ARABIC_FONT_SIZE_MIN = 12;
export const ARABIC_FONT_SIZE_MAX = 96;
// The neutral size the responsive tiers measure their delta from: a reset
// returns the reader to this, not to a device-specific pixel value.
export const DEFAULT_ARABIC_FONT_SIZE = 25;

export function clampArabicFontSize(value, fallback = DEFAULT_ARABIC_FONT_SIZE) {
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
    deviceMaximum = isMushaf ? 72 : 32;
  } else if (width <= 768) {
    deviceBaseline = isMushaf ? 26 : 28;
    deviceMaximum = isMushaf ? 76 : 40;
  } else if (width <= 1024) {
    deviceBaseline = isMushaf ? 30 : 34;
    deviceMaximum = isMushaf ? 80 : 40;
  } else {
    deviceBaseline = isMushaf ? 34 : 42;
    deviceMaximum = isMushaf ? 96 : 52;
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
 * Measured glyph ink for the continuous-mushaf faces (harakat ascenders plus
 * descenders) reaches ~1.8em, so the mushaf layout leads at 2.2 — the value
 * verified against rendered pages on main (da2c50a, e54a65b). List mode keeps
 * tighter per-face ratios.
 */
export function getArabicReadingLineHeight({
  displayMode = "surah",
  fontFamily = "qpc-hafs",
  mushafLayout = "list",
  riwaya = "hafs",
}) {
  const isContinuousMushaf = mushafLayout === "mushaf";
  const normalizedFont = String(fontFamily || "").toLowerCase();

  // Page, Juz and Surah routes all use the same live Unicode renderer. Keep
  // the metric attached to the selected face instead of the route: a route
  // specific value makes the same ayah jump when the reader changes mode.
  void displayMode;

  if (isContinuousMushaf) {
    return 2.2;
  }

  if (normalizedFont.includes("indopak")) {
    return 1.9;
  }

  if (riwaya === "warsh") {
    return 1.82;
  }

  if (normalizedFont.includes("scheherazade")) {
    return 1.84;
  }

  if (
    normalizedFont.includes("amiri") ||
    normalizedFont.includes("noto-naskh")
  ) {
    return 1.78;
  }

  return 1.76;
}
