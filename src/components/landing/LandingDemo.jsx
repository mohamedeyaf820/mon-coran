import React, { useEffect, useRef, useState } from "react";
import { ArrowIcon, BookIcon, HandsIcon, HeadphonesIcon, PlayIcon } from "./landingIcons";
import { ClipPhone, Folio, Kicker } from "./LandingMedia";
import { ENTRIES } from "./landingData";

const ICONS = { read: BookIcon, duas: HandsIcon, listen: HeadphonesIcon };

/**
 * Folio II: the three ways into the app, each shown by a recording of the real app.
 * Wide screens keep one phone on screen and the entry in the middle of the window
 * chooses its recording; on a phone every entry carries its own.
 */
export default function LandingDemo({ copy, numeral, wide, playback, actions }) {
  const [active, setActive] = useState(0);
  const entries = useRef([]);

  useEffect(() => {
    if (!wide || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(
      (hits) => {
        for (const hit of hits) if (hit.isIntersecting) setActive(Number(hit.target.dataset.index));
      },
      { root: entries.current[0]?.closest(".landing"), rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    entries.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [wide]);

  const clips = ENTRIES.map((entry, index) => ({
    name: entry.clip,
    label: copy.entries[entry.id].intent,
    current: wide ? index === active : true,
  }));

  return (
    <Folio n="2" numeral={numeral} className="landing-demo" aria-labelledby="landing-demo-title">
      <header className="landing-demo__head" data-reveal>
        <Kicker Icon={PlayIcon}>{copy.kicker}</Kicker>
        <h2 id="landing-demo-title">{copy.title}</h2>
        {playback.reduce ? null : (
          <button type="button" className="landing__pause" aria-pressed={playback.paused} onClick={playback.toggle}>
            {copy.pause}
          </button>
        )}
      </header>
      <div className="landing-demo__body">
        {wide ? (
          <div className="landing-demo__stage">
            <ClipPhone clips={clips} playback={playback} />
          </div>
        ) : null}
        <div className="landing-demo__entries">
          {ENTRIES.map((entry, index) => {
            const Icon = ICONS[entry.id];
            const text = copy.entries[entry.id];
            return (
              <article
                key={entry.id}
                ref={(node) => { entries.current[index] = node; }}
                className="landing-entry"
                data-entry={entry.id}
                data-index={index}
              >
                <div className="landing-entry__text" data-reveal>
                  <Icon size={28} />
                  <h3>{text.intent}</h3>
                  <p>{text.text}</p>
                  <button type="button" className="landing__btn landing__btn--solid" onClick={actions[entry.id]}>
                    <span>{text.cta}</span>
                    <ArrowIcon />
                  </button>
                </div>
                {wide ? null : <ClipPhone clips={[clips[index]]} playback={playback} />}
              </article>
            );
          })}
        </div>
      </div>
    </Folio>
  );
}
