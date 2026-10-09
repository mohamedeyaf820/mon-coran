/**
 * Canonical Basmala text per riwaya.
 *
 * Hafs uses the Madani Mushaf Uthmani spelling (alif wasla U+0671).
 * WARSH_BASMALA is copied verbatim from the project Warsh source
 * (warshService surah payload); it must never be retyped by hand.
 */
export const HAFS_BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
export const WARSH_BASMALA = "بِسْمِ اِ۬للَّهِ اِ۬لرَّحْمَٰنِ اِ۬لرَّحِيمِ";

export function getBasmalaText(riwaya) {
  return riwaya === "warsh" ? WARSH_BASMALA : HAFS_BASMALA;
}
