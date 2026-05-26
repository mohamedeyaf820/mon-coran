import React from "react";
import { getRulesForRiwaya } from "../../data/tajwidRules";

const CORE_RULE_IDS = [
  "ghunna",
  "qalqala",
  "idgham",
  "iqlab",
  "madd",
  "tafkhim",
  "lam-shamsiyya",
];

const TajweedQuickLegend = React.memo(function TajweedQuickLegend({
  riwaya = "hafs",
}) {
  const rules = getRulesForRiwaya(riwaya);
  const displayRules = rules.filter((rule) => CORE_RULE_IDS.includes(rule.id));

  if (displayRules.length === 0) return null;

  return (
    <div
      aria-label="Tajweed Color Legend"
      style={{
        marginTop: "1rem",
        padding: "0.75rem 1rem",
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        borderRadius: "var(--r-md)",
        fontFamily: "var(--font-ui)",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "0.5rem 1rem",
        }}
      >
        {displayRules.map((rule) => (
          <div
            key={rule.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                flexShrink: 0,
                backgroundColor: `var(--tajwid-${rule.id})`,
                boxShadow: "0 0 5px rgba(0,0,0,0.2)",
              }}
            />
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 600,
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {rule.nameFr}
              <small
                style={{
                  opacity: 0.6,
                  marginLeft: "0.25rem",
                  fontWeight: 400,
                }}
              >
                ({rule.nameEn})
              </small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default TajweedQuickLegend;
