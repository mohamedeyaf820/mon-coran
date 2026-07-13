import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Headphones,
  Languages,
  NotebookPen,
  Palette,
  RotateCcw,
  Share2,
} from "lucide-react";

import SURAHS, { getSurah } from "../../data/surahs";
import {
  getJuz,
  getJuzTranslation,
  getPageFull,
  getSurahFull,
} from "../../services/quranAPI";
import { addRecentVisit } from "../../services/recentHistoryService";
import { markRead } from "../../services/readingProgressService";
import {
  addBookmark,
  getAllBookmarks,
  getNote,
  getSettings,
  removeBookmark,
  saveNote,
  savePosition,
  updateSetting,
} from "../../services/storageService";
import { buildReaderVerses, parseTajweedSegments } from "./readerModel";
import { adjacentReaderHref, buildReaderHref } from "./readerRoute";
import { useModernAudio } from "../audio/ModernAudioProvider";

const MODES = [
  { id: "surah", label: "Sourate" },
  { id: "page", label: "Page" },
  { id: "juz", label: "Juz" },
];

async function loadReaderData(route, riwaya, translationLangs, signal) {
  if (route.mode === "surah") return getSurahFull(route.value, riwaya, translationLangs, signal);
  if (route.mode === "page") return getPageFull(route.value, riwaya, translationLangs, signal);
  const [arabic, translations] = await Promise.all([
    getJuz(route.value, riwaya, signal),
    getJuzTranslation(route.value, translationLangs, signal).catch(() => []),
  ]);
  return { arabic, translations };
}

function TajweedText({ text, fallback, enabled }) {
  const segments = enabled && text ? parseTajweedSegments(text) : [{ text: fallback, rule: null }];
  return segments.map((segment, index) => (
    <span data-tajwid={segment.rule || undefined} key={`${segment.rule}-${index}`}>
      {segment.text}
    </span>
  ));
}

function ModernMushafPage({
  bookmarks,
  onBookmark,
  onPlay,
  pageNumber,
  showTajweed,
  showTranslation,
  verses,
}) {
  const [selectedKey, setSelectedKey] = useState(null);
  const selected = verses.find((verse) => verse.key === selectedKey) || null;

  return (
    <section className="modern-mushaf-wrap" aria-label={`Page du Coran ${pageNumber}`}>
      <article className={`modern-mushaf-page modern-mushaf-page--${pageNumber}`} dir="rtl" lang="ar">
        <header className="modern-mushaf-page__meta" aria-hidden="true">
          <span>القرآن الكريم</span>
          <span>الجزء {verses[0]?.juz || 1}</span>
        </header>
        <div className="modern-mushaf-page__frame">
          <div className="modern-mushaf-flow">
            {verses.map((verse, index) => {
              const previous = verses[index - 1];
              const startsSurah = verse.ayahNumber === 1 && (!previous || previous.surahNumber !== verse.surahNumber);
              const surah = getSurah(verse.surahNumber);
              return (
                <span className="modern-mushaf-unit" key={verse.key}>
                  {startsSurah && (
                    <span className="modern-mushaf-surah">
                      <span>{surah?.en}</span>
                      <strong>{surah?.ar}</strong>
                    </span>
                  )}
                  {startsSurah && verse.surahNumber !== 1 && verse.surahNumber !== 9 && (
                    <span className="modern-mushaf-basmala">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</span>
                  )}
                  <span
                    aria-label={`Verset ${verse.ayahNumber}`}
                    aria-pressed={selectedKey === verse.key}
                    className="modern-mushaf-ayah"
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedKey((key) => key === verse.key ? null : verse.key);
                      }
                    }}
                    onClick={() => setSelectedKey((key) => key === verse.key ? null : verse.key)}
                    role="button"
                    tabIndex="0"
                  >
                    <TajweedText enabled={showTajweed} fallback={verse.text} text={verse.tajweedText} />
                    <span className="modern-mushaf-ayah__mark" aria-hidden="true">{verse.ayahNumber}</span>
                  </span>{" "}
                </span>
              );
            })}
          </div>
        </div>
        <footer className="modern-mushaf-page__number" aria-label={`Page ${pageNumber}`}>
          <span>{pageNumber}</span>
        </footer>
      </article>

      {selected && (
        <div className="modern-mushaf-selection" aria-label={`Verset selectionne ${selected.ayahNumber}`}>
          <span><strong>{getSurah(selected.surahNumber)?.en}</strong><small>Verset {selected.ayahNumber}</small></span>
          <VerseActions bookmarked={bookmarks.has(selected.key)} onBookmark={() => onBookmark(selected)} onPlay={() => onPlay(selected)} verse={selected} />
        </div>
      )}

      {showTranslation && (
        <div className="modern-mushaf-translations" lang="fr">
          <h2>Traduction de la page</h2>
          {verses.map((verse) => (
            <p key={`translation-${verse.key}`}><span>{verse.surahNumber}:{verse.ayahNumber}</span>{verse.translation || "Traduction indisponible."}</p>
          ))}
        </div>
      )}
    </section>
  );
}

