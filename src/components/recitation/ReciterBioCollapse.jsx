import React, { useState } from "react";

export default function ReciterBioCollapse({ lang, text }) {
  const [open, setOpen] = useState(false);
  const safeText = String(text || "").trim() || (lang === "fr" ? "Recitation authentique et régulière." : "Authentic and regular recitation.");
  const short = safeText.slice(0, 140);
  const shouldCollapse = safeText.length > 140;
  return (
    <div className="text-sm opacity-85">
      <p>{open || !shouldCollapse ? safeText : `${short}...`}</p>
      {shouldCollapse && (
        <button type="button" className="mt-1 text-xs underline" onClick={() => setOpen((v) => !v)}>
          {open ? (lang === "fr" ? "Voir moins" : "Show less") : (lang === "fr" ? "Voir plus" : "Show more")}
        </button>
      )}
    </div>
  );
}
