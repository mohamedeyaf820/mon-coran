/**
 * MiniPlayer — fixed bottom bar visible on every page during active playback.
 *
 * Responsibilities:
 *  - Displays current surah / ayah and reciter.
 *  - Provides play/pause, prev, next controls (delegates to audioService).
 *  - Shows a thin progress bar at the top edge.
 *  - Registers MediaSession API so lock-screen / headset controls work.
 *  - Calls useAutoScrollAyah to keep the active verse in view.
 *
 * Only visible when isPlaying || currentPlayingAyah is set.
 * Does NOT replace AudioPlayer — both coexist. AudioPlayer handles the full
 * desktop card / mobile dock; MiniPlayer is the global persistent bar.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Pause, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { t } from '../i18n';
import { getSurah, surahName } from '../data/surahs';
import { reciterName } from '../data/reciters';
import audioService from '../services/audioService';
import { useAppSelector, shallowEqual } from '../context/AppContext';
import { useMediaSession } from '../hooks/useMediaSession';
import { useAutoScrollAyah } from '../hooks/useAutoScrollAyah';

export default function MiniPlayer() {
  // Subscribe to the minimal state slice we need
  const { isPlaying, currentPlayingAyah, lang, reciter, currentSurah } =
    useAppSelector(
      (s) => ({
        isPlaying:          s.isPlaying,
        currentPlayingAyah: s.currentPlayingAyah,
        lang:               s.lang,
        reciter:            s.reciter,
        currentSurah:       s.currentSurah,
      }),
      shallowEqual,
    );

  const [dismissed, setDismissed] = useState(false);
  // Ref to the inner progress-fill div — updated via direct DOM mutation to
  // avoid triggering a React re-render on every timeupdate event (~4 Hz).
  const progressFillRef = useRef(null);

  // Re-show whenever a new ayah starts playing
  useEffect(() => {
    if (isPlaying || currentPlayingAyah) {
      setDismissed(false);
    }
  }, [isPlaying, currentPlayingAyah]);

  // Subscribe to time updates and update the progress bar via direct DOM
  // mutation instead of React state to avoid 4 Hz re-renders.
  useEffect(() => {
    const unsub = audioService.addTimeUpdateListener((ct, dur) => {
      if (progressFillRef.current) {
        const pct = dur ? Math.round((ct / dur) * 100) : 0;
        progressFillRef.current.style.width = `${pct}%`;
      }
    });
    return unsub;
  }, []);

  // ── Derived display values ──────────────────────────────────────────────
  const activeSurah = currentPlayingAyah?.surah ?? currentSurah;
  const surahMeta   = getSurah(activeSurah);
  const surahLabel  = surahMeta
    ? surahName(activeSurah, lang)
    : `${t('quran.surah', lang)} ${activeSurah}`;
  const arabicSurahName = surahMeta?.ar ?? null;
  const ayahLabel   = currentPlayingAyah?.ayah
    ? `${t('quran.ayah', lang)} ${currentPlayingAyah.ayah}`
    : '';
  const reciterLabel = reciterName(reciter, lang);

  // ── Controls ────────────────────────────────────────────────────────────
  const handlePlayPause = useCallback(() => {
    audioService.toggle();
  }, []);

  const handleNext = useCallback(() => {
    audioService.next();
  }, []);

  const handlePrev = useCallback(() => {
    audioService.prev();
  }, []);

  const handleDismiss = useCallback(() => {
    // audioService.stop() fires onPlaybackStateChange which updates AppContext —
    // we only need to set the local dismissed flag here to hide the bar.
    audioService.stop();
    setDismissed(true);
  }, []);

  // ── MediaSession API ────────────────────────────────────────────────────
  useMediaSession({
    title:     ayahLabel ? `${surahLabel} · ${ayahLabel}` : surahLabel,
    artist:    reciterLabel,
    album:     'MushafPlus',
    artwork:   null,
    isPlaying,
    onPlay:    () => audioService.resume(),
    onPause:   () => audioService.pause(),
    onNext:    handleNext,
    onPrev:    handlePrev,
  });

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useAutoScrollAyah({
    currentAyah:  currentPlayingAyah,
    currentSurah: activeSurah,
    isPlaying,
  });

  // ── Visibility guard ────────────────────────────────────────────────────
  const isVisible = !dismissed && (isPlaying || Boolean(currentPlayingAyah));

  // Manage --mini-player-h CSS variable so sibling elements add correct padding.
  // Must include env(safe-area-inset-bottom) so content isn't obscured by the
  // iOS home indicator (safe-area-inset-bottom ≈ 34px on notch devices).
  useEffect(() => {
    const root = document.documentElement;
    if (isVisible) {
      root.style.setProperty(
        '--mini-player-h',
        'calc(56px + env(safe-area-inset-bottom, 0px))',
      );
    } else {
      root.style.setProperty('--mini-player-h', '0px');
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const isRtl = lang === 'ar';

  return (
    <div
      role="region"
      aria-label={
        lang === 'ar'
          ? 'مشغّل الصوت المصغّر'
          : lang === 'fr'
            ? 'Lecteur audio réduit'
            : 'Mini audio player'
      }
      className={cn(
        // Positioning — bottom is set via inline style using --player-h
        'mini-player fixed inset-x-0 z-[300]',
        // Appearance
        'bg-[var(--bg-card)] border-t border-[var(--border)]',
        'shadow-[0_-4px_24px_rgba(0,0,0,0.12)]',
        // Layout
        'flex flex-col',
        'h-[var(--mini-player-h,56px)]',
        // Safe-area support for iOS notch
        'pb-[env(safe-area-inset-bottom,0px)]',
      )}
      style={{
        // Keep mini-player above the main AudioPlayer dock
        bottom: 'var(--player-h, 0px)',
      }}
    >
      {/* Progress bar — ultra-thin line at top; width set via direct DOM ref */}
      <div
        className="h-[3px] w-full bg-[color-mix(in_srgb,var(--border)_60%,transparent)]"
        aria-hidden="true"
      >
        <div
          ref={progressFillRef}
          className="h-full bg-[var(--primary)] transition-[width] duration-300 ease-linear"
          style={{ width: '0%' }}
        />
      </div>

      {/* Main row */}
      <div
        className={cn(
          'flex flex-1 items-center gap-2 px-3',
          isRtl && 'flex-row-reverse',
        )}
      >
        {/* Track info */}
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col gap-px',
            isRtl && 'items-end text-right',
          )}
        >
          <div className="flex min-w-0 items-baseline gap-1.5">
            {lang !== 'ar' && arabicSurahName && (
              <span
                className="shrink-0 text-[0.82rem] font-bold leading-tight text-[var(--primary)]"
                dir="rtl"
                lang="ar"
                aria-hidden="true"
              >
                {arabicSurahName}
              </span>
            )}
            <span
              className="truncate text-[0.74rem] font-semibold leading-tight text-[var(--text-primary)]"
              aria-live="polite"
              aria-atomic="true"
            >
              {surahLabel}
              {ayahLabel ? ` · ${ayahLabel}` : ''}
            </span>
          </div>
          {reciterLabel ? (
            <span className="truncate text-[0.64rem] leading-tight text-[var(--text-muted)]">
              {reciterLabel}
            </span>
          ) : null}
        </div>

        {/* Controls */}
        <div
          className={cn(
            'flex shrink-0 items-center gap-1',
            isRtl && 'flex-row-reverse',
          )}
        >
          {/* Previous */}
          <button
            type="button"
            onClick={handlePrev}
            aria-label={t('audio.prev', lang)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.4)]"
          >
            {isRtl ? (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={handlePlayPause}
            aria-label={isPlaying ? t('audio.pause', lang) : t('audio.play', lang)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[0_2px_10px_rgba(var(--primary-rgb),0.4)] transition-all hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.5)]"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4" fill="currentColor" aria-hidden="true" />
            ) : (
              <Play className="h-4 w-4" fill="currentColor" aria-hidden="true" />
            )}
          </button>

          {/* Next */}
          <button
            type="button"
            onClick={handleNext}
            aria-label={t('audio.next', lang)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--primary)_12%,transparent)] hover:text-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.4)]"
          >
            {isRtl ? (
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            ) : (
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label={t('audio.close', lang)}
            className="ml-1 flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[color-mix(in_srgb,var(--border)_80%,transparent)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.4)]"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
