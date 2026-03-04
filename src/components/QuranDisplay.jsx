import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import {
  getSurahFull, getPageFull, getPage, getPageTranslation,
  getJuz, getJuzTranslation, getSurahText, getSurahTranslation,
  wasWarshTextFallback, abortPendingRequests, clearCache
} from '../services/quranAPI';
import { savePosition } from '../services/storageService';
import { logSession } from '../services/historyService';
import { logWirdProgress } from '../services/wirdService';
import { stripBasmala } from '../utils/quranUtils';
import { toAr } from '../data/surahs';
import { getJuzForAyah } from '../data/juz';
import audioService from '../services/audioService';
import { ensureReciterForRiwaya, getDefaultReciterId, getReciter } from '../data/reciters';
import { getFontFamily, getWarshSurahFormatted, getWarshJuzVerses, preloadWarshSurah } from '../services/warshService';
import { getKaraokeCalibration } from '../utils/karaokeUtils';

import { Virtuoso, GroupedVirtuoso } from 'react-virtuoso';

// New sub-components
import Bismillah from './Quran/Bismillah';
import SurahHeader from './Quran/SurahHeader';
import TajweedLegend from './Quran/TajweedLegend';
import SmartAyahRenderer from './Quran/SmartAyahRenderer';
import AyahBlock from './Quran/AyahBlock';

import '../styles/quran-display.css';

/* ── Font family mapping ── */
const FONT_MAP = {
  'scheherazade': "'KFGQPC Uthmanic Script HAFS','Amiri Quran','Scheherazade New','Amiri',serif",
  'amiri-quran': "'KFGQPC Uthmanic Script HAFS','Amiri Quran','Amiri','Scheherazade New',serif",
  'amiri': "'KFGQPC Uthmanic Script HAFS','Amiri','Amiri Quran',serif",
  'noto-naskh': "'KFGQPC Uthmanic Script HAFS','Noto Naskh Arabic','Amiri Quran','Scheherazade New',serif",
  'lateef': "'KFGQPC Uthmanic Script HAFS','Lateef','Scheherazade New',serif",
};

