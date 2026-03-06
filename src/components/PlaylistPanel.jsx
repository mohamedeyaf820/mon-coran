import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import {
  getAllPlaylists, createPlaylist, deletePlaylist,
  renamePlaylist, removeAyahFromPlaylist,
} from '../services/playlistService';
import { getSurah } from '../data/surahs';
import audioService from '../services/audioService';
import { getReciter } from '../data/reciters';

export default function PlaylistPanel() {
  const { state, dispatch } = useApp();
  const { lang, reciter, riwaya } = state;

  const [playlists, setPlaylists] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);

  const close = () => dispatch({ type: 'TOGGLE_PLAYLIST' });

  const loadPlaylists = useCallback(async () => {
    setLoading(true);
    try {
      const all = await getAllPlaylists();
      setPlaylists(all);
    } catch (err) {
      console.error('Playlist load error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadPlaylists(); }, [loadPlaylists]);

  const handleCreate = async () => {
    const name = newName.trim() || (lang === 'fr' ? 'Ma playlist' : 'My playlist');
    await createPlaylist(name);
    setNewName('');
    loadPlaylists();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(lang === 'fr' ? 'Supprimer cette playlist ?' : 'Delete this playlist?')) return;
    await deletePlaylist(id);
    if (selectedId === id) setSelectedId(null);
    loadPlaylists();
  };

  const handleRename = async (id) => {
    if (!editName.trim()) return;
    await renamePlaylist(id, editName.trim());
    setEditing(null);
    setEditName('');
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
    const cdnType = reciterObj?.cdnType || 'islamic';

    // Build a playlist for audioService
    // Global ayah numbers are required by some CDN modes.
    // We compute them from canonical cumulative surah offsets.
    const ayahsForAudio = playlist.ayahs.map(a => ({
      surah: a.surah,
      ayah: a.ayah,
      numberInSurah: a.ayah,
      number: computeGlobalAyahNumber(a.surah, a.ayah),
      text: a.text || '',
    }));

    audioService.loadPlaylist(ayahsForAudio, cdnPath, cdnType);
    audioService.play();
    const firstAyah = ayahsForAudio[0];
    dispatch({
      type: 'SET_PLAYING',
      payload: {
        playing: true,
        ayah: firstAyah
          ? { surah: firstAyah.surah, ayah: firstAyah.numberInSurah, globalNumber: firstAyah.number }
          : null
      }
    });
    close();
  };

  const selected = playlists.find(p => p.id === selectedId);

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal modal-playlist" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <i className="fas fa-list" style={{ marginInlineEnd: '0.4rem' }}></i>
            {t('playlist.title', lang)}
          </h2>
          <button className="icon-btn" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="pl-body">
          {loading ? (
            <div className="wird-loading"><i className="fas fa-spinner fa-spin"></i></div>
          ) : !selectedId ? (
            /* Playlist list view */
            <div className="pl-list-view">
              {/* Create new */}
              <div className="pl-create">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                  placeholder={t('playlist.namePlaceholder', lang)}
                  className="pl-input"
                  maxLength={50}
                />
                <button className="btn btn-primary pl-create-btn" onClick={handleCreate}>
                  <i className="fas fa-plus"></i>
                </button>
              </div>

              {playlists.length === 0 ? (
                <p className="wird-empty">
                  {t('playlist.empty', lang)} {lang === 'fr'
                    ? 'Créez-en une pour organiser vos versets favoris !'
                    : 'Create one to organize your favorite verses!'}
                </p>
              ) : (
                <div className="pl-items">
                  {playlists.map(pl => (
                    <div key={pl.id} className="pl-item">
                      <button className="pl-item-main" onClick={() => setSelectedId(pl.id)}>
                        <i className="fas fa-music pl-item-icon"></i>
                        <div className="pl-item-info">
                          {editing === pl.id ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') handleRename(pl.id); if (e.key === 'Escape') setEditing(null); }}
                              onClick={e => e.stopPropagation()}
                              className="pl-edit-input"
                              autoFocus
                            />
                          ) : (
                            <span className="pl-item-name">{pl.name}</span>
                          )}
                          <span className="pl-item-count">
                            {pl.ayahs.length} {lang === 'fr' ? 'versets' : 'ayahs'}
                          </span>
                        </div>
                      </button>
                      <div className="pl-item-actions">
                        {pl.ayahs.length > 0 && (
                          <button className="icon-btn pl-play-btn" onClick={() => handlePlay(pl)} title={lang === 'fr' ? 'Écouter' : 'Play'}>
                            <i className="fas fa-play"></i>
                          </button>
                        )}
                        <button
                          className="icon-btn"
                          onClick={() => { setEditing(pl.id); setEditName(pl.name); }}
                          title={lang === 'fr' ? 'Renommer' : 'Rename'}
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                        <button className="icon-btn" onClick={() => handleDelete(pl.id)} title={lang === 'fr' ? 'Supprimer' : 'Delete'}>
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
            <div className="pl-detail-view">
              <button className="pl-back" onClick={() => setSelectedId(null)}>
                <i className="fas fa-arrow-left"></i> {lang === 'fr' ? 'Retour' : 'Back'}
              </button>
              <h3 className="pl-detail-title">{selected?.name}</h3>

              {selected && selected.ayahs.length > 0 && (
                <button className="pl-play-all" onClick={() => handlePlay(selected)}>
                  <i className="fas fa-play"></i>
                  {lang === 'fr' ? 'Écouter tout en boucle' : 'Play all in loop'}
                </button>
              )}

              {(!selected || selected.ayahs.length === 0) ? (
                <p className="wird-empty">
                  {lang === 'fr'
                    ? 'Aucun verset dans cette playlist. Ajoutez des versets depuis le menu d\'actions d\'un verset.'
                    : 'No verses in this playlist. Add verses from the ayah actions menu.'}
                </p>
              ) : (
                <div className="pl-ayahs">
                  {selected.ayahs.map((a, i) => {
                    const surah = getSurah(a.surah);
                    return (
                      <div key={i} className="pl-ayah">
                        <div className="pl-ayah-info">
                          <span className="pl-ayah-ref">{surah?.ar || `S.${a.surah}`} : {a.ayah}</span>
                          {a.text && <span className="pl-ayah-text" dir="rtl">{a.text.slice(0, 60)}…</span>}
                        </div>
                        <button
                          className="icon-btn"
                          onClick={() => handleRemoveAyah(selected.id, a.surah, a.ayah)}
                          title={lang === 'fr' ? 'Retirer' : 'Remove'}
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal-playlist { max-width: 520px; }
        .pl-body {
          padding: 1rem;
          overflow-y: auto;
          max-height: 60vh;
        }
        .pl-create {
          display: flex;
          gap: 0.4rem;
          margin-bottom: 0.8rem;
        }
        .pl-input {
          flex: 1;
          padding: 0.5rem 0.8rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--bg);
          color: var(--text);
          font-family: 'Cairo', sans-serif;
          font-size: 0.85rem;
          outline: none;
        }
        .pl-input:focus { border-color: var(--primary); }
        .pl-create-btn {
          padding: 0.5rem 0.8rem;
          border-radius: var(--radius);
          font-size: 0.85rem;
        }
        .pl-items {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .pl-item {
          display: flex;
          align-items: center;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          transition: all 0.15s;
          overflow: hidden;
        }
        .pl-item:hover {
          border-color: var(--primary);
          background: var(--primary-light);
        }
        .pl-item-main {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 0.6rem;
          border: none;
          background: none;
          color: var(--text);
          cursor: pointer;
          text-align: start;
        }
        .pl-item-icon {
          color: var(--primary);
          font-size: 0.9rem;
          flex-shrink: 0;
        }
        .pl-item-info {
          display: flex;
          flex-direction: column;
        }
        .pl-item-name {
          font-family: 'Cairo', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text);
        }
        .pl-item-count {
          font-family: 'Cairo', sans-serif;
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .pl-item-actions {
          display: flex;
          gap: 0.15rem;
          padding-inline-end: 0.3rem;
        }
        .pl-edit-input {
          padding: 0.2rem 0.4rem;
          border: 1px solid var(--primary);
          border-radius: 4px;
          background: var(--bg);
          color: var(--text);
          font-family: 'Cairo', sans-serif;
          font-size: 0.82rem;
          outline: none;
          width: 120px;
        }
        .pl-play-btn i { color: var(--primary); }
        .pl-back {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.5rem;
          border: none;
          background: none;
          color: var(--primary);
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          font-size: 0.8rem;
          margin-bottom: 0.5rem;
          transition: all 0.15s;
        }
        .pl-back:hover { opacity: 0.7; }
        .pl-detail-title {
          font-family: 'Cairo', sans-serif;
          font-size: 1rem;
          color: var(--text);
          margin-bottom: 0.5rem;
        }
        .pl-play-all {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: 100%;
          padding: 0.55rem;
          border: none;
          border-radius: var(--radius);
          background: var(--primary);
          color: white;
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          font-size: 0.85rem;
          margin-bottom: 0.7rem;
          transition: all 0.2s;
        }
        .pl-play-all:hover { background: var(--primary-dark); transform: scale(1.02); }
        .pl-ayahs {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .pl-ayah {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.45rem 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }
        .pl-ayah-info {
          display: flex;
          flex-direction: column;
        }
        .pl-ayah-ref {
          font-family: 'Amiri', serif;
          font-size: 0.88rem;
          color: var(--primary);
        }
        .pl-ayah-text {
          font-family: 'Amiri', serif;
          font-size: 0.8rem;
          color: var(--text-muted);
          max-width: 280px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}

/* ── Utility: compute approximate global ayah number ── */
// Surah start positions (cumulative ayah counts minus 1)
const SURAH_AYAH_STARTS = [
  0,1,8,35,91,121,166,207,283,296,310,334,343,396,451,462,473,
  483,494,522,530,544,572,597,612,627,636,662,683,704,729,750,
  773,796,819,852,883,915,954,987,1013,1047,1075,1108,1128,1160,
  1190,1204,1234,1252,1270,1303,1320,1362,1389,1412,1473,1510,
  1553,1575,1596,1610,1621,1633,1645,1658,1670,1699,1721,1750,
  1764,1793,1821,1841,1862,1898,1931,1981,2027,2073,2082,2110,
  2136,2155,2174,2187,2197,2213,2239,2265,2284,2298,2313,2333,
  2348,2353,2358,2363,2376,2384,2392,2400,2407,2413,2418,2424,
  2429,2433,2437,2440,2444,2449,2455,2461
];

function computeGlobalAyahNumber(surah, ayah) {
  if (surah < 1 || surah > 114) return ayah;
  return (SURAH_AYAH_STARTS[surah - 1] || 0) + ayah;
}
