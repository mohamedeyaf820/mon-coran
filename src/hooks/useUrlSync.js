import { useEffect, useRef } from "react";

/**
 * Synchronise l'état de navigation React ↔ URL du navigateur.
 *
 * Utilise l'API History native (history.replaceState / popstate) sans dépendance
 * externe, ce qui évite le besoin d'installer react-router ou react-router-dom.
 *
 * - state → URL : met à jour l'URL quand l'état de navigation change
 * - URL → state : fournit les overrides initiaux depuis l'URL au chargement
 *
 * @param {object} params
 * @param {boolean} params.showHome
 * @param {boolean} params.showDuas
 * @param {string}  params.displayMode  - 'surah' | 'page' | 'juz'
 * @param {number}  params.currentSurah
 * @param {number}  params.currentAyah
 * @param {number}  params.currentPage
 * @param {number}  params.currentJuz
 */
export function useUrlSync({
  showHome,
  showDuas,
  displayMode,
  currentSurah,
  currentAyah,
  currentPage,
  currentJuz,
}) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Ne pas mettre à jour l'URL au 1er rendu : l'URL initiale est déjà la bonne.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    let targetPath;

    if (showHome) {
      targetPath = "/";
    } else if (showDuas) {
      targetPath = "/duas";
    } else if (displayMode === "surah") {
      // N'inclure l'ayah dans l'URL que si elle est > 1 (évite /surah/1/1 redondant)
      targetPath =
        currentAyah > 1
          ? `/surah/${currentSurah}/${currentAyah}`
          : `/surah/${currentSurah}`;
    } else if (displayMode === "page") {
      targetPath = `/page/${currentPage}`;
    } else if (displayMode === "juz") {
      targetPath = `/juz/${currentJuz}`;
    } else {
      targetPath = "/";
    }

    // replaceState évite de polluer l'historique du navigateur pour chaque
    // changement d'ayah ou de page ; l'utilisateur peut toujours utiliser
    // le bouton "Retour" pour revenir à l'URL précédente de manière naturelle.
    if (
      typeof window !== "undefined" &&
      window.location.pathname !== targetPath
    ) {
      window.history.replaceState(null, "", targetPath);
    }
  }, [
    showHome,
    showDuas,
    displayMode,
    currentSurah,
    currentAyah,
    currentPage,
    currentJuz,
  ]);
}

/**
 * Lit le chemin URL au moment du chargement initial et retourne les overrides
 * d'état à appliquer dans initialState de AppContext.
 *
 * Appelée en dehors du cycle React (avant le 1er render), donc on lit
 * directement window.location.pathname sans useLocation.
 *
 * @returns {object} overrides partiels pour initialState
 */
export function parseInitialRoute() {
  if (typeof window === "undefined") return {};

  const path = window.location.pathname;

  // /duas
  if (path === "/duas") {
    return { showHome: false, showDuas: true };
  }

  // /surah/:number  ou  /surah/:number/:ayah
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

  // /page/:number
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

  // /juz/:number
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

  // / ou toute autre route inconnue → accueil
  return { showHome: true, showDuas: false };
}
