/**
 * Warsh dabt signs → recitation rules.
 *
 * The pinned Warsh edition is not an unannotated text: it is the KFGQPC Warsh
 * mushaf, which prints its own Dabt (the Maghribi notation) on the letters it
 * wants the reader to notice. Those signs are part of the pinned bytes, so a
 * rule painted from them is read off the edition the reader is looking at
 * instead of guessed from a neighbouring pattern.
 *
 * Provenance — `aziz011133/quran_warsh`, `warshData_v2-1.json`, commit
 * `31d4c18a8cf4afa081e113ffd377bb23372f6e26`, shipped byte-exact as
 * `public/data/warsh-page-source.json` and verified against its SHA-256 by
 * `src/services/warshService.js` before it reaches the reader. See
 * `src/constants/warshSource.js`.
 *
 * What this source is and is not
 * - It is an edition notation, not a Tajwid API. Every mapping below is either
 *   a standard, named sign (the Iqlab mim, the pronoun Sila letters, the Wasl
 *   alef of the article) or a printed mark whose meaning the notation fixes.
 * - It says nothing about the Warsh-specific reading choices (Imala, Taqlil,
 *   Naql, Ibdal, Ra' tafkhim/tarqiq, the Warsh madd lengths). None of those is
 *   painted; `WARSH_UNPAINTED_SIGNS` records each sign and why.
 * - Counts below were measured over all 6214 ayahs of the pinned file; the
 *   `warsh-tajwid-derivation` test re-measures them, so a corpus refresh that
 *   moves a sign fails the build instead of silently repainting Quran text.
 */

/** The pinned corpus these mappings were measured on. */
export const WARSH_TAJWID_SOURCE = Object.freeze({
  id: "aziz011133-quran-warsh-dabt",
  dataset: "aziz011133/quran_warsh warshData_v2-1.json",
  commit: "31d4c18a8cf4afa081e113ffd377bb23372f6e26",
  localUrl: "/data/warsh-page-source.json",
  sha256: "c6017e688cc599d88f6fdb1a19cafc9c51d024b3530955f1a878f17d26b9bcbc",
  ayahCount: 6214,
  edition: "KFGQPC Warsh mushaf, Maghribi Dabt as shipped by the pinned dataset",
  // Warsh-specific rule families this notation cannot name. No colour may
  // claim them, because no adopted source declares them.
  unpaintedRuleFamilies: Object.freeze([
    "imala",
    "taqlil",
    "naql",
    "ibdal",
    "ra-tafkhim-tarqiq",
    "warsh-madd-lengths",
  ]),
});

/** Code points this engine reads, under their Unicode names. */
export const WARSH_SIGN = Object.freeze({
  MADDAH: 0x0653,
  SUBSCRIPT_ALEF: 0x0656,
  INVERTED_DAMMA: 0x0657,
  FATHA_TWO_DOTS: 0x065e,
  DAGGER_ALEF: 0x0670,
  SHADDA: 0x0651,
  SUKUN: 0x0652,
  SMALL_HIGH_ROUNDED_ZERO: 0x06df,
  SMALL_HIGH_MEEM: 0x06e2,
  SMALL_WAW: 0x06e5,
  SMALL_YEH: 0x06e6,
  SMALL_HIGH_YEH: 0x06e7,
  SMALL_HIGH_NOON: 0x06e8,
  PLACE_OF_SAJDAH: 0x06e9,
  EMPTY_CENTRE_LOW_STOP: 0x06ea,
  // The reader's canonicalisation writes the ishmam / tashil sign as U+06EB;
  // the pinned dataset spells the same sign U+06EC, and only the font boundary
  // picks the glyph a face has (U+06EC for QCF, U+06DF for the Warsh face).
  // Both code points are accepted so the derivation reads whichever it is given.
  ISHMAM: 0x06eb,
  ISHMAM_QPC_FORM: 0x06ec,
});

/**
 * What the derivation paints on the pinned file, measured over all 6214 ayahs
 * (77 425 words, 25 562 words carry at least one colour, 5725 ayahs).
 *
 * `printed` is how many occurrences the edition carries for that shape and
 * `painted` how many of them the derivation colours; the remainder is either
 * counted in `WARSH_UNPAINTED_SIGNS` or explained in `note`.
 *
 * The order is the order `getWarshPerWordTajweedRanges` tests the signs.
 */
