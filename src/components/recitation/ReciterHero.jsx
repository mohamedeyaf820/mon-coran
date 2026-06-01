import React, { useState } from "react";
import ReciterTypeBadge from "./ReciterTypeBadge";
import { getReciterVisual } from "../../data/reciters";

function label(reciter, lang) {
  if (lang === "ar") return reciter.name;
  if (lang === "fr") return reciter.nameFr;
  return reciter.nameEn;
}

export default function ReciterHero({ reciter, lang }) {
  const visual = getReciterVisual(reciter);
  const [imgError, setImgError] = useState(false);
  const showPhoto = visual.photo && !imgError;
  const avatar = visual.avatar;
  const sourceLabel =
    reciter.source === "mp3quran"
      ? "MP3Quran"
      : reciter.source === "everyayah"
        ? "EveryAyah"
        : reciter.cdnType || "";

  return (
    <div className="reciter-hero flex min-w-0 items-start gap-3 py-1 sm:items-center sm:gap-4">
      <div className="relative shrink-0">
        {/* Ambient glow behind avatar */}
        <div className="absolute inset-0 rounded-full bg-[var(--primary)] opacity-[0.12] blur-xl scale-125 pointer-events-none" aria-hidden="true" />
        
        {showPhoto ? (
          <img
            src={visual.photo}
            alt={label(reciter, lang)}
            className="reciter-hero__avatar relative h-14 w-14 rounded-full border-2 border-[var(--primary)] object-cover shadow-[0_4px_16px_rgba(var(--primary-rgb),0.2)] transition-transform duration-300 hover:scale-105 sm:h-[72px] sm:w-[72px]"
            onError={() => setImgError(true)}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            sizes="(max-width: 640px) 56px, 72px"
          />
        ) : (
          <div
            className="reciter-hero__avatar reciter-hero__avatar--fallback relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white border-2 border-white/50 shadow-[0_4px_16px_rgba(var(--primary-rgb),0.15)] sm:h-[72px] sm:w-[72px]"
            style={{ backgroundColor: avatar.color }}
            aria-hidden="true"
          >
            <span className="text-base font-black tracking-normal sm:text-lg">{avatar.initials}</span>
          </div>
        )}
      </div>
      <div className="reciter-hero__copy min-w-0 flex-1">
        <h3 id="reciter-modal-title" className="reciter-hero__name text-base sm:text-xl font-bold text-text-primary leading-tight break-words">
          {label(reciter, lang)}
        </h3>
        <div className="reciter-hero__meta mt-2 flex max-w-full flex-wrap items-center gap-1.5 sm:gap-2">
          <ReciterTypeBadge style={reciter.style} />
          {reciter.cdnType === "mp3quran-surah" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 text-[0.68rem] font-bold text-amber-600 dark:text-amber-400">
              <i className="fas fa-bolt text-[0.6rem]" />HD
            </span>
          )}
          {reciter.verifiedWarsh && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 text-[0.68rem] font-bold text-emerald-600 dark:text-emerald-400">
              Warsh
            </span>
          )}
          {reciter.country && (
            <span className="inline-flex items-center rounded-full bg-[rgba(var(--primary-rgb),0.08)] border border-[rgba(var(--primary-rgb),0.14)] px-2.5 py-0.5 text-[0.68rem] font-bold text-[var(--text-muted)]">
              {reciter.country}
            </span>
          )}
          {sourceLabel && (
            <span className="inline-flex items-center rounded-full bg-[rgba(var(--primary-rgb),0.05)] border border-border px-2.5 py-0.5 text-[0.68rem] font-bold text-[var(--text-muted)]">
              {sourceLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
