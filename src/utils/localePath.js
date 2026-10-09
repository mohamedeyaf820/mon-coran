// Language in the URL. French is the default language and lives at the root
// (/surah/2); English and Arabic live under /en and /ar (/en/surah/2). One URL
// per language is what lets search engines index and serve each version.
// Plain ESM, no imports: the router, the SEO service and the build script all use it.

export const LOCALES = ["fr", "en", "ar"];
export const DEFAULT_LOCALE = "fr";

const LOCALE_PREFIX = /^\/(en|ar)(?=\/|$)/;

/** "/en/surah/2" -> { lang: "en", path: "/surah/2" }; no prefix -> { lang: null }. */
export function splitLocale(pathname = "/") {
  const value = String(pathname || "/");
  const match = value.match(LOCALE_PREFIX);
  if (!match) return { lang: null, path: value };
  return { lang: match[1], path: value.slice(match[0].length) || "/" };
}

/** Same page in another language: "/surah/2" + "en" -> "/en/surah/2"; the home is "/en/". */
export function localizePath(pathname = "/", lang = DEFAULT_LOCALE) {
  const { path } = splitLocale(pathname);
  if (!lang || lang === DEFAULT_LOCALE || !LOCALES.includes(lang)) return path;
  return path === "/" ? `/${lang}/` : `/${lang}${path}`;
}
