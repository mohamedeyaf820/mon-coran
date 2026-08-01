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

  let deviceScale = 1.08;
  let deviceMaximum = 64;

  if (width <= 420) {
    deviceScale = 0.84;
    deviceMaximum = mushafLayout === "mushaf" ? 40 : 48;
  } else if (width <= 640) {
    deviceScale = 0.92;
    deviceMaximum = mushafLayout === "mushaf" ? 44 : 52;
  } else if (width <= 1024) {
    deviceScale = 1.08;
    deviceMaximum = mushafLayout === "mushaf" ? 56 : 64;
  } else if (width < 1440) {
    deviceScale = 1.24;
    deviceMaximum = mushafLayout === "mushaf" ? 66 : 76;
  } else {
    deviceScale = 1.34;
    deviceMaximum = mushafLayout === "mushaf" ? 72 : 84;
  }

  const layoutScale = mushafLayout === "mushaf" ? 0.94 : 1;
  return Math.max(
    ARABIC_FONT_SIZE_MIN,
    Math.min(deviceMaximum, Math.round(baseSize * deviceScale * layoutScale)),
  );
}
