import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import audioService from '../services/audioService';
import { ensureReciterForRiwaya, getRecitersByRiwaya } from '../data/reciters';
import '../styles/audio-player.css';

export default function AudioPlayer() {
  const { state, set } = useApp();
  const {
    lang, reciter, isPlaying, currentPlayingAyah,
    riwaya, audioSpeed, memMode, memRepeatCount, memPause, warshStrictMode,
    volume: savedVolume,
  } = state;

  const [progress, setProgress] = useState(0);
  const [currentTime, setCurTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  // Volume initialisé depuis le state sauvegardé (persisté)
  const [volume, setVolume] = useState(savedVolume ?? 1);

  const progressRef = useRef(null);

  /* ── Wire callbacks ────────────────────────── */
  useEffect(() => {
    audioService.onPlay = (item) => {
      set({
        isPlaying: true,
        currentPlayingAyah: item ? { surah: item.surah, ayah: item.ayah, globalNumber: item.globalNumber } : null,
      });
    };
    audioService.onPause = () => set({ isPlaying: false });
    audioService.onEnd = () => set({ isPlaying: false, currentPlayingAyah: null });
    audioService.onAyahChange = (item) => {
      set({ currentPlayingAyah: { surah: item.surah, ayah: item.ayah, globalNumber: item.globalNumber } });
    };
    audioService.onTimeUpdate = (ct, dur) => {
      setCurTime(ct);
      setDuration(dur);
      setProgress(dur ? ct / dur : 0);
    };
    audioService.onError = () => set({ isPlaying: false });

    return () => {
      audioService.onPlay = null;
      audioService.onPause = null;
      audioService.onEnd = null;
      audioService.onAyahChange = null;
      audioService.onTimeUpdate = null;
      audioService.onError = null;
    };
  }, [set]);

  /* ── Speed ─────────────────────────────────── */
  useEffect(() => {
    audioService.setSpeed(audioSpeed);
  }, [audioSpeed]);

  useEffect(() => {
    const safeReciter = ensureReciterForRiwaya(reciter, riwaya);
    if (safeReciter !== reciter) {
      set({ reciter: safeReciter });
    }
  }, [reciter, riwaya, set]);

  /* ── Memorization ──────────────────────────── */
  useEffect(() => {
    if (memMode) {
      audioService.enableMemorization(memRepeatCount, memPause * 1000);
    } else {
      audioService.disableMemorization();
    }
  }, [memMode, memRepeatCount, memPause]);

  /* ── Controls ──────────────────────────────── */
  const toggle = useCallback(() => audioService.toggle(), []);
  const stop = useCallback(() => audioService.stop(), []);
  const next = useCallback(() => audioService.next(), []);
  const prev = useCallback(() => audioService.prev(), []);

  const handleSeek = (e) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioService.seekPercent(pct);
  };

  const formatTime = (s) => {
    if (!s || isNaN(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (v) => {
    setVolume(v);
    audioService.setVolume(v);
    // Persister dans le contexte global
    set({ volume: v });
  };

  const currentReciters = getRecitersByRiwaya(riwaya);
  const isWarshMode = riwaya === 'warsh';
  const warshStrictLabel = lang === 'ar'
    ? 'ورش الصارم'
    : lang === 'fr'
      ? 'Warsh strict'
      : 'Warsh strict';
  const warshVerifiedLabel = lang === 'ar'
    ? 'صوت ورش مُتحقق'
    : lang === 'fr'
      ? 'Audio Warsh vérifié'
      : 'Warsh audio verified';
  const warshNonStrictLabel = lang === 'ar'
    ? 'وضع ورش عادي'
    : lang === 'fr'
      ? 'Warsh standard'
      : 'Warsh standard';

  const changeReciter = (id) => {
    set({ reciter: id });
  };

  const cycleSpeed = () => {
    const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const idx = speeds.indexOf(audioSpeed);
    const nextSpeed = speeds[(idx + 1) % speeds.length];
    set({ audioSpeed: nextSpeed });
  };

  const expandLabel = expanded
    ? (lang === 'ar' ? 'إغلاق التفاصيل' : lang === 'fr' ? 'Réduire le lecteur' : 'Collapse player')
    : (lang === 'ar' ? 'فتح التفاصيل' : lang === 'fr' ? 'Développer le lecteur' : 'Expand player');

  return (
    <div
      className={`audio-player ${expanded ? 'expanded' : ''}`}
      role="region"
      aria-label={lang === 'ar' ? 'مشغل الصوت' : lang === 'fr' ? 'Lecteur Audio' : 'Audio Player'}
    >
      {/* Mini bar */}
      <div className="player-main">
        {/* Progress bar */}
        <div
          className="player-progress"
          ref={progressRef}
          onClick={handleSeek}
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={lang === 'ar' ? 'تقدم الصوت' : lang === 'fr' ? 'Progression audio' : 'Audio progress'}
        >
          <div className="player-progress-fill" style={{ width: `${progress * 100}%` }}></div>
        </div>

        <div className="player-controls">
          {/* Left: info */}
          <div className="player-info" aria-live="polite" aria-atomic="true">
            {currentPlayingAyah ? (
              <span className="player-ayah-info">
                {t('quran.surah', lang)} {currentPlayingAyah.surah}:{currentPlayingAyah.ayah}
              </span>
            ) : (
              <span className="player-ayah-info">{t('audio.play', lang)}</span>
            )}
            {isWarshMode && (
              <div className="player-status-badges">
                <span className={`player-status-badge ${warshStrictMode ? 'verified' : 'muted'}`}>
                  {warshStrictMode ? warshStrictLabel : warshNonStrictLabel}
                </span>
                {warshStrictMode && (
                  <span className="player-status-badge verified">{warshVerifiedLabel}</span>
                )}
              </div>
            )}
            <span className="player-time">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Center: main buttons */}
          <div className="player-btns">
            <button className="player-btn" onClick={prev} title={t('audio.prev', lang)} aria-label={t('audio.prev', lang)}>
              <i className="fas fa-backward-step" aria-hidden="true"></i>
            </button>
            <button
              className="player-btn play-btn"
              onClick={toggle}
              title={isPlaying ? t('audio.pause', lang) : t('audio.play', lang)}
              aria-label={isPlaying ? t('audio.pause', lang) : t('audio.play', lang)}
              aria-pressed={isPlaying}
            >
              <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`} aria-hidden="true"></i>
            </button>
            <button className="player-btn" onClick={next} title={t('audio.next', lang)} aria-label={t('audio.next', lang)}>
              <i className="fas fa-forward-step" aria-hidden="true"></i>
            </button>
            <button className="player-btn" onClick={stop} title={t('audio.stop', lang)} aria-label={t('audio.stop', lang)}>
              <i className="fas fa-stop" aria-hidden="true"></i>
            </button>
          </div>

          {/* Right: extra controls */}
          <div className="player-extra">
            <div className="player-volume-group">
              <button
                className="player-btn-sm"
                onClick={() => { const v = volume > 0 ? 0 : 1; handleVolumeChange(v); }}
                title={t('audio.volume', lang)}
                aria-label={t('audio.volume', lang)}
              >
                <i className={`fas ${volume === 0 ? 'fa-volume-xmark' : volume < 0.5 ? 'fa-volume-low' : 'fa-volume-high'}`} aria-hidden="true"></i>
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                className="player-volume-slider"
                aria-label={`${lang === 'ar' ? 'الحجم' : lang === 'fr' ? 'Volume' : 'Volume'}: ${Math.round(volume * 100)}%`}
                title={`${Math.round(volume * 100)}%`}
              />
            </div>
            <button
              className="player-btn-sm"
              onClick={cycleSpeed}
              title={lang === 'ar' ? 'سرعة التشغيل' : lang === 'fr' ? 'Vitesse de lecture' : 'Playback speed'}
              aria-label={`${lang === 'ar' ? 'السرعة' : lang === 'fr' ? 'Vitesse' : 'Speed'}: ${audioSpeed}x`}
            >
              {audioSpeed}x
            </button>
            <button
              className={`player-btn-sm ${memMode ? 'active' : ''}`}
              onClick={() => set({ memMode: !memMode })}
              title={t('audio.memorization', lang)}
              aria-label={t('audio.memorization', lang)}
              aria-pressed={memMode}
            >
              <i className="fas fa-repeat" aria-hidden="true"></i>
            </button>
            <button
              className="player-btn-sm"
              onClick={() => setExpanded(!expanded)}
              title={expandLabel}
              aria-label={expandLabel}
              aria-expanded={expanded}
            >
              <i className={`fas fa-chevron-${expanded ? 'down' : 'up'}`} aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="player-expanded">
          {/* Reciter selection */}
          <div className="player-section">
            <label className="player-label">{t('audio.reciter', lang)}</label>
            <div className="reciter-grid">
              {currentReciters.map(r => (
                <button
                  key={r.id}
                  className={`reciter-card ${reciter === r.id ? 'active' : ''}`}
                  onClick={() => changeReciter(r.id)}
                  aria-pressed={reciter === r.id}
                >
                  <div className="reciter-name">
                    {lang === 'ar' ? r.name : lang === 'fr' ? r.nameFr : r.nameEn}
                  </div>
                  <div className="reciter-style">
                    {r.style === 'murattal' ? 'مرتل' : r.style === 'tartil' ? 'مجود' : r.style}
                  </div>
                  {reciter === r.id && (
                    <div className="reciter-active-indicator">
                      <i className="fas fa-check"></i>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Memorization settings */}
          {memMode && (
            <div className="player-section">
              <label className="player-label">{t('audio.memorization', lang)}</label>
              <div className="mem-controls">
                <div className="mem-field">
                  <span>{t('audio.repeat', lang)}</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={memRepeatCount}
                    onChange={e => set({ memRepeatCount: parseInt(e.target.value) || 3 })}
                    className="mem-input"
                    aria-label={t('audio.repeat', lang)}
                  />
                </div>
                <div className="mem-field">
                  <span>{t('audio.pause', lang)} (s)</span>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    value={memPause}
                    onChange={e => set({ memPause: parseInt(e.target.value) || 2 })}
                    className="mem-input"
                    aria-label={`${t('audio.pause', lang)} en secondes`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
