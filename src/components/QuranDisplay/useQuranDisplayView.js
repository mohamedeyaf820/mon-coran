import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { resolveFontFamily } from "../../data/fonts";
import {
  clampArabicFontSize,
  getArabicReadingLineHeight,
  getResponsiveArabicFontSize,
} from "../../utils/arabicTypography";

export default function useQuranDisplayView({
  contentReady,
  dispatch,
  displayMode,
  fontFamily,
  isQCF4,
  quranFontSize,
  quranTranslationFontSize,
  riwaya,
  syncKey,
  syncOffsetsMs,
  mushafLayout,
}) {
  const contentRef = useRef(null);
  const pinchRef = useRef({ startDist: null, startSize: null });
  const [fullPage, setFullPage] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === "undefined") return 1024;
    return window.innerWidth;
  });

  const quranFontCss = resolveFontFamily(fontFamily, riwaya);
  const userSyncOffsetMs = Math.max(
    -500,
    Math.min(500, Number(syncOffsetsMs?.[syncKey] ?? 0)),
  );
  const readingFontSize = useMemo(
    () =>
      getResponsiveArabicFontSize({
        preferredSize: clampArabicFontSize(quranFontSize),
        viewportWidth,
        mushafLayout,
      }),
    [mushafLayout, quranFontSize, viewportWidth],
  );
  const preferredReadingFontSize = useMemo(
    () => clampArabicFontSize(quranFontSize),
    [quranFontSize],
  );
  const fullscreenFontSize = useMemo(
    () => Math.min(Math.max(readingFontSize + 6, 16), 110),
    [readingFontSize],
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
    let frameId;
    const updateWidth = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        setViewportWidth(window.innerWidth);
      });
    };
    updateWidth();
    window.addEventListener("resize", updateWidth, { passive: true });
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", updateWidth);
    };
  }, []);

  useLayoutEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const quranFontSizeCss = `${Math.round(readingFontSize)}px`;
    const listMetric = (factor, minimum, maximum) =>
      `${Math.max(minimum, Math.min(maximum, readingFontSize * factor)).toFixed(2)}px`;
    const quranLineHeight = String(
      getArabicReadingLineHeight({
        displayMode,
        fontFamily,
        mushafLayout,
        riwaya,
      }),
    );
    element.style.setProperty("--qd-reading-font-size", quranFontSizeCss);
    element.style.setProperty("--qd-font-size", quranFontSizeCss);
    // Verse-list chrome follows the resolved, device-aware Arabic size. This
    // keeps small text from sitting inside an unnecessarily tall card while
    // preserving comfortable spacing when the reader enlarges it.
    element.style.setProperty(
      "--qd-list-card-padding-block",
      listMetric(0.42, 6, 24),
    );
    element.style.setProperty(
      "--qd-list-card-padding-inline",
      listMetric(0.5, 8, 28),
    );
    element.style.setProperty(
      "--qd-list-content-gap",
      listMetric(0.22, 4, 14),
    );
    element.style.setProperty(
      "--qd-list-section-gap",
      listMetric(0.28, 5, 18),
    );
    element.style.setProperty(
      "--qd-list-control-size",
      listMetric(1.08, 32, 44),
    );
    element.style.setProperty(
      "--qd-list-icon-size",
      listMetric(0.4, 12, 15),
    );
    element.style.setProperty(
      "--qd-list-loading-height",
      listMetric(1.7, 42, 80),
    );
    element.style.setProperty(
      "--qd-translation-font-size",
      `${Math.max(12, Math.min(28, Number(quranTranslationFontSize) || 18))}px`,
    );
    element.style.setProperty("--qd-fullscreen-font-size", `${fullscreenFontSize}px`);
    document.documentElement.style.setProperty("--qcom-reader-font-size", quranFontSizeCss);
    document.documentElement.style.setProperty("--qcom-ar-size", quranFontSizeCss);
    document.documentElement.style.setProperty("--quran-font-size", quranFontSizeCss);
    document.documentElement.style.setProperty("--qd-reading-font-size", quranFontSizeCss);
    element.style.setProperty("--qd-font-size", quranFontSizeCss);
    element.style.setProperty("--qd-reading-font-size", quranFontSizeCss);
    element.style.setProperty("--qcom-reader-font-size", quranFontSizeCss);
    element.style.setProperty("--qcom-ar-size", quranFontSizeCss);
    element.style.setProperty("--quran-font-size", quranFontSizeCss);
    element.style.setProperty("--quran-line-height", quranLineHeight);
    element.style.setProperty("--cpv-font-size", quranFontSizeCss);

    if (isQCF4) {
      element.style.removeProperty("--qd-font-family");
      element.dataset.qcf4Font = "true";
    } else {
      document.documentElement.style.setProperty("--quran-font-family", quranFontCss);
      document.documentElement.style.setProperty("--font-quran", quranFontCss);
      document.documentElement.style.setProperty("--font-quran-tajweed", quranFontCss);
      element.style.setProperty("--qd-font-family", quranFontCss);
      element.style.setProperty("--quran-font-family", quranFontCss);
      element.dataset.qcf4Font = "false";
    }

    element
      .querySelectorAll(".verse-text, .mushaf-container, .quran-text, .qc-ayah-text-ar, .rd-arabic, .mushaf-verse, .cpv-verse, [lang='ar']")
      .forEach((arabicElement) => {
        if (!isQCF4) {
          arabicElement.style.fontFamily = quranFontCss;
        }
        arabicElement.style.fontSize = quranFontSizeCss;
      });
  }, [
    contentReady,
    displayMode,
    fullscreenFontSize,
    fontFamily,
    isQCF4,
    quranFontCss,
    quranTranslationFontSize,
    mushafLayout,
    readingFontSize,
    riwaya,
  ]);

  const touchHandlers = {
    onTouchStart: (event) => {
      if (event.touches.length !== 2) return;
      pinchRef.current = {
        startDist: Math.hypot(
          event.touches[0].clientX - event.touches[1].clientX,
          event.touches[0].clientY - event.touches[1].clientY,
        ),
        startSize: preferredReadingFontSize,
      };
    },
    onTouchMove: (event) => {
      if (event.touches.length !== 2 || !pinchRef.current.startDist) return;
      const distance = Math.hypot(
        event.touches[0].clientX - event.touches[1].clientX,
        event.touches[0].clientY - event.touches[1].clientY,
      );
      const nextSize = Math.round(
        clampArabicFontSize(
          pinchRef.current.startSize * (distance / pinchRef.current.startDist),
        ),
      );
      if (nextSize !== preferredReadingFontSize) {
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
