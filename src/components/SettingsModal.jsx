import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { t, LANGUAGES } from '../i18n';
import { downloadExport, importFromFile } from '../services/exportService';
import { clearCache } from '../services/quranAPI';
import audioService from '../services/audioService';
import { getDefaultReciterId, getReciter, getRecitersByRiwaya } from '../data/reciters';
import PlatformLogo from './PlatformLogo';
import '../styles/settings-modal.css';

const TABS = [
  { id: 'apparence', icon: 'fa-palette',     fr: 'Apparence', ar: 'المظهر',    en: 'Appearance' },
  { id: 'coran',     icon: 'fa-book-quran',  fr: 'Coran',     ar: 'القرآن',   en: 'Quran' },
  { id: 'texte',     icon: 'fa-font',        fr: 'Texte',     ar: 'النص',     en: 'Text' },
  { id: 'audio',     icon: 'fa-volume-high', fr: 'Audio',     ar: 'الصوت',    en: 'Audio' },
  { id: 'donnees',   icon: 'fa-database',    fr: 'Données',   ar: 'البيانات', en: 'Data' },
  { id: 'outils',    icon: 'fa-screwdriver-wrench', fr: 'Outils', ar: 'الأدوات', en: 'Tools' },
];

const THEMES = [
  { id: 'light',      fr: 'Clair',  ar: 'فاتح',  en: 'Light',  bg: '#FFFFFF', border: '#e2e8f0', text: '#1e293b' },
  { id: 'dark',       fr: 'Sombre', ar: 'داكن',  en: 'Dark',   bg: '#1e1e1e', border: '#444',    text: '#e2e8f0' },
  { id: 'oled',       fr: 'OLED',   ar: 'أوليد', en: 'OLED',   bg: '#000000', border: '#1a1a1a', text: '#f0f0f0' },
  { id: 'sepia',      fr: 'Sépia',  ar: 'سيبيا', en: 'Sepia',  bg: '#f5efe4', border: '#c8a97a', text: '#5c4a2a' },
  { id: 'ocean',      fr: 'Océan',  ar: 'محيط',  en: 'Ocean',  bg: '#0a1628', border: '#1a3a5c', text: '#93c5fd' },
  { id: 'forest',     fr: 'Forêt',  ar: 'غابة',  en: 'Forest', bg: '#0d1f0f', border: '#1a3d1c', text: '#86efac' },
  { id: 'night-blue', fr: 'Nuit',   ar: 'ليلي',  en: 'Night',  bg: '#0f172a', border: '#1e2d4d', text: '#c7d2fe' },
];

const TRANSLATION_LANGUAGE_OPTIONS = [
  { code: 'fr', fr: 'Français', ar: 'الفرنسية', en: 'French' },
  { code: 'en', fr: 'Anglais', ar: 'الإنجليزية', en: 'English' },
  { code: 'es', fr: 'Espagnol', ar: 'الإسبانية', en: 'Spanish' },
  { code: 'de', fr: 'Allemand', ar: 'الألمانية', en: 'German' },
  { code: 'tr', fr: 'Turc', ar: 'التركية', en: 'Turkish' },
  { code: 'ur', fr: 'Ourdou', ar: 'الأردية', en: 'Urdu' },
];

const WORD_TRANSLATION_LANGUAGE_OPTIONS = [
  { code: 'fr', fr: 'Français', ar: 'الفرنسية', en: 'French' },
  { code: 'en', fr: 'Anglais', ar: 'الإنجليزية', en: 'English' },
];

