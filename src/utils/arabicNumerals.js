const ARABIC_NUMERALS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicNumeral(value) {
  return String(value ?? "")
    .split("")
    .map((digit) => ARABIC_NUMERALS[Number.parseInt(digit, 10)] ?? digit)
    .join("");
}

/** Read Arabic-Indic digits back as a number ("١٢" → 12); NaN when absent. */
export function fromArabicNumeral(value) {
  const digits = String(value ?? "")
    .split("")
    .map((char) => ARABIC_NUMERALS.indexOf(char))
    .filter((index) => index >= 0);
  if (digits.length === 0) return Number.NaN;
  return Number.parseInt(digits.join(""), 10);
}
