import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppProvider } from "./context/AppContext";
import "./styles/tailwind.css";
import "./styles/domains/themes4.css";
import "./styles/domains/premium-platform.css";
import "./styles/domains/premium-plus.css";
import "./styles/domains/mobile-all-versions.css";
import "./styles/responsive.css";
import "./styles/ui-polish.css";
import "./styles/responsive-experience.css";
import "./styles/riwaya-fonts.css";
import "./styles/dark-mode-refonte.css";

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
  if (
    typeof window !== "undefined" &&
    window.__DISABLE_FONTAWESOME__
  ) {
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
    Promise.all([
      "serviceWorker" in navigator
        ? navigator.serviceWorker
            .getRegistrations()
            .then((registrations) =>
              Promise.all(registrations.map((registration) => registration.unregister())),
            )
            .catch(() => null)
        : Promise.resolve(null),
      "caches" in window
        ? caches
            .keys()
            .then((keys) =>
              Promise.all(
                keys
                  .filter((key) => key.startsWith("mushaf-plus"))
                  .map((key) => caches.delete(key)),
              ),
            )
            .catch(() => null)
        : Promise.resolve(null),
    ]).finally(() => {
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
  console.error("[Main] Root element not found - cannot mount React application");
  document.body.innerHTML = `
    <div style="padding: 2rem; text-align: center; font-family: system-ui, sans-serif;">
      <h1 style="color: #ef4444; margin-bottom: 1rem;">Erreur de chargement</h1>
      <p>L'application n'a pas pu démarrer. Veuillez recharger la page.</p>
      <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; cursor: pointer;">
        Recharger
      </button>
    </div>
  `;
} else {
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
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        regs
          .filter((r) => {
            const scriptUrl = String(
              r.active?.scriptURL || r.installing?.scriptURL || "",
            );
            return scriptUrl.includes("/sw.js") || scriptUrl.includes("mushaf");
          })
          .map((r) => r.unregister()),
      );
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((k) => k.startsWith("mushaf-plus"))
            .map((k) => caches.delete(k)),
        );
      }
      if (import.meta.env.DEV)
        console.log("SW désactivé/nettoyé en mode développement");
    } catch (err) {
      if (import.meta.env.DEV) console.log("Nettoyage SW (dev) échoué:", err);
    }
  });
}
