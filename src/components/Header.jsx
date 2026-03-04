import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { t } from '../i18n';
import { toAr } from '../data/surahs';
import { getDefaultReciterId } from '../data/reciters';
import audioService from '../services/audioService';
import { clearCache } from '../services/quranAPI';
import '../styles/header.css';

export default function Header() {
  const { state, dispatch, set } = useApp();
  const { lang, theme, currentSurah, displayMode, currentPage, currentJuz, riwaya } = state;
  const [goToOpen, setGoToOpen] = useState(false);
  const [goToValue, setGoToValue] = useState('');
  const [moreOpen, setMoreOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const goToRef = useRef(null);
  const inputRef = useRef(null);
  const moreRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    if (!goToOpen && !moreOpen) return;
    const handler = (e) => {
      if (goToOpen && goToRef.current && !goToRef.current.contains(e.target)) setGoToOpen(false);
      if (moreOpen && moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [goToOpen, moreOpen]);

  // Track fullscreen state
  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  const themeLabel = theme === 'dark' ? t('settings.dark', lang) : theme === 'sepia' ? t('settings.sepia', lang) : theme === 'ocean' ? t('settings.ocean', lang) : theme === 'forest' ? t('settings.forest', lang) : theme === 'night-blue' ? t('settings.nightBlue', lang) : t('settings.light', lang);
  const cycleTheme = () => {
    const themes = ['light', 'dark', 'sepia', 'ocean', 'forest', 'night-blue'];
    const idx = themes.indexOf(theme);
    dispatch({ type: 'SET_THEME', payload: themes[(idx + 1) % themes.length] });
  };

  const applyRiwaya = (nextRiwaya) => {
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
  };

  const cycleDisplayMode = () => {
    const modes = riwaya === 'warsh' ? ['surah', 'juz'] : ['surah', 'page', 'juz'];
    const idx = modes.indexOf(displayMode);
    set({ displayMode: modes[(idx + 1) % modes.length] });
  };

  const displayModeLabel = displayMode === 'page'
    ? t('settings.pageMode', lang)
    : displayMode === 'juz'
      ? t('settings.juzMode', lang)
      : t('settings.surahMode', lang);

  // Focus input on open
  useEffect(() => {
    if (goToOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [goToOpen]);

  const handleGoTo = (e) => {
    e.preventDefault();
    const num = parseInt(goToValue);
    if (isNaN(num)) return;
    if (displayMode === 'page') {
      if (num >= 1 && num <= 604) {
        set({ currentPage: num });
        setGoToOpen(false);
        setGoToValue('');
      }
    } else if (displayMode === 'juz') {
      if (num >= 1 && num <= 30) {
        dispatch({ type: 'NAVIGATE_JUZ', payload: { juz: num } });
        setGoToOpen(false);
        setGoToValue('');
      }
    } else {
      if (num >= 1 && num <= 114) {
        dispatch({ type: 'NAVIGATE_SURAH', payload: { surah: num } });
        setGoToOpen(false);
        setGoToValue('');
      }
    }
  };

  const goToLabel = displayMode === 'page'
    ? (lang === 'fr' ? 'Page (1-604)' : lang === 'en' ? 'Page (1-604)' : 'صفحة (١-٦٠٤)')
    : displayMode === 'juz'
      ? (lang === 'fr' ? 'Juz (1-30)' : lang === 'en' ? 'Juz (1-30)' : 'جزء (١-٣٠)')
      : (lang === 'fr' ? 'Sourate (1-114)' : lang === 'en' ? 'Surah (1-114)' : 'سورة (١-١١٤)');

  const goToMax = displayMode === 'page' ? 604 : displayMode === 'juz' ? 30 : 114;

  return (
    <header className="app-header" role="banner">
      {/* Left: menu + title */}
      <div className="header-left">
        <button
          className="icon-btn"
          onClick={() => dispatch({ type: 'TOGGLE_SIDEBAR' })}
          title={t('nav.surahList', lang)}
          aria-label={t('nav.surahList', lang)}
          aria-expanded={state.sidebarOpen}
        >
          <i className="fas fa-bars" aria-hidden="true"></i>
        </button>
        <h1 className="header-title">
          <i className="fas fa-book-quran header-logo" aria-hidden="true"></i>
          <span>MushafPlus</span>
        </h1>
        
        {/* Riwayat selector - desktop */}
        <div className="riwayat-selector hide-mobile">
          <button
            className={`riwayat-btn ${riwaya === 'hafs' ? 'active' : ''}`}
            onClick={() => applyRiwaya('hafs')}
            title={t('settings.hafs', lang)}
            aria-pressed={riwaya === 'hafs'}
          >
            <span className="riwayat-text">{t('settings.hafs', lang)}</span>
            <span className="riwayat-indicator"></span>
          </button>
          <div className="riwayat-divider"></div>
          <button
            className={`riwayat-btn ${riwaya === 'warsh' ? 'active' : ''}`}
            onClick={() => applyRiwaya('warsh')}
            title={t('settings.warsh', lang)}
            aria-pressed={riwaya === 'warsh'}
          >
            <span className="riwayat-text">{t('settings.warsh', lang)}</span>
            <span className="riwayat-indicator"></span>
          </button>
        </div>
      </div>

      {/* Center: info + go-to */}
      <div className="header-center" ref={goToRef}>
        <button
          className="header-info goto-trigger"
          onClick={() => setGoToOpen(!goToOpen)}
          title={lang === 'fr' ? 'Aller à…' : lang === 'ar' ? 'اذهب إلى…' : 'Go to…'}
        >
          <span>
            {displayMode === 'page'
              ? `${t('quran.page', lang)} ${lang === 'ar' ? toAr(currentPage) : currentPage} / 604`
              : displayMode === 'juz'
                ? `${t('sidebar.juz', lang)} ${lang === 'ar' ? toAr(currentJuz) : currentJuz} / 30`
                : `${t('quran.surah', lang)} ${lang === 'ar' ? toAr(currentSurah) : currentSurah}`
            }
          </span>
          <i className="fas fa-chevron-down goto-arrow"></i>
        </button>

        {goToOpen && (
          <div className="goto-dropdown">
            <form onSubmit={handleGoTo} className="goto-form">
              <label className="goto-label">{goToLabel}</label>
              <div className="goto-input-row">
                <input
                  ref={inputRef}
                  type="number"
                  min={1}
                  max={goToMax}
                  value={goToValue}
                  onChange={e => setGoToValue(e.target.value)}
                  placeholder="#"
                  className="goto-input"
                />
                <button type="submit" className="goto-btn">
                  <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Right: actions */}
      <div className="header-right">
        {/* Always visible on all devices */}
        <button
          className="icon-btn"
          onClick={() => dispatch({ type: 'TOGGLE_SEARCH' })}
          title={t('nav.search', lang)}
        >
          <i className="fas fa-search"></i>
        </button>

        <button
          className="icon-btn"
          onClick={() => dispatch({ type: 'TOGGLE_BOOKMARKS' })}
          title={t('nav.bookmarks', lang)}
        >
          <i className="fas fa-bookmark"></i>
        </button>

        <button
          className="icon-btn"
          onClick={() => dispatch({ type: 'TOGGLE_SETTINGS' })}
          title={t('nav.settings', lang)}
        >
          <i className="fas fa-gear"></i>
        </button>

        {/* Mobile "More" dropdown — visible only on mobile */}
        <div className="header-more" ref={moreRef}>
          <button
            className="icon-btn"
            onClick={() => setMoreOpen(!moreOpen)}
            title={lang === 'fr' ? 'Plus d\'actions' : 'More actions'}
          >
            <i className="fas fa-ellipsis-vertical"></i>
          </button>
          {moreOpen && (
            <div className="more-dropdown">
              {/* Riwaya quick switch */}
              <div className="more-section-label">
                <i className="fas fa-book-quran"></i>
                <span>{t('settings.riwaya', lang)}</span>
              </div>
              <div className="riwayat-toggle-row">
                <button
                  className={`riwayat-toggle-btn ${riwaya === 'hafs' ? 'active' : ''}`}
                  onClick={() => { applyRiwaya('hafs'); setMoreOpen(false); }}
                >
                  <span className="riwayat-toggle-text">{t('settings.hafs', lang)}</span>
                  <span className="riwayat-toggle-desc">عاصم</span>
                </button>
                <button
                  className={`riwayat-toggle-btn ${riwaya === 'warsh' ? 'active' : ''}`}
                  onClick={() => { applyRiwaya('warsh'); setMoreOpen(false); }}
                >
                  <span className="riwayat-toggle-text">{t('settings.warsh', lang)}</span>
                  <span className="riwayat-toggle-desc">ورش</span>
                </button>
              </div>

              {/* Display mode quick switch */}
              <div className="more-section-label">
                <i className="fas fa-eye"></i>
                <span>{lang === 'fr' ? 'Mode de lecture' : lang === 'ar' ? 'طريقة العرض' : 'Reading mode'}</span>
              </div>
              <div className="more-toggle-row">
                <button
                  className={`more-chip ${displayMode === 'surah' ? 'active' : ''}`}
                  onClick={() => { set({ displayMode: 'surah' }); setMoreOpen(false); }}
                >
                  {t('settings.surahMode', lang)}
                </button>
                <button
                  className={`more-chip ${displayMode === 'page' ? 'active' : ''}`}
                  onClick={() => { set({ displayMode: 'page' }); setMoreOpen(false); }}
                  disabled={riwaya === 'warsh'}
                >
                  {t('settings.pageMode', lang)}
                </button>
                <button
                  className={`more-chip ${displayMode === 'juz' ? 'active' : ''}`}
                  onClick={() => { set({ displayMode: 'juz' }); setMoreOpen(false); }}
                >
                  {t('settings.juzMode', lang)}
                </button>
              </div>

              <div className="more-divider"></div>

              <button className="more-item" onClick={() => { dispatch({ type: 'TOGGLE_WIRD' }); setMoreOpen(false); }}>
                <i className="fas fa-bullseye"></i>
                <span>{t('wird.title', lang)}</span>
              </button>
              <button className="more-item" onClick={() => { dispatch({ type: 'TOGGLE_HISTORY' }); setMoreOpen(false); }}>
                <i className="fas fa-clock-rotate-left"></i>
                <span>{t('readingHistory.title', lang)}</span>
              </button>
              <button className="more-item" onClick={() => { dispatch({ type: 'TOGGLE_PLAYLIST' }); setMoreOpen(false); }}>
                <i className="fas fa-list"></i>
                <span>{t('playlist.title', lang)}</span>
              </button>
              <div className="more-divider"></div>
              <button className="more-item" onClick={() => { cycleTheme(); setMoreOpen(false); }}>
                <i className={`fas ${theme === 'dark' || theme === 'night-blue' ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true"></i>
                <span>{lang === 'ar' ? 'الوضع الليلي' : t('settings.darkMode', lang)}: {themeLabel}</span>
              </button>
              <button className="more-item" onClick={() => { toggleFullscreen(); setMoreOpen(false); }}>
                <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`} aria-hidden="true"></i>
                <span>
                  {isFullscreen
                    ? (lang === 'fr' ? 'Quitter plein écran' : lang === 'ar' ? 'إنهاء ملء الشاشة' : 'Exit fullscreen')
                    : (lang === 'fr' ? 'Plein écran' : lang === 'ar' ? 'ملء الشاشة' : 'Fullscreen')}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Desktop-only buttons (hidden on mobile via CSS) */}
        <button
          className="icon-btn hide-mobile"
          onClick={() => dispatch({ type: 'TOGGLE_WIRD' })}
          title={t('wird.title', lang)}
        >
          <i className="fas fa-bullseye"></i>
        </button>

        <button
          className="icon-btn hide-mobile"
          onClick={() => dispatch({ type: 'TOGGLE_HISTORY' })}
          title={t('readingHistory.title', lang)}
        >
          <i className="fas fa-clock-rotate-left"></i>
        </button>

        <button
          className="icon-btn hide-mobile"
          onClick={() => dispatch({ type: 'TOGGLE_PLAYLIST' })}
          title={t('playlist.title', lang)}
        >
          <i className="fas fa-list"></i>
        </button>

        <button
          className="icon-btn hide-mobile"
          onClick={cycleTheme}
          title={t('settings.darkMode', lang)}
        >
          <i className={`fas ${theme === 'dark' || theme === 'night-blue' ? 'fa-sun' : 'fa-moon'}`}></i>
        </button>

        <button
          className="icon-btn hide-mobile"
          onClick={toggleFullscreen}
          title={isFullscreen
            ? (lang === 'fr' ? 'Quitter plein écran' : lang === 'ar' ? 'إنهاء ملء الشاشة' : 'Exit fullscreen')
            : (lang === 'fr' ? 'Plein écran' : lang === 'ar' ? 'ملء الشاشة' : 'Fullscreen')}
        >
          <i className={`fas ${isFullscreen ? 'fa-compress' : 'fa-expand'}`}></i>
        </button>
      </div>
    </header>
  );
}
