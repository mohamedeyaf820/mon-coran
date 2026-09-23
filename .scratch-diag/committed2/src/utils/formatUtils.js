/**
 * formatUtils.js – Shared formatting helpers.
 */

/**
 * Format a cooldown duration in ms as a human-readable label.
 *
 * @param {number} remainingMs
 * @param {string} lang  - "fr" | "ar" | "en"
 * @returns {string}
 */
export function formatCooldownLabel(remainingMs, lang) {
  const totalMinutes = Math.ceil(Math.max(1, remainingMs / 60000));
  if (totalMinutes < 60) {
    return lang === "ar" ? `${totalMinutes} دقيقة` : `${totalMinutes} min`;
  }
  const hours = Math.ceil(totalMinutes / 60);
  return lang === "ar" ? `${hours} ساعة` : `${hours} h`;
}
