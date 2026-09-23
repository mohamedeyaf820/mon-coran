export function getMushafFontClass(size) {
  const value = Number(size);
  if (!Number.isFinite(value)) return "text-[58px]";
  if (value <= 54) return "text-[54px]";
  if (value <= 58) return "text-[58px]";
  if (value <= 62) return "text-[62px]";
  if (value <= 66) return "text-[66px]";
  return "text-[70px]";
}

export function getRevelationBadge(lang, surahMeta) {
  if (surahMeta?.type === "Meccan") {
    if (lang === "fr") return "Mecquoise";
    if (lang === "ar") return "\u0645\u0643\u064a\u0629";
    return "Meccan";
  }
  if (lang === "fr") return "M\u00e9dinoise";
  if (lang === "ar") return "\u0645\u062f\u0646\u064a\u0629";
  return "Medinan";
}
