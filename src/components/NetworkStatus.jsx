import React, { useState, useEffect } from "react";
import { cn } from "../lib/utils";

// Derives a simplified quality tier from the Network Information API
function deriveQuality(conn) {
  if (!conn) return "unknown";
  const type = conn.effectiveType;
  if (type === "slow-2g" || type === "2g") return "slow";
  if (type === "3g") return "medium";
  return "good";
}

/**
 * NetworkStatus — Indicateur visuel de la qualité de connexion réseau
 * Affiche le statut du réseau avec icônes et couleurs modernes
 */
export default function NetworkStatus() {
  const [connection, setConnection] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState("unknown");

  useEffect(() => {
    // Détecter les changements de connexion
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Lire la qualité de connexion si disponible
    const updateConnection = () => {
      const conn =
        navigator.connection ||
        navigator.mozConnection ||
        navigator.webkitConnection;
      if (conn) {
        setConnection({
          type: conn.effectiveType, // '4g', '3g', '2g', 'slow-2g'
          downlink: conn.downlink,
          rtt: conn.rtt,
          saveData: conn.saveData,
        });
        setConnectionQuality(deriveQuality(conn));
      } else {
        setConnectionQuality("unknown");
      }
    };

    updateConnection();

    // Écouter les changements de connexion
    const connElement =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection;
    if (connElement) {
      connElement.addEventListener("change", updateConnection);
      return () => {
        connElement.removeEventListener("change", updateConnection);
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // ── Slow connection warning (online but degraded) ──────────────────────
  if (isOnline && connectionQuality === "slow") {
    return (
      <div
        className="network-status slow-connection"
        title="Connexion lente détectée"
        role="status"
        aria-live="polite"
      >
        <svg
          className="status-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Single weak bar to convey poor signal */}
          <rect
            x="2"
            y="16"
            width="3"
            height="6"
            fill="currentColor"
            stroke="none"
          />
          <rect
            x="7"
            y="13"
            width="3"
            height="9"
            fill="currentColor"
            opacity="0.35"
            stroke="none"
          />
          <rect
            x="12"
            y="9"
            width="3"
            height="13"
            fill="currentColor"
            opacity="0.2"
            stroke="none"
          />
          <rect
            x="17"
            y="5"
            width="3"
            height="17"
            fill="currentColor"
            opacity="0.15"
            stroke="none"
          />
          {/* Warning triangle overlay */}
          <path d="M21 3l-2 3.5" strokeWidth="1.5" opacity="0.8" />
        </svg>
        <span className="status-label">2G</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="network-status offline" title="Mode hors ligne">
        <svg
          className="status-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <line
            x1="1"
            y1="1"
            x2="23"
            y2="23"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M16.72 3.02a8.956 8.956 0 0 1 2.13 10"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M5.64 5.64a8.991 8.991 0 0 0 12.72 12.72"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
        <span className="status-label">Hors ligne</span>
      </div>
    );
  }

  const getConnectionIcon = () => {
    if (!connection) return null;

    const type = connection.type;
    const bars = type === "4g" ? 4 : type === "3g" ? 3 : type === "2g" ? 2 : 1;

    return (
      <svg
        className="status-icon"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
      >
        {/* Bars */}
        {[...Array(bars)].map((_, i) => (
          <rect
            key={i}
            x={18 - i * 5}
            y={10 + (3 - i) * 3}
            width="3"
            height={(i + 1) * 3}
            fill="currentColor"
          />
        ))}
      </svg>
    );
  };

  const getConnectionColor = () => {
    if (!connection) return "text-gray-500";
    const type = connection.type;
    if (type === "4g") return "text-emerald-600";
    if (type === "3g") return "text-blue-600";
    if (type === "2g") return "text-orange-600";
    return "text-gray-600";
  };

  const getConnectionLabel = () => {
    if (!connection) return "En ligne";
    return connection.type.toUpperCase();
  };

  return (
    <div
      className={cn("network-status online", getConnectionColor())}
      title={`Connexion: ${getConnectionLabel()}`}
    >
      {getConnectionIcon()}
      <span className="status-label text-xs">{getConnectionLabel()}</span>
    </div>
  );
}
