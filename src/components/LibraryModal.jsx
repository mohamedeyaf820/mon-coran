import React, { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Bookmark,
  ChevronRight,
  ListMusic,
  Loader2,
  NotebookPen,
  Pencil,
  Play,
  Plus,
  Search,
  Check,
  Trash2,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  deleteNote,
  getAllBookmarks,
  getAllNotes,
  removeBookmark,
  saveNote,
} from "../services/storageService";
import {
  createPlaylist,
  deletePlaylist,
  getAllPlaylists,
  renamePlaylist,
} from "../services/playlistService";
import { getReciter } from "../data/reciters";
import { getSurah } from "../data/surahs";
import audioService from "../services/audioService";
import {
  buildAudioPlaylistForSurah,
  normalizeAyahsForAudioPlaylist,
} from "../utils/audioPlaylist";
import { confirmAction } from "../services/interactionService";

const COPY = {
  fr: {
    title: "Bibliothèque",
    subtitle: "Favoris, notes et listes audio réunis au même endroit.",
    favorites: "Favoris",
    notes: "Notes",
    playlists: "Listes audio",
    emptyFavorites: "Aucun verset favori pour le moment.",
    emptyNotes: "Aucune note personnelle pour le moment.",
    emptyPlaylists: "Aucune liste audio pour le moment.",
    newList: "Nouvelle liste",
    create: "Créer",
    close: "Fermer la bibliothèque",
    remove: "Supprimer",
    listen: "Écouter",
    searchNotes: "Rechercher dans les notes",
    edit: "Modifier",
    save: "Enregistrer",
  },
  en: {
    title: "Library",
    subtitle: "Bookmarks, notes and audio lists in one calm space.",
    favorites: "Bookmarks",
    notes: "Notes",
    playlists: "Audio lists",
    emptyFavorites: "No bookmarked verse yet.",
    emptyNotes: "No personal note yet.",
    emptyPlaylists: "No audio list yet.",
    newList: "New list",
    create: "Create",
    close: "Close library",
    remove: "Delete",
    listen: "Listen",
    searchNotes: "Search notes",
    edit: "Edit",
    save: "Save",
  },
  ar: {
    title: "المكتبة",
    subtitle: "المفضلة والملاحظات والقوائم الصوتية في مكان واحد.",
    favorites: "المفضلة",
    notes: "الملاحظات",
    playlists: "القوائم الصوتية",
    emptyFavorites: "لا توجد آيات مفضلة بعد.",
    emptyNotes: "لا توجد ملاحظات بعد.",
    emptyPlaylists: "لا توجد قوائم صوتية بعد.",
    newList: "قائمة جديدة",
    create: "إنشاء",
    close: "إغلاق المكتبة",
    remove: "حذف",
    listen: "استماع",
    searchNotes: "البحث في الملاحظات",
    edit: "تعديل",
    save: "حفظ",
  },
};

