import {
  BookOpenText,
  Bookmark,
  Headphones,
  Moon,
  Search,
  Settings,
  Sun,
} from "lucide-react";

import { ModernHomePage } from "../home/ModernHomePage";
import { ModernAudioPage } from "../audio/ModernAudioPage";
import { ModernAudioPlayer } from "../audio/ModernAudioPlayer";
import { ModernReaderPage } from "../reader/ModernReaderPage";
import { parseReaderRoute } from "../reader/readerRoute";
import { useModernTheme } from "../theme/ModernThemeProvider";
import { IconButton } from "../ui/IconButton";
import { SkipLink } from "../ui/SkipLink";

const navigation = [
  { label: "Lire", icon: BookOpenText, href: "/" },
  { label: "Ecouter", icon: Headphones, href: "/audio" },
  { label: "Etudier", icon: Bookmark, disabled: true },
];

export function ModernShell() {
  const readerRoute = parseReaderRoute(window.location.pathname);
  const isAudioPage = window.location.pathname === "/audio";
  const { theme, toggleTheme } = useModernTheme();
  const ThemeIcon = theme === "dark" ? Sun : Moon;
  const focusHomeSearch = () => {
    if (window.location.pathname !== "/") window.location.assign("/#surah-search");
    else document.getElementById("surah-search")?.focus();
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
              className={((isAudioPage && href === "/audio") || (!isAudioPage && href === "/")) ? "modern-nav__item is-active" : "modern-nav__item"}
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
          <IconButton disabled label="Ouvrir les reglages">
            <Settings size={19} strokeWidth={1.7} />
          </IconButton>
        </div>
      </header>

      {isAudioPage ? <ModernAudioPage /> : readerRoute ? <ModernReaderPage route={readerRoute} /> : <ModernHomePage />}

      <footer className="modern-footer">
        <span>Mon Coran · {isAudioPage ? "Ecoute" : readerRoute ? "Lecture" : "Accueil"}</span>
        <a href="/legacy">Ouvrir l'interface legacy</a>
      </footer>
      <ModernAudioPlayer />
    </div>
  );
}
