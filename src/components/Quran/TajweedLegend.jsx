import React from "react";
import { t } from "../../i18n";

const LEGEND_RULES = [
  ["silent", "silent"],
  ["madd-normal", "maddNormal"],
  ["madd-separated", "maddSeparated"],
  ["madd-connected", "maddConnected"],
  ["madd", "maddNecessary"],
  ["ghunna", "ghunnaIkhfa"],
  ["qalqala", "qalqala"],
  ["tafkhim", "tafkhim"],
];

const LEGEND_COPY = {
  fr: {
    eyebrow: "Guide Tajwid",
    helper: "Survolez un passage coloré pour comprendre la règle",
    warshHelper:
      "Couleurs du mushaf Warsh coloré, huit catégories ; repères calculés, certaines règles ne sont pas marquées.",
  },
  en: {
    eyebrow: "Tajweed guide",
    helper: "Hover over a coloured passage to understand the rule",
    warshHelper:
      "Colours taken from the printed Warsh tajweed mushaf, eight categories; markers are calculated, some rules are not marked.",
  },
  ar: {
    eyebrow: "دليل التجويد",
    helper: "مرّر المؤشر فوق النص الملوّن لمعرفة القاعدة",
    warshHelper:
      "ألوان مصحف ورش الملون بثماني فئات؛ العلامات محسوبة وبعض الأحكام غير ملوّنة.",
  },
};

function TajweedLegend({ lang = "fr", riwaya = "hafs" }) {
  const copy = LEGEND_COPY[lang] || LEGEND_COPY.fr;

  return (
    <details
      className="tajweed-legend"
      aria-label={t("tajwid.legend", lang)}
      data-riwaya={riwaya}
      data-testid="tajweed-legend"
    >
      <summary className="tajweed-legend__intro">
        <span className="tajweed-legend__eyebrow">{copy.eyebrow}</span>
        <span className="tajweed-legend__helper">{riwaya === "warsh" ? copy.warshHelper : copy.helper}</span>
      </summary>

      <div className="tajweed-legend__rules" role="list">
        {LEGEND_RULES.map(([ruleId, labelKey]) => (
          <span
            className="tajweed-legend-item"
            role="listitem"
            key={ruleId}
            data-rule={ruleId}
          >
            <span
              className="tajweed-dot"
              style={{ backgroundColor: `var(--tajwid-${ruleId})` }}
              aria-hidden="true"
            />
            <span>{t(`tajwid.${labelKey}`, lang)}</span>
          </span>
        ))}
      </div>
    </details>
  );
}

export default React.memo(TajweedLegend);
