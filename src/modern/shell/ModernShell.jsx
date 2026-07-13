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
import { useEffect, useState } from "react";

import { ModernHomePage } from "../home/ModernHomePage";
import { ModernAudioPage } from "../audio/ModernAudioPage";
import { ModernAudioPlayer } from "../audio/ModernAudioPlayer";
import { ModernLibraryPage } from "../library/ModernLibraryPage";
import { ModernStudyPage } from "../study/ModernStudyPage";
import { ModernToolsPage } from "../tools/ModernToolsPage";
import { ModernPreferencesDialog } from "../preferences/ModernPreferencesDialog";
import { ModernOnboarding } from "../onboarding/ModernOnboarding";
import { ModernPWAUpdateBanner } from "../pwa/ModernPWAUpdateBanner";
import { FORCE_ONBOARDING_KEY, shouldShowOnboarding } from "../onboarding/onboardingModel";
import { ModernReaderPage } from "../reader/ModernReaderPage";
import { parseReaderRoute } from "../reader/readerRoute";
import { useModernTheme } from "../theme/ModernThemeProvider";
import { IconButton } from "../ui/IconButton";
import { SkipLink } from "../ui/SkipLink";

const navigation = [
  { label: "Lire", icon: BookOpenText, href: "/" },
  { label: "Ecouter", icon: Headphones, href: "/audio" },
  { label: "Bibliotheque", icon: Bookmark, href: "/library" },
  { label: "Etudier", icon: GraduationCap, href: "/study" },
  { label: "Outils", icon: Wrench, href: "/tools" },
];

export function ModernShell() {
  const readerRoute = parseReaderRoute(window.location.pathname);
  const isAudioPage = window.location.pathname === "/audio";
  const isLibraryPage = window.location.pathname === "/library";
  const isStudyPage = window.location.pathname === "/study";
  const isToolsPage = window.location.pathname === "/tools";
  const { theme, setTheme, toggleTheme } = useModernTheme();
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(() => shouldShowOnboarding(localStorage, navigator.webdriver));
  useEffect(() => {
    const reopen = () => { localStorage.setItem(FORCE_ONBOARDING_KEY, "1"); setPreferencesOpen(false); setOnboardingOpen(true); };
    window.addEventListener("modern-open-onboarding", reopen);
    return () => window.removeEventListener("modern-open-onboarding", reopen);
  }, []);
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
            <small>Lecture et recitation</small>
          </span>
        </a>

        <nav className="modern-nav" aria-label="Navigation principale">
          {navigation.map(({ label, icon: NavIcon, href, disabled }) => (
            <a
              aria-disabled={disabled || undefined}
              className={((isAudioPage && href === "/audio") || (isLibraryPage && href === "/library") || (isStudyPage && href === "/study") || (isToolsPage && href === "/tools") || (!isAudioPage && !isLibraryPage && !isStudyPage && !isToolsPage && href === "/")) ? "modern-nav__item is-active" : "modern-nav__item"}
              href={disabled ? undefined : href}
              key={label}
            >
              <NavIcon aria-hidden="true" size={18} strokeWidth={1.7} />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="modern-header__actions">
          <IconButton label="Rechercher" onClick={focusHomeSearch}>
            <Search size={19} strokeWidth={1.7} />
          </IconButton>
          <IconButton label={theme === "dark" ? "Activer le theme clair" : "Activer le theme sombre"} onClick={toggleTheme}>
            <ThemeIcon size={19} strokeWidth={1.7} />
          </IconButton>
          <IconButton label="Ouvrir les reglages" onClick={() => setPreferencesOpen(true)}>
            <Settings size={19} strokeWidth={1.7} />
          </IconButton>
        </div>
      </header>

      {isAudioPage ? <ModernAudioPage /> : isLibraryPage ? <ModernLibraryPage /> : isStudyPage ? <ModernStudyPage /> : isToolsPage ? <ModernToolsPage /> : readerRoute ? <ModernReaderPage route={readerRoute} /> : <ModernHomePage />}

      <footer className="modern-footer">
        <span>Mon Coran · {isAudioPage ? "Ecoute" : isLibraryPage ? "Bibliotheque" : isStudyPage ? "Etude" : readerRoute ? "Lecture" : "Accueil"}</span>
        <a href="/legacy">Ouvrir l'interface legacy</a>
      </footer>
      <ModernAudioPlayer />
      <ModernPWAUpdateBanner />
      {preferencesOpen && <ModernPreferencesDialog onClose={() => setPreferencesOpen(false)} onThemeChange={setTheme} />}
      {onboardingOpen && <ModernOnboarding onClose={() => setOnboardingOpen(false)} onThemeChange={setTheme} />}
    </div>
  );
}
