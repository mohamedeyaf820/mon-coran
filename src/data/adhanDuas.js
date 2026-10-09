// Duas authentified after the adhan, in the shape consumed by the duas
// cards. Arabic text is kept exactly as transmitted (plain script, no
// vocalization, so no combining-mark ordering can differ across engines);
// every entry carries its authenticated source, shown to the reader.
// Only add duas here whose text and reference are verified against a canonical
// edition — the two-button du'a between adhan and iqama, often circulated,
// is weakly attested and deliberately excluded.

export const POST_ADHAN_DUAS = [
  {
    id: "adhan-wasilah",
    arabic:
      "اللهم رب هذه الدعوة التامة والصلاة القائمة آت محمدًا الوسيلة والفضيلة وابعثه المقام المحمود الذي وعدته",
    transliteration:
      "Allāhumma rabba hādhihi da‘wati t-tāmmah, wa as-salāti l-qā’imah, āti Muḥammadan al-wasīlata wa l-faḍīlah, wab‘athu l-maqāma l-maḥmūda alladhī wa‘adtahu",
    fr: "À toi Allah, Seigneur de cet appel parfait et de la prière établie. Accorde à Muhammad al-Wasîlah et la faveur éminente, et élève-le à la station de louange que tu lui as promise.",
    en: "O Allah, Lord of this perfect call and the established prayer. Grant Muhammad al-Wasilah and eminence, and raise him to the praiseworthy station You have promised him.",
    source: "Sahih al-Bukhari 614",
  },
];
