import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { NOTE_TEXT_MAX_LENGTH } from "../services/storageValidation";
import { t } from "../i18n";

export default function LibraryModal() {
  const { state, dispatch, set } = useApp();
  const { lang, reciter, riwaya } = state;
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
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const actionPending = useRef(false);

  useEffect(() => {
    setTab(requestedTab);
  }, [requestedTab]);

  const close = () => set({ libraryOpen: false });
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextBookmarks, nextNotes, nextPlaylists] = await Promise.all([
        getAllBookmarks(), getAllNotes(), getAllPlaylists(),
      ]);
      setBookmarks([...nextBookmarks].sort((a, b) => b.createdAt - a.createdAt));
      setNotes([...nextNotes].sort((a, b) => b.updatedAt - a.updatedAt));
      setPlaylists(nextPlaylists);
    } catch {
      setError("loadError");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const runAction = async (operation, errorKey = "saveError") => {
    if (actionPending.current) return;
    actionPending.current = true;
    setBusy(true);
    setError(null);
    try {
      await operation();
    } catch {
      setError(errorKey);
    } finally {
      actionPending.current = false;
      setBusy(false);
    }
  };

  const tabs = useMemo(
    () => [
      { id: "favorites", label: t("library.favorites", lang), Icon: Bookmark, count: bookmarks.length },
      { id: "notes", label: t("library.notes", lang), Icon: NotebookPen, count: notes.length },
      { id: "playlists", label: t("library.playlists", lang), Icon: ListMusic, count: playlists.length },
    ],
    [bookmarks.length, lang, notes.length, playlists.length],
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
    const ref = `${item.surah}:${item.ayah}`;
    const message = (kind === "favorites" ? t("library.removeFavoriteConfirm", lang) : t("library.removeNoteConfirm", lang))
      .replace("{ref}", ref);
    const approved = await confirmAction({ message, tone: "danger" });
    if (!approved) return;
    const removed = kind === "favorites"
      ? await removeBookmark(item.surah, item.ayah)
      : await deleteNote(item.surah, item.ayah);
    if (!removed) throw new Error("Unable to delete item");
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
      message: t("library.deleteListConfirm", lang),
      tone: "danger",
    });
    if (!approved) return;
    await deletePlaylist(id);
    await load();
  };

  const commitNote = async (item) => {
    const value = editingNoteText.trim();
    if (!value) return;
    if (!(await saveNote(item.surah, item.ayah, value))) throw new Error("Note was not saved");
    setEditingNoteId(null);
    setEditingNoteText("");
    await load();
  };

  const commitPlaylistName = async (playlist) => {
    const value = editingPlaylistName.trim();
    if (!value) return;
    if (!(await renamePlaylist(playlist.id, value))) throw new Error("List no longer exists");
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
      selectedReciter?.cdnType || "everyayah",
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
              <textarea value={editingNoteText} onChange={(event) => setEditingNoteText(event.target.value)} maxLength={NOTE_TEXT_MAX_LENGTH} autoFocus aria-label={t("library.edit", lang)} />
              <button type="button" disabled={busy} onClick={() => runAction(() => commitNote(item))} aria-label={t("library.save", lang)}><Check size={16} /></button>
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
            <button type="button" className="library-row__edit" onClick={() => { setEditingNoteId(item.id || `${item.surah}:${item.ayah}`); setEditingNoteText(item.text || ""); }} aria-label={t("library.edit", lang)}>
              <Pencil size={16} aria-hidden="true" />
            </button>
          ) : null}
          <button type="button" className="library-row__delete" disabled={busy} onClick={() => runAction(() => removeSavedItem(kind, item))} aria-label={t("library.remove", lang)}>
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
                <p>{t("library.personalSpace", lang)}</p>
                <Dialog.Title id="library-title">{t("library.title", lang)}</Dialog.Title>
                <Dialog.Description>{t("library.subtitle", lang)}</Dialog.Description>
              </div>
              <button type="button" className="library-close" onClick={close} aria-label={t("library.closeLabel", lang)}><X size={18} /></button>
            </header>
            <nav className="library-tabs" role="tablist" aria-label={t("library.title", lang)}>
              {tabs.map(({ id, label, Icon, count }) => (
                <button key={id} type="button" className={tab === id ? "is-active" : ""} onClick={() => setTab(id)} id={`library-tab-${id}`} aria-controls={`library-panel-${id}`} tabIndex={tab === id ? 0 : -1} onKeyDown={(event) => {
                  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
                  if (!keys.includes(event.key)) return;
                  event.preventDefault();
                  const current = tabs.findIndex((item) => item.id === id);
                  const step = (event.key === "ArrowRight" ? 1 : -1) * (lang === "ar" ? -1 : 1);
                  const index = event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : (current + step + tabs.length) % tabs.length;
                  setTab(tabs[index].id);
                  document.getElementById(`library-tab-${tabs[index].id}`)?.focus();
                }} aria-selected={tab === id} role="tab">
                  <Icon size={17} /><span>{label}</span><small>{count}</small>
                </button>
              ))}
            </nav>
            <div className="library-modal__body" role="tabpanel" id={`library-panel-${tab}`} aria-labelledby={`library-tab-${tab}`} aria-busy={loading || busy}>
              {error ? <div className="library-empty" role="alert"><span>{t(`library.${error}`, lang)}</span>{error === "loadError" ? <button type="button" onClick={load}>{t("library.retry", lang)}</button> : null}</div> : null}
              {tab === "notes" ? (
                <label className="library-search">
                  <Search size={16} aria-hidden="true" />
                  <input type="search" value={noteQuery} onChange={(event) => setNoteQuery(event.target.value)} placeholder={t("library.searchNotes", lang)} aria-label={t("library.searchNotes", lang)} />
                </label>
              ) : null}
              {loading ? <div className="library-loading"><Loader2 size={22} className="animate-spin" /></div> : null}
              {!loading && error !== "loadError" && tab === "favorites" ? renderSaved(bookmarks, "favorites", t("library.emptyFavorites", lang)) : null}
              {!loading && error !== "loadError" && tab === "notes" ? renderSaved(filteredNotes, "notes", noteQuery.trim() ? t("library.noNoteResults", lang) : t("library.emptyNotes", lang)) : null}
              {!loading && error !== "loadError" && tab === "playlists" ? (
                <div className="library-playlists">
                  <div className="library-create">
                    <Plus size={17} aria-hidden="true" />
                    <input value={newName} onChange={(event) => setNewName(event.target.value)} onKeyDown={(event) => event.key === "Enter" && runAction(createList)} placeholder={t("library.newList", lang)} aria-label={t("library.newList", lang)} maxLength={50} />
                    <button type="button" disabled={busy || !newName.trim()} onClick={() => runAction(createList)}>{t("library.create", lang)}</button>
                  </div>
                  {!playlists.length ? <div className="library-empty"><span>{t("library.emptyPlaylists", lang)}</span></div> : playlists.map((playlist) => (
                    <article className="library-row library-row--playlist" key={playlist.id}>
                      <div className="library-row__main">
                        <span className="library-row__ref"><ListMusic size={17} /></span>
                        {editingPlaylistId === playlist.id ? (
                          <span className="library-row__rename"><input value={editingPlaylistName} onChange={(event) => setEditingPlaylistName(event.target.value)} maxLength={50} autoFocus aria-label={t("library.edit", lang)} /><button type="button" disabled={busy} onClick={() => runAction(() => commitPlaylistName(playlist))} aria-label={t("library.save", lang)}><Check size={15} /></button></span>
                        ) : <span className="library-row__copy"><strong>{playlist.name}</strong><small>{playlist.ayahs.length} {t("library.verses", lang)}</small></span>}
                      </div>
                      {editingPlaylistId !== playlist.id ? <button type="button" className="library-row__edit" onClick={() => { setEditingPlaylistId(playlist.id); setEditingPlaylistName(playlist.name); }} aria-label={t("library.edit", lang)}><Pencil size={16} /></button> : null}
                      <button type="button" className="library-row__play" onClick={() => runAction(() => playList(playlist), "audioError")} disabled={busy || !playlist.ayahs.length} aria-label={t("library.listen", lang)}><Play size={16} /></button>
                      <button type="button" className="library-row__delete" disabled={busy} onClick={() => runAction(() => removeList(playlist.id))} aria-label={t("library.remove", lang)}><Trash2 size={16} /></button>
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
