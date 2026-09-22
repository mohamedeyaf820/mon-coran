/**
 * formatUtils.js – Shared formatting helpers.
 */

import { t } from "../i18n";

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
    return t("common.durationMinutes", lang).replace("{count}", totalMinutes);
  }
  const hours = Math.ceil(totalMinutes / 60);
  return t("common.durationHours", lang).replace("{count}", hours);
}
