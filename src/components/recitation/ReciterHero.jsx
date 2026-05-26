import React from "react";
import ReciterTypeBadge from "./ReciterTypeBadge";
import { RECITER_PHOTOS_MAP } from "../../data/reciters";

function label(reciter, lang) {
  if (lang === "ar") return reciter.name;
  if (lang === "fr") return reciter.nameFr;
  return reciter.nameEn;
}

export default function ReciterHero({ reciter, lang }) {
  const photo = RECITER_PHOTOS_MAP[reciter.id];

  return (
    <div className="flex items-center gap-4 py-1">
      {photo ? (
        <img
          src={photo}
          alt={label(reciter, lang)}
          className="h-16 w-16 rounded-full border-2 border-[var(--primary)] object-cover shadow-md transition-transform duration-300 hover:scale-105"
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[rgba(var(--primary-rgb),0.1)] text-[var(--primary)] border-2 border-[var(--primary)] border-dashed shadow-inner">
          <i className="fas fa-microphone-lines text-2xl" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <h3 id="reciter-modal-title" className="text-lg sm:text-xl font-bold text-text-primary leading-tight truncate">
          {label(reciter, lang)}
        </h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ReciterTypeBadge style={reciter.style} />
          {reciter.cdnType === "mp3quran-surah" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[0.68rem] font-bold text-amber-600 dark:text-amber-400">
              <i className="fas fa-bolt text-[0.6rem]" /> HD
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
