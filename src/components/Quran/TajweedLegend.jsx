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

function TajweedLegend({ lang = "fr", riwaya = "hafs" }) {
  return (
    <div
      className="tajweed-legend"
      role="list"
      aria-label={t("tajwid.legend", lang)}
      data-riwaya={riwaya}
      data-testid="tajweed-legend"
    >
      {LEGEND_RULES.map(([ruleId, labelKey]) => (
        <span className="tajweed-legend-item" role="listitem" key={ruleId}>
          <span
            className="tajweed-dot"
            style={{ backgroundColor: `var(--tajwid-${ruleId})` }}
            aria-hidden="true"
          />
          <span>{t(`tajwid.${labelKey}`, lang)}</span>
        </span>
      ))}
    </div>
  );
}

export default React.memo(TajweedLegend);