export default function LibraryModal() {
  const { state, dispatch, set } = useApp();
  const { lang, reciter, riwaya } = state;
  const copy = COPY[lang] || COPY.fr;
  const requestedTab = ["favorites", "notes", "playlists"].includes(state.libraryTab)
    ? state.libraryTab
    : "favorites";
  const [tab, setTab] = useState(requestedTab);
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [newName, setNewName] = useState("");
  const [noteQuery, setNoteQuery] = useState("");
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [editingPlaylistId, setEditingPlaylistId] = useState(null);
  const [editingPlaylistName, setEditingPlaylistName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTab(requestedTab);
  }, [requestedTab]);

  const close = () => set({ libraryOpen: false });
  const load = useCallback(async () => {
    setLoading(true);
    const [nextBookmarks, nextNotes, nextPlaylists] = await Promise.all([
      getAllBookmarks(),
      getAllNotes(),
      getAllPlaylists(),
    ]);
    setBookmarks([...(nextBookmarks || [])].sort((a, b) => b.createdAt - a.createdAt));
    setNotes([...(nextNotes || [])].sort((a, b) => b.updatedAt - a.updatedAt));
    setPlaylists(nextPlaylists || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load().catch(() => setLoading(false));
  }, [load]);

  const tabs = useMemo(
    () => [
      { id: "favorites", label: copy.favorites, Icon: Bookmark, count: bookmarks.length },
      { id: "notes", label: copy.notes, Icon: NotebookPen, count: notes.length },
      { id: "playlists", label: copy.playlists, Icon: ListMusic, count: playlists.length },
    ],
    [bookmarks.length, copy, notes.length, playlists.length],
  );
  const filteredNotes = useMemo(() => {
    const query = noteQuery.trim().toLocaleLowerCase(lang === "ar" ? "ar" : undefined);
    if (!query) return notes;
    return notes.filter((item) => {
      const surah = getSurah(item.surah);
      return `${item.text || ""} ${item.surah}:${item.ayah} ${surah?.fr || ""} ${surah?.en || ""} ${surah?.ar || ""}`
        .toLocaleLowerCase(lang === "ar" ? "ar" : undefined)
        .includes(query);
    });
  }, [lang, noteQuery, notes]);

  const goToVerse = (surah, ayah) => {
    set({ libraryOpen: false, showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah } });
  };

  const removeSavedItem = async (kind, item) => {
    if (kind === "favorites") await removeBookmark(item.surah, item.ayah);
    else await deleteNote(item.surah, item.ayah);
    await load();
  };

  const createList = async () => {
    const value = newName.trim();
    if (!value) return;
    await createPlaylist(value);
    setNewName("");
    await load();
  };

  const removeList = async (id) => {
    const approved = await confirmAction({
      message: lang === "fr" ? "Supprimer cette liste audio ?" : lang === "ar" ? "حذف هذه القائمة الصوتية؟" : "Delete this audio list?",
      tone: "danger",
    });
    if (!approved) return;
    await deletePlaylist(id);
    await load();
  };

  const commitNote = async (item) => {
    const value = editingNoteText.trim();
    if (!value) return;
    await saveNote(item.surah, item.ayah, value);
    setEditingNoteId(null);
    setEditingNoteText("");
    await load();
  };

  const commitPlaylistName = async (playlist) => {
    const value = editingPlaylistName.trim();
    if (!value) return;
    await renamePlaylist(playlist.id, value);
    setEditingPlaylistId(null);
    setEditingPlaylistName("");
    await load();
  };

  const playList = async (playlist) => {
    if (!playlist?.ayahs?.length) return;
    const selectedReciter = getReciter(reciter, riwaya);
    const items = riwaya === "warsh"
      ? (await Promise.all(playlist.ayahs.map(async (entry) => {
          const surahItems = await buildAudioPlaylistForSurah(entry.surah, riwaya);
          return surahItems.find((item) => item.numberInSurah === entry.ayah) || null;
        }))).filter(Boolean)
      : normalizeAyahsForAudioPlaylist(playlist.ayahs);
    if (!items.length) return;
    audioService.loadPlaylist(
      items,
      selectedReciter?.cdn || reciter,
      selectedReciter?.cdnType || "islamic",
    );
    await audioService.play();
    const first = items[0];
    dispatch({
      type: "SET_PLAYING",
      payload: {
        playing: true,
        ayah: { surah: first.surah, ayah: first.numberInSurah, globalNumber: first.number },
      },
    });
    close();
  };

  const renderSaved = (items, kind, emptyLabel) => {
    if (!items.length) return <div className="library-empty"><span>{emptyLabel}</span></div>;
    return items.map((item) => {
      const surah = getSurah(item.surah);
      return (
        <article className="library-row" key={item.id || `${item.surah}:${item.ayah}`}>
          {kind === "notes" && editingNoteId === (item.id || `${item.surah}:${item.ayah}`) ? (
            <div className="library-row__editor">
              <span className="library-row__ref">{item.surah}:{item.ayah}</span>
              <textarea value={editingNoteText} onChange={(event) => setEditingNoteText(event.target.value)} maxLength={2000} autoFocus aria-label={copy.edit} />
              <button type="button" onClick={() => commitNote(item)} aria-label={copy.save}><Check size={16} /></button>
            </div>
          ) : <button type="button" className="library-row__main" onClick={() => goToVerse(item.surah, item.ayah)}>
            <span className="library-row__ref">{item.surah}:{item.ayah}</span>
            <span className="library-row__copy">
              <strong>{lang === "fr" ? surah?.fr : lang === "ar" ? surah?.ar : surah?.en}</strong>
              {kind === "notes" && item.text ? <small>{item.text}</small> : <small>{surah?.ar}</small>}
            </span>
            <ChevronRight size={17} aria-hidden="true" />
          </button>}
          {kind === "notes" && editingNoteId !== (item.id || `${item.surah}:${item.ayah}`) ? (
            <button type="button" className="library-row__edit" onClick={() => { setEditingNoteId(item.id || `${item.surah}:${item.ayah}`); setEditingNoteText(item.text || ""); }} aria-label={copy.edit}>
              <Pencil size={16} aria-hidden="true" />
            </button>
          ) : null}
          <button type="button" className="library-row__delete" onClick={() => removeSavedItem(kind, item)} aria-label={copy.remove}>
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </article>
      );
    });
  };

  return (
    <Dialog.Root open onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <div className="modal-overlay library-overlay" onClick={close}>
          <Dialog.Content className="library-modal" onClick={(event) => event.stopPropagation()} aria-labelledby="library-title">
            <header className="library-modal__header">
              <div>
                <p>{lang === "fr" ? "Votre espace personnel" : lang === "ar" ? "مساحتك الخاصة" : "Your personal space"}</p>
                <Dialog.Title id="library-title">{copy.title}</Dialog.Title>
                <Dialog.Description>{copy.subtitle}</Dialog.Description>
              </div>
              <button type="button" className="library-close" onClick={close} aria-label={copy.close}><X size={18} /></button>
            </header>
            <nav className="library-tabs" aria-label={copy.title}>
              {tabs.map(({ id, label, Icon, count }) => (
                <button key={id} type="button" className={tab === id ? "is-active" : ""} onClick={() => setTab(id)} aria-selected={tab === id} role="tab">
                  <Icon size={17} /><span>{label}</span><small>{count}</small>
                </button>
              ))}
            </nav>
            <div className="library-modal__body">
              {tab === "notes" ? (
                <label className="library-search">
                  <Search size={16} aria-hidden="true" />
                  <input type="search" value={noteQuery} onChange={(event) => setNoteQuery(event.target.value)} placeholder={copy.searchNotes} aria-label={copy.searchNotes} />
                </label>
              ) : null}
              {loading ? <div className="library-loading"><Loader2 size={22} className="animate-spin" /></div> : null}
              {!loading && tab === "favorites" ? renderSaved(bookmarks, "favorites", copy.emptyFavorites) : null}
              {!loading && tab === "notes" ? renderSaved(filteredNotes, "notes", copy.emptyNotes) : null}
              {!loading && tab === "playlists" ? (
                <div className="library-playlists">
                  <div className="library-create">
                    <Plus size={17} aria-hidden="true" />
                    <input value={newName} onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && createList()} placeholder={copy.newList} maxLength={50} />
                    <button type="button" onClick={createList}>{copy.create}</button>
                  </div>
                  {!playlists.length ? <div className="library-empty"><span>{copy.emptyPlaylists}</span></div> : playlists.map((playlist) => (
                    <article className="library-row library-row--playlist" key={playlist.id}>
                      <div className="library-row__main">
                        <span className="library-row__ref"><ListMusic size={17} /></span>
                        {editingPlaylistId === playlist.id ? (
                          <span className="library-row__rename"><input value={editingPlaylistName} onChange={(event) => setEditingPlaylistName(event.target.value)} maxLength={50} autoFocus aria-label={copy.edit} /><button type="button" onClick={() => commitPlaylistName(playlist)} aria-label={copy.save}><Check size={15} /></button></span>
                        ) : <span className="library-row__copy"><strong>{playlist.name}</strong><small>{playlist.ayahs.length} {lang === "fr" ? "versets" : lang === "ar" ? "آيات" : "verses"}</small></span>}
                      </div>
                      {editingPlaylistId !== playlist.id ? <button type="button" className="library-row__edit" onClick={() => { setEditingPlaylistId(playlist.id); setEditingPlaylistName(playlist.name); }} aria-label={copy.edit}><Pencil size={16} /></button> : null}
                      <button type="button" className="library-row__play" onClick={() => playList(playlist)} disabled={!playlist.ayahs.length} aria-label={copy.listen}><Play size={16} /></button>
                      <button type="button" className="library-row__delete" onClick={() => removeList(playlist.id)} aria-label={copy.remove}><Trash2 size={16} /></button>
                    </article>
                  ))}
                </div>
              ) : null}
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
