import {
  BookOpenText,
  Bookmark,
  Headphones,
  Moon,
  Search,
  Settings,
  Sun,
} from "lucide-react";

import { buildLegacyHref } from "../routing/legacyLink";
import { useModernTheme } from "../theme/ModernThemeProvider";
import { IconButton } from "../ui/IconButton";
import { SkipLink } from "../ui/SkipLink";

const navigation = [
  { label: "Lire", icon: BookOpenText, active: true },
  { label: "Ecouter", icon: Headphones },
  { label: "Etudier", icon: Bookmark },
];

export function ModernShell() {
  const { theme, toggleTheme } = useModernTheme();
  const legacyHref = buildLegacyHref(
    window.location.pathname,
    window.location.search,
  );
  const ThemeIcon = theme === "dark" ? Sun : Moon;

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
          <IconButton disabled label="Rechercher">
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

      <main className="modern-main" id="modern-main">
        <section className="modern-reading" aria-labelledby="modern-reading-title">
          <div className="modern-reading__heading">
            <div>
              <p className="modern-eyebrow">Derniere lecture</p>
              <h1 id="modern-reading-title">Al-Fatiha</h1>
              <p>La sourate qui ouvre le Livre</p>
            </div>
            <span className="modern-reading__count">1 / 114</span>
          </div>

          <div className="modern-verse">
            <p className="modern-arabic" lang="ar">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
            </p>
            <p className="modern-translation">
              Au nom d'Allah, le Tout Misericordieux, le Tres Misericordieux.
            </p>
          </div>

          <div className="modern-reading__footer">
            <div>
              <span>Progression</span>
              <strong>Verset 1 sur 7</strong>
            </div>
            <div className="modern-progress" aria-label="Progression 14 pour cent">
              <span style={{ width: "14%" }} />
            </div>
            <button className="modern-resume" type="button">
              Reprendre la lecture
              <span aria-hidden="true">&#8594;</span>
            </button>
          </div>
        </section>

        <aside className="modern-phase-note" aria-label="Etat de la refonte">
          <p className="modern-eyebrow">Fondations</p>
          <h2>Une interface recentree sur l'essentiel.</h2>
          <p>
            Les parcours seront reactives progressivement apres leur validation.
            L'application actuelle reste disponible comme reference.
          </p>
          <a href={legacyHref}>Ouvrir l'interface legacy</a>
        </aside>
      </main>

      <footer className="modern-footer">
        <span>Phase 1 · Fondations</span>
        <span>Interface claire et sombre</span>
      </footer>
    </div>
  );
}
