const clamp = (value, min, max, fallback) => Math.max(min, Math.min(max, Number(value) || fallback));

export function buildPreferencePatch(input = {}) {
  const patch = {};
  if ("quranFontSize" in input) {
    patch.quranFontSize = clamp(input.quranFontSize, 18, 72, 25);
    patch.fontSize = patch.quranFontSize;
  }
  if ("quranTranslationFontSize" in input) patch.quranTranslationFontSize = clamp(input.quranTranslationFontSize, 12, 28, 18);
  if ("wirdGoalAmount" in input) patch.wirdGoalAmount = clamp(input.wirdGoalAmount, 1, 30, 5);
  return patch;
}

export function getReaderCssVariables(settings = {}) {
  return {
    "--modern-quran-size": `${clamp(settings.quranFontSize, 18, 72, 25)}px`,
    "--modern-translation-size": `${clamp(settings.quranTranslationFontSize, 12, 28, 18)}px`,
  };
}
