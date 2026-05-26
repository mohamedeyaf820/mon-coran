import React from "react";
import { getSurah } from "../../data/surahs";
import { useApp } from "../../context/AppContext";
import { openExternalUrl } from "../../lib/security";
import { getQuranComVerseUrl } from "../../services/quranComStudyService";

function labelFor(lang, fr, en) {
  return lang === "fr" ? fr : en;
}

export default function VerseCompareTray({ lang }) {
  const { state, set } = useApp();
  const pinnedAyahs = Array.isArray(state.pinnedAyahs)
    ? state.pinnedAyahs
    : [];

  if (pinnedAyahs.length === 0) return null;

  const removePin = (surah, ayah) =>
    set({
      pinnedAyahs: pinnedAyahs.filter(
        (item) =>
          !(Number(item.surah) === Number(surah) && Number(item.ayah) === Number(ayah)),
      ),
    });

  return (
    <aside
      className="verse-compare-tray"
      aria-label={labelFor(lang, "Versets epingles", "Pinned verses")}
    >
      <div className="verse-compare-tray__header">
        <div>
          <span className="verse-compare-tray__eyebrow">
            <i className="fas fa-thumbtack" />
            {labelFor(lang, "Comparaison", "Compare")}
          </span>
          <h2>{labelFor(lang, "Versets epingles", "Pinned verses")}</h2>
        </div>
        <button
          type="button"
          className="verse-compare-tray__clear"
          onClick={() => set({ pinnedAyahs: [] })}
        >
          {labelFor(lang, "Vider", "Clear")}
        </button>
      </div>

      <div className="verse-compare-tray__grid">
        {pinnedAyahs.map((item) => {
          const surahMeta = getSurah(item.surah);
          const title =
            item.surahName ||
            (lang === "fr" ? surahMeta?.fr || surahMeta?.en : surahMeta?.en) ||
            `Surah ${item.surah}`;

          return (
            <article
              className="verse-compare-card"
              key={`${item.surah}:${item.ayah}`}
            >
              <div className="verse-compare-card__top">
                <span>
                  {title} {item.surah}:{item.ayah}
                </span>
                <button
                  type="button"
                  onClick={() => removePin(item.surah, item.ayah)}
                  aria-label={labelFor(lang, "Retirer", "Remove")}
                >
                  <i className="fas fa-xmark" />
                </button>
              </div>
              <p dir="rtl" lang="ar">
                {item.text || "..." }
              </p>
              <button
                type="button"
                className="verse-compare-card__link"
                onClick={() => openExternalUrl(getQuranComVerseUrl(item.surah, item.ayah))}
              >
                <i className="fas fa-arrow-up-right-from-square" />
                Quran.com
              </button>
            </article>
          );
        })}
      </div>
    </aside>
  );
}
