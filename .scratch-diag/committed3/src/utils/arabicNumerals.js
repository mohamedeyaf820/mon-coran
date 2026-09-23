const ARABIC_NUMERALS = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toArabicNumeral(value) {
  return String(value ?? "")
    .split("")
    .map((digit) => ARABIC_NUMERALS[Number.parseInt(digit, 10)] ?? digit)
    .join("");
}
