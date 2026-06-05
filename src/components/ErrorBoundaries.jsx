import React from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

/**
 * Error Boundary de base avec UI de récupération
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Logger l'erreur
    console.error("[ErrorBoundary]", error, errorInfo);
    
    // Optionnel: envoyer à un service de monitoring
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          title={this.props.fallbackTitle || "Une erreur est survenue"}
          description={this.props.fallbackDescription}
          onReset={this.handleReset}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
          showReset={this.props.showReset !== false}
          showReload={this.props.showReload !== false}
          showGoHome={this.props.showGoHome !== false}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Composant d'affichage des erreurs
 */
function ErrorFallback({
  error,
  errorInfo,
  title,
  description,
  onReset,
  onReload,
  onGoHome,
  showReset,
  showReload,
  showGoHome,
}) {
  return (
    <div
      className="min-h-[300px] flex flex-col items-center justify-center p-8 text-center"
      style={{
        background: "var(--bg-primary, #fdfaf4)",
        color: "var(--text-primary, #1a1a1a)",
      }}
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
        style={{
          background: "rgba(239, 68, 68, 0.1)",
        }}
      >
        <AlertCircle size={32} style={{ color: "#ef4444" }} />
      </div>

      <h2 className="text-xl font-semibold mb-2">{title}</h2>

      <p className="text-sm opacity-70 mb-6 max-w-md">
        {description ||
          "Une erreur inattendue s'est produite. Vous pouvez réessayer ou revenir à l'accueil."}
      </p>

      {import.meta.env.DEV && error && (
        <div
          className="text-left text-xs p-4 rounded-lg mb-6 max-w-2xl overflow-auto"
          style={{
            background: "rgba(0, 0, 0, 0.05)",
            fontFamily: "monospace",
          }}
        >
          <p className="font-semibold text-red-500 mb-2">{error.message}</p>
          {errorInfo?.componentStack && (
            <pre className="opacity-70 whitespace-pre-wrap">
              {errorInfo.componentStack}
            </pre>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3 justify-center">
        {showReset && (
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
            style={{
              background: "var(--primary, #0b6235)",
              color: "white",
            }}
          >
            <RefreshCw size={16} />
            Réessayer
          </button>
        )}

        {showReload && (
          <button
            onClick={onReload}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
            style={{
              background: "var(--bg-secondary, #f1f1f1)",
              color: "var(--text-primary, #1a1a1a)",
            }}
          >
            <RefreshCw size={16} />
            Recharger la page
          </button>
        )}

        {showGoHome && (
          <button
            onClick={onGoHome}
            className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all hover:opacity-80"
            style={{
              background: "var(--bg-secondary, #f1f1f1)",
              color: "var(--text-primary, #1a1a1a)",
            }}
          >
            <Home size={16} />
            Accueil
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Error Boundary spécifique pour l'audio
 */
export class AudioErrorBoundary extends React.Component {
  render() {
    return (
      <ErrorBoundary
        {...this.props}
        fallbackTitle="Erreur Audio"
        fallbackDescription="Impossible de charger le lecteur audio. Veuillez réessayer."
      >
        {this.props.children}
      </ErrorBoundary>
    );
  }
}

/**
 * Error Boundary spécifique pour l'affichage du Quran
 */
export class QuranDisplayErrorBoundary extends React.Component {
  render() {
    return (
      <ErrorBoundary
        {...this.props}
        fallbackTitle="Erreur d'affichage"
        fallbackDescription="Impossible d'afficher le texte du Quran. Veuillez réessayer."
      >
        {this.props.children}
      </ErrorBoundary>
    );
  }
}

/**
 * Error Boundary spécifique pour les paramètres
 */
export class SettingsErrorBoundary extends React.Component {
  render() {
    return (
      <ErrorBoundary
        {...this.props}
        fallbackTitle="Erreur de paramètres"
        fallbackDescription="Impossible de charger les paramètres. Veuillez réessayer."
        showGoHome={false}
      >
        {this.props.children}
      </ErrorBoundary>
    );
  }
}

/**
 * Error Boundary spécifique pour les modales
 */
export class ModalErrorBoundary extends React.Component {
  render() {
    return (
      <ErrorBoundary
        {...this.props}
        fallbackTitle="Erreur"
        fallbackDescription="Impossible d'afficher cette fenêtre. Veuillez la fermer et réessayer."
        showReload={false}
        showGoHome={false}
      >
        {this.props.children}
      </ErrorBoundary>
    );
  }
}

export default ErrorBoundary;
