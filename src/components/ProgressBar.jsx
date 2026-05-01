import React, { useEffect, useState } from "react";

function getScrollTarget() {
  if (typeof document === "undefined") return null;
  const appMain = document.querySelector(".app-main");
  if (appMain && appMain.scrollHeight > appMain.clientHeight) return appMain;
  return document.scrollingElement || document.documentElement;
}

export default function ProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const target = getScrollTarget();
    if (!target) return undefined;

    const updateProgress = () => {
      const scrollTop =
        target === document.scrollingElement || target === document.documentElement
          ? window.scrollY || target.scrollTop
          : target.scrollTop;
      const maxScroll = Math.max(1, target.scrollHeight - target.clientHeight);
      setProgress(Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100)));
    };

    updateProgress();
    target.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    return () => {
      target.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, []);

  return (
    <div className="app-scroll-progress" aria-hidden="true">
      <div
        className="app-scroll-progress__bar"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}
