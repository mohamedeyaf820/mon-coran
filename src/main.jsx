import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { AppProvider } from "./context/AppContext";
import "./styles/index.css";
import "./styles/ui-enhancements.css";
import "./styles/themes4.css";

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
        <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-[var(--bg-primary)]">
          <h1 className="mb-4 text-xl font-semibold text-red-500">
            Une erreur est survenue
          </h1>
          <p className="mb-4 text-sm text-[var(--text-muted)]">
            {this.state.error?.message || "Erreur inconnue"}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-xl bg-[#0d6efd] px-6 py-3 text-base font-semibold text-white transition hover:brightness-110"
          >
            Recharger l'application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
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
      await Promise.all(regs.map((r) => r.unregister()));
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
