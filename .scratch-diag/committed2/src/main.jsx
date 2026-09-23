import React from "react";
import ReactDOM from "react-dom/client";
import { initErrorAnalytics } from "./services/errorAnalytics.js";
import { initPerformanceMetrics } from "./services/performanceMetrics.js";
import { clearMushafRuntimeCaches } from "./services/runtimeCacheService.js";

import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AppProvider } from "./context/AppContext";
import PrivacyLockGate from "./components/PrivacyLockGate";
// Critical CSS — must be available before first paint
import "./styles/tailwind.css";
import "./styles/domains/themes4.css";
import "./styles/ui-polish.css";
import "./styles/riwaya-fonts.css";
import "./styles/dark-mode-refonte.css";
import "./styles/domains/mobile-all-versions.css";
import "./styles/header-enhanced.css";
import "./styles/device-root.css";
import "./styles/experience-polish.css";
// Core tokens and shared responsive surfaces must be available before paint.
import "./styles/app-system.css";
// Last: flat, hairline chrome for the shell (header, panel, player).
import "./styles/shell-calm.css";

if (typeof window !== "undefined") {
  // Load the non-critical polish CSS right after the first frame is painted:
  // it never delays first paint, and the home typography settles within a
  // few frames instead of waiting for an idle period. The flag lets tests
  // wait for the complete cascade.
  const loadDeferred = () =>
    import("./styles/deferredStyles.js")
      .catch(() => null)
      .finally(() => {
        document.documentElement.dataset.deferredStyles = "ready";
      });
  if (typeof requestAnimationFrame !== "undefined") {
    requestAnimationFrame(() => setTimeout(loadDeferred, 0));
  } else {
    setTimeout(loadDeferred, 200);
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

async function tryRecoverFromChunkLoad(errorLike) {
  if (navigator.onLine === false || chunkReloadTriggered || !isChunkLoadErrorLike(errorLike)) return;
  chunkReloadTriggered = true;

  // The online hint can remain true in a dead zone. HEAD bypasses the
  // GET-only service worker, so a cached shell cannot authorize its deletion.
  try {
    const probe = await fetch("/index.html", { method: "HEAD", cache: "no-store" });
    if (!probe.ok || navigator.onLine === false) return;
  } catch {
    chunkReloadTriggered = false;
    return;
  }

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
    "L'application n'a pas pu démarrer. Veuillez recharger la page.";

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
  initPerformanceMetrics();
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <PrivacyLockGate>
          <AppProvider>
            <App />
          </AppProvider>
        </PrivacyLockGate>
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
      // On the first visit the page loads its chunks and fonts before the
      // worker controls it, so they never pass through its fetch handler.
      // Hand it the list so an offline reload finds the whole shell.
      const shareLoadedShell = () => {
        const worker = navigator.serviceWorker.controller;
        if (!worker || typeof performance?.getEntriesByType !== "function") return;
        const urls = new Set();
        performance.getEntriesByType("resource").forEach((entry) => {
          try {
            const url = new URL(entry.name, window.location.href);
            if (url.origin === window.location.origin) urls.add(url.pathname);
          } catch {
            // Ignore unparsable entries.
          }
        });
        document
          .querySelectorAll("script[src], link[rel='stylesheet'][href], link[rel='modulepreload'][href]")
          .forEach((node) => {
            try {
              urls.add(new URL(node.src || node.href, window.location.href).pathname);
            } catch {
              // Ignore.
            }
          });
        worker.postMessage({ type: "CACHE_SHELL_URLS", urls: [...urls] });
      };
      navigator.serviceWorker.ready.then(shareLoadedShell).catch(() => {});
      navigator.serviceWorker.addEventListener("controllerchange", shareLoadedShell);
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
