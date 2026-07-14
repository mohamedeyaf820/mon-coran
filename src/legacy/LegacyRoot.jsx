import App from "../App";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { AppProvider } from "../context/AppContext";
import "./legacyStyles";

export default function LegacyRoot() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <App />
      </AppProvider>
    </ErrorBoundary>
  );
}
