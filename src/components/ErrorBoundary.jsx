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
    this.handleReload = this.handleReload.bind(this);
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[ErrorBoundary]", error, errorInfo);
    }
  }

  handleReload() {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 gap-4"
        >
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-3xl mb-2">
            <span aria-hidden="true">⚠</span>
          </div>
          <h2 className="text-xl font-bold text-red-700 dark:text-red-400">
            Une erreur est survenue · An error occurred
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
            Désolé, une erreur inattendue a été détectée dans cette section.
            <br />
            Sorry, an unexpected error was detected in this section.
          </p>
          {process.env.NODE_ENV !== "production" && this.state.error && (
            <pre className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 text-xs overflow-x-auto max-w-full text-left text-red-800 dark:text-red-300">
              {String(this.state.error)}
            </pre>
          )}
          <button
            onClick={this.handleReload}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <span aria-hidden="true">↺</span>
            Recharger · Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
