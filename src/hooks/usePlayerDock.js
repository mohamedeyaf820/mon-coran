import { useLayoutEffect, useRef } from "react";

/** Reserve the rendered dock, including safe areas and text/font resizing. */
export function usePlayerDock({ closed, isMobile, minimized, isContextualDesktop }) {
  const playerRef = useRef(null);
  useLayoutEffect(() => {
    const root = document.documentElement;
    const player = playerRef.current;
    const clear = () => {
      root.style.removeProperty("--player-h");
      root.style.removeProperty("--desktop-player-reserved-h");
    };
    clear();
    if (closed || !player) return clear;
    const update = () => {
      const rect = player.getBoundingClientRect();
      const bottom = Math.max(0, parseFloat(getComputedStyle(player).bottom) || 0);
      const height = Math.ceil(rect.height + bottom);
      if (isMobile) root.style.setProperty("--player-h", `${height}px`);
      else if (isContextualDesktop) {
        root.style.setProperty("--desktop-player-reserved-h", `${height}px`);
      }
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(player);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
      clear();
    };
  }, [closed, isMobile, minimized, isContextualDesktop]);
  return playerRef;
}
