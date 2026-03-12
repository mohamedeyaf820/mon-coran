import React, { useState, useEffect, useCallback } from "react";
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

export default function PlaylistPanel() {
  const { state, dispatch, set } = useApp();
  const { lang, reciter, riwaya, currentPlayingAyah, isPlaying } = state;

  const [playlists, setPlaylists] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);

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

  const handlePlay = (playlist) => {
    if (!playlist || playlist.ayahs.length === 0) return;
    const reciterObj = getReciter(reciter, riwaya);
    const cdnPath = reciterObj?.cdn || reciter;
    const cdnType = reciterObj?.cdnType || "islamic";

    // Build a playlist for audioService
    // Global ayah numbers are required by some CDN modes.
    // We compute them from canonical cumulative surah offsets.
    const ayahsForAudio = playlist.ayahs.map((a) => ({
      surah: a.surah,
      ayah: a.ayah,
      numberInSurah: a.ayah,
      number: computeGlobalAyahNumber(a.surah, a.ayah),
      text: a.text || "",
    }));

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
    <div className="modal-overlay" onClick={close}>
      <div
        className="modal modal-panel--wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-stack">
            <div className="modal-kicker">
              {lang === "fr"
                ? "Écoute"
                : lang === "ar"
                  ? "الاستماع"
                  : "Listening"}
            </div>
            <h2 className="modal-title">
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
          <button className="modal-close" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-body modal-body--flush">
          {loading ? (
            <div className="wird-loading">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
          ) : !selectedId ? (
            <div className="panel-scroll">
              <div className="panel-toolbar panel-toolbar--compact">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder={t("playlist.namePlaceholder", lang)}
                  className="modal-inline-input"
                  maxLength={50}
                />
                <button className="modal-action-btn" onClick={handleCreate}>
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
                <div className="panel-stack-list">
                  {playlists.map((pl) => (
                    <div key={pl.id} className="modal-item-card">
                      <button
                        className="modal-item-main"
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
                                className="modal-inline-input"
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
                      <div className="modal-item-actions">
                        {pl.ayahs.length > 0 && (
                          <button
                            className="modal-action-btn"
                            onClick={() => handlePlay(pl)}
                            title={lang === "fr" ? "Écouter" : "Play"}
                          >
                            <i className="fas fa-play"></i>
                          </button>
                        )}
                        <button
                          className="modal-action-btn"
                          onClick={() => {
                            setEditing(pl.id);
                            setEditName(pl.name);
                          }}
                          title={lang === "fr" ? "Renommer" : "Rename"}
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                        <button
                          className="modal-action-btn modal-delete-btn"
                          onClick={() => handleDelete(pl.id)}
                          title={lang === "fr" ? "Supprimer" : "Delete"}
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
            <div className="panel-scroll">
              <button
                className="panel-back-link"
                onClick={() => setSelectedId(null)}
              >
                <i className="fas fa-arrow-left"></i>{" "}
                {lang === "fr" ? "Retour" : "Back"}
              </button>
              <h3 className="panel-section-title">{selected?.name}</h3>

              {selected && selected.ayahs.length > 0 && (
                <button
                  className="panel-hero-btn"
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
                <div className="panel-stack-list">
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
                        className={`modal-item-card${isActive ? " modal-item-card--playing" : ""}`}
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
                          className="modal-item-main"
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
                            className="modal-action-btn modal-delete-btn"
                            onClick={() =>
                              handleRemoveAyah(selected.id, a.surah, a.ayah)
                            }
                            title={lang === "fr" ? "Retirer" : "Remove"}
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

/* ── Utility: compute approximate global ayah number ── */
// Surah start positions (cumulative ayah counts minus 1)
const SURAH_AYAH_STARTS = [
  0, 1, 8, 35, 91, 121, 166, 207, 283, 296, 310, 334, 343, 396, 451, 462, 473,
  483, 494, 522, 530, 544, 572, 597, 612, 627, 636, 662, 683, 704, 729, 750,
  773, 796, 819, 852, 883, 915, 954, 987, 1013, 1047, 1075, 1108, 1128, 1160,
  1190, 1204, 1234, 1252, 1270, 1303, 1320, 1362, 1389, 1412, 1473, 1510, 1553,
  1575, 1596, 1610, 1621, 1633, 1645, 1658, 1670, 1699, 1721, 1750, 1764, 1793,
  1821, 1841, 1862, 1898, 1931, 1981, 2027, 2073, 2082, 2110, 2136, 2155, 2174,
  2187, 2197, 2213, 2239, 2265, 2284, 2298, 2313, 2333, 2348, 2353, 2358, 2363,
  2376, 2384, 2392, 2400, 2407, 2413, 2418, 2424, 2429, 2433, 2437, 2440, 2444,
  2449, 2455, 2461,
];

function computeGlobalAyahNumber(surah, ayah) {
  if (surah < 1 || surah > 114) return ayah;
  return (SURAH_AYAH_STARTS[surah - 1] || 0) + ayah;
}
