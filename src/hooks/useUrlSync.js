import { useEffect, useRef } from "react";
import { getSurahAyahCount } from "../data/surahs.js";

/**
 * Synchronise React navigation state with the browser URL.
 *
 * - state -> URL: push a history entry for major route changes and replace it
 *   for intra-route ayah updates.
 * - URL -> state: read the URL on initial load and on browser back/forward.
 */
export function useUrlSync({
  showHome,
  showDuas,
  legalPage,
  routeNotFound,
  displayMode,
  currentSurah,
  currentAyah,
  currentPage,
  currentJuz,
  onRouteChange,
}) {
  const isFirstRender = useRef(true);
  const lastRouteKey = useRef(null);

  const buildRoute = () => {
    if (routeNotFound) {
      const targetPath = typeof window === "undefined" ? "/404" : window.location.pathname;
      return { targetPath, routeKey: `not-found:${targetPath}` };
    }
    if (["surahs", "about", "privacy", "legal", "sources"].includes(legalPage)) {
      return { targetPath: `/${legalPage}`, routeKey: `legal:${legalPage}` };
    }
    if (showHome) return { targetPath: "/", routeKey: "home" };
    if (showDuas) return { targetPath: "/duas", routeKey: "duas" };

    if (displayMode === "surah") {
      return {
        targetPath:
          currentAyah > 1
            ? `/surah/${currentSurah}/${currentAyah}`
            : `/surah/${currentSurah}`,
        routeKey: `surah:${currentSurah}`,
      };
    }

    if (displayMode === "page") {
      return {
        targetPath: `/page/${currentPage}`,
        routeKey: `page:${currentPage}`,
      };
    }

    if (displayMode === "juz") {
      return {
        targetPath: `/juz/${currentJuz}`,
        routeKey: `juz:${currentJuz}`,
      };
    }

    return { targetPath: "/", routeKey: "home" };
  };

  useEffect(() => {
    const { targetPath, routeKey } = buildRoute();

    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastRouteKey.current = routeKey;
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.location.pathname !== targetPath
    ) {
      const method =
        lastRouteKey.current !== routeKey ? "pushState" : "replaceState";
      window.history[method](null, "", targetPath);
    }

    lastRouteKey.current = routeKey;
  }, [
    showHome,
    showDuas,
    legalPage,
    routeNotFound,
    displayMode,
    currentSurah,
    currentAyah,
    currentPage,
    currentJuz,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof onRouteChange !== "function") {
      return undefined;
    }

    const handlePopState = () => {
      onRouteChange(parseInitialRoute());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [onRouteChange]);
}

/**
 * Read the current URL path and return partial AppContext state.
 */
export function parseRoutePath(pathname = "/") {
  const path = String(pathname || "/").split(/[?#]/, 1)[0];

  const legalMatch = path.match(/^\/(surahs|about|privacy|legal|sources)\/?$/);
  if (legalMatch) {
    return {
      legalPage: legalMatch[1],
      showHome: false,
      showDuas: false,
    };
  }

  if (/^\/duas\/?$/.test(path)) {
    return { showHome: false, showDuas: true };
  }

  const surahMatch = path.match(/^\/surah\/(\d+)(?:\/(\d+))?\/?$/);
  if (surahMatch) {
    const surah = Number(surahMatch[1]);
    if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
      return { routeNotFound: true, showHome: false, showDuas: false };
    }
    const maxAyah = getSurahAyahCount(surah);
    const requestedAyah = surahMatch[2] ? Number(surahMatch[2]) : 1;
    if (!Number.isInteger(requestedAyah) || requestedAyah < 1 || requestedAyah > maxAyah) {
      return { routeNotFound: true, showHome: false, showDuas: false };
    }
    const ayah = requestedAyah;
    return {
      showHome: false,
      showDuas: false,
      routeNotFound: false,
      displayMode: "surah",
      currentSurah: surah,
      currentAyah: ayah,
    };
  }

  const pageMatch = path.match(/^\/page\/(\d+)\/?$/);
  if (pageMatch) {
    const page = Number(pageMatch[1]);
    if (!Number.isInteger(page) || page < 1 || page > 604) {
      return { routeNotFound: true, showHome: false, showDuas: false };
    }
    return {
      showHome: false,
      showDuas: false,
      routeNotFound: false,
      displayMode: "page",
      currentPage: page,
    };
  }

  const juzMatch = path.match(/^\/juz\/(\d+)\/?$/);
  if (juzMatch) {
    const juz = Number(juzMatch[1]);
    if (!Number.isInteger(juz) || juz < 1 || juz > 30) {
      return { routeNotFound: true, showHome: false, showDuas: false };
    }
    return {
      showHome: false,
      showDuas: false,
      routeNotFound: false,
      displayMode: "juz",
      currentJuz: juz,
    };
  }

  if (path === "/") return { showHome: true, showDuas: false, routeNotFound: false };
  return { routeNotFound: true, showHome: false, showDuas: false };
}

export function parseInitialRoute() {
  if (typeof window === "undefined") return {};
  return parseRoutePath(window.location.pathname);
}