function VerseActions({ verse, bookmarked, onBookmark, onPlay }) {
  const [copied, setCopied] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState("");

  async function openNote() {
    const saved = await getNote(verse.surahNumber, verse.ayahNumber);
    setNote(saved?.text || "");
    setEditingNote(true);
  }

  async function copyVerse() {
    await navigator.clipboard.writeText(
      `${verse.text}\n${verse.translation}\n${verse.surahNumber}:${verse.ayahNumber}`,
    );
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function shareVerse() {
    const url = `${window.location.origin}/surah/${verse.surahNumber}/${verse.ayahNumber}`;
    const data = { title: `${verse.surahNumber}:${verse.ayahNumber} · Mon Coran`, text: `${verse.text}\n${verse.translation}`, url };
    if (navigator.share) await navigator.share(data).catch(() => {});
    else await navigator.clipboard.writeText(`${data.text}\n${url}`);
  }

  return (
    <div className="modern-verse-actions" aria-label={`Actions du verset ${verse.ayahNumber}`}>
      <button aria-label="Ecouter le verset" onClick={onPlay} title="Ecouter" type="button">
        <Headphones size={17} />
      </button>
      <button aria-label="Copier le verset" onClick={copyVerse} title="Copier" type="button">
        {copied ? <Check size={17} /> : <Copy size={17} />}
      </button>
      <button
        aria-label={bookmarked ? "Retirer le favori" : "Ajouter aux favoris"}
        className={bookmarked ? "is-active" : ""}
        onClick={onBookmark}
        title={bookmarked ? "Retirer le favori" : "Ajouter aux favoris"}
        type="button"
      >
        <Bookmark fill={bookmarked ? "currentColor" : "none"} size={17} />
      </button>
      <button aria-label="Ajouter une note" onClick={openNote} title="Ajouter une note" type="button">
        <NotebookPen size={17} />
      </button>
      <button aria-label="Partager le verset" onClick={shareVerse} title="Partager" type="button">
        <Share2 size={17} />
      </button>
      {editingNote && (
        <form
          className="modern-note-editor"
          onSubmit={async (event) => {
            event.preventDefault();
            await saveNote(verse.surahNumber, verse.ayahNumber, note.trim());
            setEditingNote(false);
          }}
        >
          <label htmlFor={`note-${verse.key}`}>Note personnelle</label>
          <textarea
            autoFocus
            id={`note-${verse.key}`}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ecrire une observation..."
            rows="3"
            value={note}
          />
          <div>
            <button onClick={() => setEditingNote(false)} type="button">Annuler</button>
            <button className="is-primary" type="submit">Enregistrer</button>
          </div>
        </form>
      )}
    </div>
  );
}

export function ModernReaderPage({ route }) {
  const audio = useModernAudio();
  const settings = useMemo(() => getSettings(), []);
  const [riwaya, setRiwaya] = useState(() => settings.riwaya || "hafs");
  const [translationLangs, setTranslationLangs] = useState(() => settings.translationLangs || [settings.translationLang || "fr"]);
  const [state, setState] = useState({ status: "loading", verses: [], error: null });
  const [showTranslation, setShowTranslation] = useState(() => settings.showTranslation !== false);
  const [showTajweed, setShowTajweed] = useState(() => settings.showTajwid === true);
  const [bookmarks, setBookmarks] = useState(new Set());
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const applyPreferences = (event) => {
      const next = event.detail || getSettings();
      setShowTranslation(next.showTranslation !== false);
      setShowTajweed(next.showTajwid === true);
      setRiwaya(next.riwaya || "hafs");
      setTranslationLangs(next.translationLangs || [next.translationLang || "fr"]);
    };
    window.addEventListener("modern-preferences-change", applyPreferences);
    return () => window.removeEventListener("modern-preferences-change", applyPreferences);
  }, []);

  useEffect(() => {
    getAllBookmarks().then((items) => setBookmarks(new Set(items.map((item) => item.id))));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading", verses: [], error: null });
    loadReaderData(route, riwaya, translationLangs, controller.signal)
      .then((data) => {
        const verses = buildReaderVerses(data);
        setState({ status: "ready", verses, error: null });
        const first = verses[0];
        if (first) {
          savePosition(first.surahNumber, route.ayah || first.ayahNumber, first.page || 1);
          addRecentVisit(first.surahNumber, route.ayah || first.ayahNumber, getSurah(first.surahNumber)?.fr);
        }
      })
      .catch((error) => {
        if (error.name !== "AbortError") setState({ status: "error", verses: [], error });
      });
    return () => controller.abort();
  }, [route.mode, route.value, route.ayah, riwaya, translationLangs.join(","), reloadKey]);

  useEffect(() => {
    if (state.status !== "ready") return;
    const target = route.ayah ? document.getElementById(`ayah-${route.value}-${route.ayah}`) : null;
    target?.scrollIntoView({ block: "center" });
  }, [route.ayah, route.value, state.status]);

  const title = route.mode === "surah"
    ? getSurah(route.value)?.en
    : route.mode === "page" ? `Page ${route.value}` : `Juz ${route.value}`;
  const subtitle = route.mode === "surah"
    ? `${getSurah(route.value)?.fr} · ${getSurah(route.value)?.ayahs} versets`
    : `${state.verses.length} versets`;
  const max = route.mode === "surah" ? 114 : route.mode === "page" ? 604 : 30;

  function navigate(mode, value) {
    updateSetting("displayMode", mode);
    window.location.assign(buildReaderHref({ mode, value }));
  }

  function toggleTranslation() {
    setShowTranslation((value) => {
      updateSetting("showTranslation", !value);
      return !value;
    });
  }

  function toggleTajweed() {
    setShowTajweed((value) => {
      updateSetting("showTajwid", !value);
      return !value;
    });
  }

  async function toggleBookmark(verse) {
    const key = verse.key;
    if (bookmarks.has(key)) await removeBookmark(verse.surahNumber, verse.ayahNumber);
    else await addBookmark(verse.surahNumber, verse.ayahNumber);
    setBookmarks((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  return (
    <main className="modern-reader" id="modern-main">
      <section className="modern-reader-toolbar" aria-label="Navigation de lecture">
        <div className="modern-segmented" aria-label="Mode de lecture">
          {MODES.map((mode) => (
            <button
              aria-pressed={route.mode === mode.id}
              className={route.mode === mode.id ? "is-active" : ""}
              key={mode.id}
              onClick={() => navigate(mode.id, 1)}
              type="button"
            >
              {mode.label}
            </button>
          ))}
        </div>
        <div className="modern-reader-picker">
          <a aria-label="Precedent" className={route.value <= 1 ? "is-disabled" : ""} href={adjacentReaderHref(route, "previous")}>
            <ChevronLeft size={19} />
          </a>
          {route.mode === "surah" ? (
            <select aria-label="Choisir une sourate" onChange={(event) => navigate("surah", event.target.value)} value={route.value}>
              {SURAHS.map((surah) => <option key={surah.n} value={surah.n}>{surah.n}. {surah.en}</option>)}
            </select>
          ) : (
            <label>
              <span>{route.mode === "page" ? "Page" : "Juz"}</span>
              <input max={max} min="1" onChange={(event) => navigate(route.mode, event.target.value)} type="number" value={route.value} />
            </label>
          )}
          <a aria-label="Suivant" className={route.value >= max ? "is-disabled" : ""} href={adjacentReaderHref(route, "next")}>
            <ChevronRight size={19} />
          </a>
        </div>
        <div className="modern-reader-options">
          <button aria-pressed={showTranslation} className={showTranslation ? "is-active" : ""} onClick={toggleTranslation} type="button">
            <Languages size={17} /> Traduction
          </button>
          <button aria-pressed={showTajweed} className={showTajweed ? "is-active" : ""} disabled={riwaya !== "hafs"} onClick={toggleTajweed} type="button">
            <Palette size={17} /> Tajwid
          </button>
        </div>
      </section>

      <header className="modern-reader-heading">
        <div>
          <p className="modern-eyebrow">Lecture · {riwaya.toUpperCase()}</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        {route.mode === "surah" && <p className="modern-reader-heading__arabic" lang="ar" dir="rtl">{getSurah(route.value)?.ar}</p>}
      </header>

      {state.status === "loading" && <div className="modern-reader-state" role="status">Chargement du texte...</div>}
      {state.status === "error" && (
        <div className="modern-reader-state" role="alert">
          <p>Le texte n'a pas pu etre charge.</p>
          <button onClick={() => setReloadKey((key) => key + 1)} type="button"><RotateCcw size={17} /> Reessayer</button>
        </div>
      )}
      {state.status === "ready" && !state.verses.length && <div className="modern-reader-state">Aucun verset disponible.</div>}

      {state.status === "ready" && state.verses.length > 0 && route.mode === "page" && (
        <ModernMushafPage
          bookmarks={bookmarks}
          onBookmark={toggleBookmark}
          onPlay={(verse) => audio.playQueue(state.verses, { surah: verse.surahNumber, ayah: verse.ayahNumber })}
          pageNumber={route.value}
          showTajweed={showTajweed}
          showTranslation={showTranslation}
          verses={state.verses}
        />
      )}

      {state.status === "ready" && state.verses.length > 0 && route.mode !== "page" && (
        <section className="modern-reader-verses" aria-label={title}>
          {state.verses.map((verse, index) => {
            const previous = state.verses[index - 1];
            const startsSurah = route.mode !== "surah" && (!previous || previous.surahNumber !== verse.surahNumber);
            return (
              <div key={verse.key}>
                {startsSurah && (
                  <header className="modern-reader-surah-break">
                    <span>{getSurah(verse.surahNumber)?.en}</span>
                    <span lang="ar" dir="rtl">{getSurah(verse.surahNumber)?.ar}</span>
                  </header>
                )}
                <article
                  className={route.ayah === verse.ayahNumber ? "modern-reader-verse is-target" : "modern-reader-verse"}
                  id={`ayah-${verse.surahNumber}-${verse.ayahNumber}`}
                  onMouseEnter={() => markRead(verse.surahNumber, verse.ayahNumber)}
                >
                  <div className="modern-reader-verse__meta">
                    <a href={`/surah/${verse.surahNumber}/${verse.ayahNumber}`}>{verse.surahNumber}:{verse.ayahNumber}</a>
                    <VerseActions
                      bookmarked={bookmarks.has(verse.key)}
                      onBookmark={() => toggleBookmark(verse)}
                      onPlay={() => audio.playQueue(state.verses, { surah: verse.surahNumber, ayah: verse.ayahNumber })}
                      verse={verse}
                    />
                  </div>
                  <p className="modern-reader-verse__arabic" dir="rtl" lang="ar">
                    <TajweedText enabled={showTajweed} fallback={verse.text} text={verse.tajweedText} />
                    <span className="modern-ayah-mark" aria-hidden="true">{verse.ayahNumber}</span>
                  </p>
                  {showTranslation && <p className="modern-reader-verse__translation" lang="fr">{verse.translation || "Traduction indisponible."}</p>}
                </article>
              </div>
            );
          })}
        </section>
      )}
    </main>
  );
}
