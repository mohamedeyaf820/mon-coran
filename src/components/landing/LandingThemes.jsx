import React, { useEffect, useRef, useState } from "react";
import { CheckIcon, PhoneIcon } from "./landingIcons";
import { ClipPhone, Folio, Kicker, Phone } from "./LandingMedia";
import { SHOTS, TINTS } from "./landingData";

/**
 * Folio III: the five themes of the mobile app. While one is shown (centred in the rail,
 * hovered, focused or tapped) the whole page takes its colour. The web has only three
 * themes, so the block says "mobile app".
 */
export default function LandingThemes({ copy, numeral, wide, playback, setTint }) {
  const [selected, setSelected] = useState(null);
  const body = useRef(null);
  const rail = useRef(null);
  const inside = useRef(false);
  const centred = useRef(null);

  const choose = (id) => {
    setSelected(id);
    setTint(id);
  };

  useEffect(() => {
    const node = body.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const root = node.closest(".landing");
    const section = new IntersectionObserver(
      ([entry]) => {
        inside.current = entry.isIntersecting;
        if (!entry.isIntersecting) {
          setSelected(null);
          setTint(null);
        } else if (centred.current) {
          setSelected(centred.current);
          setTint(centred.current);
        }
      },
      { root, rootMargin: "-30% 0px -30% 0px", threshold: 0 },
    );
    section.observe(node);
    // On a phone the theme in the middle of the rail is the one shown.
    const middle =
      wide || !rail.current
        ? null
        : new IntersectionObserver(
            (hits) => {
              for (const hit of hits) {
                if (!hit.isIntersecting) continue;
                centred.current = hit.target.dataset.tint;
                if (inside.current) {
                  setSelected(centred.current);
                  setTint(centred.current);
                }
              }
            },
            { root: rail.current, rootMargin: "0px -42% 0px -42%", threshold: 0 },
          );
    if (middle) rail.current.querySelectorAll("[data-tint]").forEach((item) => middle.observe(item));
    return () => {
      section.disconnect();
      middle?.disconnect();
      setTint(null);
    };
  }, [wide, setTint]);

  return (
    <Folio n="3" numeral={numeral} className="landing-themes" aria-labelledby="landing-themes-title">
      <div ref={body} className="landing-themes__body">
        <header className="landing-themes__head" data-reveal>
          <Kicker Icon={PhoneIcon}>{copy.kicker}</Kicker>
          <h2 id="landing-themes-title">{copy.title}</h2>
          <p className="landing__lead">{copy.text}</p>
        </header>
        <ul ref={rail} className="landing-themes__rail">
          {Object.entries(TINTS).map(([id, { fresh }]) => (
            <li key={id}>
              <button
                type="button"
                className="landing-theme"
                data-tint={id}
                aria-pressed={selected === id}
                onClick={() => choose(id)}
                onFocus={() => choose(id)}
                onPointerEnter={(event) => event.pointerType === "mouse" && choose(id)}
              >
                <span className="landing-phone landing-phone--thumb">
                  <img src={`${SHOTS}mob-home-${id}.webp`} alt="" width="720" height="1503" loading="lazy" decoding="async" />
                  {selected === id ? <CheckIcon className="landing-theme__check" /> : null}
                </span>
                <span className="landing-theme__name">{copy.names[id]}</span>
                {fresh ? <span className="landing-theme__new">{copy.fresh}</span> : null}
              </button>
            </li>
          ))}
        </ul>
        {wide ? (
          <div className="landing-themes__picker">
            <Phone shot="mob-themes-picker-a" alt={copy.pickerAlt} />
            <Phone shot="mob-themes-picker-b" />
          </div>
        ) : (
          <ClipPhone clips={[{ name: "mob-themes", label: copy.videoAlt, current: true }]} playback={playback} />
        )}
      </div>
    </Folio>
  );
}
