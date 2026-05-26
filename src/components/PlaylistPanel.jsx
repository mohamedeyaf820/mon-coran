import React, { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import {
  getAllPlaylists,
  createPlaylist,
  deletePlaylist,
  renamePlaylist,
  removeAyahFromPlaylist,
} from "../services/playlistService";
import { getSurah } from "../data/surahs";
import audioService from "../services/audioService";
import { getReciter } from "../data/reciters";
import {
  buildAudioPlaylistForSurah,
  normalizeAyahsForAudioPlaylist,
} from "../utils/audioPlaylist";

export default function PlaylistPanel() {
  const { state, dispatch, set } = useApp();
  const { lang, reciter, riwaya, currentPlayingAyah, isPlaying } = state;

  const [playlists, setPlaylists] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const titleId = "playlist-panel-title";

  const close = () => dispatch({ type: "TOGGLE_PLAYLIST" });

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllPlaylists();
      setPlaylists(all);
    } catch (err) {
      console.error("Playlist load error:", err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadPlaylists();
  }, [loadPlaylists]);

  useEffect(() => {
    const previous = document.activeElement;
    const raf = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(raf);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, []);

  const handleModalKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
        return;
      }
      if (event.key !== "Tab") return;

      const root = panelRef.current;
      if (!root) return;
      const focusable = root.querySelectorAll(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [close],
  );

  const handleCreate = async () => {
    const name =
      newName.trim() || (lang === "fr" ? "Ma playlist" : "My playlist");
    await createPlaylist(name);
    setNewName("");
    loadPlaylists();
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        lang === "fr" ? "Supprimer cette playlist ?" : "Delete this playlist?",
      )
    )
      return;
    await deletePlaylist(id);
    if (selectedId === id) setSelectedId(null);
    loadPlaylists();
  };

  const handleRename = async (id) => {
    if (!editName.trim()) return;
    await renamePlaylist(id, editName.trim());
    setEditing(null);
    setEditName("");
    loadPlaylists();
  };

  const handleRemoveAyah = async (playlistId, surah, ayah) => {
    await removeAyahFromPlaylist(playlistId, surah, ayah);
    loadPlaylists();
  };

  const handlePlay = async (playlist) => {
    if (!playlist || playlist.ayahs.length === 0) return;
    const reciterObj = getReciter(reciter, riwaya);
    const cdnPath = reciterObj?.cdn || reciter;
    const cdnType = reciterObj?.cdnType || "islamic";

    let ayahsForAudio = [];
    try {
      ayahsForAudio =
        riwaya === "warsh"
          ? (
              await Promise.all(
                playlist.ayahs.map(async (a) => {
                  const surahItems = await buildAudioPlaylistForSurah(a.surah, riwaya);
                  return (
                    surahItems.find((item) => item.numberInSurah === a.ayah) || null
                  );
                }),
              )
            ).filter(Boolean)
          : normalizeAyahsForAudioPlaylist(playlist.ayahs);
    } catch (error) {
      console.error("Playlist audio build error:", error);
      return;
    }

    if (!ayahsForAudio.length) return;

    audioService.loadPlaylist(ayahsForAudio, cdnPath, cdnType);
    audioService.play();
    const firstAyah = ayahsForAudio[0];
    dispatch({
      type: "SET_PLAYING",
      payload: {
        playing: true,
        ayah: firstAyah
          ? {
              surah: firstAyah.surah,
              ayah: firstAyah.numberInSurah,
              globalNumber: firstAyah.number,
            }
          : null,
      },
    });
    close();
  };

  const selected = playlists.find((p) => p.id === selectedId);

  return (
    <div className="modal-overlay !p-3 sm:!p-5" onClick={close}>
      <div
        className="modal modal-panel--wide !w-full !max-w-5xl !overflow-hidden !rounded-3xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(10,18,35,0.98),rgba(8,15,30,0.96))] !shadow-[0_36px_90px_rgba(1,8,22,0.64)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        ref={panelRef}
        onKeyDown={handleModalKeyDown}
      >
        <div className="modal-header !border-b !border-white/10 !bg-[linear-gradient(135deg,rgba(35,62,110,0.34),rgba(18,29,58,0.2))]">
          <div className="modal-title-stack">
            <div className="modal-kicker">
              {lang === "fr"
                ? "Écoute"
                : lang === "ar"
                  ? "الاستماع"
                  : "Listening"}
            </div>
            <h2 className="modal-title" id={titleId}>
              <i className="fas fa-list"></i>
              {t("playlist.title", lang)}
            </h2>
            <div className="modal-subtitle">
              {lang === "fr"
                ? "Organisez vos versets en listes fluides et relancez-les en un geste."
                : lang === "ar"
                  ? "نظّم آياتك في قوائم سلسة وأعد تشغيلها بضغطة واحدة."
                  : "Organize verses into fluid lists and replay them instantly."}
            </div>
          </div>
          <button
            className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/12 !bg-white/[0.04] hover:!bg-white/[0.1]"
            onClick={close}
            ref={closeButtonRef}
            aria-label={lang === "fr" ? "Fermer les playlists" : "Close playlists"}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body modal-body--flush !max-h-[70vh] !overflow-auto !px-3 !pb-3 sm:!px-4 sm:!pb-4">
          {loading ? (
            <div className="wird-loading">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          ) : !selectedId ? (
            <div className="panel-scroll">
              <div className="panel-toolbar panel-toolbar--compact !mb-2 !flex !items-center !gap-2 !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder={t("playlist.namePlaceholder", lang)}
                  className="modal-inline-input !min-h-11 !flex-1 !rounded-xl !border !border-white/14 !bg-white/[0.05] !px-3"
                  maxLength={50}
                />
                <button
                  className="modal-action-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-sky-200/30 !bg-sky-500/20 hover:!bg-sky-500/30"
                  onClick={handleCreate}
                  aria-label={lang === "fr" ? "Créer la playlist" : "Create playlist"}
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>

              {playlists.length === 0 ? (
                <div className="modal-empty">
                  <i className="fas fa-music"></i>
                  <div>
                    {t("playlist.empty", lang)}{" "}
                    {lang === "fr"
                      ? "Créez-en une pour organiser vos versets favoris."
                      : "Create one to organize your favorite verses."}
                  </div>
                </div>
              ) : (
                <div className="panel-stack-list !space-y-2">
                  {playlists.map((pl) => (
                    <div key={pl.id} className="modal-item-card !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-2.5">
                      <button
                        className="modal-item-main !flex-1 !rounded-xl !px-2 !py-2 !text-left hover:!bg-white/[0.08]"
                        onClick={() => setSelectedId(pl.id)}
                      >
                        <div className="modal-item-shell">
                          <span className="modal-item-icon">
                            <i className="fas fa-music"></i>
                          </span>
                          <div>
                            {editing === pl.id ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleRename(pl.id);
                                  if (e.key === "Escape") setEditing(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="modal-inline-input !min-h-10 !w-full !rounded-xl !border !border-white/14 !bg-white/[0.05] !px-3"
                                autoFocus
                              />
                            ) : (
                              <span className="modal-item-body modal-item-body--title">
                                {pl.name}
                              </span>
                            )}
                            <span className="modal-item-meta modal-item-meta--stack">
                              {pl.ayahs.length}{" "}
                              {lang === "fr" ? "versets" : "ayahs"}
                            </span>
                          </div>
                        </div>
                      </button>
                      <div className="modal-item-actions !flex !items-center !gap-1.5">
                        {pl.ayahs.length > 0 && (
                          <button
                            className="modal-action-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-emerald-300/20 !bg-emerald-500/10 hover:!bg-emerald-500/20"
                            onClick={() => handlePlay(pl)}
                            title={lang === "fr" ? "Écouter" : "Play"}
                            aria-label={lang === "fr" ? "Écouter la playlist" : "Play playlist"}
                          >
                            <i className="fas fa-play"></i>
                          </button>
                        )}
                        <button
                          className="modal-action-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/14 !bg-white/[0.05] hover:!bg-white/[0.12]"
                          onClick={() => {
                            setEditing(pl.id);
                            setEditName(pl.name);
                          }}
                          title={lang === "fr" ? "Renommer" : "Rename"}
                          aria-label={lang === "fr" ? "Renommer la playlist" : "Rename playlist"}
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                        <button
                          className="modal-action-btn modal-delete-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-red-300/20 !bg-red-500/10 !text-red-100 hover:!bg-red-500/20"
                          onClick={() => handleDelete(pl.id)}
                          title={lang === "fr" ? "Supprimer" : "Delete"}
                          aria-label={lang === "fr" ? "Supprimer la playlist" : "Delete playlist"}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Playlist detail view */
            <div className="panel-scroll !space-y-2">
              <button
                className="panel-back-link !inline-flex !items-center !gap-1.5 !rounded-xl !border !border-white/14 !bg-white/[0.05] !px-3 !py-2 hover:!bg-white/[0.12]"
                onClick={() => setSelectedId(null)}
              >
                <i className="fas fa-arrow-left"></i>{" "}
                {lang === "fr" ? "Retour" : "Back"}
              </button>
              <h3 className="panel-section-title">{selected?.name}</h3>

              {selected && selected.ayahs.length > 0 && (
                <button
                  className="panel-hero-btn !inline-flex !items-center !gap-2 !rounded-xl !border !border-emerald-300/20 !bg-emerald-500/10 !px-3.5 !py-2.5 !text-emerald-100 hover:!bg-emerald-500/20"
                  onClick={() => handlePlay(selected)}
                >
                  <i className="fas fa-play"></i>
                  {lang === "fr"
                    ? "Écouter tout en boucle"
                    : "Play all in loop"}
                </button>
              )}

              {!selected || selected.ayahs.length === 0 ? (
                <div className="modal-empty">
                  <i className="fas fa-wave-square"></i>
                  <div>
                    {lang === "fr"
                      ? "Aucun verset dans cette playlist. Ajoutez des versets depuis le menu d'actions d'un verset."
                      : "No verses in this playlist. Add verses from the ayah actions menu."}
                  </div>
                </div>
              ) : (
                <div className="panel-stack-list !space-y-2">
                  {selected.ayahs.map((a, i) => {
                    const surah = getSurah(a.surah);
                    const isActive =
                      isPlaying &&
                      currentPlayingAyah &&
                      currentPlayingAyah.surah === a.surah &&
                      currentPlayingAyah.ayah === a.ayah;
                    return (
                      <div
                        key={i}
                        className={`modal-item-card !rounded-2xl !border !border-white/12 !bg-white/[0.03] !p-2.5${isActive ? " modal-item-card--playing" : ""}`}
                        style={
                          isActive
                            ? {
                                borderColor: "var(--gold)",
                                background: "rgba(212,168,32,0.07)",
                                boxShadow: "0 0 0 1px rgba(212,168,32,0.18)",
                              }
                            : undefined
                        }
                      >
                        <button
                          className="modal-item-main !flex-1 !rounded-xl !px-2 !py-2 !text-left hover:!bg-white/[0.08]"
                          onClick={() => {
                            set({
                              displayMode: "surah",
                              showHome: false,
                              showDuas: false,
                            });
                            dispatch({
                              type: "NAVIGATE_SURAH",
                              payload: { surah: a.surah, ayah: a.ayah },
                            });
                            close();
                          }}
                        >
                          <div
                            className="modal-item-meta"
                            style={
                              isActive ? { color: "var(--gold)" } : undefined
                            }
                          >
                            {isActive && (
                              <i
                                className="fas fa-volume-up"
                                style={{
                                  marginInlineEnd: "0.35em",
                                  fontSize: "0.6em",
                                }}
                              />
                            )}
                            {lang === "fr"
                              ? `Verset ${a.ayah}`
                              : `Ayah ${a.ayah}`}
                          </div>
                          <div className="modal-item-ar">
                            {surah?.ar || `S.${a.surah}`}
                          </div>
                          {a.text && (
                            <div className="modal-item-body" dir="rtl">
                              {a.text.slice(0, 90)}…
                            </div>
                          )}
                        </button>
                        <div className="modal-item-side">
                          <button
                            className="modal-action-btn modal-delete-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-red-300/20 !bg-red-500/10 !text-red-100 hover:!bg-red-500/20"
                            onClick={() =>
                              handleRemoveAyah(selected.id, a.surah, a.ayah)
                            }
                            title={lang === "fr" ? "Retirer" : "Remove"}
                            aria-label={lang === "fr" ? "Retirer le verset" : "Remove verse"}
                          >
                            <i className="fas fa-times"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
