import React from "react";
import ReactDOM from "react-dom/client";
import { initErrorAnalytics } from "./services/errorAnalytics.js";
import { initPerformanceMetrics } from "./services/performanceMetrics.js";
import {
  clearMushafRuntimeCaches,
  migrateQuranRuntimeCaches,
} from "./services/runtimeCacheService.js";

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
import "./styles/responsive-all.css";

// Load the complete responsive cascade as one ordered chunk before React mounts.
// This keeps Safari/iOS deterministic without inflating the critical CSS entry.
const applicationStylesReady = import("./styles/deferredStyles.js").catch(
  () => null,
);

if (typeof window !== "undefined") {
  const syncVisualViewportHeight = () => {
    const height = window.visualViewport?.height || window.innerHeight;
    if (Number.isFinite(height) && height > 0) {
      document.documentElement.style.setProperty("--app-viewport-h", `${Math.round(height)}px`);
    }
  };
  syncVisualViewportHeight();
  window.addEventListener("resize", syncVisualViewportHeight, { passive: true });
  window.addEventListener("orientationchange", syncVisualViewportHeight, { passive: true });
  window.visualViewport?.addEventListener("resize", syncVisualViewportHeight, { passive: true });
  window.visualViewport?.addEventListener("scroll", syncVisualViewportHeight, { passive: true });
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

async function hasUsableNetwork() {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(`/manifest.json?chunk-probe=${Date.now()}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function tryRecoverFromChunkLoad(errorLike) {
  if (chunkReloadTriggered || !isChunkLoadErrorLike(errorLike)) return;
  chunkReloadTriggered = true;

  // navigator.onLine is unreliable on iOS and under network emulation. Never
  // erase a valid installed PWA until a same-origin network probe succeeds.
  if (!(await hasUsableNetwork())) {
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
  const mountApplication = () => {
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
  };

  Promise.all([
    applicationStylesReady,
    migrateQuranRuntimeCaches().catch(() => null),
  ]).finally(mountApplication);
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
