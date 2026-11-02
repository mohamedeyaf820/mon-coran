import React from "react";
import { BookIcon } from "./landingIcons";
import { Folio, Kicker } from "./LandingMedia";
import { SHOTS } from "./landingData";

/** Folio I: the promise in one sentence, one action, and the real app. */
export default function LandingHero({ copy, numeral, sequence, primaryLabel, offline, onStart, onOpenApp }) {
  const { title, word } = copy.hero;
  const head = title.slice(0, -1);
  return (
    <Folio n="1" numeral={numeral} className="landing-hero" aria-labelledby="landing-title">
      <div className="landing-hero__copy">
        <Kicker>{copy.hero.kicker}</Kicker>
        <h1 id="landing-title" className="landing-hero__title">
          {head.map((line, index) => (
            <span key={line} className="landing-hero__line" style={{ "--i": index }}>{line}{" "}</span>
          ))}
          <span className="landing-hero__line" style={{ "--i": head.length }}>
            {title[title.length - 1]}{" "}
            <span className="landing__word">{word}</span>
          </span>
        </h1>
        <p className="landing__lead">{copy.hero.lead}</p>
        <div className="landing__actions">
          <button type="button" className="landing__btn landing__btn--primary" onClick={onStart}>
            <BookIcon />
            <span>{primaryLabel}</span>
          </button>
          <button type="button" className="landing__btn landing__btn--quiet" onClick={onOpenApp}>
            {copy.hero.openApp}
          </button>
        </div>
        {offline ? (
          <p className="landing__offline" role="status">{copy.hero.offline}</p>
        ) : null}
      </div>
      <div className="landing-hero__phone">
        <div className="landing-phone landing-phone--hero">
          {sequence.map((tint, index) => (
            <img
              key={tint}
              className="landing-hero__shot"
              data-shot={tint}
              src={`${SHOTS}mob-home-${tint}.webp`}
              alt={index === 0 ? copy.hero.alt : ""}
              width="720"
              height="1503"
              loading={index === 0 ? "eager" : "lazy"}
              decoding="async"
              {...(index === 0 ? { fetchpriority: "high" } : {})}
            />
          ))}
        </div>
      </div>
      <ul className="landing-hero__colophon">
        {copy.colophon.map((fact) => (
          <li key={fact}>{fact}</li>
        ))}
      </ul>
    </Folio>
  );
}
