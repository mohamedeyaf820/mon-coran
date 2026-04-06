import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import "./styles/tailwind.css";

let fontAwesomeStylesPromise = null;

function loadFontAwesomeStyles() {
  if (!fontAwesomeStylesPromise) {
    fontAwesomeStylesPromise = import(
      "@fortawesome/fontawesome-free/css/all.min.css"
    ).catch(() => null);
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

// ErrorBoundary global pour capturer les erreurs React
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
          style={{
            background: "var(--bg-primary)",
            color: "var(--text-primary)",
          }}
        >
          <h1 className="mb-4 text-xl font-semibold" style={{ color: "var(--danger, #ef4444)" }}>
            Une erreur est survenue
          </h1>
          <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
            {import.meta.env.DEV
              ? this.state.error?.message || "Erreur inconnue"
              : "Une erreur inattendue est survenue. Veuillez recharger l'application."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl px-6 py-3 text-base font-semibold text-white transition hover:brightness-110"
            style={{
              background:
                "linear-gradient(135deg, var(--primary, #1b5e3b), color-mix(in srgb, var(--primary, #1b5e3b) 82%, #000000 18%))",
            }}
          >
            Recharger l'application
          </button>
        </div>
      );
    }
    return this.props.children;
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
    window.location.reload();
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

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

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
            const scriptUrl = String(r.active?.scriptURL || r.installing?.scriptURL || "");
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
