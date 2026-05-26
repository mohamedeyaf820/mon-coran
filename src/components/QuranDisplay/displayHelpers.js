export function getTranslationKeyForAyah(surahNumber, ayahNumber) {
  if (!surahNumber || !ayahNumber) return null;
  return `surah:${surahNumber}:${ayahNumber}`;
}

export function readingLabel(lang, copy) {
  if (lang === "ar") return copy.ar;
  if (lang === "fr") return copy.fr;
  return copy.en;
}

export function getWordModeTitle(lang, showWordByWord) {
  return showWordByWord
    ? readingLabel(lang, {
        fr: "Afficher en liste",
        ar: "\u0639\u0631\u0636 \u0643\u0642\u0627\u0626\u0645\u0629",
        en: "Show as list",
      })
    : readingLabel(lang, {
        fr: "Afficher mot \u00e0 mot",
        ar: "\u0639\u0631\u0636 \u0643\u0644\u0645\u0629 \u0628\u0643\u0644\u0645\u0629",
        en: "Show word by word",
      });
}

export function getWordModeLabel(lang, showWordByWord) {
  return showWordByWord
    ? readingLabel(lang, {
        fr: "Mot \u00e0 mot",
        ar: "\u0643\u0644\u0645\u0629 \u0628\u0643\u0644\u0645\u0629",
        en: "Word by Word",
      })
    : readingLabel(lang, {
        fr: "Liste",
        ar: "\u0642\u0627\u0626\u0645\u0629",
        en: "List",
      });
}

export function getMemorizationTitle(lang) {
  return readingLabel(lang, {
    fr: "Mode m\u00e9morisation",
    ar: "\u0648\u0636\u0639 \u0627\u0644\u062d\u0641\u0638",
    en: "Memorization mode",
  });
}

export function getMemorizationLabel(lang) {
  return readingLabel(lang, {
    fr: "M\u00e9morisation",
    ar: "\u062d\u0641\u0638",
    en: "Memorize",
  });
}

export const TRANSLATION_LANGUAGE_META = {
  fr: {
    fr: "Francais",
    ar: "\u0627\u0644\u0641\u0631\u0646\u0633\u064a\u0629",
    en: "French",
    icon: "fa-language",
  },
  en: {
    fr: "Anglais",
    ar: "\u0627\u0644\u0625\u0646\u062c\u0644\u064a\u0632\u064a\u0629",
    en: "English",
    icon: "fa-language",
  },
  es: {
    fr: "Espagnol",
    ar: "\u0627\u0644\u0625\u0633\u0628\u0627\u0646\u064a\u0629",
    en: "Spanish",
    icon: "fa-language",
  },
  de: {
    fr: "Allemand",
    ar: "\u0627\u0644\u0623\u0644\u0645\u0627\u0646\u064a\u0629",
    en: "German",
    icon: "fa-language",
  },
  tr: {
    fr: "Turc",
    ar: "\u0627\u0644\u062a\u0631\u0643\u064a\u0629",
    en: "Turkish",
    icon: "fa-language",
  },
  ur: {
    fr: "Ourdou",
    ar: "\u0627\u0644\u0623\u0631\u062f\u064a\u0629",
    en: "Urdu",
    icon: "fa-language",
  },
};

export function getLanguageLabel(lang, meta) {
  if (lang === "ar") return meta.ar;
  if (lang === "fr") return meta.fr;
  return meta.en;
}
