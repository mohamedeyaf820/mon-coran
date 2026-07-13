import { BookHeart, Headphones, Plus, Sparkles, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import QURAN_DUAS from "../../data/duas";
import { createPlaylist, deletePlaylist, getAllPlaylists } from "../../services/playlistService";

export function ModernToolsPage() {
  const [tab, setTab] = useState("duas");
  const [query, setQuery] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [name, setName] = useState("");
  const refresh = () => getAllPlaylists().then(setPlaylists);
  useEffect(() => { refresh().catch(() => setPlaylists([])); }, []);
  const duas = useMemo(() => QURAN_DUAS.filter((dua) => `${dua.fr} ${dua.transliteration} ${dua.surah}:${dua.ayah}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const add = async (event) => { event.preventDefault(); if (!name.trim()) return; await createPlaylist(name.trim()); setName(""); await refresh(); };

  return <main className="modern-tools" id="modern-main">
    <header><div><p className="modern-eyebrow">Approfondir a votre rythme</p><h1>Invocations et outils.</h1></div><p>Retrouvez les douas du Coran et organisez vos sequences de recitation.</p></header>
    <nav aria-label="Sections des outils"><button aria-pressed={tab === "duas"} onClick={() => setTab("duas")} type="button"><BookHeart size={18}/>Invocations</button><button aria-pressed={tab === "playlists"} onClick={() => setTab("playlists")} type="button"><Headphones size={18}/>Playlists</button><button aria-pressed={tab === "advanced"} onClick={() => setTab("advanced")} type="button"><Sparkles size={18}/>Plus</button></nav>
    {tab === "duas" && <section><label className="modern-tools__search"><span>Rechercher une invocation</span><input onChange={(event) => setQuery(event.target.value)} placeholder="Patience, pardon, 2:201..." type="search" value={query}/></label><div className="modern-dua-list">{duas.map((dua) => <article key={dua.id}><a href={`/surah/${dua.surah}/${dua.ayah}`}>{dua.surah}:{dua.ayah}</a><p className="modern-dua-list__arabic" dir="rtl" lang="ar">{dua.arabic}</p><p>{dua.fr}</p><small>{dua.transliteration}</small></article>)}</div></section>}
    {tab === "playlists" && <section className="modern-playlists"><form onSubmit={add}><label htmlFor="playlist-name">Nouvelle playlist</label><div><input id="playlist-name" onChange={(event) => setName(event.target.value)} placeholder="Revision du matin" value={name}/><button type="submit"><Plus size={17}/>Creer</button></div></form>{playlists.length ? <div>{playlists.map((playlist) => <article key={playlist.id}><span><strong>{playlist.name}</strong><small>{playlist.ayahs.length} verset{playlist.ayahs.length > 1 ? "s" : ""}</small></span><button aria-label={`Supprimer ${playlist.name}`} onClick={async () => { await deletePlaylist(playlist.id); await refresh(); }} type="button"><Trash2 size={17}/></button></article>)}</div> : <p className="modern-tools__empty">Aucune playlist. Creez votre premiere sequence de lecture.</p>}</section>}
    {tab === "advanced" && <section className="modern-tools__advanced"><a href="/legacy"><strong>Flashcards et comparateur</strong><span>Retrouver temporairement les outils experts dans l'interface complete.</span></a><a href="/study"><strong>Memorisation et quiz tajwid</strong><span>Reviser vos versets et mesurer votre progression.</span></a><a href="/audio"><strong>Recitateurs et file audio</strong><span>Comparer les voix et preparer votre ecoute.</span></a></section>}
  </main>;
}
