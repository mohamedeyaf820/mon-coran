import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { getAllBookmarks, removeBookmark } from '../services/storageService';
import { getSurah, toAr } from '../data/surahs';

export default function BookmarksModal() {
  const { state, dispatch, set } = useApp();
  const { lang } = state;

  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    getAllBookmarks().then(bms => {
      setBookmarks(bms.sort((a, b) => b.createdAt - a.createdAt));
    });
  }, []);

  const goTo = (surah, ayah) => {
    set({ displayMode: 'surah', showHome: false });
    dispatch({ type: 'NAVIGATE_SURAH', payload: { surah, ayah } });
    dispatch({ type: 'TOGGLE_BOOKMARKS' });
  };

  const handleRemove = async (surah, ayah) => {
    await removeBookmark(surah, ayah);
    setBookmarks(prev => prev.filter(b => b.id !== `${surah}:${ayah}`));
  };

  const close = () => dispatch({ type: 'TOGGLE_BOOKMARKS' });

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <i className="fas fa-bookmark" style={{ color: 'var(--gold)' }}></i>{' '}
            {t('bookmarks.title', lang)}
          </h2>
          <button className="icon-btn" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="bookmarks-body">
          {bookmarks.length === 0 ? (
            <p className="bookmarks-empty">
              <i className="fas fa-bookmark" style={{ fontSize: '2rem', opacity: 0.2 }}></i>
              <br />
              {t('bookmarks.empty', lang)}
            </p>
          ) : (
            bookmarks.map(bm => {
              const s = getSurah(bm.surah);
              return (
                <div key={bm.id} className="bookmark-item">
                  <button className="bookmark-info" onClick={() => goTo(bm.surah, bm.ayah)}>
                    <span className="bookmark-surah">{s?.ar}</span>
                    <span className="bookmark-ref">
                      {t('quran.ayah', lang)} {lang === 'ar' ? toAr(bm.ayah) : bm.ayah}
                    </span>
                  </button>
                  <button
                    className="icon-btn bookmark-delete"
                    onClick={() => handleRemove(bm.surah, bm.ayah)}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>

      <style>{`
        .bookmarks-body {
          padding: 0.7rem;
          overflow-y: auto;
          max-height: 65vh;
        }
        .bookmarks-empty {
          text-align: center;
          color: var(--text-muted);
          padding: 3rem 1rem;
          font-family: 'Cairo', sans-serif;
        }
        .bookmark-item {
          display: flex;
          align-items: center;
          padding: 0.52rem;
          margin-bottom: 0.35rem;
          border: 1px solid var(--border);
          background: var(--bg);
          border-radius: var(--radius);
          transition: all 0.15s;
        }
        .bookmark-item:hover {
          background: var(--primary-light);
          border-color: var(--primary);
        }
        .bookmark-info {
          flex: 1;
          border: none;
          background: transparent;
          text-align: start;
          cursor: pointer;
          padding: 0.3rem;
          color: var(--text);
        }
        .bookmark-surah {
          font-family: 'Amiri', serif;
          font-size: 1rem;
          display: block;
        }
        .bookmark-ref {
          font-family: 'Cairo', sans-serif;
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .bookmark-delete {
          color: var(--text-muted);
          width: 32px;
          height: 32px;
          font-size: 0.75rem;
        }
        .bookmark-delete:hover { color: var(--primary); }
      `}</style>
    </div>
  );
}
