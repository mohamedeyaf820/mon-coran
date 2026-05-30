import { useEffect, useRef } from "react";

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
export function parseInitialRoute() {
  if (typeof window === "undefined") return {};

  const path = window.location.pathname;

  if (path === "/duas") {
    return { showHome: false, showDuas: true };
  }

  const surahMatch = path.match(/^\/surah\/(\d+)(?:\/(\d+))?/);
  if (surahMatch) {
    const surah = Math.max(1, Math.min(114, Number(surahMatch[1]) || 1));
    const ayah = surahMatch[2]
      ? Math.max(1, Math.min(286, Number(surahMatch[2]) || 1))
      : 1;
    return {
      showHome: false,
      showDuas: false,
      displayMode: "surah",
      currentSurah: surah,
      currentAyah: ayah,
    };
  }

  const pageMatch = path.match(/^\/page\/(\d+)/);
  if (pageMatch) {
    const page = Math.max(1, Math.min(604, Number(pageMatch[1]) || 1));
    return {
      showHome: false,
      showDuas: false,
      displayMode: "page",
      currentPage: page,
    };
  }

  const juzMatch = path.match(/^\/juz\/(\d+)/);
  if (juzMatch) {
    const juz = Math.max(1, Math.min(30, Number(juzMatch[1]) || 1));
    return {
      showHome: false,
      showDuas: false,
      displayMode: "juz",
      currentJuz: juz,
    };
  }

  return { showHome: true, showDuas: false };
}
