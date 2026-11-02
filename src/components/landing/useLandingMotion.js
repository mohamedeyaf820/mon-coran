import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { tintSequence } from "./landingData";

// Motion of the welcome page, kept out of the page component and out of React state:
// the page scrolls inside .landing (position: fixed), so every observer and every scroll
// listener here targets that container, not the window. With reduced motion nothing in
// this file moves anything: the page keeps one tint, shows no reveal and plays no video.

const QUERY_REDUCE = "(prefers-reduced-motion: reduce)";

/** A media query as a boolean that follows the browser live. */
export function useMedia(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const sync = () => setMatches(list.matches);
    sync();
    list.addEventListener("change", sync);
    return () => list.removeEventListener("change", sync);
  }, [query]);
  return matches;
}

export const useReducedMotion = () => useMedia(QUERY_REDUCE);

/** Network state as a boolean, live (the offline notice of the page). */
export function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine !== false);
  useEffect(() => {
    const sync = () => setOnline(navigator.onLine !== false);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);
  return online;
}

/** Fetches the given images once the browser is idle, so the service worker keeps them for offline. */
export function useWarmImages(urls) {
  useEffect(() => {
    if (navigator.onLine === false || navigator.connection?.saveData || !navigator.serviceWorker) return;
    const idle = window.requestIdleCallback || ((run) => setTimeout(run, 2000));
    // Only once the service worker answers for the page, or nothing would be kept.
    const sw = navigator.serviceWorker;
    const warm = () => idle(() => urls.forEach((url) => fetch(url).catch(() => {})));
    sw.ready.then(() => (sw.controller ? warm() : sw.addEventListener("controllerchange", warm, { once: true })));
  }, [urls]);
}

/** True while at least `threshold` of the node is inside the landing scroller. */
export function useInView(ref, threshold = 0.4) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === "undefined") return undefined;
    const observer = new IntersectionObserver(([entry]) => setSeen(entry.isIntersecting), {
      root: node.closest(".landing"),
      threshold,
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return seen;
}

/** Demo playback: autoplay stops for reduced motion, a pause by the reader, or a blocked play(). */
export function usePlayback(reduce) {
  const [paused, setPaused] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const toggle = useCallback(() => setPaused((value) => !value), []);
  const block = useCallback(() => setBlocked(true), []);
  return { auto: !reduce && !paused && !blocked, paused, reduce, toggle, block };
}

/**
 * Scroll motion: border under the bar, reveal of marked blocks (once), the hero walking
 * through the three web tints while it scrolls away, and its dissolving word.
 * Returns setTint(id | null): the themes block pins the page tint while one is shown.
 */
export function useLandingMotion(rootRef, base) {
  const pinned = useRef(null);
  const apply = useRef(() => {});

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;
    const reduce = window.matchMedia?.(QUERY_REDUCE).matches;
    const sequence = tintSequence(base);
    const hero = root.querySelector("[data-folio='1']");
    let frame = 0;

    const update = () => {
      frame = 0;
      const top = root.scrollTop;
      root.classList.toggle("landing--scrolled", top > 8);
      if (reduce) return;
      const progress = hero ? Math.min(top / Math.max(hero.offsetHeight * 0.9, 1), 1) : 0;
      hero?.style.setProperty("--lp-word", (1 - 0.65 * progress).toFixed(3));
      const shot = sequence[progress < 0.25 ? 0 : progress < 0.5 ? 1 : progress < 0.75 ? 2 : 0];
      const tint = pinned.current || shot;
      if (root.dataset.shot !== shot) root.dataset.shot = shot;
      if (root.dataset.tint !== tint) root.dataset.tint = tint;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    root.addEventListener("scroll", schedule, { passive: true });
    update();

    if (reduce || typeof IntersectionObserver === "undefined") {
      return () => {
        root.removeEventListener("scroll", schedule);
        cancelAnimationFrame(frame);
      };
    }

    apply.current = schedule;
    root.classList.add("landing--motion");
    window.addEventListener("resize", schedule);
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      },
      { root, rootMargin: "0px 0px -10% 0px", threshold: 0 },
    );
    root.querySelectorAll("[data-reveal], [data-frame]").forEach((node) => observer.observe(node));

    return () => {
      root.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
      apply.current = () => {};
      root.classList.remove("landing--motion");
    };
  }, [rootRef, base]);

  return useCallback((id) => {
    pinned.current = id;
    apply.current();
  }, []);
}
