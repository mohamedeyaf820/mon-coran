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
import { ModernReaderPage } from "../reader/ModernReaderPage";
import { parseReaderRoute } from "../reader/readerRoute";
import { useModernTheme } from "../theme/ModernThemeProvider";
import { IconButton } from "../ui/IconButton";
import { SkipLink } from "../ui/SkipLink";

const navigation = [
  { label: "Lire", icon: BookOpenText, active: true },
  { label: "Ecouter", icon: Headphones },
  { label: "Etudier", icon: Bookmark },
];

export function ModernShell() {
  const readerRoute = parseReaderRoute(window.location.pathname);
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
          {navigation.map(({ label, icon: NavIcon, active }) => (
            <button
              className={active ? "modern-nav__item is-active" : "modern-nav__item"}
              disabled={!active}
              key={label}
              type="button"
            >
              <NavIcon aria-hidden="true" size={18} strokeWidth={1.7} />
              <span>{label}</span>
            </button>
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

      {readerRoute ? <ModernReaderPage route={readerRoute} /> : <ModernHomePage />}

      <footer className="modern-footer">
        <span>Mon Coran · {readerRoute ? "Lecture" : "Accueil"}</span>
        <a href="/legacy">Ouvrir l'interface legacy</a>
      </footer>
    </div>
  );
}