export const WARSH_PAINTED_RULES = Object.freeze([
  Object.freeze({
    ruleId: "ham-wasl",
    sign: WARSH_SIGN.ISHMAM,
    name: "Hamza dabt on the article alef",
    printed: 10060,
    painted: 9996,
    note:
      "The edition spells this one dabt three ways: U+06EB (the reader's canonical form, 10055 in the pinned file), U+06EC and U+06DF (5 article words such as ٱلَ 15:61 and ٱلْقِيَٰمَة 54:25). It also carries Hamzat qat' (اَ۬وْ 2:10, اَ۬ن) and the hamza of ؤ / ئ (يُّوَ۬اخِذُكُمُ 5:42), and U+06DF opens Wasl verbs on its own (اُ۫عْبُدُواْ 2:20). Only the alef that opens the word and is followed by an undoubled lam is the article: the other 64 stay plain.",
  }),
  Object.freeze({
    ruleId: "lam-shamsiyya",
    sign: WARSH_SIGN.ISHMAM,
    name: "Article lam before a doubled letter",
    printed: 9996,
    painted: 4432,
    note: "The article lam itself, exactly as the official Hafs annotation paints <laam_shamsiyah>.",
  }),
  Object.freeze({
    ruleId: "silent",
    sign: WARSH_SIGN.SUKUN,
    name: "Sukun on an alef",
    printed: 3716,
    painted: 3716,
    note: "3701 word-final (كَفَرُواْ 2:8) and 15 medial (مِاْئَةَ 100:1), written and not read.",
  }),
  Object.freeze({
    ruleId: "iqlab",
    sign: WARSH_SIGN.SMALL_HIGH_MEEM,
    name: "Small high mim (Iqlab)",
    printed: 575,
    painted: 1137,
    note:
      "575 marks, all of them on a Nun or a Tanwin that a ب turns into a mim. The paint is 1137 ranges: each mark plus the ب that follows it, which the edition writes as the next word. 13 marks sit on the last letter of their ayah; there the following ب belongs to the verse that follows, so only the marked letter is coloured.",
  }),
  Object.freeze({
    ruleId: "qalqala",
    sign: WARSH_SIGN.SUKUN,
    name: "Sukun on a qalqala letter",
    printed: 3304,
    painted: 3304,
    note: "Only letters the edition itself leaves sakin, so no waqf-dependent claim is made.",
  }),
  Object.freeze({
    ruleId: "ghunna",
    sign: WARSH_SIGN.SHADDA,
    name: "Shadda on a nun or a mim",
    printed: 7335,
    painted: 7331,
    note:
      "7335 doubled ن / م. The 4 exceptions also carry another sign of this source (صُمُّۢ, مُطْمَئِنُّۢ, تَسْـَٔلَنِّۦ) and take that rule, so no letter carries two colours at once.",
  }),
  Object.freeze({
    ruleId: "madd-normal",
    sign: WARSH_SIGN.SMALL_WAW,
    name: "Printed Sila letter of ه / م",
    printed: 3148,
    painted: 1922,
    note:
      "U+06E5 2142 (1089 painted) and U+06E6 1006 (833 painted). The 1226 that stay plain all carry the edition's own maddah, which is how it prints the longer Sila kubra; no duration is assumed for them.",
  }),
]);

/**
 * Signs the edition prints that this engine deliberately does NOT colour. Each
 * entry is a decision with its reason: none of them is a rule a neighbouring
 * pattern is allowed to fill in.
 */
