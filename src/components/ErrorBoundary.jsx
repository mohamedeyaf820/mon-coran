import React from "react";
import { AlertTriangle, CloudOff, Home, RefreshCw } from "lucide-react";
import { t } from "../i18n";
import { classifyBoundaryError } from "./QuranDisplay/readerLoadError.js";

const SUPPORTED_LANGS = ["fr", "en", "ar"];
// A code-split route chunk that the network could not deliver is usually a
// raced request or a hash that changed under an open tab: one reload fixes it.
// The guard keeps a genuinely missing file from turning into a reload loop.
const CHUNK_RELOAD_KEY = "mushafplus-chunk-reload-at";
const CHUNK_RELOAD_COOLDOWN_MS = 30000;

function isOnline() {
  return typeof navigator === "undefined" || navigator.onLine !== false;
}

function claimChunkReload() {
  try {
    const last = Number(sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
    if (last && Date.now() - last < CHUNK_RELOAD_COOLDOWN_MS) return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
    return true;
  } catch {
    return false;
  }
}

function getLang() {
  const tag = document.documentElement.lang;
  if (tag && SUPPORTED_LANGS.includes(tag)) return tag;
  try {
    const stored = JSON.parse(localStorage.getItem("mushaf-plus-settings") || "{}");
    if (stored.lang && SUPPORTED_LANGS.includes(stored.lang)) return stored.lang;
  } catch { /* ignore */ }
  return "fr";
}

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
    this.handleReload = this.handleReload.bind(this);
    this.handleHome = this.handleHome.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, errorInfo);
    }
    const kind = classifyBoundaryError(error, { online: isOnline() });
    if (kind.chunkLoad && kind.retryable && claimChunkReload()) {
      window.location.reload();
    }
  }

  handleReload() {
    window.location.reload();
  }

  handleHome() {
    window.location.href = "/";
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const lang = getLang();
    const kind = classifyBoundaryError(this.state.error, { online: isOnline() });
    // A route whose code or data never reached the device is a content gap, not
    // a crash. This keys on the failed fetch itself rather than on
    // `navigator.onLine`, which stays true behind a captive portal or on a
    // connection with no internet: there the reload button offers to fetch the
    // same bytes that just failed.
    const offlineGap = kind.chunkLoad;
    const copy = offlineGap
      ? {
          title: t("errors.notStoredTitle", lang),
          body: t("errors.notStoredBody", lang),
          hint: kind.offline ? t("errors.notStoredHint", lang) : null,
          reloadLabel: kind.retryable ? t("errors.boundaryReload", lang) : null,
          homeLabel: t("errors.backHome", lang),
        }
      : {
          title: t("errors.boundaryTitle", lang),
          body: t("errors.boundaryBody", lang),
          hint: null,
          reloadLabel: t("errors.boundaryReload", lang),
          homeLabel: t("errors.boundaryHome", lang),
        };

    return (
      <div
        role="alert"
        dir={lang === "ar" ? "rtl" : "ltr"}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "40vh",
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          gap: "1rem",
          fontFamily: "var(--font-ui, system-ui, sans-serif)",
          color: "var(--text-primary, #1a2e22)",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "3.25rem",
            height: "3.25rem",
            borderRadius: "50%",
            background: "color-mix(in srgb, var(--primary, #17865f) 11%, transparent)",
            color: "var(--primary, #17865f)",
            marginBottom: ".1rem",
          }}
        >
          {offlineGap ? <CloudOff size={20} strokeWidth={2} /> : <AlertTriangle size={20} strokeWidth={2} />}
        </div>

        <h2
          style={{
            margin: 0,
            fontSize: "1rem",
            fontWeight: 700,
            color: "var(--text-primary, #1a2e22)",
            letterSpacing: "-.012em",
          }}
        >
          {copy.title}
        </h2>

        <p
          style={{
            margin: 0,
            fontSize: ".875rem",
            color: "var(--text-secondary, #4b6355)",
            maxWidth: "26rem",
            lineHeight: 1.65,
          }}
        >
          {copy.body}
        </p>

        {copy.hint ? (
          <p
            style={{
              margin: 0,
              fontSize: ".78rem",
              color: "var(--text-muted, #6b7f72)",
              maxWidth: "26rem",
              lineHeight: 1.6,
            }}
          >
            {copy.hint}
          </p>
        ) : null}

        {import.meta.env.DEV && this.state.error && (
          <pre
            style={{
              background: "color-mix(in srgb, var(--primary, #17865f) 7%, transparent)",
              border: "1px solid color-mix(in srgb, var(--primary, #17865f) 14%, transparent)",
              borderRadius: ".5rem",
              padding: ".65rem .9rem",
              fontSize: ".7rem",
              textAlign: "left",
              overflowX: "auto",
              maxWidth: "min(100%, 36rem)",
              color: "var(--text-secondary, #4b6355)",
              lineHeight: 1.5,
            }}
          >
            {String(this.state.error)}
          </pre>
        )}

        <div style={{ display: "flex", gap: ".55rem", marginTop: ".15rem", flexWrap: "wrap", justifyContent: "center" }}>
          {copy.reloadLabel ? (
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: ".38rem",
                padding: ".48rem 1.1rem",
                borderRadius: ".6rem",
                border: "none",
                background: "var(--primary, #17865f)",
                color: "#fff",
                fontSize: ".82rem",
                fontWeight: 600,
                cursor: "pointer",
                minHeight: "2.75rem",
              }}
            >
              <RefreshCw size={13} strokeWidth={2.5} aria-hidden="true" />
              {copy.reloadLabel}
            </button>
          ) : null}
          <button
            type="button"
            onClick={this.handleHome}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: ".38rem",
              padding: ".48rem 1.1rem",
              borderRadius: ".6rem",
              border: "1px solid color-mix(in srgb, var(--border, rgba(148,163,184,.22)) 100%, transparent)",
              background: "color-mix(in srgb, var(--bg-card, #fff) 72%, transparent)",
              color: "var(--text-secondary, #4b6355)",
              fontSize: ".82rem",
              fontWeight: 600,
              cursor: "pointer",
              minHeight: "2.75rem",
            }}
          >
            <Home size={13} strokeWidth={2.5} aria-hidden="true" />
            {copy.homeLabel}
          </button>
        </div>
      </div>
    );
  }
}
