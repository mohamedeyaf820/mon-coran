import { useEffect, useMemo, useState } from "react";
import { Bookmark, Clock3, FileText, Search, Share2, Trash2 } from "lucide-react";
import { getSurah } from "../../data/surahs";
import { search, searchTranslation } from "../../services/quranAPI";
import { getAllSessions } from "../../services/historyService";
import { getRecentVisits } from "../../services/recentHistoryService";
import { deleteNote, getAllBookmarks, getAllNotes, getSettings, removeBookmark } from "../../services/storageService";
import { filterLibraryItems, normalizeSearchMatches } from "./libraryModel";

const tabs = [
  { id: "search", label: "Recherche", icon: Search },
  { id: "bookmarks", label: "Favoris", icon: Bookmark },
  { id: "notes", label: "Notes", icon: FileText },
  { id: "history", label: "Historique", icon: Clock3 },
];

function VerseRow({ item, action }) {
  const surah = getSurah(item.surah);
  return <article className="modern-library-row"><a href={`/surah/${item.surah}/${item.ayah}`}><span>{item.surah}:{item.ayah}</span><span><strong>{surah?.en}</strong><small>{surah?.fr}</small></span><span className="modern-arabic" lang="ar">{surah?.ar}</span></a>{item.text && <p>{item.text}</p>}{action}</article>;
}

export function ModernLibraryPage() {
  const initialTab = new URLSearchParams(window.location.search).get("tab");
  const [tab, setTab] = useState(tabs.some((item) => item.id === initialTab) ? initialTab : "search");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const settings = useMemo(() => getSettings(), []);

  useEffect(() => {
    if (tab === "search") { setItems([]); return; }
    setStatus("loading");
    const request = tab === "bookmarks" ? getAllBookmarks()
      : tab === "notes" ? getAllNotes()
        : Promise.all([getAllSessions(100), Promise.resolve(getRecentVisits())]).then(([sessions, recent]) => {
            const fromSessions = sessions.map((entry) => ({ surah: entry.surah, ayah: entry.ayahTo || entry.ayahFrom, text: entry.date, timestamp: entry.timestamp }));
            return [...fromSessions, ...recent.map((entry) => ({ ...entry, text: entry.surahName, timestamp: entry.ts }))].sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
          });
    request.then((data) => { setItems(data); setStatus("ready"); }).catch(() => setStatus("error"));
  }, [tab]);

  useEffect(() => {
    if (tab !== "search" || query.trim().length < 2) return;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setStatus("loading");
      try {
        const isArabic = /[\u0600-\u06ff]/.test(query);
        const data = isArabic ? await search(query, settings.riwaya, null, controller.signal) : await searchTranslation(query, "fr", null, controller.signal);
        setItems(normalizeSearchMatches(data)); setStatus("ready");
      } catch (error) { if (error.name !== "AbortError") setStatus("error"); }
    }, 350);
    return () => { window.clearTimeout(timeout); controller.abort(); };
  }, [query, settings.riwaya, tab]);

  const visible = tab === "search" ? items : filterLibraryItems(items, query);
  const remove = async (item) => {
    if (tab === "bookmarks") await removeBookmark(item.surah, item.ayah); else await deleteNote(item.surah, item.ayah);
    setItems((current) => current.filter((entry) => entry.id !== item.id));
  };

  return <main className="modern-library" id="modern-main">
    <header><p className="modern-eyebrow">Organiser votre lecture</p><h1>Retrouver ce qui compte.</h1><p>Recherchez un verset ou revenez à vos favoris, notes et lectures récentes.</p></header>
    <nav aria-label="Bibliotheque" className="modern-library-tabs">{tabs.map(({ id, label, icon: Icon }) => <button aria-pressed={tab === id} className={tab === id ? "is-active" : ""} key={id} onClick={() => { setTab(id); setQuery(""); history.replaceState(null, "", `/library?tab=${id}`); }} type="button"><Icon size={18} />{label}</button>)}</nav>
    <section className="modern-library-content" aria-labelledby="library-title">
      <div className="modern-library-heading"><div><p className="modern-eyebrow">{tabs.find((item) => item.id === tab)?.label}</p><h2 id="library-title">{tab === "search" ? "Chercher dans le Coran" : `${items.length} élément${items.length > 1 ? "s" : ""}`}</h2></div><label><Search size={18} /><input aria-label={tab === "search" ? "Rechercher dans le Coran" : "Filtrer la liste"} onChange={(event) => setQuery(event.target.value)} placeholder={tab === "search" ? "Mot arabe ou traduction française" : "Référence ou contenu"} value={query} /></label></div>
      {status === "loading" && <p className="modern-library-state" role="status">Chargement...</p>}
      {status === "error" && <p className="modern-library-state" role="alert">Impossible de charger ces éléments.</p>}
      {status !== "loading" && !visible.length && <p className="modern-library-state">{tab === "search" && query.length < 2 ? "Saisissez au moins deux caractères." : "Aucun élément à afficher."}</p>}
      <div className="modern-library-list">{visible.map((item, index) => <VerseRow action={(tab === "bookmarks" || tab === "notes") ? <button aria-label="Supprimer" onClick={() => remove(item)} title="Supprimer" type="button"><Trash2 size={17} /></button> : <button aria-label="Partager le lien" onClick={() => navigator.clipboard.writeText(`${location.origin}/surah/${item.surah}/${item.ayah}`)} title="Partager" type="button"><Share2 size={17} /></button>} item={item} key={item.id || `${item.surah}:${item.ayah}:${index}`} />)}</div>
    </section>
  </main>;
}
