import React from "react";

const MAP = {
  murattal: "Murattal",
  mujawwad: "Mujawwad",
  muallim: "Muallim",
  "kids repeat": "Kids",
};

export default function ReciterTypeBadge({ style = "murattal" }) {
  const key = String(style || "murattal").toLowerCase();
  return <span className="rounded-full border px-2 py-0.5 text-xs opacity-85">{MAP[key] || "Murattal"}</span>;
}
