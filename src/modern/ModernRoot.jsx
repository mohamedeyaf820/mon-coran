import "./modern.css";
import { ModernShell } from "./shell/ModernShell";
import { ModernAudioProvider } from "./audio/ModernAudioProvider";
import { ModernThemeProvider } from "./theme/ModernThemeProvider";

export default function ModernRoot() {
  return (
    <ModernThemeProvider>
      <ModernAudioProvider>
        <ModernShell />
      </ModernAudioProvider>
    </ModernThemeProvider>
  );
}