export default function SettingsModal() {
  const { state, dispatch, set } = useApp();
  const {
    lang, theme, riwaya, reciter, quranFontSize, showTranslation, showTajwid,
    showWordByWord, showTransliteration, showWordTranslation,
    translationLang, wordTranslationLang, displayMode, fontFamily, warshStrictMode,
    syncOffsetsMs, autoNightMode, nightStart, nightEnd, nightTheme, dayTheme
  } = state;
  const syncKey = `${riwaya}:${reciter}`;
  const syncOffsetMs = Number(syncOffsetsMs?.[syncKey] ?? 0);
  const reciterObj = getReciter(reciter, riwaya);
  const [fontFilter, setFontFilter] = useState('');
  const [activeTab, setActiveTab] = useState('apparence');

  const close = () => dispatch({ type: 'TOGGLE_SETTINGS' });
  const tabLabel = (tab) => lang === 'ar' ? tab.ar : lang === 'fr' ? tab.fr : tab.en;
  const translationLanguageHint =
    lang === 'fr'
      ? 'Choisissez la langue affichée sous chaque verset.'
      : lang === 'ar'
        ? 'اختر لغة الترجمة المعروضة تحت كل آية.'
        : 'Choose the language shown below each verse.';
  const wordTranslationLanguageHint =
    lang === 'fr'
      ? 'Cette langue ne s’applique qu’au mot-à-mot.'
      : lang === 'ar'
        ? 'هذه اللغة خاصة بترجمة الكلمات فقط.'
        : 'This language only applies to word-by-word translation.';
  const getOptionLabel = (option) =>
    lang === 'ar' ? option.ar : lang === 'fr' ? option.fr : option.en;

  // Font options — extended library inspired by arabic-calligraphy-generator.com
  const FONT_CATEGORIES = [
    {
      label: lang === 'fr' ? 'Recommandée (sans artefacts visuels)' : 'Recommended (no rendering artifacts)',
      fonts: [
        {
          id: 'scheherazade-new',
          label: 'Scheherazade New',
          hint: lang === 'fr' ? 'Rendu optimal — aucun artefact visuel' : 'Best rendering — no visual artifacts',
          css: "'Scheherazade New','Amiri Quran','Noto Naskh Arabic',serif",
        },
        {
          id: 'amiri-quran',
          label: 'Amiri Quran',
          hint: lang === 'fr' ? 'Police Naskh classique' : 'Classic Naskh typeface',
          css: "'Amiri Quran','Scheherazade New','Noto Naskh Arabic',serif",
        },
        {
          id: 'noto-naskh-arabic',
          label: 'Noto Naskh Arabic',
          hint: lang === 'fr' ? 'Très lisible pour interface et texte' : 'Highly readable for text & UI',
          css: "'Noto Naskh Arabic','Scheherazade New','Amiri Quran',serif",
        },
        {
          id: 'markazi-text',
          label: 'Markazi Text',
          hint: lang === 'fr' ? 'Naskh classique, lecture continue' : 'Classic Naskh for long reading',
          css: "'Markazi Text','Amiri Quran','Scheherazade New',serif",
        },
        {
          id: 'el-messiri',
          label: 'El Messiri',
          hint: lang === 'fr' ? 'Style Naskh moderne pour titres/sous-titres' : 'Modern Naskh-inspired style',
          css: "'El Messiri','Noto Naskh Arabic','Scheherazade New',serif",
        },
      ],
    },
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
        {
          id: 'kfgqpc-uthman-taha-naskh',
          label: 'KFGQPC Uthman Taha Naskh',
          hint: lang === 'fr' ? 'Variante Uthman Taha Naskh demandée' : 'Requested Uthman Taha Naskh variant',
          css: "'KFGQPC Uthman Taha Naskh','Uthman Taha Hafs','ME Quran',serif",
        },
      ],
    },
    {
      label: lang === 'fr' ? 'Kufi & Diwani' : 'Kufi & Diwani',
      fonts: [
        {
          id: 'reem-kufi',
          label: 'Reem Kufi',
          hint: lang === 'fr' ? 'Kufi géométrique moderne' : 'Geometric modern Kufi',
          css: "'Reem Kufi','Cairo','Noto Naskh Arabic',sans-serif",
        },
        {
          id: 'aref-ruqaa',
          label: 'Aref Ruqaa',
          hint: lang === 'fr' ? 'Style calligraphique décoratif' : 'Decorative calligraphic style',
          css: "'Aref Ruqaa','Scheherazade New','Amiri Quran',serif",
        },
      ],
    },
    {
      label: lang === 'fr' ? 'Modernes UI / Sans-serif' : 'Modern UI / Sans-serif',
      fonts: [
        { id: 'cairo', label: 'Cairo', hint: 'Modern UI', css: "'Cairo','Noto Naskh Arabic',sans-serif" },
        { id: 'harmattan', label: 'Harmattan', hint: 'Clean digital', css: "'Harmattan','Cairo',sans-serif" },
        { id: 'mada', label: 'Mada', hint: 'Geometric minimal', css: "'Mada','Cairo',sans-serif" },
        { id: 'tajawal', label: 'Tajawal', hint: 'Versatile UI font', css: "'Tajawal','Cairo',sans-serif" },
        { id: 'lemonada', label: 'Lemonada', hint: 'Rounded friendly', css: "'Lemonada','Cairo',sans-serif" },
      ],
    },
    {
      label: lang === 'fr' ? 'Display / Titres' : 'Display / Headlines',
      fonts: [
        { id: 'jomhuria', label: 'Jomhuria', hint: 'Bold display', css: "'Jomhuria','Cairo',sans-serif" },
        { id: 'rakkas', label: 'Rakkas', hint: 'Decorative display', css: "'Rakkas','Cairo',sans-serif" },
        { id: 'marhey', label: 'Marhey', hint: 'Playful display', css: "'Marhey','Cairo',sans-serif" },
      ],
    },
    {
      label: lang === 'fr' ? 'Nastaliq / Littéraire' : 'Nastaliq / Literary',
      fonts: [
        { id: 'lateef', label: 'Lateef', hint: 'Flowing literary', css: "'Lateef','Scheherazade New','Amiri',serif" },
        { id: 'mirza', label: 'Mirza', hint: 'Persian-influenced', css: "'Mirza','Lateef',serif" },
      ],
    },
  ];
  const FONT_OPTIONS = FONT_CATEGORIES.flatMap(c => c.fonts);
  const normalizedFontFilter = fontFilter.trim().toLowerCase();
  const FILTERED_FONT_CATEGORIES = !normalizedFontFilter
    ? FONT_CATEGORIES
    : FONT_CATEGORIES
      .map(cat => ({
        ...cat,
        fonts: cat.fonts.filter(font =>
          `${font.label} ${font.hint || ''} ${font.id}`.toLowerCase().includes(normalizedFontFilter)
        ),
      }))
      .filter(cat => cat.fonts.length > 0);

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
      className="settings-overlay"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={t('settings.title', lang)}
    >
      <div className="settings-dialog" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="settings-header">
          <div className="settings-header-left">
            <i className="fas fa-sliders" aria-hidden="true"></i>
            <h2 className="settings-title">{t('settings.title', lang)}</h2>
          </div>
          <button className="settings-close-btn" onClick={close} aria-label={lang === 'ar' ? 'إغلاق' : 'Fermer'}>
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        {/* ── Body: nav + content ── */}
        <div className="settings-body-layout">

          {/* Left navigation */}
          <nav className="settings-nav" aria-label="Navigation paramètres">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
              >
                <i className={`fas ${tab.icon}`} aria-hidden="true"></i>
                <span className="settings-nav-label">{tabLabel(tab)}</span>
              </button>
            ))}
          </nav>

          {/* Right content panel */}
          <div className="settings-content">

            {/* ════════════════════════════════
                TAB: Apparence
            ════════════════════════════════ */}
            {activeTab === 'apparence' && (
              <div className="settings-pane">
                <div className="settings-pane-title">
                  {lang === 'ar' ? 'المظهر' : lang === 'fr' ? 'Apparence' : 'Appearance'}
                </div>

                {/* Language */}
                <div className="settings-card">
                  <div className="settings-card-label">
                    <i className="fas fa-globe" aria-hidden="true"></i>
                    {t('settings.language', lang)}
                  </div>
                  <div className="settings-chips">
                    {LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        className={`settings-chip ${lang === l.code ? 'active' : ''}`}
                        onClick={() => dispatch({ type: 'SET_LANG', payload: l.code })}
                        aria-pressed={lang === l.code}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme swatches */}
                <div className="settings-card">
                  <div className="settings-card-label">
                    <i className="fas fa-circle-half-stroke" aria-hidden="true"></i>
                    {t('settings.darkMode', lang)}
                  </div>
                  <div className="theme-swatch-grid">
                    {THEMES.map(th => (
                      <button
                        key={th.id}
                        className={`theme-swatch-btn ${theme === th.id ? 'active' : ''}`}
                        onClick={() => dispatch({ type: 'SET_THEME', payload: th.id })}
                        aria-pressed={theme === th.id}
                        title={lang === 'fr' ? th.fr : lang === 'ar' ? th.ar : th.en}
                      >
                        <span
                          className="swatch-circle"
                          style={{ background: th.bg, border: `3px solid ${theme === th.id ? 'var(--primary)' : th.border}` }}
                        >
                          <span className="swatch-text-ar" style={{ color: th.text }}>أ</span>
                          {theme === th.id && <i className="fas fa-check swatch-check" aria-hidden="true"></i>}
                        </span>
                        <span className="swatch-label">
                          {lang === 'fr' ? th.fr : lang === 'ar' ? th.ar : th.en}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto Night Mode */}
                <div className="settings-card">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <i className="fas fa-cloud-moon" aria-hidden="true"></i>
                      <div>
                        <div className="settings-toggle-title">{t('autoNight.title', lang)}</div>
                        <div className="settings-toggle-hint">{t('autoNight.hint', lang)}</div>
                      </div>
                    </div>
                    <button
                      className={`toggle-switch ${autoNightMode ? 'on' : ''}`}
                      onClick={() => set({ autoNightMode: !autoNightMode })}
                      aria-pressed={autoNightMode}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                  </div>
                  {autoNightMode && (
                    <div className="auto-night-options">
                      <div className="auto-night-row">
                        <label className="auto-night-label">
                          <i className="fas fa-moon" aria-hidden="true"></i>
                          {t('autoNight.nightStart', lang)}
                        </label>
                        <input type="time" value={nightStart} onChange={e => set({ nightStart: e.target.value })} className="auto-night-time" />
                      </div>
                      <div className="auto-night-row">
                        <label className="auto-night-label">
                          <i className="fas fa-sun" aria-hidden="true"></i>
                          {t('autoNight.nightEnd', lang)}
                        </label>
                        <input type="time" value={nightEnd} onChange={e => set({ nightEnd: e.target.value })} className="auto-night-time" />
                      </div>
                      <div className="auto-night-row">
                        <label className="auto-night-label">{t('autoNight.dayTheme', lang)}</label>
                        <select value={dayTheme} onChange={e => set({ dayTheme: e.target.value })} className="auto-night-select">
                          <option value="light">{t('settings.light', lang)}</option>
                          <option value="sepia">{t('settings.sepia', lang)}</option>
                          <option value="ocean">{t('settings.ocean', lang)}</option>
                          <option value="forest">{t('settings.forest', lang)}</option>
                        </select>
                      </div>
                      <div className="auto-night-row">
                        <label className="auto-night-label">{t('autoNight.nightTheme', lang)}</label>
                        <select value={nightTheme} onChange={e => set({ nightTheme: e.target.value })} className="auto-night-select">
                          <option value="dark">{t('settings.dark', lang)}</option>
                          <option value="night-blue">{t('settings.nightBlue', lang)}</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                TAB: Coran
            ════════════════════════════════ */}
            {activeTab === 'coran' && (
              <div className="settings-pane">
                <div className="settings-pane-title">
                  {lang === 'ar' ? 'القرآن' : lang === 'fr' ? 'Coran' : 'Quran'}
                </div>

                {/* Riwaya */}
                <div className="settings-card">
                  <div className="settings-card-label">
                    <i className="fas fa-book-quran" aria-hidden="true"></i>
                    {t('settings.riwaya', lang)}
                  </div>
                  <div className="settings-chips">
                    <button
                      className={`settings-chip ${riwaya === 'hafs' ? 'active' : ''}`}
                      onClick={() => applyRiwaya('hafs')}
                      aria-pressed={riwaya === 'hafs'}
                    >
                      {t('settings.hafs', lang)}
                    </button>
                    <button
                      className={`settings-chip ${riwaya === 'warsh' ? 'active' : ''}`}
                      onClick={() => applyRiwaya('warsh')}
                      aria-pressed={riwaya === 'warsh'}
                    >
                      {t('settings.warsh', lang)}
                    </button>
                  </div>
                  <p className="settings-hint">{t('settings.riwayaHint', lang)}</p>
                  {riwaya === 'warsh' && (
                    <div className="settings-info-note">
                      <i className="fas fa-check-circle" aria-hidden="true"></i>
                      <span>{t('settings.warshTextNote', lang)}</span>
                    </div>
                  )}
                </div>

                {/* Warsh strict mode */}
                {riwaya === 'warsh' && (
                  <div className="settings-card">
                    <div className="settings-toggle-row">
                      <div className="settings-toggle-info">
                        <i className="fas fa-shield-halved" aria-hidden="true"></i>
                        <div>
                          <div className="settings-toggle-title">
                            {lang === 'fr' ? 'Mode Warsh strict' : lang === 'ar' ? 'وضع ورش الصارم' : 'Warsh strict mode'}
                          </div>
                          <div className="settings-toggle-hint">
                            {lang === 'fr' ? 'Refuse tout fallback Hafs quand Warsh est sélectionné.' : lang === 'ar' ? 'يرفض أي بديل حفص عند اختيار ورش.' : 'Rejects any Hafs fallback when Warsh is selected.'}
                          </div>
                        </div>
                      </div>
                      <button
                        className={`toggle-switch ${warshStrictMode ? 'on' : ''}`}
                        onClick={() => set({ warshStrictMode: !warshStrictMode })}
                        aria-pressed={warshStrictMode}
                      >
                        <span className="toggle-knob"></span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Display mode */}
                <div className="settings-card">
                  <div className="settings-card-label">
                    <i className="fas fa-layer-group" aria-hidden="true"></i>
                    {t('settings.displayMode', lang)}
                  </div>
                  <p className="settings-hint">
                    {riwaya === 'warsh'
                      ? (lang === 'fr' ? 'Mode page indisponible pour Warsh (QCF4 par sourate)' : lang === 'ar' ? 'وضع الصفحة غير متاح لورش' : 'Page mode unavailable for Warsh')
                      : (lang === 'fr' ? 'Choisissez comment le Coran est affiché' : lang === 'ar' ? 'اختر طريقة عرض القرآن' : 'Choose how the Quran is displayed')}
                  </p>
                  <div className="display-mode-cards">
                    {[
                      { id: 'surah', icon: 'fa-list-ul',   fr: 'Par sourate', ar: 'سورة',  en: 'By surah' },
                      { id: 'page',  icon: 'fa-file-alt',  fr: 'Mushaf',      ar: 'مصحف', en: 'Mushaf page', disabled: riwaya === 'warsh' },
                      { id: 'juz',   icon: 'fa-book-open', fr: 'Par juz',     ar: 'جزء',  en: 'By juz' },
                    ].map(m => (
                      <button
                        key={m.id}
                        className={`display-mode-card ${displayMode === m.id ? 'active' : ''} ${m.disabled ? 'disabled' : ''}`}
                        onClick={() => !m.disabled && set({ displayMode: m.id })}
                        disabled={m.disabled}
                        aria-pressed={displayMode === m.id}
                        title={m.disabled ? (lang === 'fr' ? 'Non disponible en Warsh' : 'Not available for Warsh') : undefined}
                      >
                        <i className={`fas ${m.icon}`} aria-hidden="true"></i>
                        <span>{lang === 'fr' ? m.fr : lang === 'ar' ? m.ar : m.en}</span>
                        {m.disabled && <span className="mode-badge">⚠</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continuous play */}
                <div className="settings-card">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <i className="fas fa-circle-play" aria-hidden="true"></i>
                      <div>
                        <div className="settings-toggle-title">{t('settings.continuousPlay', lang)}</div>
                        <div className="settings-toggle-hint">{t('settings.continuousPlayHint', lang)}</div>
                      </div>
                    </div>
                    <button
                      className={`toggle-switch ${state.continuousPlay ? 'on' : ''}`}
                      onClick={() => set({ continuousPlay: !state.continuousPlay })}
                      aria-pressed={state.continuousPlay}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                  </div>
                </div>

                {/* Focus reading */}
                <div className="settings-card">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <i className="fas fa-expand" aria-hidden="true"></i>
                      <div>
                        <div className="settings-toggle-title">
                          {lang === 'fr' ? 'Mode lecture zen' : lang === 'ar' ? 'وضع القراءة الهادئة' : 'Zen reading mode'}
                        </div>
                        <div className="settings-toggle-hint">
                          {lang === 'fr' ? 'Allège l’interface sur desktop: moins de panneaux, moins de bordures, plus d’air.' : lang === 'ar' ? 'واجهة أخف على سطح المكتب: لوحات أقل وحدود أخف ومساحة أوسع.' : 'Lighter desktop reading with fewer panels, borders, and visual noise.'}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`toggle-switch ${state.focusReading ? 'on' : ''}`}
                      onClick={() => set({ focusReading: !state.focusReading })}
                      aria-pressed={state.focusReading}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                TAB: Texte
            ════════════════════════════════ */}
            {activeTab === 'texte' && (
              <div className="settings-pane">
                <div className="settings-pane-title">
                  {lang === 'ar' ? 'النص والعرض' : lang === 'fr' ? 'Texte & Affichage' : 'Text & Display'}
                </div>

                {/* Tajweed */}
                <div className="settings-card">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <i className="fas fa-paint-brush" aria-hidden="true" style={{ color: '#e74c3c' }}></i>
                      <div>
                        <div className="settings-toggle-title">{t('settings.showTajwid', lang)}</div>
                        <div className="settings-toggle-hint">
                          {lang === 'fr' ? 'Colorie chaque règle de tajwid dans le texte' : lang === 'ar' ? 'يلوّن قواعد التجويد في النص' : 'Colors each tajweed rule in the text'}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`toggle-switch ${showTajwid ? 'on' : ''}`}
                      onClick={() => set({ showTajwid: !showTajwid })}
                      aria-pressed={showTajwid}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                  </div>
                </div>

                {/* Word by word */}
                <div className="settings-card">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <i className="fas fa-layer-group" aria-hidden="true"></i>
                      <div>
                        <div className="settings-toggle-title">
                          {lang === 'fr' ? 'Mode mot à mot' : lang === 'ar' ? 'وضع كلمة بكلمة' : 'Word-by-word mode'}
                        </div>
                        <div className="settings-toggle-hint">
                          {lang === 'fr' ? 'Affiche chaque mot avec sa traduction et translittération' : lang === 'ar' ? 'يعرض كل كلمة مع ترجمتها ونطقها' : 'Shows each word with its translation and transliteration'}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`toggle-switch ${showWordByWord ? 'on' : ''}`}
                      onClick={() => set({ showWordByWord: !showWordByWord })}
                      aria-pressed={showWordByWord}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                  </div>
                  {showWordByWord && (
                    <div className="sub-toggles">
                      <div className="settings-toggle-row sub">
                        <span>{lang === 'fr' ? 'Translittération' : lang === 'ar' ? 'النطق اللاتيني' : 'Transliteration'}</span>
                        <button
                          className={`toggle-switch ${showTransliteration ? 'on' : ''}`}
                          onClick={() => set({ showTransliteration: !showTransliteration })}
                          aria-pressed={showTransliteration}
                        >
                          <span className="toggle-knob"></span>
                        </button>
                      </div>
                      <div className="settings-toggle-row sub">
                        <span>{lang === 'fr' ? 'Traduction par mot' : lang === 'ar' ? 'ترجمة كل كلمة' : 'Word translation'}</span>
                        <button
                          className={`toggle-switch ${showWordTranslation ? 'on' : ''}`}
                          onClick={() => set({ showWordTranslation: !showWordTranslation })}
                          aria-pressed={showWordTranslation}
                        >
                          <span className="toggle-knob"></span>
                        </button>
                      </div>
                      {showWordTranslation && (
                        <>
                          <div className="settings-card-label" style={{ marginTop: '0.6rem' }}>
                            <i className="fas fa-language" aria-hidden="true"></i>
                            {lang === 'fr' ? 'Langue mot-à-mot' : lang === 'ar' ? 'لغة الترجمة كلمة بكلمة' : 'Word-by-word language'}
                          </div>
                          <p className="settings-hint">{wordTranslationLanguageHint}</p>
                          <div className="settings-chips" style={{ marginTop: '0.55rem' }}>
                            {WORD_TRANSLATION_LANGUAGE_OPTIONS.map(option => (
                              <button
                                key={option.code}
                                className={`settings-chip ${wordTranslationLang === option.code ? 'active' : ''}`}
                                onClick={() => set({ wordTranslationLang: option.code })}
                                aria-pressed={wordTranslationLang === option.code}
                              >
                                {getOptionLabel(option)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Translation */}
                <div className="settings-card">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <i className="fas fa-language" aria-hidden="true"></i>
                      <div>
                        <div className="settings-toggle-title">{t('settings.showTranslation', lang)}</div>
                        <div className="settings-toggle-hint">
                          {lang === 'fr' ? 'Affiche la traduction sous chaque verset' : lang === 'ar' ? 'يعرض الترجمة تحت كل آية' : 'Shows translation below each verse'}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`toggle-switch ${showTranslation ? 'on' : ''}`}
                      onClick={() => set({ showTranslation: !showTranslation })}
                      aria-pressed={showTranslation}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                  </div>
                  {showTranslation && (
                    <>
                      <div className="settings-card-label" style={{ marginTop: '0.85rem' }}>
                        <i className="fas fa-globe" aria-hidden="true"></i>
                        {t('settings.translationLang', lang)}
                      </div>
                      <p className="settings-hint">{translationLanguageHint}</p>
                      <div className="settings-chips" style={{ marginTop: '0.75rem' }}>
                        {TRANSLATION_LANGUAGE_OPTIONS.map(option => (
                          <button
                            key={option.code}
                            className={`settings-chip ${translationLang === option.code ? 'active' : ''}`}
                            onClick={() => set({ translationLang: option.code })}
                            aria-pressed={translationLang === option.code}
                          >
                            {getOptionLabel(option)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Font size */}
                <div className="settings-card">
                  <div className="settings-card-label">
                    <i className="fas fa-text-height" aria-hidden="true"></i>
                    {t('settings.fontSize', lang)}
                    <span className="settings-value-pill">{quranFontSize}px</span>
                  </div>
                  <div className="settings-card-hint">
                    {lang === 'fr'
                      ? 'Ajuste uniquement la taille du texte coranique arabe.'
                      : lang === 'ar'
                        ? 'هذا الخيار يغيّر حجم النص القرآني العربي فقط.'
                        : 'This control changes only the Quranic Arabic text size.'}
                  </div>
                  <div className="font-size-stepper">
                    <button
                      className="fss-btn"
                      onClick={() => dispatch({ type: 'SET_QURAN_FONT_SIZE', payload: Math.max(32, quranFontSize - 2) })}
                      disabled={quranFontSize <= 32}
                      aria-label={lang === 'fr' ? 'Réduire la taille' : lang === 'ar' ? 'تصغير الخط' : 'Decrease size'}
                    >
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, fontFamily: 'var(--font-ui)', lineHeight: 1 }}>A</span>
                    </button>
                    <div className="fss-track" role="presentation">
                       <div className="fss-bar" style={{ width: `${((quranFontSize - 32) / (64 - 32)) * 100}%` }} />
                    </div>
                    <button
                      className="fss-btn"
                      onClick={() => dispatch({ type: 'SET_QURAN_FONT_SIZE', payload: Math.min(64, quranFontSize + 2) })}
                      disabled={quranFontSize >= 64}
                      aria-label={lang === 'fr' ? 'Augmenter la taille' : lang === 'ar' ? 'تكبير الخط' : 'Increase size'}
                    >
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, fontFamily: 'var(--font-ui)', lineHeight: 1 }}>A</span>
                    </button>
                  </div>
                  <div
                    className="font-size-preview-ar"
                    style={{
                      fontFamily: 'var(--font-quran)',
                      fontSize: `${Math.round(quranFontSize * 0.82)}px`,
                      direction: 'rtl',
                      textAlign: 'center',
                      marginTop: '0.5rem',
                      color: 'var(--text-quran)',
                      lineHeight: 2.2,
                      minHeight: '2.5rem',
                      opacity: 0.9,
                    }}
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </div>
                </div>

                {/* Font family */}
                <div className="settings-card">
                  <div className="settings-card-label">
                    <i className="fas fa-font" aria-hidden="true"></i>
                    {t('settings.fontFamily', lang)}
                  </div>
                  <div className="font-search-wrap">
                    <input
                      type="text"
                      className="font-search-input"
                      value={fontFilter}
                      onChange={(e) => setFontFilter(e.target.value)}
                      placeholder={lang === 'fr' ? 'Rechercher une police…' : lang === 'ar' ? 'ابحث عن خط…' : 'Search a font…'}
                      aria-label={lang === 'fr' ? 'Rechercher une police' : lang === 'ar' ? 'البحث عن خط' : 'Search font'}
                    />
                  </div>
                  {FILTERED_FONT_CATEGORIES.map(cat => (
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
                  {FILTERED_FONT_CATEGORIES.length === 0 && (
                    <div className="font-empty-state">
                      {lang === 'fr' ? 'Aucune police trouvée pour cette recherche.' : lang === 'ar' ? 'لا توجد خطوط مطابقة للبحث.' : 'No matching fonts found.'}
                    </div>
                  )}
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
                      lineHeight: 2,
                    }}
                    aria-label="Aperçu de la police"
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                TAB: Audio
            ════════════════════════════════ */}
            {activeTab === 'audio' && (
              <div className="settings-pane">
                <div className="settings-pane-title">
                  {lang === 'ar' ? 'الصوت' : lang === 'fr' ? 'Audio' : 'Audio'}
                </div>

                {/* Current reciter info */}
                <div className="settings-card settings-reciter-card">
                  <div className="reciter-info-row">
                    <span className="reciter-avatar">
                      <i className="fas fa-microphone-lines" aria-hidden="true"></i>
                    </span>
                    <div className="reciter-info-text">
                      <div className="reciter-name">
                        {reciterObj?.nameFr || reciterObj?.nameEn || reciterObj?.name || reciter}
                      </div>
                      <div className="reciter-meta">
                        {riwaya.toUpperCase()} · {reciterObj?.style || 'murattal'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reciter selector */}
                <div className="settings-card">
                  <div className="settings-card-label">
                    <i className="fas fa-microphone-lines" aria-hidden="true"></i>
                    {lang === 'fr' ? 'Choisir le récitateur' : lang === 'ar' ? 'اختر القارئ' : 'Choose Reciter'}
                  </div>
                  <div className="settings-reciters-list">
                    {getRecitersByRiwaya(riwaya).map((r) => {
                      const active = reciter === r.id;
                      return (
                        <button
                          key={r.id}
                          className={`settings-reciter-item${active ? ' active' : ''}`}
                          onClick={() => set({ reciter: r.id })}
                          aria-pressed={active}
                        >
                          <span className="settings-reciter-avatar">
                            <i className="fas fa-microphone" aria-hidden="true" />
                          </span>
                          <span className="settings-reciter-info">
                            <span className="settings-reciter-name">
                              {lang === 'ar' ? r.name : lang === 'fr' ? r.nameFr : r.nameEn}
                            </span>
                            <span className="settings-reciter-style">{r.style || 'murattal'}</span>
                          </span>
                          {active && (
                            <i className="fas fa-check settings-reciter-check" aria-hidden="true" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sync offset */}
                <div className="settings-card">
                  <div className="settings-card-label">
                    <i className="fas fa-sliders" aria-hidden="true"></i>
                    {lang === 'fr' ? 'Décalage synchro audio' : lang === 'ar' ? 'إزاحة مزامنة الصوت' : 'Audio sync offset'}
                    <span className="settings-value-pill">{syncOffsetMs} ms</span>
                  </div>
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
                  <p className="settings-hint">
                    {reciterObj?.nameFr || reciterObj?.nameEn || reciterObj?.name || reciter} · {riwaya.toUpperCase()} · [-500 / +500]ms
                  </p>
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                TAB: Données
            ════════════════════════════════ */}
            {activeTab === 'donnees' && (
              <div className="settings-pane">
                <div className="settings-pane-title">
                  {lang === 'ar' ? 'البيانات' : lang === 'fr' ? 'Données' : 'Data'}
                </div>

                {/* Export / Import */}
                <div className="settings-card">
                  <div className="settings-card-label">
                    <i className="fas fa-hard-drive" aria-hidden="true"></i>
                    {t('export.title', lang)}
                  </div>
                  <div className="data-action-btns">
                    <button className="data-action-btn" onClick={downloadExport}>
                      <i className="fas fa-download" aria-hidden="true"></i>
                      <span>{t('export.export', lang)}</span>
                    </button>
                    <button className="data-action-btn" onClick={handleImport}>
                      <i className="fas fa-upload" aria-hidden="true"></i>
                      <span>{t('export.import', lang)}</span>
                    </button>
                  </div>
                </div>

                {/* Keyboard shortcuts */}
                <div className="settings-card">
                  <div className="settings-card-label">
                    <i className="fas fa-keyboard" aria-hidden="true"></i>
                    {lang === 'ar' ? 'اختصارات لوحة المفاتيح' : lang === 'fr' ? 'Raccourcis clavier' : 'Keyboard shortcuts'}
                  </div>
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
                      <kbd>{lang === 'fr' ? 'Échap' : 'Esc'}</kbd>
                      <span>{lang === 'ar' ? 'إغلاق النافذة' : lang === 'fr' ? 'Fermer le modal' : 'Close modal'}</span>
                    </div>
                  </div>
                </div>

                {/* About */}
                <div className="settings-card about-card">
                  <div className="about-brand">
                    <PlatformLogo className="about-logo" imgClassName="about-logo-img" decorative />
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
                      <i className="fas fa-font" aria-hidden="true"></i>
                      {lang === 'fr' ? 'Polices QCF4 (Complexe Roi Fahd)' : lang === 'ar' ? 'خطوط QCF4 (مجمع الملك فهد)' : 'QCF4 Fonts (King Fahd Complex)'}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                TAB: Outils
            ════════════════════════════════ */}
            {activeTab === 'outils' && (
              <div className="settings-pane">
                <div className="settings-pane-title">
                  {lang === 'ar' ? 'الأدوات' : lang === 'fr' ? 'Outils' : 'Tools'}
                </div>
                <p className="settings-hint" style={{ marginBottom: '1rem' }}>
                  {lang === 'fr'
                    ? 'Accédez rapidement aux outils d\'apprentissage et de mémorisation.'
                    : lang === 'ar'
                      ? 'الوصول السريع لأدوات التعلم والحفظ.'
                      : 'Quick access to learning and memorization tools.'}
                </p>

                <div className="settings-tools-grid">
                  {[
                    {
                      icon: 'fa-layer-group',
                      fr: 'Flashcards',
                      ar: 'بطاقات التعلم',
                      en: 'Flashcards',
                      desc_fr: 'Mémorisez les versets',
                      desc_ar: 'احفظ الآيات',
                      desc_en: 'Memorize verses',
                      action: 'flashcardsOpen',
                      color: '#4ade80',
                    },
                    {
                      icon: 'fa-spell-check',
                      fr: 'Quiz Tajweed',
                      ar: 'اختبار التجويد',
                      en: 'Tajweed Quiz',
                      desc_fr: 'Testez vos règles',
                      desc_ar: 'اختبر معلوماتك',
                      desc_en: 'Test your rules',
                      action: 'tajweedQuizOpen',
                      color: '#60a5fa',
                    },
                    {
                      icon: 'fa-book-open-reader',
                      fr: 'Khatma',
                      ar: 'الختمة',
                      en: 'Khatma',
                      desc_fr: 'Objectif de lecture',
                      desc_ar: 'هدف القراءة',
                      desc_en: 'Reading goal',
                      action: 'khatmaOpen',
                      color: '#f59e0b',
                    },
                    {
                      icon: 'fa-users',
                      fr: 'Comparateur',
                      ar: 'مقارنة الرواية',
                      en: 'Comparator',
                      desc_fr: 'Comparer Hafs & Warsh',
                      desc_ar: 'قارن حفص وورش',
                      desc_en: 'Compare Hafs & Warsh',
                      action: 'comparatorOpen',
                      color: '#a78bfa',
                    },
                    {
                      icon: 'fa-image',
                      fr: 'Partager image',
                      ar: 'مشاركة صورة',
                      en: 'Share Image',
                      desc_fr: 'Créer une belle image',
                      desc_ar: 'أنشئ صورة جميلة',
                      desc_en: 'Create a beautiful image',
                      action: 'shareImageOpen',
                      color: '#f472b6',
                    },
                    {
                      icon: 'fa-chart-bar',
                      fr: 'Stats Hebdo',
                      ar: 'الإحصاء الأسبوعي',
                      en: 'Weekly Stats',
                      desc_fr: 'Votre progression',
                      desc_ar: 'تقدمك الأسبوعي',
                      desc_en: 'Your progress',
                      action: 'weeklyStatsOpen',
                      color: '#34d399',
                    },
                  ].map(({ icon, fr, ar, en, desc_fr, desc_ar, desc_en, action, color }) => (
                    <button
                      key={action}
                      className="settings-tool-card"
                      onClick={() => { set({ [action]: true }); close(); }}
                      aria-label={lang === 'ar' ? ar : lang === 'fr' ? fr : en}
                    >
                      <span className="settings-tool-icon" style={{ color }}>
                        <i className={`fas ${icon}`} aria-hidden="true" />
                      </span>
                      <span className="settings-tool-name">
                        {lang === 'ar' ? ar : lang === 'fr' ? fr : en}
                      </span>
                      <span className="settings-tool-desc">
                        {lang === 'ar' ? desc_ar : lang === 'fr' ? desc_fr : desc_en}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>{/* end settings-content */}
        </div>{/* end settings-body-layout */}

      </div>{/* end settings-dialog */}
    </div>
  );
}
