import React, { useState } from "react";
import ReciterTypeBadge from "./ReciterTypeBadge";
import { RECITER_PHOTOS_MAP } from "../../data/reciters";

function label(reciter, lang) {
  if (lang === "ar") return reciter.name;
  if (lang === "fr") return reciter.nameFr;
  return reciter.nameEn;
}

export default function ReciterHero({ reciter, lang }) {
  const photo = RECITER_PHOTOS_MAP[reciter.id];
  const [imgError, setImgError] = useState(false);
  const showPhoto = photo && !imgError;

  return (
    <div className="reciter-hero flex items-center gap-4 py-1">
      <div className="relative shrink-0">
        {/* Ambient glow behind avatar */}
        <div className="absolute inset-0 rounded-full bg-[var(--primary)] opacity-[0.12] blur-xl scale-125 pointer-events-none" aria-hidden="true" />
        
        {showPhoto ? (
          <img
            src={photo}
            alt={label(reciter, lang)}
            className="reciter-hero__avatar relative h-[72px] w-[72px] rounded-full border-2 border-[var(--primary)] object-cover shadow-[0_4px_16px_rgba(var(--primary-rgb),0.2)] transition-transform duration-300 hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="reciter-hero__avatar reciter-hero__avatar--fallback relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[rgba(var(--primary-rgb),0.15)] to-[rgba(var(--primary-rgb),0.05)] text-[var(--primary)] border-2 border-[var(--primary)] shadow-[0_4px_16px_rgba(var(--primary-rgb),0.15)]">
            <i className="fas fa-microphone-lines text-2xl" />
          </div>
        )}
      </div>
      <div className="reciter-hero__copy min-w-0 flex-1">
        <h3 id="reciter-modal-title" className="reciter-hero__name text-lg sm:text-xl font-bold text-text-primary leading-tight truncate">
          {label(reciter, lang)}
        </h3>
        <div className="reciter-hero__meta mt-2 flex flex-wrap items-center gap-2">
          <ReciterTypeBadge style={reciter.style} />
          {reciter.cdnType === "mp3quran-surah" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[0.68rem] font-bold text-amber-600 dark:text-amber-400">
              <i className="fas fa-bolt text-[0.6rem]" />HD
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
