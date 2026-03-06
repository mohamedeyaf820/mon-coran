import React, { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { search } from '../services/quranAPI';
import { getSurah, toAr } from '../data/surahs';
import { latinToArabic } from '../data/transliteration';

export default function SearchModal() {
  const { state, dispatch, set } = useApp();
  const { lang, riwaya } = state;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [phoneticMode, setPhoneticMode] = useState(false);

  const handleSearch = useCallback(async () => {
    // Sanitisation: limite longueur, supprime caractères dangereux
    const sanitized = query.trim().slice(0, 200).replace(/[<>"'&]/g, '');
    if (!sanitized || sanitized.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      let searchQuery = sanitized;
      // Mode phonétique: convertir Latin → Arabe
      if (phoneticMode) {
        searchQuery = latinToArabic(sanitized);
        if (!searchQuery || searchQuery === sanitized) {
          // Fallback: try direct search
          searchQuery = sanitized;
        }
      }
      const data = await search(searchQuery, riwaya);
      setResults(data.matches || []);
    } catch (err) {
      setError(err.message);
      setResults([]);
    }
    setLoading(false);
  }, [query, riwaya, phoneticMode]);

  const goToAyah = (surah, ayah) => {
    set({ displayMode: 'surah', showHome: false, showDuas: false });
    dispatch({ type: 'NAVIGATE_SURAH', payload: { surah, ayah } });
    dispatch({ type: 'TOGGLE_SEARCH' });
  };

  const close = () => dispatch({ type: 'TOGGLE_SEARCH' });

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal modal-search" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('search.title', lang)}</h2>
          <button className="icon-btn" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="search-bar">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={phoneticMode
              ? (lang === 'fr' ? 'Ex: bismillah, rahman, fatiha…' : 'Ex: bismillah, rahman, fatiha…')
              : t('search.placeholder', lang)}
            className="search-input"
            autoFocus
          />
          <button className="btn btn-primary" onClick={handleSearch} disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
          </button>
        </div>

        {/* Phonetic mode toggle */}
        <div className="search-mode-toggle">
          <button
            className={`search-mode-btn ${!phoneticMode ? 'active' : ''}`}
            onClick={() => setPhoneticMode(false)}
          >
            <i className="fas fa-font"></i> {lang === 'fr' ? 'Arabe' : 'Arabic'}
          </button>
          <button
            className={`search-mode-btn ${phoneticMode ? 'active' : ''}`}
            onClick={() => setPhoneticMode(true)}
          >
            <i className="fas fa-keyboard"></i> {lang === 'fr' ? 'Phonétique' : 'Phonetic'}
          </button>
        </div>

        {error && <p className="search-error">{error}</p>}

        <div className="search-results">
          {results.length === 0 && !loading && query && (
            <p className="search-empty">{t('search.noResults', lang)}</p>
          )}
          {results.map((r, i) => {
            const s = getSurah(r.surah.number);
            return (
              <button key={i} className="search-result" onClick={() => goToAyah(r.surah.number, r.numberInSurah)}>
                <div className="search-result-ref">
                  {s?.ar} {lang === 'ar' ? toAr(r.numberInSurah) : r.numberInSurah}
                </div>
                <div className="search-result-text" dir="rtl">{r.text}</div>
              </button>
            );
          })}
        </div>
      </div>

      <style>{`
        .modal-search { max-width: 680px; }
        .modal-search .search-bar {
          display: flex;
          gap: 0.5rem;
          padding: 0.9rem 1.2rem;
          border-bottom: 1px solid var(--border);
          background: var(--surface);
          position: sticky;
          top: 0;
          z-index: 1;
        }
        .search-input {
          flex: 1;
          padding: 0.6rem 1rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--bg);
          color: var(--text);
          font-family: 'Amiri', serif;
          font-size: 1rem;
          outline: none;
        }
        .search-input:focus { border-color: var(--primary); }
        .search-results {
          flex: 1;
          overflow-y: auto;
          padding: 0.65rem;
        }
        .search-result {
          display: block;
          width: 100%;
          padding: 0.74rem 0.76rem;
          margin-bottom: 0.4rem;
          border: 1px solid var(--border);
          background: var(--bg);
          text-align: start;
          cursor: pointer;
          border-radius: var(--radius);
          transition: all 0.15s;
        }
        .search-result:hover {
          background: var(--primary-light);
          border-color: var(--primary);
        }
        .search-result-ref {
          font-family: 'Amiri', serif;
          font-size: 0.85rem;
          color: var(--primary);
          margin-bottom: 0.15rem;
        }
        .search-result-text {
          font-family: 'Amiri', serif;
          font-size: 1rem;
          color: var(--text);
          line-height: 1.8;
        }
        .search-empty, .search-error {
          text-align: center;
          color: var(--text-muted);
          padding: 2rem;
          font-family: 'Cairo', sans-serif;
        }
        .search-error { color: var(--gold); }
        .search-mode-toggle {
          display: flex;
          padding: 0 1.2rem 0.5rem;
          gap: 0.3rem;
        }
        .search-mode-btn {
          flex: 1;
          padding: 0.35rem 0.5rem;
          border: 1px solid var(--border);
          border-radius: var(--radius);
          background: var(--bg);
          color: var(--text-muted);
          cursor: pointer;
          font-family: 'Cairo', sans-serif;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          transition: all 0.2s;
        }
        .search-mode-btn:hover { background: var(--primary-light); color: var(--text); }
        .search-mode-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
}
