import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { resolveFontFamily } from "../../data/fonts";

export default function useQuranDisplayView({
  dispatch,
  displayMode,
  fontFamily,
  isQCF4,
  quranFontSize,
  quranTranslationFontSize,
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
        ? Math.min(Math.max(quranFontSize, 32), 58)
        : Math.min(Math.max(quranFontSize, 40), 72),
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

    const pageScale = displayMode === "page" ? 1.28 : 1;
    const quranFontSizeCss = `${Math.round(readingFontSize * pageScale)}px`;
    const quranLineHeight = displayMode === "page" ? "3.05" : "2.2";
    element.style.setProperty("--qd-reading-font-size", quranFontSizeCss);
    element.style.setProperty(
      "--qd-translation-font-size",
      `${Math.max(12, Math.min(28, Number(quranTranslationFontSize) || 18))}px`,
    );
    element.style.setProperty("--qd-fullscreen-font-size", `${fullscreenFontSize}px`);
    document.documentElement.style.setProperty("--quran-font-family", quranFontCss);
    document.documentElement.style.setProperty("--quran-font-size", quranFontSizeCss);
    document.documentElement.style.setProperty("--quran-line-height", quranLineHeight);
    if (isQCF4) {
      element.style.removeProperty("--qd-font-family");
      element.dataset.qcf4Font = "true";
      return;
    }

    element.style.setProperty("--qd-font-family", quranFontCss);
    element.style.setProperty("--quran-font-family", quranFontCss);
    element.style.setProperty("--quran-font-size", quranFontSizeCss);
    element.style.setProperty("--quran-line-height", quranLineHeight);
    element.dataset.qcf4Font = "false";
    document.documentElement.style.setProperty("--font-quran", quranFontCss);
    document.documentElement.style.setProperty("--font-quran-tajweed", quranFontCss);

    element
      .querySelectorAll(".verse-text, .mushaf-container, .quran-text, [lang='ar']")
      .forEach((arabicElement) => {
        arabicElement.style.fontFamily = quranFontCss;
      });
  }, [
    displayMode,
    fullscreenFontSize,
    isQCF4,
    quranFontCss,
    quranTranslationFontSize,
    readingFontSize,
  ]);

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
        Math.max(32, Math.min(72, pinchRef.current.startSize * (distance / pinchRef.current.startDist))),
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
