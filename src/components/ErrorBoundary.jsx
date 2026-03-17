import React from "react";

/**
 * ErrorBoundary – capture les erreurs JS dans l'arbre React enfant et affiche un fallback UI.
 * Utilisation :
 * <ErrorBoundary>
 *   <ComponentQuiPeutPlanter />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log possible ici (Sentry, etc.)
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center text-red-700 dark:text-red-400 p-8">
          <h2 className="text-2xl font-bold mb-2">Une erreur est survenue</h2>
          <p className="mb-4">Désolé, une erreur inattendue a été détectée dans cette section.<br />Essayez de recharger la page ou contactez le support si le problème persiste.</p>
          {process.env.NODE_ENV !== "production" && this.state.error && (
            <pre className="bg-red-100 dark:bg-red-900/30 rounded p-2 text-xs overflow-x-auto max-w-full">
              {String(this.state.error)}
            </pre>
          )}
        </div>
      );
    }
    return this.props.children;
  }
}