export const WARSH_UNPAINTED_SIGNS = Object.freeze([
  Object.freeze({
    sign: WARSH_SIGN.EMPTY_CENTRE_LOW_STOP,
    name: "Empty centre low stop",
    occurrences: 2569,
    reason:
      "Two roles measured: word-initial Wasl alefs of some verbs (اَ۪رْكَبُواْ 11:41, اُ۪هْدِنَا 1:5) and the alef of words read with Imala or Taqlil (مُجْر۪يٰهَا 11:41, وَالضُّح۪ىٰ 93:1, بِالْكٰ۪فِرِينَ 2:18, أَب۪ىٰ 2:33). Naming it would colour Wasl alefs as Imala or the reverse.",
  }),
  Object.freeze({
    sign: WARSH_SIGN.SMALL_HIGH_ROUNDED_ZERO,
    name: "Small high rounded zero",
    occurrences: 281,
    reason:
      "Measured on Wasl verbs (اُعْبُدُواْ 2:20, اِسْجُدُواْ 2:33) and on Hamzat qat' words (أُخَرَ, أُجِيبُ, أُولَٰئِكَ). One sign, two readings. 5 of its 281 occurrences are the article's own Wasl dabt and are painted; the 276 that open a verb or a qat' hamza stay plain, because the painting needs the article shape (an opening alef, an undoubled lam).",
  }),
  Object.freeze({
    sign: WARSH_SIGN.MADDAH,
    name: "Maddah (madd sign)",
    occurrences: 3316,
    reason:
      "It marks elongation beyond the natural two beats, but the duration depends on the case (Madd lazım of the muqattaʿat, Munfasil, Sila kubra) and Warsh reads several of them shorter than Hafs. A colour group would assert a duration this source does not state.",
  }),
  Object.freeze({
    sign: WARSH_SIGN.DAGGER_ALEF,
    name: "Dagger alef",
    occurrences: 10033,
    reason:
      "A written alef whose length belongs to the surrounding madd rule. The official Hafs annotation paints 17 of the 29 dagger alefs in the audit fixture and leaves the rest to a longer madd class, so every dagger alef is not a natural madd.",
  }),
  Object.freeze({
    sign: WARSH_SIGN.SMALL_HIGH_YEH,
    name: "Small high yeh",
    occurrences: 22,
    reason:
      "Not measured against a named rule: 22 occurrences cannot establish what the edition marks with it, so nothing is painted.",
  }),
  Object.freeze({
    sign: WARSH_SIGN.PLACE_OF_SAJDAH,
    name: "Place of sajdah sign",
    occurrences: 14,
    reason:
      "A stop sign, not a recitation rule: it belongs to the waqf layer the reader already renders, and this source paints no rule for it.",
  }),
  Object.freeze({
    sign: WARSH_SIGN.SMALL_HIGH_NOON,
    name: "Small high noon",
    occurrences: 2,
    reason:
      "Only فَنُجِّيَ (12:110) and نُجِّيَ (21:87). Two occurrences cannot establish whether the edition means idgham or ikhfa of the nun, and both words are read differently from Hafs.",
  }),
  Object.freeze({
    sign: WARSH_SIGN.SUBSCRIPT_ALEF,
    name: "Subscript alef (Maghribi kasratan)",
    occurrences: 1935,
    reason:
      "Orthography, not a rule: the Tanwin kasr of رَيْبٍ, نَّفْسٍ, حِينٍ. It carries no colour of its own.",
  }),
  Object.freeze({
    sign: WARSH_SIGN.INVERTED_DAMMA,
    name: "Inverted damma (Maghribi fathatan)",
    occurrences: 2916,
    reason: "Orthography: the Tanwin fath of نَارًا, رِزْقًا, مَثَلًا.",
  }),
  Object.freeze({
    sign: WARSH_SIGN.FATHA_TWO_DOTS,
    name: "Fatha with two dots (Maghribi dammatan)",
    occurrences: 1815,
    reason: "Orthography: the Tanwin damm of عَظِيمٌ, مَرَضٌ, قَدِيرٌ.",
  }),
]);

/**
 * Rules this source can paint. Every one of them is a rule the official Hafs
 * annotation also uses, so the Warsh colours mean exactly what the reader
 * already sees on a Hafs page; the Warsh-specific reading choices are absent
 * by design (see `WARSH_TAJWID_SOURCE.unpaintedRuleFamilies`).
 */
export const WARSH_TAJWID_RULE_IDS = Object.freeze(
  Array.from(new Set(WARSH_PAINTED_RULES.map((entry) => entry.ruleId))),
);

/**
 * The corpus writes Tanwin in both notations: the Maghribi marks above, and
 * the Mashriqi U+064B/C/D for the remaining words (730 fath, 588 damm, 603
 * kasr). Both mean the same thing; neither is painted.
 */
export const WARSH_TANWIN_SIGNS = Object.freeze([
  WARSH_SIGN.SUBSCRIPT_ALEF,
  WARSH_SIGN.INVERTED_DAMMA,
  WARSH_SIGN.FATHA_TWO_DOTS,
  0x064b,
  0x064c,
  0x064d,
]);

