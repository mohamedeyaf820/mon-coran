import {
  BookOpenText,
  Bookmark,
  Headphones,
  GraduationCap,
  Moon,
  Search,
  Settings,
  Wrench,
  Sun,
} from "lucide-react";
import { lazy, Suspense, useEffect, useState } from "react";
import { getSettings } from "../../services/storageService";
import { translate } from "../i18n";

import { ModernAudioPlayer } from "../audio/ModernAudioPlayer";
import { ModernPreferencesDialog } from "../preferences/ModernPreferencesDialog";
import { ModernOnboarding } from "../onboarding/ModernOnboarding";
import { ModernPWAUpdateBanner } from "../pwa/ModernPWAUpdateBanner";
import {
  FORCE_ONBOARDING_KEY,
  shouldShowOnboarding,
} from "../onboarding/onboardingModel";
import { parseReaderRoute } from "../reader/readerRoute";
import { useModernTheme } from "../theme/ModernThemeProvider";
import { IconButton } from "../ui/IconButton";
import { SkipLink } from "../ui/SkipLink";

const navigation = [
  { key: "read", icon: BookOpenText, href: "/" },
  { key: "listen", icon: Headphones, href: "/audio" },
  { key: "library", icon: Bookmark, href: "/library" },
  { key: "study", icon: GraduationCap, href: "/study" },
  { key: "tools", icon: Wrench, href: "/tools" },
];
const ModernHomePage = lazy(() =>
  import("../home/ModernHomePage").then((module) => ({
    default: module.ModernHomePage,
  })),
);
const ModernAudioPage = lazy(() =>
  import("../audio/ModernAudioPage").then((module) => ({
    default: module.ModernAudioPage,
  })),
);
const ModernLibraryPage = lazy(() =>
  import("../library/ModernLibraryPage").then((module) => ({
    default: module.ModernLibraryPage,
  })),
);
const ModernStudyPage = lazy(() =>
  import("../study/ModernStudyPage").then((module) => ({
    default: module.ModernStudyPage,
  })),
);
const ModernToolsPage = lazy(() =>
  import("../tools/ModernToolsPage").then((module) => ({
    default: module.ModernToolsPage,
  })),
);
const ModernReaderPage = lazy(() =>
  import("../reader/ModernReaderPage").then((module) => ({
    default: module.ModernReaderPage,
  })),
);

