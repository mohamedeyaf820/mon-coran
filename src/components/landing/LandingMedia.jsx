import React, { useEffect, useRef } from "react";
import { CLIPS, SHOTS } from "./landingData";
import { useInView } from "./useLandingMotion";

/** Small-capitals label above a heading, with an optional drawn icon. */
export function Kicker({ Icon, children }) {
  return (
    <p className="landing__kicker">
      {Icon ? <Icon size={18} /> : null}
      <span>{children}</span>
    </p>
  );
}

/**
 * A folio of the page: a numbered section inside the gilt frame of a mushaf page.
 * The frame draws itself once when it enters (see landing.css); the numeral is decoration.
 */
export function Folio({ n, numeral, as: Tag = "section", className = "", children, ...rest }) {
  return (
    <Tag className={`folio ${className}`} data-folio={n} {...rest}>
      <div className="folio__frame" data-frame aria-hidden="true">
        <i /><i /><i /><i /><b /><b /><b /><b />
      </div>
      <span className="folio__num" aria-hidden="true">{numeral}</span>
      {children}
    </Tag>
  );
}

/** A capture of the mobile app in a device frame. Sizes are fixed: no layout shift. */
export function Phone({ shot, alt = "", eager = false, className = "", ...rest }) {
  return (
    <div className={`landing-phone ${className}`} {...rest}>
      <img
        src={`${SHOTS}${shot}.webp`}
        alt={alt}
        width="720"
        height="1503"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        {...(eager ? { fetchpriority: "high" } : {})}
      />
    </div>
  );
}

/**
 * Recordings of the mobile app in a device frame. `clips` stack on top of each other and the
 * one marked `current` is shown. A recording plays only while the frame is on screen and
 * autoplay is allowed; otherwise it shows its poster with the native controls.
 */
export function ClipPhone({ clips, playback, className = "" }) {
  const frame = useRef(null);
  const videos = useRef([]);
  const visible = useInView(frame, 0.4);
  const { auto, block } = playback;

  useEffect(() => {
    videos.current.forEach((video, index) => {
      if (!video) return;
      if (!(auto && visible && clips[index].current)) {
        video.pause();
        return;
      }
      Promise.resolve(video.play()).catch((error) => {
        // A pause() racing a play() is an AbortError: not a refusal.
        if (error?.name === "NotAllowedError" || error?.name === "NotSupportedError") block();
      });
    });
  }, [auto, visible, clips, block]);

  return (
    <div ref={frame} className={`landing-phone landing-phone--clips ${className}`}>
      {clips.map((clip, index) => (
        <video
          key={clip.name}
          ref={(node) => { videos.current[index] = node; }}
          className={clip.current ? "is-current" : undefined}
          src={`${CLIPS}${clip.name}.mp4`}
          poster={`${CLIPS}${clip.name}.jpg`}
          aria-label={clip.label}
          aria-hidden={clip.current ? undefined : true}
          inert={clip.current ? undefined : ""}
          width="540"
          height="1128"
          muted
          loop
          playsInline
          preload="none"
          controls={!auto}
        />
      ))}
    </div>
  );
}
