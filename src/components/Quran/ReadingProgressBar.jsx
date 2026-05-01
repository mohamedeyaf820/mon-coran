import React, { useEffect, useRef, useState } from "react";

/**
 * Thin progress bar that shows how far the user has scrolled
 * through the current reading content. Sticks right below the header.
 */
export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  const rafRef = useRef(null);

  useEffect(() => {
    function onScroll() {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        const scrollEl = document.scrollingElement || document.documentElement;
        const scrollTop = scrollEl.scrollTop;
        const scrollHeight = scrollEl.scrollHeight - scrollEl.clientHeight;
        const pct = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;
        setProgress(pct);
        rafRef.current = null;
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      className="sticky top-[var(--header-h,68px)] z-[99] h-[3px] w-full bg-transparent pointer-events-none"
      aria-hidden="true"
    >
      <div
        className="h-full bg-[var(--primary)] transition-[width] duration-100 ease-out rounded-r-full"
        style={{ width: `${progress}%`, opacity: progress > 0.5 ? 1 : 0 }}
      />
    </div>
  );
}
