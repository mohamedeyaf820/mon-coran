export const THEMATIC_INDEX = [
  {
    id: "faith",
    icon: "sparkles",
    labels: { fr: "Foi et unicité", en: "Faith and oneness", ar: "\u0627\u0644\u0625\u064a\u0645\u0627\u0646 \u0648\u0627\u0644\u062a\u0648\u062d\u064a\u062f" },
    refs: [{ surah: 2, from: 255 }, { surah: 57, from: 3 }, { surah: 112, from: 1, to: 4 }],
  },
  {
    id: "mercy",
    icon: "heart",
    labels: { fr: "Miséricorde", en: "Mercy", ar: "\u0627\u0644\u0631\u062d\u0645\u0629" },
    refs: [{ surah: 1, from: 1, to: 3 }, { surah: 7, from: 156 }, { surah: 39, from: 53 }],
  },
  {
    id: "patience",
    icon: "hourglass",
    labels: { fr: "Patience et constance", en: "Patience and steadfastness", ar: "\u0627\u0644\u0635\u0628\u0631 \u0648\u0627\u0644\u062b\u0628\u0627\u062a" },
    refs: [{ surah: 2, from: 153 }, { surah: 2, from: 155, to: 157 }, { surah: 39, from: 10 }],
  },
  {
    id: "prayer",
    icon: "hands-praying",
    labels: { fr: "Prière et rappel", en: "Prayer and remembrance", ar: "\u0627\u0644\u0635\u0644\u0627\u0629 \u0648\u0627\u0644\u0630\u0643\u0631" },
    refs: [{ surah: 2, from: 43 }, { surah: 11, from: 114 }, { surah: 29, from: 45 }],
  },
  {
    id: "gratitude",
    icon: "sun",
    labels: { fr: "Gratitude", en: "Gratitude", ar: "\u0627\u0644\u0634\u0643\u0631" },
    refs: [{ surah: 2, from: 152 }, { surah: 14, from: 7 }, { surah: 31, from: 12 }],
  },
  {
    id: "justice",
    icon: "scale-balanced",
    labels: { fr: "Justice et équité", en: "Justice and fairness", ar: "\u0627\u0644\u0639\u062f\u0644 \u0648\u0627\u0644\u0642\u0633\u0637" },
    refs: [{ surah: 4, from: 58 }, { surah: 4, from: 135 }, { surah: 5, from: 8 }],
  },
  {
    id: "family",
    icon: "people-roof",
    labels: { fr: "Famille et parents", en: "Family and parents", ar: "\u0627\u0644\u0623\u0633\u0631\u0629 \u0648\u0627\u0644\u0648\u0627\u0644\u062f\u0627\u0646" },
    refs: [{ surah: 17, from: 23, to: 24 }, { surah: 30, from: 21 }, { surah: 66, from: 6 }],
  },
  {
    id: "knowledge",
    icon: "book-open",
    labels: { fr: "Connaissance", en: "Knowledge", ar: "\u0627\u0644\u0639\u0644\u0645" },
    refs: [{ surah: 20, from: 114 }, { surah: 39, from: 9 }, { surah: 58, from: 11 }],
  },
  {
    id: "creation",
    icon: "globe",
    labels: { fr: "Création et signes", en: "Creation and signs", ar: "\u0627\u0644\u062e\u0644\u0642 \u0648\u0627\u0644\u0622\u064a\u0627\u062a" },
    refs: [{ surah: 3, from: 190, to: 191 }, { surah: 21, from: 30 }, { surah: 51, from: 20, to: 21 }],
  },
  {
    id: "forgiveness",
    icon: "rotate-left",
    labels: { fr: "Pardon et repentir", en: "Forgiveness and repentance", ar: "\u0627\u0644\u0645\u063a\u0641\u0631\u0629 \u0648\u0627\u0644\u062a\u0648\u0628\u0629" },
    refs: [{ surah: 3, from: 135 }, { surah: 24, from: 22 }, { surah: 39, from: 53 }],
  },
  {
    id: "charity",
    icon: "hand-holding-heart",
    labels: { fr: "Don et solidarité", en: "Charity and solidarity", ar: "\u0627\u0644\u0625\u0646\u0641\u0627\u0642 \u0648\u0627\u0644\u062a\u0643\u0627\u0641\u0644" },
    refs: [{ surah: 2, from: 261 }, { surah: 2, from: 274 }, { surah: 57, from: 18 }],
  },
  {
    id: "trust",
    icon: "shield-heart",
    labels: { fr: "Confiance en Dieu", en: "Trust in God", ar: "\u0627\u0644\u062a\u0648\u0643\u0644" },
    refs: [{ surah: 3, from: 159 }, { surah: 8, from: 2 }, { surah: 65, from: 3 }],
  },
  {
    id: "trials",
    icon: "mountain-sun",
    labels: { fr: "Épreuves et soulagement", en: "Trials and relief", ar: "\u0627\u0644\u0627\u0628\u062a\u0644\u0627\u0621 \u0648\u0627\u0644\u0641\u0631\u062c" },
    refs: [{ surah: 2, from: 155, to: 157 }, { surah: 29, from: 2, to: 3 }, { surah: 94, from: 5, to: 6 }],
  },
];

export function thematicLabel(topic, lang = "fr") {
  return topic?.labels?.[lang] || topic?.labels?.fr || topic?.id || "";
}
