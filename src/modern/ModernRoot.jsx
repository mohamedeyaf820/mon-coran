import "./modern.css";
import { ModernShell } from "./shell/ModernShell";
import { ModernThemeProvider } from "./theme/ModernThemeProvider";

export default function ModernRoot() {
  return (
    <ModernThemeProvider>
      <ModernShell />
    </ModernThemeProvider>
  );
}
