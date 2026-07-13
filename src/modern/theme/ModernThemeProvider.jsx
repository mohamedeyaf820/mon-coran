import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { getSettings, updateSetting } from "../../services/storageService";
import { resolveFontFamily } from "../../data/fonts";
import { getReaderCssVariables } from "../preferences/preferencesModel";
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
    const applyReaderVariables = (settings) => {
      Object.entries(getReaderCssVariables(settings)).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
      document.documentElement.style.setProperty("--modern-quran-font", resolveFontFamily(settings.fontFamily, settings.riwaya));
      document.documentElement.lang = settings.lang || "fr";
    };
    applyReaderVariables(getSettings());
    const syncPreferences = (event) => applyReaderVariables(event.detail || getSettings());
    window.addEventListener("modern-preferences-change", syncPreferences);
    return () => window.removeEventListener("modern-preferences-change", syncPreferences);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme(nextTheme) {
        const next = nextTheme === "dark" ? "dark" : "light";
        localStorage.setItem(MODERN_THEME_KEY, next);
        updateSetting("theme", next);
        setTheme(next);
      },
      toggleTheme() {
        setTheme((current) => {
          const next = current === "dark" ? "light" : "dark";
          localStorage.setItem(MODERN_THEME_KEY, next);
          updateSetting("theme", next);
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
