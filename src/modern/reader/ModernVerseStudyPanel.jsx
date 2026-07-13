import { useEffect, useState } from "react";
import { BookOpenText, Headphones, Languages, RotateCcw, X } from "lucide-react";
import { getAvailableTafsirs, getVerseTafsir } from "../../services/quranComStudyService";
import { getWordByWord } from "../../services/wordByWordService";

const tabs = [{ id: "tafsir", label: "Tafsir", icon: BookOpenText }, { id: "words", label: "Mot a mot", icon: Languages }];

export function ModernVerseStudyPanel({ verse, onClose }) {
  const [tab, setTab] = useState("tafsir");
  const [tafsirId, setTafsirId] = useState("en-kathir");
  const [state, setState] = useState({ status: "loading", tafsir: null, words: [] });
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState((current) => ({ ...current, status: "loading" }));
    Promise.all([
      getVerseTafsir({ surah: verse.surahNumber, ayah: verse.ayahNumber, lang: "fr", tafsirId, signal: controller.signal }),
      getWordByWord(verse.surahNumber, verse.ayahNumber, "fr"),
    ]).then(([tafsir, words]) => setState({ status: "ready", tafsir, words })).catch((error) => { if (error.name !== "AbortError") setState({ status: "error", tafsir: null, words: [] }); });
    return () => controller.abort();
  }, [verse.key, tafsirId, reload]);
  useEffect(() => { const close = (event) => event.key === "Escape" && onClose(); document.addEventListener("keydown", close); return () => document.removeEventListener("keydown", close); }, [onClose]);
  return <div className="modern-study-panel-overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><aside aria-label={`Etudier le verset ${verse.surahNumber}:${verse.ayahNumber}`} aria-modal="true" className="modern-study-panel" role="dialog">
    <header><div><p className="modern-eyebrow">{verse.surahNumber}:{verse.ayahNumber}</p><h2>Etudier le verset</h2></div><button aria-label="Fermer l'etude" onClick={onClose} type="button"><X size={20} /></button></header>
    <p className="modern-study-panel__arabic" dir="rtl" lang="ar">{verse.text}</p>
    <nav aria-label="Outils d'etude">{tabs.map(({ id, label, icon: Icon }) => <button aria-pressed={tab === id} className={tab === id ? "is-active" : ""} key={id} onClick={() => setTab(id)} type="button"><Icon size={17} />{label}</button>)}</nav>
    {state.status === "loading" && <div className="modern-study-panel__state" role="status">Chargement de l'etude...</div>}
    {state.status === "error" && <div className="modern-study-panel__state" role="alert"><span>Cette ressource n'est pas disponible actuellement.</span><button onClick={() => setReload((value) => value + 1)} type="button"><RotateCcw size={17} />Reessayer</button></div>}
    {state.status === "ready" && tab === "tafsir" && <section className="modern-study-panel__body"><label>Commentaire<select aria-label="Choisir un tafsir" onChange={(event) => setTafsirId(event.target.value)} value={tafsirId}>{getAvailableTafsirs().map((item) => <option key={item.key} value={item.key}>{item.nameFr || item.name}</option>)}</select></label><h3>{state.tafsir.sourceFr || state.tafsir.source}</h3>{state.tafsir.note && <p className="modern-study-panel__note">{state.tafsir.note}</p>}<p dir={state.tafsir.language === "ar" ? "rtl" : "ltr"} lang={state.tafsir.language}>{state.tafsir.text}</p></section>}
    {state.status === "ready" && tab === "words" && <section className="modern-study-panel__words">{state.words.length ? state.words.map((word) => <article key={word.id || word.position}><strong dir="rtl" lang="ar">{word.text}</strong><span>{word.transliteration || "-"}</span><small>{word.translation || "Traduction indisponible"}</small>{word.audioUrl && <button aria-label={`Ecouter ${word.text}`} onClick={() => new Audio(word.audioUrl).play().catch(() => {})} type="button"><Headphones size={16} /></button>}</article>) : <p>Le mot a mot n'est pas disponible pour ce verset.</p>}</section>}
  </aside></div>;
}