/* ═══════════════════════════════════════════════════ */
/*  Main QuranDisplay                                  */
/* ═══════════════════════════════════════════════════ */
export default function QuranDisplay() {
  const { state, dispatch, set } = useApp();
  const {
    displayMode, currentSurah, currentAyah, currentPage,
    riwaya, translationLang, lang, fontSize, fontFamily,
    showTranslation, showTajwid, currentPlayingAyah, loading,
    currentJuz, continuousPlay, warshStrictMode, syncOffsetsMs,
  } = state;

  const quranFontCss = FONT_MAP[fontFamily] || FONT_MAP['scheherazade'];
  const effectiveReciterId = ensureReciterForRiwaya(state.reciter, riwaya);
  const syncKey = `${riwaya}:${effectiveReciterId}`;
  const userSyncOffsetMs = Math.max(-500, Math.min(500, Number(syncOffsetsMs?.[syncKey] ?? 0)));
  const karaokeCalibration = useMemo(
    () => {
      const base = getKaraokeCalibration(effectiveReciterId, riwaya);
      return {
        ...base,
        extraLagSec: (base.extraLagSec || 0) + (userSyncOffsetMs / 1000),
      };
    },
    [effectiveReciterId, riwaya, userSyncOffsetMs]
  );

  const [ayahs, setAyahs] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [error, setError] = useState(null);
  const [sourceEdition, setSourceEdition] = useState('');
  const [isWarshFallback, setIsWarshFallback] = useState(false);
  const [isQCF4, setIsQCF4] = useState(false);
  const contentRef = useRef(null);
  const readingStartRef = useRef(Date.now());
  const [activeAyah, setActiveAyah] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Full riwaya switch (stops audio, clears cache, resets reciter)
  const applyRiwaya = useCallback((nextRiwaya) => {
    if (nextRiwaya === riwaya) return;
    audioService.stop();
    clearCache();
    const fallbackReciter = getDefaultReciterId(nextRiwaya);
    const patch = {
      riwaya: nextRiwaya,
      reciter: fallbackReciter,
      isPlaying: false,
      currentPlayingAyah: null,
      currentAyah: 1,
    };
    // Warsh doesn't support page mode
    if (nextRiwaya === 'warsh' && displayMode === 'page') {
      patch.displayMode = 'surah';
    }
    set(patch);
  }, [riwaya, displayMode, set]);

  // Stable toggle callback — prevents re-creating closures per ayah
  const toggleActiveRef = useRef(null);
  toggleActiveRef.current = activeAyah;
  const toggleAyah = useCallback((id) => {
    setActiveAyah(prev => prev === id ? null : id);
  }, []);

  // Memoized style object for ayahs container (avoid new object per render)
  const ayahsContainerStyle = useMemo(() => ({
    fontSize: `${fontSize}px`,
    fontFamily: isQCF4 ? undefined : quranFontCss,
  }), [fontSize, isQCF4, quranFontCss]);

  /* ── Track scroll for back-to-top button (throttled) ── */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    let ticking = false;
    const handler = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          setShowScrollTop(el.scrollTop > 500);
          ticking = false;
        });
      }
    };
    el.addEventListener('scroll', handler, { passive: true });
    return () => el.removeEventListener('scroll', handler);
  }, []);

  const scrollToTop = () => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const repairPlatform = useCallback(async () => {
    try {
      await clearCache();
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map(r => r.unregister()));
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      localStorage.removeItem('mushaf-plus-settings');
      window.location.reload();
    } catch {
      window.location.reload();
    }
  }, []);

  // Removed old visibleAyahCount reset

  /* ── Continuous play: auto-advance to next surah/juz when playlist ends ── */
  useEffect(() => {
    if (!continuousPlay) return;
    const unsubEnd = audioService.addEndListener(() => {
      // Playlist ended, auto-navigate to next
      if (displayMode === 'surah' && currentSurah < 114) {
        dispatch({ type: 'NAVIGATE_SURAH', payload: { surah: currentSurah + 1, ayah: 1 } });
        // Auto-play after a short delay (wait for data to load)
        setTimeout(() => audioService.play(), 1200);
      } else if (displayMode === 'juz' && currentJuz < 30) {
        dispatch({ type: 'NAVIGATE_JUZ', payload: { juz: currentJuz + 1 } });
        setTimeout(() => audioService.play(), 1200);
      } else if (displayMode === 'page' && currentPage < 604) {
        set({ currentPage: currentPage + 1 });
        setTimeout(() => audioService.play(), 1200);
      }
    });
    return unsubEnd;
  }, [continuousPlay, displayMode, currentSurah, currentJuz, currentPage, dispatch, set]);


  /* ── Load audio playlist when ayahs or reciter/riwaya change ── */
  useEffect(() => {
    if (ayahs.length > 0 && state.reciter) {
      const safeReciterId = ensureReciterForRiwaya(state.reciter, riwaya);
      // Auto-fix reciter in state if it doesn't belong to this riwaya
      if (safeReciterId !== state.reciter) {
        set({ reciter: safeReciterId });
        return; // Will re-trigger with correct reciter
      }
      const rec = getReciter(safeReciterId, riwaya);
      if (rec) {
        if (riwaya === 'warsh' && warshStrictMode && !String(rec.cdn || '').toLowerCase().includes('warsh')) {
          setError(t('errors.warshStrict', lang));
          return;
        }
        const playlistAyahs = ayahs.map(a => ({
          surah: a.surah?.number || currentSurah,
          numberInSurah: a.numberInSurah,
          number: a.number,
          text: a.text,
        }));
        audioService.loadPlaylist(playlistAyahs, rec.cdn, rec.cdnType || 'islamic');
      }
    }
  }, [ayahs, state.reciter, riwaya, currentSurah, set, warshStrictMode, lang]);

  /* ── Auto-scroll to playing ayah ───────────── */
  useEffect(() => {
    if (!currentPlayingAyah?.ayah) return;
    // In juz mode, elements use global ayah number; in surah/page mode, numberInSurah
    const elId = displayMode === 'juz'
      ? `ayah-${currentPlayingAyah.globalNumber || currentPlayingAyah.ayah}`
      : `ayah-${currentPlayingAyah.ayah}`;
    const el = document.getElementById(elId);
    if (el) {
      const container = contentRef.current;
      if (!container) return;
      const cRect = container.getBoundingClientRect();
      const eRect = el.getBoundingClientRect();
      const outOfView = eRect.top < cRect.top + 40 || eRect.bottom > cRect.bottom - 40;
      if (outOfView) {
        el.scrollIntoView({ behavior: 'auto', block: 'center' });
      }
    }
  }, [currentPlayingAyah, displayMode]);

  /* ── Play entire surah from start ──────────── */
  const playSurah = useCallback(() => {
    if (ayahs.length === 0) return;
    const safeReciterId = ensureReciterForRiwaya(state.reciter, riwaya);
    const rec = getReciter(safeReciterId, riwaya);
    if (rec) {
      if (riwaya === 'warsh' && warshStrictMode && !String(rec.cdn || '').toLowerCase().includes('warsh')) {
        setError(t('errors.warshStrict', lang));
        return;
      }
      const playlistAyahs = ayahs.map(a => ({
        surah: a.surah?.number || currentSurah,
        numberInSurah: a.numberInSurah,
        number: a.number,
        text: a.text,
      }));
      audioService.loadPlaylist(playlistAyahs, rec.cdn, rec.cdnType || 'islamic');
      audioService.play();
    }
  }, [ayahs, state.reciter, riwaya, currentSurah, warshStrictMode, lang]);

  /* ── Fetch data ────────────────────────────── */
  const fetchData = useCallback(async () => {
    // Abort any previous in-flight request
    const signal = abortPendingRequests();
    dispatch({ type: 'SET_LOADING', payload: true });
    setError(null);

    // Warsh QCF4 doesn't support mushaf-page browsing (data is surah-based).
    // In page mode with Warsh, we use Hafs text with Warsh audio.
    // No automatic redirect — let user see page mode with fallback text.

    try {
      let arabicData;

      // ── Primary fetch first (fast render), secondary data loads in background ──
      // Page mode uses standard API (no QCF4 for page browsing)
      if (displayMode === 'page') {
        // Page mode: use Hafs text even if Warsh riwaya selected (Warsh QCF4 is surah-based)
        arabicData = await getPage(currentPage, 'hafs', signal);
        // Mark as fallback when Warsh is selected but using Hafs text
        if (riwaya === 'warsh') {
          arabicData = { ...arabicData, isTextFallback: true, requestedRiwaya: 'warsh' };
        }
      } else if (riwaya === 'warsh') {
        if (displayMode === 'juz') {
          arabicData = await getWarshJuzVerses(currentJuz);
        } else {
          arabicData = await getWarshSurahFormatted(currentSurah);
        }
      } else if (displayMode === 'juz') {
        arabicData = await getJuz(currentJuz, riwaya, signal);
      } else {
        arabicData = await getSurahText(currentSurah, riwaya, signal);
      }

      // If aborted after await, bail out (another fetchData call is running)
      if (signal.aborted) {
        // Don't leave loading=true — the newer fetch will handle it
        return;
      }

      const fetchedAyahs = arabicData?.ayahs || [];
      if (!Array.isArray(fetchedAyahs) || fetchedAyahs.length === 0) {
        throw new Error(t('errors.emptyData', lang));
      }

      // Warsh strict mode check — but NOT in page mode (QCF4 only supports surah/juz)
      if (riwaya === 'warsh' && warshStrictMode && arabicData?.isTextFallback && displayMode !== 'page') {
        throw new Error(lang === 'fr'
          ? 'Mode Warsh strict: texte Warsh indisponible (fallback Hafs refusé).'
          : lang === 'ar'
            ? 'وضع ورش الصارم: نص ورش غير متاح (تم رفض بديل حفص).'
            : 'Warsh strict mode: Warsh text unavailable (Hafs fallback blocked).');
      }

      // Mark ayahs with requested riwaya (prevents any visual fallback confusion)
      // Also strip Bismillah from verse 1 text at data level for Hafs (belt-and-suspenders)
      for (const ayah of fetchedAyahs) {
        ayah.requestedRiwaya = riwaya;
        if (!ayah.warshWords && ayah.text && ayah.numberInSurah === 1) {
          const sn = ayah.surah?.number;
          if (sn && sn !== 1 && sn !== 9) {
            ayah.text = stripBasmala(ayah.text, sn, 1);
          }
        }
      }

      // Replace all state atomically — new data is ready
      setAyahs(fetchedAyahs);
      setTranslations([]);
      setSourceEdition(arabicData?.usedEdition || arabicData?.edition?.identifier || '');
      setIsWarshFallback(arabicData?.isTextFallback || false);
      setIsQCF4(arabicData?.isQCF4 || false);
      dispatch({ type: 'SET_LOADING', payload: false });

      // Secondary fetches in background — parallel for speed
      if (riwaya === 'warsh' && displayMode !== 'page') {
        const transPromise = displayMode === 'juz'
          ? getJuzTranslation(currentJuz, translationLang, signal)
          : getSurahTranslation(currentSurah, translationLang, signal);

        const hafsPromise = displayMode === 'juz'
          ? getJuz(currentJuz, 'hafs', signal)
          : getSurahText(currentSurah, 'hafs', signal);

        // Fire both in parallel
        Promise.allSettled([transPromise, hafsPromise]).then(([transResult, hafsResult]) => {
          if (signal.aborted) return;
          if (transResult.status === 'fulfilled' && transResult.value?.ayahs) {
            setTranslations(transResult.value.ayahs);
          }
          if (hafsResult.status === 'fulfilled') {
            const hafsAyahs = hafsResult.value?.ayahs || [];
            if (Array.isArray(hafsAyahs) && hafsAyahs.length > 0) {
              const hafsMap = new Map();
              for (const h of hafsAyahs) {
                hafsMap.set(`${h.surah?.number}:${h.numberInSurah}`, h.text);
              }
              setAyahs(prev => prev.map(a => {
                const key = `${a.surah?.number}:${a.numberInSurah}`;
                const ht = hafsMap.get(key);
                return ht ? { ...a, hafsText: ht } : a;
              }));
            }
          }
        });
      } else {
        // Hafs mode OR Warsh page mode (using Hafs text)
        const transPromise = displayMode === 'page'
          ? getPageTranslation(currentPage, translationLang, signal)
          : displayMode === 'juz'
            ? getJuzTranslation(currentJuz, translationLang, signal)
            : getSurahTranslation(currentSurah, translationLang, signal);
        transPromise
          .then(trans => {
            if (signal.aborted) return;
            setTranslations(trans?.ayahs || []);
          })
          .catch(() => { });
      }

      // Save reading position
      if (displayMode === 'page') {
        const firstAyah = arabicData.ayahs?.[0];
        savePosition(firstAyah?.surah?.number || currentSurah, firstAyah?.numberInSurah || 1, currentPage);
      } else {
        const firstAyah = arabicData.ayahs?.[0];
        if (firstAyah) {
          savePosition(firstAyah.surah?.number || currentSurah, 1, firstAyah.page);
        }
      }

      // Log reading history & wird progress (fire-and-forget)
      try {
        const allAyahs = arabicData.ayahs || [];
        if (allAyahs.length > 0) {
          const firstA = allAyahs[0];
          const lastA = allAyahs[allAyahs.length - 1];
          const sSurah = firstA.surah?.number || currentSurah;
          const sFrom = firstA.numberInSurah || 1;
          const sTo = lastA.numberInSurah || sFrom;
          const pagesCount = displayMode === 'page' ? 1 : Math.ceil(allAyahs.length / 15);
          // Compute actual reading duration since last navigation
          const elapsed = Date.now() - readingStartRef.current;
          readingStartRef.current = Date.now();
          logSession({ surah: sSurah, ayahFrom: sFrom, ayahTo: sTo, page: currentPage, durationMs: elapsed }).catch(() => { });
          logWirdProgress({ surah: sSurah, fromAyah: sFrom, toAyah: sTo, pagesCount }).catch(() => { });
        }
      } catch { /* best-effort */ }
    } catch (err) {
      // Silently ignore abort errors — a newer fetchData is already running
      if (err.name === 'AbortError') return;
      console.error('Fetch error:', err);
      setError(err.message);
      dispatch({ type: 'SET_ERROR', payload: err.message });
    } finally {
      // Safety net: if no data loaded and we're still loading, clear the flag
      // This prevents infinite loading skeleton when all fetches fail/abort
      if (signal.aborted) return;
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [displayMode, currentSurah, currentPage, currentJuz, riwaya, translationLang, lang, dispatch, warshStrictMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Prefetch adjacent surah/page/juz data so next navigation is instant
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      if (displayMode === 'surah') {
        if (riwaya === 'warsh') {
          if (currentSurah < 114) preloadWarshSurah(currentSurah + 1);
          if (currentSurah > 1) preloadWarshSurah(currentSurah - 1);
          if (currentSurah < 114) getSurahTranslation(currentSurah + 1, translationLang).catch(() => { });
        } else {
          if (currentSurah < 114) getSurahFull(currentSurah + 1, riwaya, translationLang).catch(() => { });
          if (currentSurah > 1) getSurahFull(currentSurah - 1, riwaya, translationLang).catch(() => { });
        }
      } else if (displayMode === 'page') {
        if (currentPage < 604) getPageFull(currentPage + 1, riwaya, translationLang).catch(() => { });
        if (currentPage > 1) getPageFull(currentPage - 1, riwaya, translationLang).catch(() => { });
      } else if (displayMode === 'juz') {
        if (riwaya === 'warsh') {
          if (currentJuz < 30) {
            getWarshJuzVerses(currentJuz + 1).catch(() => { });
            getJuzTranslation(currentJuz + 1, translationLang).catch(() => { });
          }
        } else {
          if (currentJuz < 30) getJuz(currentJuz + 1, riwaya).catch(() => { });
        }
      }
    }, 150); // Fast prefetch — data will be cached for instant next navigation
    return () => clearTimeout(timer);
  }, [loading, displayMode, currentSurah, currentPage, currentJuz, riwaya, translationLang]);

  // Scroll to top on navigation (instant for speed)
  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [currentSurah, currentPage, currentJuz]);

  /* ── Page navigation ───────────────────────── */
  const goNextPage = () => {
    if (currentPage < 604) set({ currentPage: currentPage + 1 });
  };
  const goPrevPage = () => {
    if (currentPage > 1) set({ currentPage: currentPage - 1 });
  };
  const goNextSurah = () => {
    if (currentSurah < 114) {
      dispatch({ type: 'NAVIGATE_SURAH', payload: { surah: currentSurah + 1 } });
    }
  };
  const goPrevSurah = () => {
    if (currentSurah > 1) {
      dispatch({ type: 'NAVIGATE_SURAH', payload: { surah: currentSurah - 1 } });
    }
  };
  const goNextJuz = () => {
    if (currentJuz < 30) dispatch({ type: 'NAVIGATE_JUZ', payload: { juz: currentJuz + 1 } });
  };
  const goPrevJuz = () => {
    if (currentJuz > 1) dispatch({ type: 'NAVIGATE_JUZ', payload: { juz: currentJuz - 1 } });
  };

  /* ── (continuous play is handled in the earlier useEffect) ── */

  /* ── Group ayahs by surah (memoized for page/juz mode) ── */
  const surahGroups = useMemo(() => {
    if (displayMode !== 'page' && displayMode !== 'juz') return [];
    const groups = [];
    let currentGroup = null;
    for (const a of ayahs) {
      const sn = a.surah?.number || currentSurah;
      if (!currentGroup || currentGroup.surah !== sn) {
        currentGroup = { surah: sn, ayahs: [] };
        groups.push(currentGroup);
      }
      currentGroup.ayahs.push(a);
    }
    return groups;
  }, [ayahs, displayMode, currentSurah]);


  /* ── Translation Map for O(1) lookup (juz mode) ── */
  const translationMap = useMemo(() => {
    if (translations.length === 0) return null;
    const map = new Map();
    for (const tr of translations) {
      map.set(tr.number, tr);
    }
    return map;
  }, [translations]);

  /* ── Loading / Error states ────────────────── */
  // Show skeleton ONLY when we have no data at all — otherwise show stale data while loading
  if (loading && ayahs.length === 0) {
    return (
      <div className="quran-loading">
        <div className="loading-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-bismillah"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line medium"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line short"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line medium"></div>
          <div className="skeleton-line long"></div>
          <div className="skeleton-line short"></div>
          <div className="skeleton-line medium"></div>
          <div className="skeleton-line long"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="quran-error">
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <div className="quran-error-actions">
          <button className="btn btn-primary" onClick={fetchData}>
            {t('errors.retry', lang)}
          </button>
          <button className="btn btn-outline" onClick={repairPlatform}>
            {lang === 'fr' ? 'Réparer la plateforme' : 'Repair Platform'}
          </button>
        </div>
      </div>
    );
  }

  if (!loading && !error && ayahs.length === 0) {
    return (
      <div className="quran-error">
        <i className="fas fa-book-open"></i>
        <p>{t('errors.emptyData', lang)}</p>
        <div className="quran-error-actions">
          <button className="btn btn-primary" onClick={fetchData}>
            {t('errors.retry', lang)}
          </button>
          <button className="btn btn-outline" onClick={repairPlatform}>
            {lang === 'fr' ? 'Réparer la plateforme' : 'Repair Platform'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quran-display" ref={contentRef}>
      {/* Quick display mode switcher + riwaya toggle */}
      <div className="display-mode-bar">
        <button
          className={`mode-btn${displayMode === 'surah' ? ' active' : ''}`}
          onClick={() => set({ displayMode: 'surah' })}
        >
          <i className="fas fa-list"></i>
          <span>{t('settings.surahMode', lang)}</span>
        </button>
        <button
          className={`mode-btn${displayMode === 'page' ? ' active' : ''}`}
          onClick={() => set({ displayMode: 'page' })}
          disabled={riwaya === 'warsh'}
          title={riwaya === 'warsh' ? t('errors.warshNotAvailable', lang) : ''}
        >
          <i className="fas fa-file"></i>
          <span>{t('settings.pageMode', lang)}</span>
        </button>
        <button
          className={`mode-btn${displayMode === 'juz' ? ' active' : ''}`}
          onClick={() => set({ displayMode: 'juz' })}
        >
          <i className="fas fa-book-open"></i>
          <span>{t('settings.juzMode', lang)}</span>
        </button>

        <span className="mode-bar-divider" />

        <button
          className={`mode-btn riwaya-btn${riwaya === 'hafs' ? ' active' : ''}`}
          onClick={() => applyRiwaya('hafs')}
        >
          <i className="fas fa-book"></i>
          <span>{t('settings.hafs', lang)}</span>
        </button>
        <button
          className={`mode-btn riwaya-btn${riwaya === 'warsh' ? ' active' : ''}`}
          onClick={() => applyRiwaya('warsh')}
        >
          <i className="fas fa-book-quran"></i>
          <span>{t('settings.warsh', lang)}</span>
        </button>
      </div>
      {/* Warsh QCF4 active indicator */}
      {riwaya === 'warsh' && isQCF4 && (
        <div className="warsh-notice warsh-qcf4-active">
          <div className="warsh-notice-content">
            <div className="warsh-notice-badge warsh-badge-ok">
              <i className="fas fa-check-circle"></i>
              <span>{t('settings.warshScriptLabel', lang)}</span>
            </div>
          </div>
        </div>
      )}
      {/* Warsh fallback — if QCF4 failed and using Hafs text */}
      {riwaya === 'warsh' && isWarshFallback && !isQCF4 && (
        <div className="warsh-notice warsh-fallback">
          <div className="warsh-notice-content">
            <div className="warsh-notice-badge">
              <i className="fas fa-exclamation-triangle"></i>
              <span>{t('settings.warshFallbackBadge', lang)}</span>
            </div>
            <p className="warsh-notice-text">{t('settings.warshFallbackText', lang)}</p>
          </div>
          <a
            href="https://archive.org/download/MushafAlMadinahWarsh5488865/Mushaf%20AlMadinah_Warsh.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="warsh-mushaf-link"
          >
            <i className="fas fa-external-link-alt"></i>
            {t('settings.warshMushafLink', lang)}
          </a>
        </div>
      )}

      {/* Surah mode */}
      {displayMode === 'surah' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Virtuoso
            useWindowScroll
            data={ayahs}
            initialTopMostItemIndex={currentAyah > 1 ? currentAyah - 1 : 0}
            components={{
              Scroller: React.forwardRef((props, ref) => <div {...props} ref={ref} role="region" aria-label={t('settings.surahMode', lang)} />),
              List: React.forwardRef((props, ref) => <div {...props} ref={ref} role="list" />),
              Header: () => (
                <>
                  {sourceEdition && (
                    <div className="edition-badge">
                      <i className={`fas ${isQCF4 ? 'fa-book-quran' : riwaya === 'warsh' ? 'fa-headphones' : 'fa-book'}`}></i>
                      {isQCF4 ? `WARSH QCF4 · ${t('settings.warshQcf4Badge', lang)}` : `${riwaya.toUpperCase()} · ${sourceEdition}`}
                    </div>
                  )}
                  <SurahHeader surahNum={currentSurah} lang={lang} />
                  <div className="play-surah-bar">
                    <button className="btn-play-surah" onClick={playSurah} title={t('audio.playSurah', lang)}>
                      <i className="fas fa-play"></i>
                      <span>{t('audio.playSurah', lang)}</span>
                    </button>
                  </div>
                  {currentSurah !== 1 && currentSurah !== 9 && !isQCF4 && <Bismillah />}
                  <TajweedLegend lang={lang} visible={showTajwid} riwaya={riwaya} />
                </>
              ),
              Footer: () => (
                <div className="quran-nav">
                  <button className="btn btn-outline" onClick={goPrevSurah} disabled={currentSurah <= 1}>
                    <i className={`fas fa-arrow-${lang === 'ar' ? 'right' : 'left'}`}></i>
                    {t('quran.prevSurah', lang)}
                  </button>
                  <button className="btn btn-outline" onClick={goNextSurah} disabled={currentSurah >= 114}>
                    {t('quran.nextSurah', lang)}
                    <i className={`fas fa-arrow-${lang === 'ar' ? 'left' : 'right'}`}></i>
                  </button>
                </div>
              )
            }}
            itemContent={(index, ayah) => {
              const isPlayingAyah = currentPlayingAyah?.ayah === ayah.numberInSurah
                && currentPlayingAyah?.surah === currentSurah;
              const trans = translations[index];
              return (
                <div className={isQCF4 ? 'qcf4-container' : ''} style={ayahsContainerStyle}>
                  <AyahBlock
                    key={ayah.number}
                    ayah={ayah}
                    ayahId={`ayah-${ayah.numberInSurah}`}
                    isPlaying={isPlayingAyah}
                    isActive={activeAyah === ayah.numberInSurah}
                    trans={trans}
                    showTajwid={showTajwid}
                    showTranslation={showTranslation}
                    surahNum={currentSurah}
                    calibration={karaokeCalibration}
                    riwaya={riwaya}
                    lang={lang}
                    onToggleActive={() => toggleAyah(ayah.numberInSurah)}
                  />
                </div>
              );
            }}
          />
        </div>
      )}

      {/* Page mode */}
      {displayMode === 'page' && (
        <>
          <div className="page-header-bar">
            <span>{t('quran.page', lang)} {lang === 'ar' ? toAr(currentPage) : currentPage}</span>
            {sourceEdition && <span className="edition-chip">{riwaya.toUpperCase()} · {sourceEdition}</span>}
            {ayahs[0] && (
              <span>
                {t('sidebar.juz', lang)} {getJuzForAyah(ayahs[0].surah?.number, ayahs[0].numberInSurah)}
              </span>
            )}
          </div>

          {surahGroups.map((group, gi) => (
            <div key={gi}>
              <SurahHeader surahNum={group.surah} lang={lang} />
              {!isQCF4 && group.ayahs[0]?.numberInSurah === 1 && group.surah !== 1 && group.surah !== 9 && (
                <Bismillah />
              )}
              <div className={`ayahs-container mushaf-page ${isQCF4 ? 'qcf4-container' : ''}`} style={ayahsContainerStyle}>
                {group.ayahs.map((ayah) => {
                  const isPlaying = currentPlayingAyah?.ayah === ayah.numberInSurah
                    && currentPlayingAyah?.surah === ayah.surah?.number;
                  return (
                    <span
                      key={ayah.number}
                      className={`ayah-inline ${isPlaying ? 'playing' : ''}`}
                    >
                      <SmartAyahRenderer
                        ayah={ayah}
                        showTajwid={showTajwid}
                        isPlaying={isPlaying}
                        surahNum={group.surah}
                        calibration={karaokeCalibration}
                        riwaya={riwaya}
                      />{' '}
                      <span className="ayah-number">
                        ﴿{lang === 'ar' ? toAr(ayah.numberInSurah) : ayah.numberInSurah}﴾
                      </span>{' '}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Navigation */}
          <div className="quran-nav">
            <button
              className="btn btn-outline"
              onClick={goPrevPage}
              disabled={currentPage <= 1}
            >
              <i className={`fas fa-arrow-${lang === 'ar' ? 'right' : 'left'}`}></i>
              {t('quran.prevPage', lang)}
            </button>
            <span className="page-indicator">
              {lang === 'ar' ? toAr(currentPage) : currentPage} / 604
            </span>
            <button
              className="btn btn-outline"
              onClick={goNextPage}
              disabled={currentPage >= 604}
            >
              {t('quran.nextPage', lang)}
              <i className={`fas fa-arrow-${lang === 'ar' ? 'left' : 'right'}`}></i>
            </button>
          </div>
        </>
      )}

      {/* Juz mode */}
      {displayMode === 'juz' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <GroupedVirtuoso
            useWindowScroll
            groupCounts={surahGroups.map(g => g.ayahs.length)}
            groupContent={index => (
              <SurahHeader surahNum={surahGroups[index].surah} lang={lang} />
            )}
            components={{
              Scroller: React.forwardRef((props, ref) => <div {...props} ref={ref} role="region" aria-label={t('settings.juzMode', lang)} />),
              List: React.forwardRef((props, ref) => <div {...props} ref={ref} role="list" />),
              Header: () => (
                <div className="page-header-bar">
                  <span>
                    <i className="fas fa-book-open" style={{ marginInlineEnd: '0.4rem' }}></i>
                    {t('sidebar.juz', lang)} {lang === 'ar' ? toAr(currentJuz) : currentJuz}
                  </span>
                  {sourceEdition && <span className="edition-chip">{riwaya.toUpperCase()} · {sourceEdition}</span>}
                </div>
              ),
              Footer: () => (
                <div className="quran-nav">
                  <button className="btn btn-outline" onClick={goPrevJuz} disabled={currentJuz <= 1}>
                    <i className={`fas fa-arrow-${lang === 'ar' ? 'right' : 'left'}`}></i>
                    {t('quran.prevJuz', lang)}
                  </button>
                  <span className="page-indicator">
                    {t('sidebar.juz', lang)} {lang === 'ar' ? toAr(currentJuz) : currentJuz} / 30
                  </span>
                  <button className="btn btn-outline" onClick={goNextJuz} disabled={currentJuz >= 30}>
                    {t('quran.nextJuz', lang)}
                    <i className={`fas fa-arrow-${lang === 'ar' ? 'left' : 'right'}`}></i>
                  </button>
                </div>
              )
            }}
            itemContent={(index) => {
              const ayah = ayahs[index];
              if (!ayah) return null;
              const isPlayingAyah = currentPlayingAyah?.ayah === ayah.numberInSurah
                && currentPlayingAyah?.surah === ayah.surah?.number;
              const trans = translationMap?.get(ayah.number);
              return (
                <div className={isQCF4 ? 'qcf4-container' : ''} style={ayahsContainerStyle}>
                  <AyahBlock
                    key={ayah.number}
                    ayah={ayah}
                    ayahId={`ayah-${ayah.number}`}
                    isPlaying={isPlayingAyah}
                    isActive={activeAyah === ayah.number}
                    trans={trans}
                    showTajwid={showTajwid}
                    showTranslation={showTranslation}
                    surahNum={ayah.surah?.number}
                    calibration={karaokeCalibration}
                    riwaya={riwaya}
                    lang={lang}
                    onToggleActive={() => toggleAyah(ayah.number)}
                  />
                </div>
              );
            }}
          />
        </div>
      )}

      {/* Scroll to top button */}
      {showScrollTop && (
        <button className="scroll-top-btn" onClick={scrollToTop} title={t('nav.scrollTop', lang)}>
          <i className="fas fa-chevron-up"></i>
        </button>
      )}

      {/* Footer */}
      <footer className="quran-footer">
        <div className="footer-brand">
          <i className="fas fa-book-quran"></i>
          <span>MushafPlus v1.1.0</span>
        </div>
        <div className="footer-links">
          <a href="https://alquran.cloud/api" target="_blank" rel="noopener noreferrer">
            <i className="fas fa-cloud"></i> API
          </a>
          <span className="footer-dot">·</span>
          <a href="https://archive.org/download/MushafAlMadinahWarsh5488865/Mushaf%20AlMadinah_Warsh.pdf" target="_blank" rel="noopener noreferrer">
            <i className="fas fa-file-pdf"></i> Warsh PDF
          </a>
          <span className="footer-dot">·</span>
          <button className="footer-link-btn" onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}>
            <i className="fas fa-gear"></i> {t('nav.settings', lang)}
          </button>
        </div>
        <p className="footer-verse">﴿ إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ ﴾</p>
      </footer>
    </div>
  );
}

