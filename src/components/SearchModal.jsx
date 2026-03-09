import React, { useState, useCallback, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { search, searchTranslation } from '../services/quranAPI';
import { getSurah, toAr } from '../data/surahs';
import { latinToArabic } from '../data/transliteration';

// Web Speech API detection
const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;

export default function SearchModal() {
  const { state, dispatch, set } = useApp();
  const { lang, riwaya } = state;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  // searchMode: 'arabic' | 'phonetic' | 'fr' | 'en'
  const [searchMode, setSearchMode] = useState('arabic');

  const startVoiceSearch = useCallback(() => {
    if (!SpeechRecognition) {
      setError(lang === 'fr' ? 'Recherche vocale non supportée sur ce navigateur.' : 'Voice search not supported.');
      return;
    }
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const rec = new SpeechRecognition();
    recognitionRef.current = rec;
    rec.lang = searchMode === 'ar' || searchMode === 'arabic' || searchMode === 'phonetic' ? 'ar-SA' : (lang === 'fr' ? 'fr-FR' : 'en-US');
    rec.continuous = false;
    rec.interimResults = false;
    rec.onstart  = () => setListening(true);
    rec.onend    = () => setListening(false);
    rec.onerror  = () => setListening(false);
    rec.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript || '';
      setQuery(transcript);
      setListening(false);
      // Auto-search after capture
      setTimeout(() => {
        const sanitized = transcript.trim().slice(0, 200);
        if (sanitized.length >= 2) setQuery(sanitized);
      }, 100);
    };
    rec.start();
  }, [listening, searchMode, lang]);

  const handleSearch = useCallback(async () => {
    // Sanitisation: limite longueur, supprime caractères dangereux
    const sanitized = query.trim().slice(0, 200).replace(/[<>"'&]/g, '');
    if (!sanitized || sanitized.length < 2) return;
    setLoading(true);
    setError(null);
    try {
      let data;
      if (searchMode === 'fr' || searchMode === 'en') {
        data = await searchTranslation(sanitized, searchMode);
      } else {
        let searchQuery = sanitized;
        if (searchMode === 'phonetic') {
          searchQuery = latinToArabic(sanitized);
          if (!searchQuery || searchQuery === sanitized) searchQuery = sanitized;
        }
        data = await search(searchQuery, riwaya);
      }
      setResults(data.matches || []);
    } catch (err) {
      setError(err.message);
      setResults([]);
    }
    setLoading(false);
  }, [query, riwaya, searchMode]);

  const goToAyah = (surah, ayah) => {
    set({ displayMode: 'surah', showHome: false, showDuas: false });
    dispatch({ type: 'NAVIGATE_SURAH', payload: { surah, ayah } });
    dispatch({ type: 'TOGGLE_SEARCH' });
  };

  const close = () => dispatch({ type: 'TOGGLE_SEARCH' });
  const searchModeLabels = {
    arabic: lang === 'fr' ? 'Arabe' : lang === 'ar' ? 'عربي' : 'Arabic',
    phonetic: lang === 'fr' ? 'Phonétique' : lang === 'ar' ? 'صوتي' : 'Phonetic',
    fr: 'Traduction FR',
    en: 'Translation EN',
  };
  const searchModeLabel = searchModeLabels[searchMode] || searchModeLabels.arabic;

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal modal-panel--wide modal-search-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-stack">
            <div className="modal-kicker">{lang === 'fr' ? 'Exploration' : lang === 'ar' ? 'استكشاف' : 'Explore'}</div>
            <h2 className="modal-title">{t('search.title', lang)}</h2>
            <div className="modal-subtitle">
              {lang === 'fr'
                ? 'Recherche par texte arabe ou saisie phonétique.'
                : lang === 'ar'
                  ? 'ابحث بالنص العربي أو بالكتابة الصوتية.'
                  : 'Search by Arabic text or phonetic typing.'}
            </div>
          </div>
          <button className="modal-close" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="modal-toolbar">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder={searchMode === 'phonetic'
              ? (lang === 'fr' ? 'Ex: bismillah, rahman, fatiha…' : 'Ex: bismillah, rahman, fatiha…')
              : t('search.placeholder', lang)}
            className="modal-search-input"
            autoFocus
          />
          {SpeechRecognition && (
            <button
              className={`modal-action-btn modal-voice-btn${listening ? ' listening' : ''}`}
              onClick={startVoiceSearch}
              title={listening
                ? (lang === 'fr' ? 'Arrêter l\'écoute' : 'Stop listening')
                : (lang === 'fr' ? 'Recherche vocale' : 'Voice search')}
              aria-label={listening ? 'Stop' : 'Voice'}
            >
              <i className={`fas ${listening ? 'fa-stop' : 'fa-microphone'}`}></i>
            </button>
          )}
          <button className="modal-action-btn" onClick={handleSearch} disabled={loading}>
            {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-search"></i>}
          </button>
        </div>

        <div className="modal-segmented" role="tablist" aria-label={lang === 'fr' ? 'Mode de recherche' : lang === 'ar' ? 'وضع البحث' : 'Search mode'}>
          <button className={`modal-segmented-btn ${searchMode === 'arabic' ? 'active' : ''}`} onClick={() => setSearchMode('arabic')}>
            <i className="fas fa-font"></i> {lang === 'fr' ? 'Arabe' : lang === 'ar' ? 'عربي' : 'Arabic'}
          </button>
          <button className={`modal-segmented-btn ${searchMode === 'phonetic' ? 'active' : ''}`} onClick={() => setSearchMode('phonetic')}>
            <i className="fas fa-keyboard"></i> {lang === 'fr' ? 'Phonétique' : lang === 'ar' ? 'صوتي' : 'Phonetic'}
          </button>
          <button className={`modal-segmented-btn ${searchMode === 'fr' ? 'active' : ''}`} onClick={() => setSearchMode('fr')}>
            <i className="fas fa-language"></i> FR
          </button>
          <button className={`modal-segmented-btn ${searchMode === 'en' ? 'active' : ''}`} onClick={() => setSearchMode('en')}>
            <i className="fas fa-language"></i> EN
          </button>
        </div>

        <div className="search-summary-bar">
          <span className="search-summary-pill">
            <i className="fas fa-wave-square"></i>
            {searchModeLabel}
          </span>
          <span className="search-summary-pill">
            <i className="fas fa-layer-group"></i>
            {query
              ? (lang === 'fr'
                ? `${results.length} résultat${results.length > 1 ? 's' : ''}`
                : lang === 'ar'
                  ? `${results.length} نتيجة`
                  : `${results.length} result${results.length > 1 ? 's' : ''}`)
              : (lang === 'fr' ? 'Recherche contextuelle' : lang === 'ar' ? 'بحث سياقي' : 'Context search')}
          </span>
        </div>

        {error && <p className="modal-error">{error}</p>}

        <div className="modal-results modal-search-results">
          {!query && !loading && (
            <div className="search-spotlight">
              <div className="search-spotlight-icon">
                <i className="fas fa-compass"></i>
              </div>
              <div className="search-spotlight-body">
                <h3>
                  {lang === 'fr' ? 'Rechercher dans le texte coranique' : lang === 'ar' ? 'ابحث داخل النص القرآني' : 'Search inside the Quran text'}
                </h3>
                <p>
                  {lang === 'fr'
                    ? 'Saisissez un mot arabe ou activez le mode phonétique pour retrouver rapidement un verset.'
                    : lang === 'ar'
                      ? 'اكتب كلمة عربية أو فعّل البحث الصوتي للوصول بسرعة إلى الآية.'
                      : 'Type an Arabic word or enable phonetic mode to reach a verse quickly.'}
                </p>
              </div>
            </div>
          )}

          {results.length === 0 && !loading && query && (
            <div className="modal-empty">
              <i className="fas fa-search"></i>
              <div>{t('search.noResults', lang)}</div>
            </div>
          )}
          {results.map((r, i) => {
            const s = getSurah(r.surah.number);
            const surahName = lang === 'ar' ? s?.ar : lang === 'fr' ? (s?.fr || s?.en) : s?.en;
            return (
              <button key={i} className="modal-item-card search-result-card" onClick={() => goToAyah(r.surah.number, r.numberInSurah)}>
                <div className="modal-item-main">
                  <div className="search-result-head">
                    <div className="modal-item-meta">
                      {s?.ar} · {lang === 'ar' ? toAr(r.numberInSurah) : r.numberInSurah}
                    </div>
                    <div className="search-result-surah">{surahName}</div>
                  </div>
                  {(searchMode === 'fr' || searchMode === 'en') ? (
                    <div className="search-result-translation">{r.text}</div>
                  ) : (
                    <div className="modal-item-ar" dir="rtl">{r.text}</div>
                  )}
                  <div className="search-result-action">
                    <i className="fas fa-arrow-up-right-from-square"></i>
                    <span>
                      {lang === 'fr' ? 'Ouvrir dans la lecture' : lang === 'ar' ? 'فتح في القراءة' : 'Open in reading'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
