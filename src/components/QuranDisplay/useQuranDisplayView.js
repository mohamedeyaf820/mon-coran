import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveFontFamily } from "../../data/fonts";

export default function useQuranDisplayView({
  dispatch,
  displayMode,
  fontFamily,
  isQCF4,
  quranFontSize,
  riwaya,
  syncKey,
  syncOffsetsMs,
}) {
  const contentRef = useRef(null);
  const pinchRef = useRef({ startDist: null, startSize: null });
  const [fullPage, setFullPage] = useState(false);
  const [isCompactPhone, setIsCompactPhone] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 420px)").matches;
  });

  const quranFontCss = resolveFontFamily(fontFamily, riwaya);
  const userSyncOffsetMs = Math.max(
    -500,
    Math.min(500, Number(syncOffsetsMs?.[syncKey] ?? 0)),
  );
  const readingFontSize = useMemo(
    () =>
      isCompactPhone
        ? Math.min(Math.max(quranFontSize, 27), 52)
        : Math.min(Math.max(quranFontSize, 32), 64),
    [isCompactPhone, quranFontSize],
  );
  const fullscreenFontSize = useMemo(
    () =>
      isCompactPhone
        ? Math.min(Math.max(readingFontSize + 5, 40), 60)
        : Math.min(Math.max(readingFontSize + 8, 50), 72),
    [isCompactPhone, readingFontSize],
  );

  const getScrollContainer = useCallback(() => {
    const content = contentRef.current;
    const shell = content?.closest(".app-main");
    if (shell && shell.scrollHeight - shell.clientHeight > 1) return shell;
    const docScroll =
      typeof document !== "undefined"
        ? document.scrollingElement || document.documentElement
        : null;
    if (docScroll && docScroll.scrollHeight - docScroll.clientHeight > 1) return docScroll;
    return shell || content || docScroll || null;
  }, []);

  useEffect(() => {
    if (!fullPage) return undefined;
    const handler = (event) => {
      if (event.key === "Escape") setFullPage(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [fullPage]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 420px)");
    const onChange = (event) => setIsCompactPhone(event.matches);
    setIsCompactPhone(media.matches);
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    element.style.setProperty(
      "--qd-reading-font-size",
      `${displayMode === "page" ? readingFontSize * 1.15 : readingFontSize}px`,
    );
    element.style.setProperty("--qd-fullscreen-font-size", `${fullscreenFontSize}px`);
    if (isQCF4) {
      element.style.removeProperty("--qd-font-family");
      element.dataset.qcf4Font = "true";
      return;
    }

    element.style.setProperty("--qd-font-family", quranFontCss);
    element.dataset.qcf4Font = "false";
    document.documentElement.style.setProperty("--font-quran", quranFontCss);
    document.documentElement.style.setProperty("--font-quran-tajweed", quranFontCss);
  }, [displayMode, fullscreenFontSize, isQCF4, quranFontCss, readingFontSize]);

  const touchHandlers = {
    onTouchStart: (event) => {
      if (event.touches.length !== 2) return;
      pinchRef.current = {
        startDist: Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY,
        ),
        startSize: quranFontSize,
      };
    },
    onTouchMove: (event) => {
      if (event.touches.length !== 2 || !pinchRef.current.startDist) return;
      const distance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY,
      );
      const nextSize = Math.round(
        Math.max(32, Math.min(64, pinchRef.current.startSize * (distance / pinchRef.current.startDist))),
      );
      if (nextSize !== quranFontSize) {
        dispatch({ type: "SET_QURAN_FONT_SIZE", payload: nextSize });
      }
    },
    onTouchEnd: () => {
      pinchRef.current = { startDist: null, startSize: null };
    },
  };

  return {
    contentRef,
    fullPage,
    fullscreenFontSize,
    getScrollContainer,
    readingFontSize,
    setFullPage,
    touchHandlers,
    userSyncOffsetMs,
  };
}
