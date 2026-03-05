import React from 'react';
import { useApp } from '../context/AppContext';
import { t, LANGUAGES } from '../i18n';
import { downloadExport, importFromFile } from '../services/exportService';
import { clearCache } from '../services/quranAPI';
import audioService from '../services/audioService';
import { getDefaultReciterId, getReciter } from '../data/reciters';
import '../styles/settings-modal.css';

export default function SettingsModal() {
  const { state, dispatch, set } = useApp();
  const {
    lang, theme, riwaya, reciter, fontSize, showTranslation, showTajwid,
    showWordByWord, showTransliteration, showWordTranslation,
    translationLang, displayMode, fontFamily, warshStrictMode,
    syncOffsetsMs, autoNightMode, nightStart, nightEnd, nightTheme, dayTheme
  } = state;
  const syncKey = `${riwaya}:${reciter}`;
  const syncOffsetMs = Number(syncOffsetsMs?.[syncKey] ?? 0);
  const reciterObj = getReciter(reciter, riwaya);

  const close = () => dispatch({ type: 'TOGGLE_SETTINGS' });

  // Font options — same categories as quranwbw.com
  const FONT_CATEGORIES = [
    {
      label: lang === 'fr' ? 'Écriture Ottomane (Uthmanique)' : 'Uthmanic Script',
      fonts: [
        {
          id: 'mushaf-1441h',
          label: 'Mushaf 1441H',
          hint: lang === 'fr' ? 'Police officielle du Complexe du Roi Fahd' : 'Official King Fahd Complex font',
          css: "'KFGQPC Uthmanic Script HAFS','ME Quran','Amiri Quran','Scheherazade New',serif",
        },
        {
          id: 'mushaf-tajweed',
          label: 'Mushaf Tajweed 1441H',
          hint: lang === 'fr' ? 'Avec coloration Tajwid' : 'With Tajweed coloring',
          css: "'KFGQPC Uthmanic Script HAFS','ME Quran','Amiri Quran','Scheherazade New',serif",
        },
        {
          id: 'uthmanic-digital',
          label: lang === 'fr' ? 'Police Numérique (Digital Font)' : 'Digital Font',
          hint: 'ME Quran V2 · quranwbw.com',
          css: "'ME Quran','KFGQPC Uthmanic Script HAFS','Amiri Quran','Scheherazade New',serif",
        },
        {
          id: 'uthmanic-bold',
          label: lang === 'fr' ? 'Police Numérique Gras (Digital Bold)' : 'Digital Bold Font',
          hint: 'ME Quran Bold V2 · quranwbw.com',
          css: "'ME Quran Bold','ME Quran','KFGQPC Uthmanic Script HAFS','Amiri Quran',serif",
          bold: true,
        },
      ],
    },
    {
      label: lang === 'fr' ? 'Style Indopak / Nastaleeq' : 'Indopak / Nastaleeq',
      fonts: [
        {
          id: 'qalam-madinah',
          label: lang === 'fr' ? 'Qalam – Édition Madinah' : 'Qalam Digital (Madinah Edition)',
          hint: 'Qalam Digital Font · Madinah Edition',
          css: "'Qalam Madinah','Scheherazade New','Noto Naskh Arabic',serif",
        },
        {
          id: 'qalam-hanafi',
          label: lang === 'fr' ? 'Qalam – Édition Hanafi' : 'Qalam Digital (Hanafi Edition)',
          hint: 'Qalam Digital Font · Hanafi Edition',
          css: "'Qalam Hanafi','Scheherazade New','Noto Naskh Arabic',serif",
        },
        {
          id: 'uthman-taha',
          label: lang === 'fr' ? 'Uthman Taha (Numérique)' : 'Uthman Taha Digital Font',
          hint: 'KFGQPC Uthman Taha',
          css: "'Uthman Taha Hafs','KFGQPC Uthmanic Script HAFS','ME Quran',serif",
        },
      ],
    },
  ];
  const FONT_OPTIONS = FONT_CATEGORIES.flatMap(c => c.fonts);

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const result = await importFromFile(file);
          alert(`${t('export.importSuccess', lang)}: ${result.bookmarks} bookmarks, ${result.notes} notes`);
          window.location.reload();
        } catch (err) {
          alert(t('errors.generic', lang));
        }
      }
    };
    input.click();
  };

  const applyRiwaya = (nextRiwaya) => {
    if (nextRiwaya === riwaya) return;
    const fallbackReciter = getDefaultReciterId(nextRiwaya);
    audioService.stop();
    clearCache();
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

  return (
    <div
      className="modal-overlay"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={t('settings.title', lang)}
    >
      <div className="modal modal-settings" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{t('settings.title', lang)}</h2>
          <button className="icon-btn" onClick={close} aria-label={lang === 'ar' ? 'إغلاق' : lang === 'fr' ? 'Fermer' : 'Close'}>
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        <div className="settings-body">

          {/* ── Section : Apparence ── */}
          <div className="settings-section-title">
            <i className="fas fa-palette" aria-hidden="true"></i>
            {lang === 'ar' ? 'المظهر' : lang === 'fr' ? 'Apparence' : 'Appearance'}
          </div>

          {/* Language */}
          <div className="setting-group">
            <label className="setting-label">{t('settings.language', lang)}</label>
            <div className="setting-options">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  className={`chip ${lang === l.code ? 'active' : ''}`}
                  onClick={() => dispatch({ type: 'SET_LANG', payload: l.code })}
                  aria-pressed={lang === l.code}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div className="setting-group">
            <label className="setting-label">{t('settings.darkMode', lang)}</label>
            <div className="setting-options theme-grid">
              <button
                className={`chip theme-chip ${theme === 'light' ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_THEME', payload: 'light' })}
                aria-pressed={theme === 'light'}
              >
                <i className="fas fa-sun" aria-hidden="true"></i> {t('settings.light', lang)}
              </button>
              <button
                className={`chip theme-chip ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_THEME', payload: 'dark' })}
                aria-pressed={theme === 'dark'}
              >
                <i className="fas fa-moon" aria-hidden="true"></i> {t('settings.dark', lang)}
              </button>
              <button
                className={`chip theme-chip ${theme === 'sepia' ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_THEME', payload: 'sepia' })}
                aria-pressed={theme === 'sepia'}
              >
                <span className="theme-dot" style={{ background: '#A1887F' }}></span> {t('settings.sepia', lang)}
              </button>
              <button
                className={`chip theme-chip ${theme === 'ocean' ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_THEME', payload: 'ocean' })}
                aria-pressed={theme === 'ocean'}
              >
                <span className="theme-dot" style={{ background: '#0288D1' }}></span> {t('settings.ocean', lang)}
              </button>
              <button
                className={`chip theme-chip ${theme === 'forest' ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_THEME', payload: 'forest' })}
                aria-pressed={theme === 'forest'}
              >
                <span className="theme-dot" style={{ background: '#43A047' }}></span> {t('settings.forest', lang)}
              </button>
              <button
                className={`chip theme-chip ${theme === 'night-blue' ? 'active' : ''}`}
                onClick={() => dispatch({ type: 'SET_THEME', payload: 'night-blue' })}
                aria-pressed={theme === 'night-blue'}
              >
                <span className="theme-dot" style={{ background: '#64FFDA' }}></span> {t('settings.nightBlue', lang)}
              </button>
            </div>
          </div>

          {/* Auto Night Mode */}
          <div className="setting-group">
            <label className="toggle-row">
              <span>
                <i className="fas fa-cloud-moon" style={{ marginInlineEnd: '0.3rem' }} aria-hidden="true"></i>
                {t('autoNight.title', lang)}
              </span>
              <button
                className={`toggle-switch ${autoNightMode ? 'on' : ''}`}
                onClick={() => set({ autoNightMode: !autoNightMode })}
                aria-pressed={autoNightMode}
                aria-label={t('autoNight.title', lang)}
              >
                <span className="toggle-knob"></span>
              </button>
            </label>
            <p className="setting-hint">{t('autoNight.hint', lang)}</p>
            {autoNightMode && (
              <div className="auto-night-options">
                <div className="auto-night-row">
                  <label className="auto-night-label">
                    <i className="fas fa-moon" aria-hidden="true"></i> {t('autoNight.nightStart', lang)}
                  </label>
                  <input
                    type="time"
                    value={nightStart}
                    onChange={e => set({ nightStart: e.target.value })}
                    className="auto-night-time"
                  />
                </div>
                <div className="auto-night-row">
                  <label className="auto-night-label">
                    <i className="fas fa-sun" aria-hidden="true"></i> {t('autoNight.nightEnd', lang)}
                  </label>
                  <input
                    type="time"
                    value={nightEnd}
                    onChange={e => set({ nightEnd: e.target.value })}
                    className="auto-night-time"
                  />
                </div>
                <div className="auto-night-row">
                  <label className="auto-night-label">{t('autoNight.dayTheme', lang)}</label>
                  <select
                    value={dayTheme}
                    onChange={e => set({ dayTheme: e.target.value })}
                    className="auto-night-select"
                  >
                    <option value="light">{t('settings.light', lang)}</option>
                    <option value="sepia">{t('settings.sepia', lang)}</option>
                    <option value="ocean">{t('settings.ocean', lang)}</option>
                    <option value="forest">{t('settings.forest', lang)}</option>
                  </select>
                </div>
                <div className="auto-night-row">
                  <label className="auto-night-label">{t('autoNight.nightTheme', lang)}</label>
                  <select
                    value={nightTheme}
                    onChange={e => set({ nightTheme: e.target.value })}
                    className="auto-night-select"
                  >
                    <option value="dark">{t('settings.dark', lang)}</option>
                    <option value="night-blue">{t('settings.nightBlue', lang)}</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ── Section : Riwaya & Lecture ── */}
          <div className="settings-section-title">
            <i className="fas fa-book-quran" aria-hidden="true"></i>
            {lang === 'ar' ? 'القراءة والرواية' : lang === 'fr' ? 'Riwaya & Lecture' : 'Riwaya & Reading'}
          </div>

          {/* Riwaya */}
          <div className="setting-group">
            <label className="setting-label">{t('settings.riwaya', lang)}</label>
            <div className="setting-options">
              <button
                className={`chip ${riwaya === 'hafs' ? 'active' : ''}`}
                onClick={() => applyRiwaya('hafs')}
                aria-pressed={riwaya === 'hafs'}
              >
                {t('settings.hafs', lang)}
              </button>
              <button
                className={`chip ${riwaya === 'warsh' ? 'active' : ''}`}
                onClick={() => applyRiwaya('warsh')}
                aria-pressed={riwaya === 'warsh'}
              >
                {t('settings.warsh', lang)}
              </button>
            </div>
            <p className="setting-hint">{t('settings.riwayaHint', lang)}</p>
            {riwaya === 'warsh' && (
              <div className="warsh-settings-note warsh-note-qcf4">
                <i className="fas fa-check-circle" aria-hidden="true"></i>
                <span>{t('settings.warshTextNote', lang)}</span>
              </div>
            )}
          </div>

          {/* Warsh strict mode */}
          {riwaya === 'warsh' && (
            <div className="setting-group">
              <label className="toggle-row">
                <span>{lang === 'fr' ? 'Mode Warsh strict' : lang === 'ar' ? 'وضع ورش الصارم' : 'Warsh strict mode'}</span>
                <button
                  className={`toggle-switch ${warshStrictMode ? 'on' : ''}`}
                  onClick={() => set({ warshStrictMode: !warshStrictMode })}
                  aria-pressed={warshStrictMode}
                >
                  <span className="toggle-knob"></span>
                </button>
              </label>
              <p className="setting-hint">
                {lang === 'fr'
                  ? 'Refuse tout fallback Hafs quand Warsh est sélectionné.'
                  : lang === 'ar'
                    ? 'يرفض أي بديل حفص عند اختيار ورش.'
                    : 'Rejects any Hafs fallback when Warsh is selected.'}
              </p>
            </div>
          )}

          {/* Per-reciter sync offset */}
          <div className="setting-group">
            <label className="setting-label">
              {lang === 'fr' ? 'Décalage synchro audio' : lang === 'ar' ? 'إزاحة مزامنة الصوت' : 'Audio sync offset'}: {syncOffsetMs} ms
            </label>
            <input
              type="range"
              min={-500}
              max={500}
              step={10}
              value={syncOffsetMs}
              onChange={e => {
                const value = Math.max(-500, Math.min(500, parseInt(e.target.value, 10) || 0));
                set({
                  syncOffsetsMs: {
                    ...(syncOffsetsMs || {}),
                    [syncKey]: value,
                  },
                });
              }}
              className="setting-slider"
              aria-label={`${lang === 'fr' ? 'Décalage synchro' : 'Sync offset'}: ${syncOffsetMs} ms`}
            />
            <p className="setting-hint">
              {(reciterObj?.nameFr || reciterObj?.nameEn || reciterObj?.name || reciter)} · {riwaya.toUpperCase()} · [-500 / +500]ms
            </p>
          </div>

          {/* Display mode */}
          <div className="setting-group">
            <label className="setting-label">{t('settings.displayMode', lang)}</label>
            <p className="setting-hint">
              {riwaya === 'warsh'
                ? (lang === 'fr' ? 'Mode page indisponible pour Warsh (QCF4 par sourate)' : lang === 'ar' ? 'وضع الصفحة غير متاح لورش' : 'Page mode unavailable for Warsh (QCF4 by surah)')
                : (lang === 'fr' ? 'Choisissez comment le Coran est affiché' : lang === 'ar' ? 'اختر طريقة عرض القرآن' : 'Choose how the Quran is displayed')}
            </p>
            <div className="display-mode-options">
              <button
                className={`chip display-mode-chip ${displayMode === 'surah' ? 'active' : ''}`}
                onClick={() => set({ displayMode: 'surah' })}
                aria-pressed={displayMode === 'surah'}
              >
                <i className="fas fa-list-ul" aria-hidden="true"></i>
                <span>{t('settings.surahMode', lang)}</span>
                <span className="mode-hint">{lang === 'fr' ? 'Par sourate' : lang === 'ar' ? 'سورة' : 'By surah'}</span>
              </button>
              <button
                className={`chip display-mode-chip ${displayMode === 'page' ? 'active' : ''}`}
                onClick={() => set({ displayMode: 'page' })}
                disabled={riwaya === 'warsh'}
                aria-pressed={displayMode === 'page'}
                title={riwaya === 'warsh' ? (lang === 'fr' ? 'Non disponible en Warsh' : lang === 'ar' ? 'غير متاح في ورش' : 'Not available for Warsh') : ''}
              >
                <i className="fas fa-file-alt" aria-hidden="true"></i>
                <span>{t('settings.pageMode', lang)}</span>
                <span className="mode-hint">{riwaya === 'warsh' ? '⚠' : (lang === 'fr' ? 'Mushaf' : 'Page')}</span>
              </button>
              <button
                className={`chip display-mode-chip ${displayMode === 'juz' ? 'active' : ''}`}
                onClick={() => set({ displayMode: 'juz' })}
                aria-pressed={displayMode === 'juz'}
              >
                <i className="fas fa-book-open" aria-hidden="true"></i>
                <span>{t('settings.juzMode', lang)}</span>
                <span className="mode-hint">{lang === 'fr' ? 'Par juz' : lang === 'ar' ? 'جزء' : 'By juz'}</span>
              </button>
            </div>
          </div>

          {/* Continuous play */}
          <div className="setting-group">
            <label className="toggle-row">
              <span>{t('settings.continuousPlay', lang)}</span>
              <button
                className={`toggle-switch ${state.continuousPlay ? 'on' : ''}`}
                onClick={() => set({ continuousPlay: !state.continuousPlay })}
                aria-pressed={state.continuousPlay}
              >
                <span className="toggle-knob"></span>
              </button>
            </label>
            <p className="setting-hint">{t('settings.continuousPlayHint', lang)}</p>
          </div>

          {/* ── Section : Texte & Affichage ── */}
          <div className="settings-section-title">
            <i className="fas fa-font" aria-hidden="true"></i>
            {lang === 'ar' ? 'النص والعرض' : lang === 'fr' ? 'Texte & Affichage' : 'Text & Display'}
          </div>

          {/* Font size */}
          <div className="setting-group">
            <label className="setting-label">{t('settings.fontSize', lang)}: {fontSize}px</label>
            <input
              type="range"
              min={18}
              max={48}
              value={fontSize}
              onChange={e => dispatch({ type: 'SET_FONT_SIZE', payload: parseInt(e.target.value) })}
              className="setting-slider"
              aria-label={`${t('settings.fontSize', lang)}: ${fontSize}px`}
            />
          </div>

          {/* Font family — grouped by category like quranwbw.com */}
          <div className="setting-group">
            <label className="setting-label">{t('settings.fontFamily', lang)}</label>
            {FONT_CATEGORIES.map(cat => (
              <div key={cat.label} className="font-category">
                <div className="font-category-label">{cat.label}</div>
                <div className="setting-options font-options">
                  {cat.fonts.map(f => (
                    <button
                      key={f.id}
                      className={`chip font-chip ${fontFamily === f.id ? 'active' : ''}`}
                      onClick={() => dispatch({ type: 'SET_FONT_FAMILY', payload: f.id })}
                      style={{ fontFamily: f.css, fontWeight: f.bold ? 700 : 400 }}
                      title={f.hint}
                      aria-pressed={fontFamily === f.id}
                    >
                      <span className="font-chip-name">بِسْمِ ٱللَّهِ</span>
                      <span className="font-chip-label">{f.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div
              className="font-preview"
              style={{
                fontFamily: FONT_OPTIONS.find(f => f.id === fontFamily)?.css || FONT_OPTIONS[0].css,
                fontWeight: FONT_OPTIONS.find(f => f.id === fontFamily)?.bold ? 700 : 400,
                fontSize: '1.4rem',
                direction: 'rtl',
                textAlign: 'center',
                marginTop: '0.5rem',
                color: 'var(--text-quran)',
                lineHeight: 2
              }}
              aria-label="Aperçu de la police"
            >
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </div>
          </div>

          {/* Translation language */}
          <div className="setting-group">
            <label className="setting-label">{t('settings.translationLang', lang)}</label>
            <div className="setting-options">
              {[
                { code: 'fr', label: 'Français' },
                { code: 'en', label: 'English' },
              ].map(l => (
                <button
                  key={l.code}
                  className={`chip ${translationLang === l.code ? 'active' : ''}`}
                  onClick={() => set({ translationLang: l.code })}
                  aria-pressed={translationLang === l.code}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="setting-group">
            <label className="toggle-row">
              <span>{t('settings.showTranslation', lang)}</span>
              <button
                className={`toggle-switch ${showTranslation ? 'on' : ''}`}
                onClick={() => set({ showTranslation: !showTranslation })}
                aria-pressed={showTranslation}
              >
                <span className="toggle-knob"></span>
              </button>
            </label>
          </div>

          <div className="setting-group">
            <label className="toggle-row">
              <span>{t('settings.showTajwid', lang)}</span>
              <button
                className={`toggle-switch ${showTajwid ? 'on' : ''}`}
                onClick={() => set({ showTajwid: !showTajwid })}
                aria-pressed={showTajwid}
              >
                <span className="toggle-knob"></span>
              </button>
            </label>
          </div>

          {/* Word-by-Word Mode */}
          <div className="setting-group">
            <label className="toggle-row">
              <span>
                <i className="fas fa-layer-group" style={{ marginInlineEnd: '0.3rem' }} aria-hidden="true"></i>
                {lang === 'fr' ? 'Mode mot à mot' : lang === 'ar' ? 'وضع كلمة بكلمة' : 'Word-by-word mode'}
              </span>
              <button
                className={`toggle-switch ${showWordByWord ? 'on' : ''}`}
                onClick={() => set({ showWordByWord: !showWordByWord })}
                aria-pressed={showWordByWord}
              >
                <span className="toggle-knob"></span>
              </button>
            </label>
            <p className="setting-hint">
              {lang === 'fr'
                ? 'Affiche chaque mot avec sa traduction et translittération'
                : lang === 'ar'
                  ? 'يعرض كل كلمة مع ترجمتها ونطقها'
                  : 'Shows each word with its translation and transliteration'}
            </p>
            
            {showWordByWord && (
              <div className="wbw-sub-options" style={{ marginTop: '0.75rem', paddingInlineStart: '1rem' }}>
                <label className="toggle-row sub-toggle">
                  <span>{lang === 'fr' ? 'Translittération' : lang === 'ar' ? 'النطق اللاتيني' : 'Transliteration'}</span>
                  <button
                    className={`toggle-switch ${showTransliteration ? 'on' : ''}`}
                    onClick={() => set({ showTransliteration: !showTransliteration })}
                    aria-pressed={showTransliteration}
                  >
                    <span className="toggle-knob"></span>
                  </button>
                </label>
                <label className="toggle-row sub-toggle" style={{ marginTop: '0.5rem' }}>
                  <span>{lang === 'fr' ? 'Traduction par mot' : lang === 'ar' ? 'ترجمة كل كلمة' : 'Word translation'}</span>
                  <button
                    className={`toggle-switch ${showWordTranslation ? 'on' : ''}`}
                    onClick={() => set({ showWordTranslation: !showWordTranslation })}
                    aria-pressed={showWordTranslation}
                  >
                    <span className="toggle-knob"></span>
                  </button>
                </label>
              </div>
            )}
          </div>

          {/* ── Section : Données ── */}
          <div className="settings-section-title">
            <i className="fas fa-database" aria-hidden="true"></i>
            {lang === 'ar' ? 'البيانات' : lang === 'fr' ? 'Données' : 'Data'}
          </div>

          {/* Export / Import */}
          <div className="setting-group">
            <label className="setting-label">{t('export.title', lang)}</label>
            <div className="setting-options">
              <button className="chip" onClick={downloadExport}>
                <i className="fas fa-download" aria-hidden="true"></i> {t('export.export', lang)}
              </button>
              <button className="chip" onClick={handleImport}>
                <i className="fas fa-upload" aria-hidden="true"></i> {t('export.import', lang)}
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div className="setting-group">
            <label className="setting-label">
              <i className="fas fa-keyboard" style={{ marginInlineEnd: '0.3rem' }} aria-hidden="true"></i>
              {lang === 'ar' ? 'اختصارات لوحة المفاتيح' : lang === 'fr' ? 'Raccourcis clavier' : 'Keyboard shortcuts'}
            </label>
            <div className="shortcuts-grid">
              <div className="shortcut-item">
                <kbd>←</kbd> <kbd>→</kbd>
                <span>{lang === 'ar' ? 'التنقل (سورة/صفحة/جزء)' : lang === 'fr' ? 'Naviguer (sourate/page/juz)' : 'Navigate (surah/page/juz)'}</span>
              </div>
              <div className="shortcut-item">
                <kbd>{lang === 'fr' ? 'Espace' : lang === 'ar' ? 'مسافة' : 'Space'}</kbd>
                <span>{lang === 'ar' ? 'تشغيل / إيقاف الصوت' : lang === 'fr' ? 'Lecture / Pause audio' : 'Play / Pause audio'}</span>
              </div>
              <div className="shortcut-item">
                <kbd>Ctrl</kbd>+<kbd>K</kbd>
                <span>{lang === 'ar' ? 'فتح البحث' : lang === 'fr' ? 'Ouvrir la recherche' : 'Open search'}</span>
              </div>
              <div className="shortcut-item">
                <kbd>{lang === 'fr' ? 'Échap' : lang === 'ar' ? 'Esc' : 'Esc'}</kbd>
                <span>{lang === 'ar' ? 'إغلاق النافذة' : lang === 'fr' ? 'Fermer le modal' : 'Close modal'}</span>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="setting-group about-section">
            <label className="setting-label">
              <i className="fas fa-info-circle" style={{ marginInlineEnd: '0.3rem' }} aria-hidden="true"></i>
              {lang === 'ar' ? 'عن التطبيق' : lang === 'fr' ? 'À propos' : 'About'}
            </label>
            <div className="about-content">
              <div className="about-brand">
                <i className="fas fa-book-quran about-logo" aria-hidden="true"></i>
                <div>
                  <strong>MushafPlus</strong>
                  <span className="about-version">v1.1.0</span>
                </div>
              </div>
              <p className="about-desc">
                {lang === 'ar'
                  ? 'تطبيق لقراءة القرآن الكريم مع دعم حفص وورش، تجويد ملوّن، صوت متزامن والمزيد.'
                  : lang === 'fr'
                    ? 'Application de lecture du Saint Coran avec support Hafs & Warsh, tajweed coloré, audio synchronisé, et bien plus.'
                    : 'Holy Quran reader with Hafs & Warsh support, colored tajweed, synchronized audio, and more.'}
              </p>
              <div className="about-links">
                <a href="https://alquran.cloud/api" target="_blank" rel="noopener noreferrer" className="about-link">
                  <i className="fas fa-cloud" aria-hidden="true"></i> Al Quran Cloud API
                </a>
                <a href="https://fonts.qurancomplex.gov.sa/" target="_blank" rel="noopener noreferrer" className="about-link">
                  <i className="fas fa-font" aria-hidden="true"></i> {lang === 'fr' ? 'Polices QCF4 (Complexe Roi Fahd)' : lang === 'ar' ? 'خطوط QCF4 (مجمع الملك فهد)' : 'QCF4 Fonts (King Fahd Complex)'}
                </a>
                <a href="https://archive.org/download/MushafAlMadinahWarsh5488865/Mushaf%20AlMadinah_Warsh.pdf" target="_blank" rel="noopener noreferrer" className="about-link">
                  <i className="fas fa-file-pdf" aria-hidden="true"></i> {lang === 'ar' ? 'مصحف ورش (PDF)' : lang === 'fr' ? 'Mushaf Warsh (PDF)' : 'Warsh Mushaf (PDF)'}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
