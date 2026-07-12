import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getSettings } from "../../services/storageService";
import { getInitialModernTheme } from "./themeStorage";

const MODERN_THEME_KEY = "mushaf-plus-modern-theme";
const ModernThemeContext = createContext(null);

function readInitialTheme() {
  const explicitTheme = localStorage.getItem(MODERN_THEME_KEY);
  const legacyTheme = explicitTheme || getSettings()?.theme;
  const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return getInitialModernTheme(legacyTheme, prefersDark);
}

export function ModernThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.modernTheme = theme;
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme() {
        setTheme((current) => {
          const next = current === "dark" ? "light" : "dark";
          localStorage.setItem(MODERN_THEME_KEY, next);
          return next;
        });
      },
    }),
    [theme],
  );

  return (
    <ModernThemeContext.Provider value={value}>
      <div className="modern-app" data-modern-theme={theme}>
        {children}
      </div>
    </ModernThemeContext.Provider>
  );
}

export function useModernTheme() {
  const context = useContext(ModernThemeContext);
  if (!context) throw new Error("useModernTheme requires ModernThemeProvider");
  return context;
}
