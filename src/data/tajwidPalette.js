/**
 * Quran.com V4's visual groups are a palette, not a riwaya annotation source.
 * Keep the finer source rule IDs in the annotation layer. All colour values
 * (upstream and MushafPlus contrast adaptations) live in themes4.css only.
 */
const revision = "aff1a035b09b66f28047b3216edcae4c5c949a49";
const repository = "https://github.com/quran/quran.com-frontend-next";
const sourceRoot = `${repository}/blob/${revision}`;

export const QURAN_COM_TAJWID_SOURCE = Object.freeze({
  repository,
  revision,
  checkedAt: "2026-10-01",
  paletteUrl: `${sourceRoot}/src/components/QuranReader/TajweedBar/TajweedBar.module.scss#L103-L195`,
  legendUrl: `${sourceRoot}/src/components/QuranReader/TajweedBar/TajweedBar.tsx#L17-L25`,
  fontPaletteUrl: `${sourceRoot}/src/components/Verse/TajweedFontPalettes.tsx#L19-L31`,
  fontDocumentationUrl: "https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/",
  annotationDocumentationUrl: "https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/quran-verses-uthmani-tajweed/",
  mushafId: 19,
  glyphField: "code_v2",
  annotationField: "text_uthmani_tajweed",
  // These font palettes are audited infrastructure, not proof that the current
  // flowing Unicode reader uses V4 fonts or has V4's richer per-glyph rules.
  unicodeMapping: "MushafPlus semantic adaptation of Quran.com V4 visual groups",
});

export const TAJWID_FONT_PALETTES = Object.freeze({ light: 0, dark: 1, sepia: 2 });

export const TAJWID_VISUAL_GROUPS = Object.freeze([
  { id: "silent", quranComId: "edgham" },
  { id: "madd-normal", quranComId: "mad-2" },
  { id: "madd-separated", quranComId: "mad-2-4-6" },
  { id: "madd-connected", quranComId: "mad-4-5" },
  { id: "madd-necessary", quranComId: "mad-6" },
  { id: "nasal", quranComId: "ekhfa" },
  { id: "qalqala", quranComId: "qalqala" },
  { id: "tafkhim", quranComId: "tafkhim" },
].map((group) => Object.freeze({
  ...group,
  colorToken: `--tajwid-palette-${group.id}`,
  sourceColorToken: `--quran-com-tajwid-${group.id}`,
})));

/** Shared colour semantics. This map never detects or supplies a Quran rule. */
export const TAJWID_RULE_GROUPS = Object.freeze({
  silent: "silent",
  "ham-wasl": "silent",
  "lam-shamsiyya": "silent",
  idgham: "silent",
  "idgham-without-ghunnah": "silent",
  "idgham-mutamathilayn": "silent",
  "idgham-mutajanisayn": "silent",
  "idgham-mutaqaribayn": "silent",
  ghunna: "nasal",
  ikhfa: "nasal",
  "ikhfa-shafawi": "nasal",
  iqlab: "nasal",
  "idgham-ghunnah": "nasal",
  "idgham-shafawi": "nasal",
  qalqala: "qalqala",
  tafkhim: "tafkhim",
  "madd-normal": "madd-normal",
  "madd-permissible": "madd-separated",
  "madd-obligatory": "madd-connected",
  "madd-obligatory-separated": "madd-connected",
  "madd-separated": "madd-separated",
  "madd-badal": "madd-separated",
  "madd-arid": "madd-separated",
  "madd-lin": "madd-separated",
  "madd-connected": "madd-connected",
  madd: "madd-necessary",
  "madd-necessary": "madd-necessary",
});

/**
 * The shipped reading inks are Quran.com's published swatches, unchanged in
 * every theme: --tajwid-palette-* equals --quran-com-tajwid-* (themes4.css).
 */
export const TAJWID_CONTRAST_ADAPTATIONS = Object.freeze({
  light: Object.freeze([]),
  sepia: Object.freeze([]),
  dark: Object.freeze([]),
});
