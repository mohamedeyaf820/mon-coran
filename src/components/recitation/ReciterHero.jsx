import React, { useState } from "react";
import ReciterTypeBadge from "./ReciterTypeBadge";
import {
  getReciterCountryLabel,
  getReciterVisual,
} from "../../data/reciters";

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
  const countryLabel = getReciterCountryLabel(reciter, lang);

  return (
    <div className="reciter-hero flex min-w-0 items-center gap-3.5">
      <div className="reciter-hero__portrait relative shrink-0">
        <div
          className={`reciter-hero__avatar--fallback flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-white sm:h-20 sm:w-20${showPhoto ? " reciter-hero__avatar--bg" : " reciter-hero__avatar"}`}
          style={{ background: avatar.gradient }}
          aria-hidden="true"
        >
          <span className="text-lg font-black sm:text-xl">{avatar.initials}</span>
        </div>
        {showPhoto ? (
          <img
            src={visual.photo}
            alt=""
            className="reciter-hero__avatar absolute inset-0 h-16 w-16 rounded-full border-2 border-primary/20 object-cover sm:h-20 sm:w-20"
            onError={() => setImgError(true)}
            loading="eager"
            decoding="async"
            fetchpriority="high"
            referrerPolicy="no-referrer"
          />
        ) : null}
      </div>

      <div className="reciter-hero__copy min-w-0 flex-1">
        <h3
          id="reciter-modal-title"
          className="reciter-hero__name text-lg font-bold text-text-primary leading-tight sm:text-xl"
        >
          {label(reciter, lang)}
        </h3>
        <div className="reciter-hero__meta mt-1.5 flex flex-wrap items-center gap-1.5">
          <ReciterTypeBadge style={reciter.style} />
          {reciter.verifiedWarsh && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-600 dark:text-emerald-400">
              Warsh
            </span>
          )}
          {countryLabel && (
            <span className="inline-flex items-center rounded-full bg-bg-secondary px-2 py-0.5 text-[0.65rem] font-medium text-text-muted">
              {countryLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
