import React from "react";
import ReciterTypeBadge from "./ReciterTypeBadge";

function label(reciter, lang) {
  if (lang === "ar") return reciter.name;
  if (lang === "fr") return reciter.nameFr;
  return reciter.nameEn;
}

export default function ReciterHero({ reciter, lang }) {
  return (
    <div>
      <h3 id="reciter-modal-title" className="text-lg font-bold">{label(reciter, lang)}</h3>
      <p className="mt-1"><ReciterTypeBadge style={reciter.style} /></p>
    </div>
  );
}
