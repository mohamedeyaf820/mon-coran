/**
 * The bundled KFGQPC Warsh 0.10 font encodes numbered rosettes 1–286 at
 * U+FC00–U+FD1D. Its glyf composites contain U+06DD and the corresponding
 * digits. These are font-specific presentation glyphs, not waqf signs.
 * Decode only the isolated terminal glyph matching this verse's number.
 * Raw Quran records remain unchanged; unfamiliar/mismatched signs survive.
 */
export function stripWarshEncodedAyahMarker(text, ayahNumber) {
  const value = String(text ?? "");
  const number = Number(ayahNumber);
  if (!Number.isInteger(number) || number < 1 || number > 286) return value;
  const marker = String.fromCodePoint(0xfc00 + number - 1);
  return value.replace(new RegExp(`(?:^|\\s)${marker}\\s*$`, "u"), "");
}
