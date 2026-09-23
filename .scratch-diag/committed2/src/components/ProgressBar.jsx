import React, { useEffect, useState } from "react";

function maxScrollOf(el) {
  return Math.max(1, el.scrollHeight - el.clientHeight);
}

function progressOf(el) {
  const top =
    el === document.scrollingElement || el === document.documentElement
      ? window.scrollY || el.scrollTop
      : el.scrollTop;
  return Math.min(100, Math.max(0, (top / maxScrollOf(el)) * 100));
}

export default function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // The reading scroller is not knowable at mount (content grows after
    // data arrives), so follow every real scroll instead of subscribing to
    // one element: scroll events do not bubble but they do capture on
    // document, and the event target is by definition the scroller.
    const updateFrom = (source) => {
      if (!(source.scrollHeight - source.clientHeight > 1)) return;
      setProgress(progressOf(source));
    };
    const onScroll = (event) => {
      const scroller = event.target instanceof Element ? event.target : null;
      if (scroller) updateFrom(scroller);
    };
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    const onWindowScroll = () => updateFrom(document.scrollingElement || document.documentElement);
    window.addEventListener("scroll", onWindowScroll, { passive: true });
    updateFrom(document.querySelector(".app-main") || document.scrollingElement || document.documentElement);
    return () => {
      document.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("scroll", onWindowScroll);
    };
  }, []);

  return (
    <div className="app-scroll-progress" aria-hidden="true">
      <div
        className="app-scroll-progress__bar"
        style={{ width: `${progress}%`, borderRadius: "999px" }}
      />
    </div>
  );
}
