import React from "react";

const MAP = {
  murattal: "Murattal",
  mujawwad: "Mujawwad",
  muallim: "Muallim",
  "kids repeat": "Kids",
};

export default function ReciterTypeBadge({ style = "murattal" }) {
  const key = String(style || "murattal").toLowerCase();
  const label = MAP[key] || "Murattal";

  const badgeColors =
    key === "mujawwad"
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
      : key === "muallim"
        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25"
        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[0.7rem] font-bold uppercase tracking-wider ${badgeColors}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
