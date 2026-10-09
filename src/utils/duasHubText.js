import duasHub from "../i18n/duasHub.js";

/**
 * Text of the invocations hub. The copy is loaded with the (lazy) Duas page
 * only, so the entry bundle does not carry it; French is the fallback, as in
 * src/i18n/index.js.
 */
function pluralForm(lang, count) {
  const abs = Math.abs(count);
  if (lang === "ar") {
    if (abs === 0) return "zero";
    if (abs === 1) return "one";
    if (abs === 2) return "two";
    if (abs % 100 >= 3 && abs % 100 <= 10) return "few";
    if (abs % 100 >= 11 && abs % 100 <= 99) return "many";
    return "other";
  }
  if (lang === "en") return abs === 1 ? "one" : "other";
  return abs <= 1 ? "one" : "other";
}

/** hubText("title", "fr"), hubText("itemsCount", "ar", 3), hubText("hisnMeta", "en", undefined, { chapters: 132, items: 267 }). */
export function hubText(key, lang = "fr", count, values = {}) {
  const locale = duasHub[lang] || duasHub.fr;
  let value = locale[key] ?? duasHub.fr[key];
  if (value == null) return key;
  if (typeof value === "object") {
    const form = pluralForm(duasHub[lang] ? lang : "fr", count ?? 0);
    value = value[form] ?? value.other ?? value.one ?? "";
  }
  const all = count === undefined ? values : { count, ...values };
  return String(value).replace(/\{(\w+)\}/g, (match, name) => (name in all ? String(all[name]) : match));
}

export const HUB_LANGS = Object.keys(duasHub);
export { duasHub };
