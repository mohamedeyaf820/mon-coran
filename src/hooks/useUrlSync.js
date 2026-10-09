import { useEffect, useRef } from "react";
import { getSurahAyahCount } from "../data/surahs.js";
import { getWarshSurahAyahCount } from "../constants/warshSource.js";
import { localizePath, splitLocale } from "../utils/localePath.js";

function buildBaseRoute({
  routeNotFound,
  legalPage,
  showHome,
  showDuas,
  duasRoute,
  showPrayers,
  displayMode,
  currentAyah,
  currentSurah,
  currentPage,
  currentJuz,
}) {
  if (routeNotFound) {
    const targetPath = typeof window === "undefined" ? "/404" : window.location.pathname;
    return { targetPath, routeKey: `not-found:${targetPath}` };
  }
  if (["surahs", "about", "privacy", "legal", "sources"].includes(legalPage)) {
    return { targetPath: `/${legalPage}`, routeKey: `legal:${legalPage}` };
  }
  if (showHome) return { targetPath: "/", routeKey: "home" };
  if (showDuas) return { targetPath: `/duas${duasRoute || ""}`, routeKey: `duas:${duasRoute || ""}` };
  if (showPrayers) return { targetPath: "/prieres", routeKey: "prieres" };

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
}

/** The route of the state, with the reading language in the address (/en/..., /ar/...; French stays at the root). */
function buildRoute({ lang, ...state }) {
  const route = buildBaseRoute(state);
  // A not-found address is kept as typed, prefix included.
  if (state.routeNotFound) return route;
  return { ...route, targetPath: localizePath(route.targetPath, lang) };
}

const withoutTrailingSlash = (path) => splitLocale(path).path.replace(/(.)\/$/, "$1");

/**
 * Synchronise React navigation state with the browser URL.
 *
 * - state -> URL: push a history entry for major route changes and replace it
 *   for intra-route ayah updates.
 * - URL -> state: read the URL on initial load and on browser back/forward.
 */
export function useUrlSync({
  lang = "fr",
  showHome,
  showDuas,
  duasRoute = "",
  showPrayers,
  legalPage,
  routeNotFound,
  displayMode,
  currentSurah,
  currentAyah,
  currentPage,
  currentJuz,
  pageNavigationSource = "navigate",
  onRouteChange,
}) {
  const isFirstRender = useRef(true);
  const lastRouteKey = useRef(null);

  useEffect(() => {
    const { targetPath, routeKey } = buildRoute({
      lang,
      routeNotFound,
      legalPage,
      showHome,
      showDuas,
      duasRoute,
      showPrayers,
      displayMode,
      currentAyah,
      currentSurah,
      currentPage,
      currentJuz,
    });

    if (isFirstRender.current) {
      isFirstRender.current = false;
      lastRouteKey.current = routeKey;
      // A visit without a language prefix shows the reader's saved language:
      // put that language in the address (same page, no history entry).
      if (
        typeof window !== "undefined" &&
        window.location.pathname !== targetPath &&
        !routeNotFound &&
        withoutTrailingSlash(window.location.pathname) === withoutTrailingSlash(targetPath)
      ) {
        window.history.replaceState(
          null,
          "",
          `${targetPath}${window.location.search}${window.location.hash}`,
        );
      }
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.location.pathname !== targetPath
    ) {
      const scrolledPage =
        displayMode === "page" && pageNavigationSource === "scroll";
      const method =
        lastRouteKey.current !== routeKey && !scrolledPage ? "pushState" : "replaceState";
      window.history[method](null, "", targetPath);
    }

    lastRouteKey.current = routeKey;
  }, [
    lang,
    showHome,
    showDuas,
    duasRoute,
    showPrayers,
    legalPage,
    routeNotFound,
    displayMode,
    currentSurah,
    currentAyah,
    currentPage,
    currentJuz,
    pageNavigationSource,
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
  const { lang, path } = splitLocale(String(pathname || "/").split(/[?#]/, 1)[0]);
  const route = parseLocalRoutePath(path);
  // The address names a language: it wins over the saved one.
  return lang ? { ...route, lang } : route;
}

function parseLocalRoutePath(path) {

  const legalMatch = path.match(/^\/(surahs|about|privacy|legal|sources)\/?$/);
  if (legalMatch) {
    return {
      legalPage: legalMatch[1],
      showHome: false,
      showDuas: false,
      showPrayers: false,
    };
  }

  // /duas (hub), /duas/hisn (chapters), /duas/hisn/27 (one chapter), /duas/coran, /duas/rabbana and /duas/khatm (Quranic collections).
  const duasMatch = path.match(/^\/duas(?:\/(hisn(?:\/\d{1,4})?|coran|rabbana|khatm))?\/?$/);
  if (duasMatch) {
    return {
      showHome: false,
      showDuas: true,
      showPrayers: false,
      duasRoute: duasMatch[1] ? `/${duasMatch[1]}` : "",
    };
  }

  if (/^\/(?:prieres|prires)\/?$/.test(path)) {
    return { showHome: false, showDuas: false, showPrayers: true };
  }

  const surahMatch = path.match(/^\/surah\/(\d+)(?:\/(\d+))?\/?$/);
  if (surahMatch) {
    const surah = Number(surahMatch[1]);
    if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
      return { routeNotFound: true, showHome: false, showDuas: false, showPrayers: false };
    }
    const maxAyah = Math.max(
      getSurahAyahCount(surah),
      getWarshSurahAyahCount(surah),
    );
    const requestedAyah = surahMatch[2] ? Number(surahMatch[2]) : 1;
    if (!Number.isInteger(requestedAyah) || requestedAyah < 1 || requestedAyah > maxAyah) {
      return { routeNotFound: true, showHome: false, showDuas: false, showPrayers: false };
    }
    const ayah = requestedAyah;
    return {
      showHome: false,
      showDuas: false,
      showPrayers: false,
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
      return { routeNotFound: true, showHome: false, showDuas: false, showPrayers: false };
    }
    return {
      showHome: false,
      showDuas: false,
      showPrayers: false,
      routeNotFound: false,
      displayMode: "page",
      currentPage: page,
    };
  }

  const juzMatch = path.match(/^\/juz\/(\d+)\/?$/);
  if (juzMatch) {
    const juz = Number(juzMatch[1]);
    if (!Number.isInteger(juz) || juz < 1 || juz > 30) {
      return { routeNotFound: true, showHome: false, showDuas: false, showPrayers: false };
    }
    return {
      showHome: false,
      showDuas: false,
      showPrayers: false,
      routeNotFound: false,
      displayMode: "juz",
      currentJuz: juz,
    };
  }

  if (path === "/") return { showHome: true, showDuas: false, showPrayers: false, routeNotFound: false };
  return { routeNotFound: true, showHome: false, showDuas: false, showPrayers: false };
}

export function parseInitialRoute() {
  if (typeof window === "undefined") return {};
  return parseRoutePath(window.location.pathname);
}