export function ModernShell() {
  const readerRoute = parseReaderRoute(window.location.pathname);
  const isAudioPage = window.location.pathname === "/audio";
  const isLibraryPage = window.location.pathname === "/library";
  const isStudyPage = window.location.pathname === "/study";
  const isToolsPage = window.location.pathname === "/tools";
  const { theme, setTheme, toggleTheme } = useModernTheme();
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(() =>
    shouldShowOnboarding(localStorage, navigator.webdriver),
  );
  const [lang, setLang] = useState(() => getSettings().lang || "fr");
  useEffect(() => {
    const reopen = () => {
      localStorage.setItem(FORCE_ONBOARDING_KEY, "1");
      setPreferencesOpen(false);
      setOnboardingOpen(true);
    };
    window.addEventListener("modern-open-onboarding", reopen);
    return () => window.removeEventListener("modern-open-onboarding", reopen);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    const sync = (event) =>
      setLang(event.detail?.lang || getSettings().lang || "fr");
    window.addEventListener("modern-preferences-change", sync);
    return () => window.removeEventListener("modern-preferences-change", sync);
  }, [lang]);
  useEffect(() => {
    const lowPower =
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
      (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
      navigator.connection?.saveData;
    document.documentElement.dataset.performance = lowPower
      ? "limited"
      : "standard";
  }, []);
  useEffect(() => {
    if (!readerRoute) return undefined;
    const navigate = (event) => {
      if (
        !["ArrowLeft", "ArrowRight"].includes(event.key) ||
        event.target.closest?.(
          "input,textarea,select,button,a,[contenteditable=true]",
        )
      )
        return;
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? "next" : "previous";
      window.location.assign(
        direction === "next"
          ? document.querySelector('a[aria-label="Suivant"]')?.href
          : document.querySelector('a[aria-label="Precedent"]')?.href,
      );
    };
    window.addEventListener("keydown", navigate);
    return () => window.removeEventListener("keydown", navigate);
  }, [readerRoute?.mode, readerRoute?.value]);
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const focusHomeSearch = () => {
    window.location.assign("/library?tab=search");
  };

  return (
    <div className="modern-shell">
      <SkipLink>Aller au contenu</SkipLink>
      <header className="modern-header">
        <a className="modern-brand" href="/" aria-label="Mon Coran, accueil">
          <span className="modern-brand__mark" aria-hidden="true">
            <BookOpenText size={20} strokeWidth={1.7} />
          </span>
          <span>
            <strong>Mon Coran</strong>
            <small>{translate(lang, "subtitle")}</small>
          </span>
        </a>

        <nav className="modern-nav" aria-label="Navigation principale">
          {navigation.map(({ key, icon: NavIcon, href, disabled }) => (
            <a
              aria-disabled={disabled || undefined}
              className={
                (isAudioPage && href === "/audio") ||
                (isLibraryPage && href === "/library") ||
                (isStudyPage && href === "/study") ||
                (isToolsPage && href === "/tools") ||
                (!isAudioPage &&
                  !isLibraryPage &&
                  !isStudyPage &&
                  !isToolsPage &&
                  href === "/")
                  ? "modern-nav__item is-active"
                  : "modern-nav__item"
              }
              href={disabled ? undefined : href}
              key={key}
            >
              <NavIcon aria-hidden="true" size={18} strokeWidth={1.7} />
              <span>{translate(lang, key)}</span>
            </a>
          ))}
        </nav>

        <div className="modern-header__actions">
          <IconButton
            label={translate(lang, "search")}
            onClick={focusHomeSearch}
          >
            <Search size={19} strokeWidth={1.7} />
          </IconButton>
          <IconButton
            label={
              theme === "dark"
                ? "Activer le theme clair"
                : "Activer le theme sombre"
            }
            onClick={toggleTheme}
          >
            <ThemeIcon size={19} strokeWidth={1.7} />
          </IconButton>
          <IconButton
            label={translate(lang, "settings")}
            onClick={() => setPreferencesOpen(true)}
          >
            <Settings size={19} strokeWidth={1.7} />
          </IconButton>
        </div>
      </header>

      <Suspense
        fallback={
          <main className="modern-page-loading" id="modern-main" role="status">
            <span />
            Chargement...
          </main>
        }
      >
        {isAudioPage ? (
          <ModernAudioPage />
        ) : isLibraryPage ? (
          <ModernLibraryPage />
        ) : isStudyPage ? (
          <ModernStudyPage />
        ) : isToolsPage ? (
          <ModernToolsPage />
        ) : readerRoute ? (
          <ModernReaderPage route={readerRoute} />
        ) : (
          <ModernHomePage />
        )}
      </Suspense>

      <footer className="modern-footer">
        <span>
          Mon Coran ·{" "}
          {isAudioPage
            ? "Ecoute"
            : isLibraryPage
              ? "Bibliotheque"
              : isStudyPage
                ? "Etude"
                : readerRoute
                  ? "Lecture"
                  : "Accueil"}
        </span>
        <a href="/legacy">Ouvrir l'interface legacy</a>
      </footer>
      <ModernAudioPlayer />
      <ModernPWAUpdateBanner />
      {preferencesOpen && (
        <ModernPreferencesDialog
          onClose={() => setPreferencesOpen(false)}
          onThemeChange={setTheme}
        />
      )}
      {onboardingOpen && (
        <ModernOnboarding
          onClose={() => setOnboardingOpen(false)}
          onThemeChange={setTheme}
        />
      )}
    </div>
  );
}
