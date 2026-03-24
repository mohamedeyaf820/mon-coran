/**
 * ReciterComparatorPanel — écouter le même verset par plusieurs récitateurs côte à côte.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getReciter } from '../data/reciters';
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

// Compact reciter list for the picker (Hafs reciters, reliable endpoints only)
const COMPARE_RECITER_IDS = [
  'ar.alafasy',
  'ar.husary',
  'ar.minshawi',
  'ahmed_ajmy',
  'ali_jabir',
  'hudhaify',
  'yasser_dossari_hafs',
  'nasser_alqatami',
];

const COMPARE_RECITERS = COMPARE_RECITER_IDS
  .map((id) => getReciter(id, 'hafs'))
  .filter(Boolean);

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
    <div className={`rc-track ${state} rounded-2xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm`}>
      <audio ref={audioRef} preload="none" />
      <div className="rc-track__name" dir="rtl">{reciter.name}</div>
      <div className="rc-track__name-en">{reciter.nameEn}</div>
      <div className="rc-track__controls !mt-2 !flex !items-center !gap-2">
        <button className="rc-btn rc-btn--play !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/14 !bg-sky-500/20 hover:!bg-sky-500/30" onClick={toggle} title={state === 'playing' ? 'Pause' : 'Play'}>
          <i className={`fas ${iconClass}`}></i>
        </button>
        <button className="rc-btn rc-btn--restart !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/14 !bg-white/[0.05] hover:!bg-white/[0.12]" onClick={restart} title="Relire depuis le début">
          <i className="fas fa-rotate-left"></i>
        </button>
      </div>
      <div className="rc-progress !mt-2 !h-1.5 !overflow-hidden !rounded-full !bg-white/10">
        <div className="rc-progress__fill" style={{ width: `${progress * 100}%` }}></div>
      </div>
      {state === 'error' && (
        <div className="rc-error !mt-2 !inline-flex !items-center !gap-1.5 !rounded-lg !border !border-red-300/25 !bg-red-500/10 !px-2.5 !py-1.5 !text-xs !text-red-100">
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
  const [selected, setSelected] = useState(() =>
    COMPARE_RECITERS.slice(0, 3).map((reciter) => reciter.id),
  );
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
    <div className="modal-overlay !p-3 sm:!p-5" onClick={close}>
      <div
        className="modal modal-panel--wide rc-panel !w-full !max-w-5xl !overflow-hidden !rounded-3xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(10,18,35,0.98),rgba(8,15,30,0.96))] !shadow-[0_36px_90px_rgba(1,8,22,0.64)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="modal-header !border-b !border-white/10 !bg-[linear-gradient(135deg,rgba(35,62,110,0.34),rgba(18,29,58,0.2))]">
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
          <button className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/12 !bg-white/[0.04] hover:!bg-white/[0.1]" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Ayah selector */}
        <div className="rc-ayah-selector !grid !grid-cols-1 !gap-2 !p-3 sm:!grid-cols-[auto,1fr,auto,auto] sm:!items-center sm:!p-4">
          <label className="rc-selector-label">
            {lang === 'fr' ? 'Sourate' : 'Surah'}
          </label>
          <select
            className="rc-select !min-h-11 !rounded-xl !border !border-white/15 !bg-white/[0.05] !px-3"
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
          <div className="rc-ayah-stepper !inline-flex !items-center !gap-2">
            <button className="rc-step-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/14 !bg-white/[0.05] hover:!bg-white/[0.12]" onClick={() => setAyah(a => Math.max(1, a - 1))} disabled={ayah <= 1}>
              <i className="fas fa-minus"></i>
            </button>
            <span className="rc-ayah-num !min-w-10 !text-center !font-semibold">{ayah}</span>
            <button className="rc-step-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/14 !bg-white/[0.05] hover:!bg-white/[0.12]" onClick={() => setAyah(a => Math.min(maxAyah, a + 1))} disabled={ayah >= maxAyah}>
              <i className="fas fa-plus"></i>
            </button>
          </div>
        </div>

        {/* Reciter picker */}
        <div className="rc-picker !space-y-2 !px-3 !pb-3 sm:!px-4">
          <div className="rc-picker__label">
            {lang === 'fr'
              ? `Récitateurs sélectionnés (max 4) · ${selected.length}/4`
              : `Selected reciters (max 4) · ${selected.length}/4`}
          </div>
          <div className="rc-picker__grid !grid !grid-cols-2 !gap-2 md:!grid-cols-4">
            {COMPARE_RECITERS.map(r => (
              <button
                key={r.id}
                className={`rc-pick-btn !inline-flex !items-center !justify-between !rounded-xl !border !px-3 !py-2 !text-sm !transition-all hover:!border-sky-200/40 hover:!bg-white/[0.08] ${selected.includes(r.id) ? '!border-sky-200/40 !bg-sky-500/20 !text-white active' : '!border-white/14 !bg-white/[0.04]'} ${selected.length >= 4 && !selected.includes(r.id) ? 'disabled !opacity-40' : ''}`}
                onClick={() => toggleReciter(r.id)}
              >
                <span dir="rtl">{r.name}</span>
                {selected.includes(r.id) && <i className="fas fa-check rc-pick-check"></i>}
              </button>
            ))}
          </div>
        </div>

        {/* Tracks */}
        <div className="rc-tracks !grid !grid-cols-1 !gap-2 !px-3 !pb-4 sm:!px-4 md:!grid-cols-2">
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
