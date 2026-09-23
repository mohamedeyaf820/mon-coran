import React from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { t } from "../i18n";

const SUPPORTED_LANGS = ["fr", "en", "ar"];

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
          <AlertTriangle size={20} strokeWidth={2} />
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
          {t("errors.boundaryTitle", lang)}
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
          {t("errors.boundaryBody", lang)}
        </p>

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
              minHeight: "2.25rem",
            }}
          >
            <RefreshCw size={13} strokeWidth={2.5} aria-hidden="true" />
            {t("errors.boundaryReload", lang)}
          </button>
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
              minHeight: "2.25rem",
            }}
          >
            <Home size={13} strokeWidth={2.5} aria-hidden="true" />
            {t("errors.boundaryHome", lang)}
          </button>
        </div>
      </div>
    );
  }
}
