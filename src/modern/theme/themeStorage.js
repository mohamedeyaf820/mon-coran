const DARK_LEGACY_THEMES = new Set([
  "dark",
  "oled",
  "night-blue",
  "forest",
  "ocean",
  "quran-night",
]);

export function normalizeModernTheme(theme) {
  return DARK_LEGACY_THEMES.has(theme) ? "dark" : "light";
}

export function getInitialModernTheme(storedTheme, prefersDark) {
  if (typeof storedTheme === "string" && storedTheme.length > 0) {
    return normalizeModernTheme(storedTheme);
  }
  return prefersDark ? "dark" : "light";
}
