import React from "react";
import ReactDOM from "react-dom/client";
import { initErrorAnalytics } from "./services/errorAnalytics.js";
import { clearMushafRuntimeCaches } from "./services/runtimeCacheService.js";

import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppProvider } from "./context/AppContext";
// Critical CSS — must be available before first paint
import "./styles/tailwind.css";
import "./styles/domains/themes4.css";
import "./styles/responsive-all.css";
import "./styles/ui-polish.css";
import "./styles/riwaya-fonts.css";
import "./styles/dark-mode-refonte.css";
import "./styles/domains/mobile-all-versions.css";
import "./styles/header-enhanced.css";

/**
 * FontAwesome is loaded lazily (~3 MB CSS when fetched) and used by 200+ legacy
 * icon instances across the app.
 *
 * Migration plan:
 *   - Use <Icon name="..." /> from src/components/ui/icon.jsx for all new icons.
 *   - Replace <i className="fas fa-*"/> with <Icon name="*"/> as components are
 *     refactored.
 *   - Once no files reference fa-* classes, remove @fortawesome/fontawesome-free
 *     dependency and delete this block.
 *
 * To disable FontAwesome globally during migration, set:
 *   window.__DISABLE_FONTAWESOME__ = true;
 * before this script runs.
 */

let fontAwesomeStylesPromise = null;

function loadFontAwesomeStyles() {
  if (typeof window !== "undefined" && window.__DISABLE_FONTAWESOME__) {
    return null;
  }
  if (!fontAwesomeStylesPromise) {
    fontAwesomeStylesPromise =
      import("@fortawesome/fontawesome-free/css/all.min.css").catch(() => null);
  }
  return fontAwesomeStylesPromise;
}

if (typeof window !== "undefined") {
  const warmIconStyles = () => {
    loadFontAwesomeStyles();
  };

  const onFirstInteraction = () => {
    loadFontAwesomeStyles();
    window.removeEventListener("pointerdown", onFirstInteraction);
    window.removeEventListener("keydown", onFirstInteraction);
    window.removeEventListener("touchstart", onFirstInteraction);
  };

  window.addEventListener("pointerdown", onFirstInteraction, {
    passive: true,
    once: true,
  });
  window.addEventListener("keydown", onFirstInteraction, { once: true });
  window.addEventListener("touchstart", onFirstInteraction, {
    passive: true,
    once: true,
  });

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(warmIconStyles, { timeout: 1200 });
  } else {
    window.setTimeout(warmIconStyles, 700);
  }

  // Defer non-critical feature CSS until idle — these are only needed after
  // the user navigates to reading/settings/recitation pages
  const loadDeferredStyles = () => {
    import("./styles/domains/premium-platform.css").catch(() => null);
    import("./styles/domains/premium-plus.css").catch(() => null);
    import("./styles/reading-ux-refonte.css").catch(() => null);
    import("./styles/expert-overhaul.css").catch(() => null);
    import("./styles/surah-reader-header.css").catch(() => null);
    import("./styles/sidebar-enhanced.css").catch(() => null);
    import("./styles/settings-enhanced.css").catch(() => null);
    import("./styles/surah-info-panel.css").catch(() => null);
    import("./styles/reciter-enhanced.css").catch(() => null);
    import("./styles/home-audio-ux-refonte.css").catch(() => null);
    import("./styles/surah-banner.css").catch(() => null);
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(loadDeferredStyles, { timeout: 2000 });
  } else {
    window.setTimeout(loadDeferredStyles, 500);
  }
}

const CHUNK_RELOAD_KEY = "mushaf-plus:chunk-reload-once";
let chunkReloadTriggered = false;

function isChunkLoadErrorLike(errorLike) {
  const message = String(
    errorLike?.message ||
      errorLike?.reason?.message ||
      errorLike?.reason ||
      errorLike ||
      "",
  );
  return /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk [\w-]+ failed/i.test(
    message,
  );
}

function tryRecoverFromChunkLoad(errorLike) {
  if (chunkReloadTriggered || !isChunkLoadErrorLike(errorLike)) return;
  chunkReloadTriggered = true;

  let alreadyReloaded = false;
  try {
    alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
    if (!alreadyReloaded) {
      sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    }
  } catch {
    // Ignore storage edge-cases; fall back to a single in-memory retry.
  }

  if (!alreadyReloaded) {
    clearMushafRuntimeCaches().finally(() => {
      window.location.reload();
    });
  }
}

if (import.meta.env.PROD) {
  window.addEventListener("error", (event) => {
    tryRecoverFromChunkLoad(event?.error || event?.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    tryRecoverFromChunkLoad(event?.reason);
  });

  window.setTimeout(() => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    } catch {
      // no-op
    }
  }, 10000);
}

// Vérifier que l'élément root existe avant de rendre
const rootElement = document.getElementById("root");
if (!rootElement) {
  console.error(
    "[Main] Root element not found - cannot mount React application",
  );
  const fallback = document.createElement("div");
  fallback.style.cssText =
    "padding:2rem;text-align:center;font-family:system-ui,sans-serif;";

  const title = document.createElement("h1");
  title.style.cssText = "color:#ef4444;margin-bottom:1rem;";
  title.textContent = "Erreur de chargement";

  const message = document.createElement("p");
  message.textContent =
    "L'application n'a pas pu demarrer. Veuillez recharger la page.";

  const reloadButton = document.createElement("button");
  reloadButton.type = "button";
  reloadButton.style.cssText =
    "margin-top:1rem;padding:0.5rem 1rem;cursor:pointer;";
  reloadButton.textContent = "Recharger";
  reloadButton.addEventListener("click", () => window.location.reload());

  fallback.append(title, message, reloadButton);
  document.body.replaceChildren(fallback);
} else {
  initErrorAnalytics();
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <AppProvider>
          <App />
        </AppProvider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}

// Service Worker: actif uniquement en production
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").catch((err) => {
        if (import.meta.env.DEV)
          console.error("Échec de l'enregistrement du SW:", err);
      });
      return;
    }

    // En développement: éviter les pages blanches causées par un SW obsolète
    try {
      await clearMushafRuntimeCaches();
      if (import.meta.env.DEV)
        console.log("SW désactivé/nettoyé en mode développement");
    } catch (err) {
      if (import.meta.env.DEV) console.log("Nettoyage SW (dev) échoué:", err);
    }
  });
}
