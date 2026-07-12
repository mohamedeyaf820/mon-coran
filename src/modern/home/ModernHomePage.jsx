import { useMemo, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  BookOpenText,
  Clock3,
  Search,
} from "lucide-react";

import SURAHS from "../../data/surahs";
import { getReadStats } from "../../services/readingProgressService";
import { getRecentVisits } from "../../services/recentHistoryService";
import { getSettings } from "../../services/storageService";
import { buildModernHomeModel, filterHomeSurahs } from "./homeModel";

const INITIAL_SURAHS = 12;

function formatSurahType(type) {
  return type === "Medinan" ? "Medinoise" : "Mecquoise";
}

export function ModernHomePage() {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_SURAHS);
  const model = useMemo(
    () =>
      buildModernHomeModel({
        settings: getSettings(),
        recentVisits: getRecentVisits(),
        stats: getReadStats(),
        surahs: SURAHS,
      }),
    [],
  );
  const filteredSurahs = useMemo(
    () => filterHomeSurahs(model.surahs, query),
    [model.surahs, query],
  );
  const displayedSurahs = query.trim()
    ? filteredSurahs
    : filteredSurahs.slice(0, visibleCount);
  const hasMore = !query.trim() && visibleCount < filteredSurahs.length;

  return (
    <main className="modern-home" id="modern-main">
      <header className="modern-home__intro">
        <div>
          <p className="modern-eyebrow">Votre espace de lecture</p>
          <h1>Revenir au texte, simplement.</h1>
        </div>
        <p>
          Reprenez votre lecture ou ouvrez une sourate sans perdre votre
          progression.
        </p>
      </header>

      <section className="modern-home__resume" aria-labelledby="resume-title">
        <div className="modern-home__resume-copy">
          <div className="modern-home__resume-meta">
            <span>Derniere lecture</span>
            <span>{model.riwaya}</span>
          </div>
          <h2 id="resume-title">{model.resume.surah.en}</h2>
          <p className="modern-arabic" lang="ar">
            {model.resume.surah.ar}
          </p>
          <p>
            {model.resume.surah.fr} · verset {model.resume.ayah} sur{" "}
            {model.resume.surah.ayahs}
          </p>
          <div className="modern-home__resume-progress">
            <span style={{ width: `${model.resume.progress}%` }} />
          </div>
          <a className="modern-home__resume-action" href={model.resume.href}>
            <BookOpenText aria-hidden="true" size={18} strokeWidth={1.8} />
            Reprendre la lecture
            <ArrowRight aria-hidden="true" size={18} strokeWidth={1.8} />
          </a>
        </div>

        <div className="modern-home__stats" aria-label="Progression globale">
          <div className="modern-home__stats-heading">
            <BarChart3 aria-hidden="true" size={19} strokeWidth={1.7} />
            <span>Progression globale</span>
          </div>
          <strong>{model.stats.percentage}%</strong>
          <div className="modern-home__global-progress">
            <span style={{ width: `${model.stats.percentage}%` }} />
          </div>
          <dl>
            <div>
              <dt>Versets lus</dt>
              <dd>{model.stats.totalRead.toLocaleString("fr-FR")}</dd>
            </div>
            <div>
              <dt>Sourates terminees</dt>
              <dd>{model.stats.completedSurahs}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="modern-home__recents" aria-labelledby="recents-title">
        <div className="modern-section-heading">
          <div>
            <p className="modern-eyebrow">Continuer</p>
            <h2 id="recents-title">Lectures recentes</h2>
          </div>
          <Clock3 aria-hidden="true" size={20} strokeWidth={1.6} />
        </div>

        {model.recents.length ? (
          <div className="modern-home__recent-list">
            {model.recents.map((recent) => (
              <a href={recent.href} key={recent.surah.n}>
                <span>{String(recent.surah.n).padStart(3, "0")}</span>
                <span>
                  <strong>{recent.surah.en}</strong>
                  <small>
                    {recent.surah.fr} · verset {recent.ayah}
                  </small>
                </span>
                <span className="modern-arabic" lang="ar">
                  {recent.surah.ar}
                </span>
                <ArrowRight aria-hidden="true" size={17} strokeWidth={1.7} />
              </a>
            ))}
          </div>
        ) : (
          <p className="modern-home__empty">
            Vos prochaines lectures apparaitront ici.
          </p>
        )}
      </section>

      <section className="modern-home__surahs" aria-labelledby="surahs-title">
        <div className="modern-section-heading modern-section-heading--search">
          <div>
            <p className="modern-eyebrow">Le Saint Coran</p>
            <h2 id="surahs-title">Explorer les sourates</h2>
          </div>
          <label className="modern-home__search" htmlFor="surah-search">
            <Search aria-hidden="true" size={18} strokeWidth={1.7} />
            <input
              aria-label="Nom, traduction ou numero"
              autoComplete="off"
              id="surah-search"
              onChange={(event) => {
                setQuery(event.target.value);
                setVisibleCount(INITIAL_SURAHS);
              }}
              placeholder="Nom, traduction ou numero"
              type="search"
              value={query}
            />
          </label>
        </div>

        {displayedSurahs.length ? (
          <div className="modern-home__surah-list">
            {displayedSurahs.map((surah) => (
              <a href={`/surah/${surah.n}`} key={surah.n}>
                <span className="modern-home__surah-number">
                  {String(surah.n).padStart(3, "0")}
                </span>
                <span className="modern-home__surah-name">
                  <strong>{surah.en}</strong>
                  <small>
                    {surah.fr} · {surah.ayahs} versets
                  </small>
                </span>
                <span className="modern-home__surah-origin">
                  {formatSurahType(surah.type)}
                </span>
                <span className="modern-arabic" lang="ar">
                  {surah.ar}
                </span>
              </a>
            ))}
          </div>
        ) : (
          <p className="modern-home__empty">
            Aucune sourate ne correspond a cette recherche.
          </p>
        )}

        {hasMore && (
          <button
            className="modern-home__more"
            onClick={() => setVisibleCount((count) => count + 18)}
            type="button"
          >
            Afficher plus de sourates
          </button>
        )}
      </section>
    </main>
  );
}
