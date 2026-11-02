import React from "react";
import { PhoneIcon } from "./landingIcons";
import { localizePath } from "../../utils/localePath";
import { Folio, Kicker, Phone } from "./LandingMedia";

/** Folio IV: the app on a phone. Only an https address from site.config.json becomes a button. */
export function LandingMobile({ copy, numeral, android, ios }) {
  return (
    <Folio n="4" numeral={numeral} className="landing-mobile" aria-labelledby="landing-mobile-title">
      <div className="landing-mobile__text" data-reveal>
        <Kicker Icon={PhoneIcon}>{copy.kicker}</Kicker>
        <h2 id="landing-mobile-title">{copy.title}</h2>
        <p className="landing__lead">{copy.text}</p>
        {android || ios ? (
          <div className="landing__stores">
            {android ? (
              <a className="landing__btn landing__btn--primary" href={android} rel="noopener noreferrer">
                {copy.android}
              </a>
            ) : null}
            {ios ? (
              <a className="landing__btn landing__btn--primary" href={ios} rel="noopener noreferrer">
                {copy.ios}
              </a>
            ) : null}
          </div>
        ) : (
          <p className="landing__soon">{copy.soon}</p>
        )}
      </div>
      <div className="landing-mobile__phones">
        <Phone shot="mob-radio" className="landing-mobile__radio" />
        <Phone shot="mob-player" alt={copy.playerAlt} />
      </div>
    </Folio>
  );
}

/** Folio V. */
export function LandingFooter({ copy, numeral, lang, onOpenLegal }) {
  // Real links (middle click, copy address); a plain click keeps the in-app navigation.
  const follow = (page) => (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onOpenLegal(page);
  };
  return (
    <Folio n="5" numeral={numeral} as="footer" className="landing__footer">
      <p>{copy.note}</p>
      <nav aria-label="MushafPlus">
        {["about", "privacy", "sources"].map((page) => (
          <a key={page} className="landing__link" href={localizePath(`/${page}`, lang)} onClick={follow(page)}>
            {copy.links[page]}
          </a>
        ))}
      </nav>
    </Folio>
  );
}
