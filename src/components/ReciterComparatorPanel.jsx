/**
 * ReciterComparatorPanel — écouter le même verset par plusieurs récitateurs côte à côte.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import SURAHS from '../data/surahs';

// Build audio URL compatible with both cdn types
function buildUrl(reciter, surah, ayah) {
  const { cdn, cdnType } = reciter;
  if (cdnType === 'everyayah') {
    const s = String(surah).padStart(3, '0');
    const a = String(ayah).padStart(3, '0');
    return `https://everyayah.com/data/${cdn}/${s}${a}.mp3`;
  }
  // islamic.network — needs globalAyahNumber
  let global = 0;
  for (let i = 0; i < surah - 1; i++) global += SURAHS[i].ayahs;
  global += ayah;
  return `https://cdn.islamic.network/quran/audio/128/${cdn}/${global}.mp3`;
}

// Compact reciter list for the picker (Hafs reciters, most popular)
const COMPARE_RECITERS = [
  { id: 'ar.alafasy',              name: 'العفاسي',       nameEn: 'Alafasy',        cdn: 'ar.alafasy',              cdnType: 'islamic' },
  { id: 'ar.abdulbasitmurattal',   name: 'عبدالباسط (مر)', nameEn: 'Abdul Basit (M)', cdn: 'ar.abdulbasitmurattal',   cdnType: 'islamic' },
  { id: 'ar.abdulbasitmujawwad',   name: 'عبدالباسط (مج)', nameEn: 'Abdul Basit (J)', cdn: 'ar.abdulbasitmujawwad',   cdnType: 'islamic' },
  { id: 'ar.husary',               name: 'الحصري',         nameEn: 'Al-Husary',      cdn: 'ar.husary',               cdnType: 'islamic' },
  { id: 'ar.minshawi',             name: 'المنشاوي',       nameEn: 'Al-Minshawi',    cdn: 'ar.minshawi',             cdnType: 'islamic' },
  { id: 'ar.abdurrahmaansudais',   name: 'السديس',         nameEn: 'As-Sudais',      cdn: 'ar.abdurrahmaansudais',   cdnType: 'islamic' },
  { id: 'ar.saoodshuraym',         name: 'الشريم',         nameEn: 'Ash-Shuraym',    cdn: 'ar.saoodshuraym',         cdnType: 'islamic' },
  { id: 'ar.maaboralmeem',         name: 'الغامدي',        nameEn: 'Al-Ghamdi',      cdn: 'Saad_Al-Ghamdi_128kbps',  cdnType: 'everyayah' },
];

function ReciterTrack({ reciter, surah, ayah, lang }) {
  const audioRef = useRef(null);
  const [state, setState] = useState('idle'); // idle | loading | playing | paused | error
  const [progress, setProgress] = useState(0);

  const url = buildUrl(reciter, surah, ayah);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onWaiting  = () => setState('loading');
    const onCanPlay  = () => { if (state === 'loading') setState('paused'); };
    const onPlay     = () => setState('playing');
    const onPause    = () => setState('paused');
    const onEnded    = () => { setState('idle'); setProgress(0); };
    const onError    = () => setState('error');
    const onTimeUpdate = () => {
      if (audio.duration > 0) setProgress(audio.currentTime / audio.duration);
    };
    audio.addEventListener('waiting',    onWaiting);
    audio.addEventListener('canplay',    onCanPlay);
    audio.addEventListener('play',       onPlay);
    audio.addEventListener('pause',      onPause);
    audio.addEventListener('ended',      onEnded);
    audio.addEventListener('error',      onError);
    audio.addEventListener('timeupdate', onTimeUpdate);
    return () => {
      audio.removeEventListener('waiting',    onWaiting);
      audio.removeEventListener('canplay',    onCanPlay);
      audio.removeEventListener('play',       onPlay);
      audio.removeEventListener('pause',      onPause);
      audio.removeEventListener('ended',      onEnded);
      audio.removeEventListener('error',      onError);
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [url]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.src = url;
      audio.play().catch(() => setState('error'));
    } else {
      audio.pause();
    }
  }, [url]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.src = url;
    audio.play().catch(() => setState('error'));
  }, [url]);

  const iconClass = state === 'playing' ? 'fa-pause' : state === 'loading' ? 'fa-spinner fa-spin' : 'fa-play';

  return (
    <div className={`rc-track ${state}`}>
      <audio ref={audioRef} preload="none" />
      <div className="rc-track__name" dir="rtl">{reciter.name}</div>
      <div className="rc-track__name-en">{reciter.nameEn}</div>
      <div className="rc-track__controls">
        <button className="rc-btn rc-btn--play" onClick={toggle} title={state === 'playing' ? 'Pause' : 'Play'}>
          <i className={`fas ${iconClass}`}></i>
        </button>
        <button className="rc-btn rc-btn--restart" onClick={restart} title="Relire depuis le début">
          <i className="fas fa-rotate-left"></i>
        </button>
      </div>
      <div className="rc-progress">
        <div className="rc-progress__fill" style={{ width: `${progress * 100}%` }}></div>
      </div>
      {state === 'error' && (
        <div className="rc-error">
          <i className="fas fa-exclamation-triangle"></i>
          {lang === 'fr' ? 'Audio indisponible' : 'Audio unavailable'}
        </div>
      )}
    </div>
  );
}

export default function ReciterComparatorPanel() {
  const { state, dispatch } = useApp();
  const { lang, currentSurah, currentAyah } = state;

  // Selected reciters (up to 4, default first 3)
  const [selected, setSelected] = useState(['ar.alafasy', 'ar.abdulbasitmurattal', 'ar.husary']);
  const [surah, setSurah] = useState(currentSurah);
  const [ayah, setAyah] = useState(currentAyah);

  const surahData = SURAHS[surah - 1];
  const maxAyah = surahData?.ayahs || 7;

  const close = () => dispatch({ type: 'SET', payload: { comparatorOpen: false } });

  const toggleReciter = (id) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= 4) return prev; // max 4
      return [...prev, id];
    });
  };

  const selectedReciters = COMPARE_RECITERS.filter(r => selected.includes(r.id));

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal modal-panel--wide rc-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-stack">
            <div className="modal-kicker">
              {lang === 'fr' ? 'Écoute comparative' : 'Comparative Listening'}
            </div>
            <h2 className="modal-title">
              {lang === 'fr' ? 'Comparateur de récitateurs' : 'Reciter Comparator'}
            </h2>
            <div className="modal-subtitle">
              {lang === 'fr'
                ? 'Écoutez le même verset par plusieurs récitateurs côte à côte.'
                : 'Listen to the same verse by multiple reciters side by side.'}
            </div>
          </div>
          <button className="modal-close" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Ayah selector */}
        <div className="rc-ayah-selector">
          <label className="rc-selector-label">
            {lang === 'fr' ? 'Sourate' : 'Surah'}
          </label>
          <select
            className="rc-select"
            value={surah}
            onChange={e => { setSurah(Number(e.target.value)); setAyah(1); }}
          >
            {SURAHS.map((s, i) => (
              <option key={i + 1} value={i + 1}>{i + 1}. {s.ar} — {lang === 'fr' ? (s.fr || s.en) : s.en}</option>
            ))}
          </select>
          <label className="rc-selector-label">
            {lang === 'fr' ? 'Verset' : 'Verse'}
          </label>
          <div className="rc-ayah-stepper">
            <button className="rc-step-btn" onClick={() => setAyah(a => Math.max(1, a - 1))} disabled={ayah <= 1}>
              <i className="fas fa-minus"></i>
            </button>
            <span className="rc-ayah-num">{ayah}</span>
            <button className="rc-step-btn" onClick={() => setAyah(a => Math.min(maxAyah, a + 1))} disabled={ayah >= maxAyah}>
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </div>

        {/* Reciter picker */}
        <div className="rc-picker">
          <div className="rc-picker__label">
            {lang === 'fr'
              ? `Récitateurs sélectionnés (max 4) · ${selected.length}/4`
              : `Selected reciters (max 4) · ${selected.length}/4`}
          </div>
          <div className="rc-picker__grid">
            {COMPARE_RECITERS.map(r => (
              <button
                key={r.id}
                className={`rc-pick-btn ${selected.includes(r.id) ? 'active' : ''} ${selected.length >= 4 && !selected.includes(r.id) ? 'disabled' : ''}`}
                onClick={() => toggleReciter(r.id)}
              >
                <span dir="rtl">{r.name}</span>
                {selected.includes(r.id) && <i className="fas fa-check rc-pick-check"></i>}
              </button>
            ))}
          </div>
        </div>

        {/* Tracks */}
        <div className="rc-tracks">
          {selectedReciters.map(r => (
            <ReciterTrack key={`${r.id}-${surah}-${ayah}`} reciter={r} surah={surah} ayah={ayah} lang={lang} />
          ))}
          {selectedReciters.length === 0 && (
            <div className="modal-empty">
              <i className="fas fa-user-music"></i>
              <div>{lang === 'fr' ? 'Sélectionnez au moins un récitateur.' : 'Select at least one reciter.'}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
