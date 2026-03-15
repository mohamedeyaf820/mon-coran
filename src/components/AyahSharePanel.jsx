/**
 * AyahSharePanel — génère et télécharge une belle image SVG d'un verset coranique.
 * Calligraphie arabe dorée sur fond islamique.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { getSurah } from '../data/surahs';

// Theme-aligned backgrounds (4 active themes)
const BG_PRESETS = [
  { id: 'light',       label: 'Ivoire',      bg: '#f7f4ea', text: '#199b90', sub: 'rgba(31,44,58,0.55)' },
  { id: 'sepia',       label: 'Parchemin',   bg: '#efe2c9', text: '#b4883c', sub: 'rgba(75,52,32,0.58)' },
  { id: 'dark',        label: 'Quran Dark',  bg: '#111827', text: '#2bb6c7', sub: 'rgba(230,234,240,0.62)' },
];

// Decorative geometric pattern (simple vine corners)
function buildDecor(w, h, color) {
  const o = 18; // offset from corners
  return `
    <line x1="${o}" y1="${o}" x2="${o+24}" y2="${o}" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
    <line x1="${o}" y1="${o}" x2="${o}" y2="${o+24}" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
    <line x1="${w-o}" y1="${o}" x2="${w-o-24}" y2="${o}" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
    <line x1="${w-o}" y1="${o}" x2="${w-o}" y2="${o+24}" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
    <line x1="${o}" y1="${h-o}" x2="${o+24}" y2="${h-o}" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
    <line x1="${o}" y1="${h-o}" x2="${o}" y2="${h-o-24}" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
    <line x1="${w-o}" y1="${h-o}" x2="${w-o-24}" y2="${h-o}" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
    <line x1="${w-o}" y1="${h-o}" x2="${w-o}" y2="${h-o-24}" stroke="${color}" stroke-width="1.5" opacity="0.7"/>
    <rect x="${o}" y="${o}" width="${w-2*o}" height="${h-2*o}" fill="none" stroke="${color}" stroke-width="0.5" opacity="0.2" rx="4"/>
  `;
}

// Split Arabic text into lines (rough heuristic: ≤ 6 words/line)
function splitLines(text, wordsPerLine = 6) {
  if (!text) return [];
  const words = text.split(' ');
  const lines = [];
  for (let i = 0; i < words.length; i += wordsPerLine) {
    lines.push(words.slice(i, i + wordsPerLine).join(' '));
  }
  return lines;
}

function buildSVG({ arabicText, translationText, surahName, ayahNum, preset, width = 800 }) {
  const W = width;
  // Dynamic height
  const arLines = splitLines(arabicText, 5);
  const hasTranslation = !!translationText;
  const H = Math.max(340, 80 + arLines.length * 80 + (hasTranslation ? 80 : 0) + 100);
  const { bg, text: mainColor, sub } = BG_PRESETS.find(p => p.id === preset) || BG_PRESETS[0];

  const arabicFontSize = arLines.length > 2 ? 32 : 40;
  const arY0 = 110;
  const arLineH = arabicFontSize * 1.8;

  const arabicLines = arLines.map((line, i) => `
    <text
      x="${W / 2}"
      y="${arY0 + i * arLineH}"
      font-size="${arabicFontSize}"
      fill="${mainColor}"
      text-anchor="middle"
      dominant-baseline="middle"
      direction="rtl"
      unicode-bidi="bidi-override"
      font-family="'Amiri', 'Traditional Arabic', serif"
      style="font-weight:700"
    >${line}</text>`).join('');

  const lastArY = arY0 + (arLines.length - 1) * arLineH;
  const metaY   = lastArY + arLineH * 0.8;
  const transY  = metaY + 44;
  const branding = H - 28;

  const escapedTrans = translationText ? translationText.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') : '';
  const escapedSurahName = (surahName || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const escapedArabicLines = arabicLines
    .replace(/&(?!amp;|lt;|gt;|quot;)/g, '&amp;');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="40%" r="55%">
      <stop offset="0%"   stop-color="${mainColor}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="${bg}"         stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="${bg}"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>

  <!-- Decorative border -->
  ${buildDecor(W, H, mainColor)}

  <!-- Decorative line above arabic -->
  <line x1="${W*0.2}" y1="72" x2="${W*0.8}" y2="72" stroke="${mainColor}" stroke-width="0.7" opacity="0.4"/>

  <!-- Bismillah-style ornament -->
  <text x="${W/2}" y="54" font-size="14" fill="${sub}" text-anchor="middle" font-family="serif" opacity="0.85">
    ﷽
  </text>

  <!-- Arabic text -->
  ${arabicLines}

  <!-- Surah/ayah reference -->
  <text x="${W/2}" y="${metaY}" font-size="13" fill="${sub}" text-anchor="middle" font-family="'Amiri', serif" direction="rtl">
    — ${escapedSurahName} · ${ayahNum} —
  </text>

  ${hasTranslation ? `
  <!-- Translation -->
  <text x="${W/2}" y="${transY}" font-size="13" fill="${sub}" text-anchor="middle" font-family="sans-serif" opacity="0.85">
    ${escapedTrans.slice(0, 120)}${escapedTrans.length > 120 ? '…' : ''}
  </text>` : ''}

  <!-- Branding -->
  <text x="${W/2}" y="${branding}" font-size="10" fill="${mainColor}" text-anchor="middle" font-family="sans-serif" opacity="0.3">
    MushafPlus · mushafplus.app
  </text>
</svg>`;
}

function downloadSVG(svgString, filename) {
  const blob = new Blob([svgString], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadPNG(svgString, filename, width = 800) {
  return new Promise((resolve) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob2 => {
        const url2 = URL.createObjectURL(blob2);
        const a = document.createElement('a');
        a.href = url2;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url2);
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    };
    img.src = url;
  });
}

export default function AyahSharePanel() {
  const { state, dispatch } = useApp();
  const { lang, currentSurah, currentAyah } = state;

  const [arabicText, setArabicText] = useState('');
  const [translationText, setTranslationText] = useState('');
  const [preset, setPreset] = useState('dark');
  const [includeTranslation, setIncludeTranslation] = useState(true);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const svgRef = useRef(null);

  const surahData = getSurah(currentSurah);
  const surahName = surahData?.ar || '';

  const close = () => dispatch({ type: 'SET', payload: { shareImageOpen: false } });

  // Try to grab the already-rendered Arabic text from the DOM for the current ayah
  useEffect(() => {
    // AyahBlock renders with id="ayah-{numberInSurah}", Arabic text in .qc-ayah-text-ar
    const ayahBlock = document.getElementById(`ayah-${currentAyah}`);
    if (ayahBlock) {
      const arEl = ayahBlock.querySelector('.qc-ayah-text-ar');
      const raw = (arEl || ayahBlock).textContent?.trim() || '';
      // Strip trailing ayah number marker ﴿N﴾ if present
      setArabicText(raw.replace(/\s*﴿\d+﴾\s*$/, '').trim());
      // Also try translation text
      const transEl = ayahBlock.querySelector('.qc-ayah-translation');
      if (transEl) setTranslationText(transEl.textContent?.trim() || '');
    }
  }, [currentSurah, currentAyah]);

  const svgContent = buildSVG({
    arabicText: arabicText || '﴿ بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ ﴾',
    translationText: includeTranslation ? translationText : null,
    surahName,
    ayahNum: currentAyah,
    preset,
  });

  const handleDownloadSVG = () => {
    downloadSVG(svgContent, `verset-${currentSurah}-${currentAyah}.svg`);
  };

  const handleDownloadPNG = async () => {
    setDownloading(true);
    try {
      await downloadPNG(svgContent, `verset-${currentSurah}-${currentAyah}.png`);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyLink = useCallback(() => {
    const url = `https://quran.com/${currentSurah}/${currentAyah}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [currentSurah, currentAyah]);

  const handleWebShare = useCallback(async () => {
    if (!navigator.share) return;
    const surahFr = surahData?.fr || surahData?.en || '';
    await navigator.share({
      title: `${surahFr} · verset ${currentAyah}`,
      text: arabicText,
      url: `https://quran.com/${currentSurah}/${currentAyah}`,
    }).catch(() => {});
  }, [arabicText, currentSurah, currentAyah, surahData]);

  const handleWhatsAppShare = useCallback(() => {
    const surahFr = surahData?.fr || surahData?.en || '';
    const text = `${arabicText}\n\n— ${surahFr} · verset ${currentAyah}\nhttps://quran.com/${currentSurah}/${currentAyah}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  }, [arabicText, currentSurah, currentAyah, surahData]);

  return (
    <div className="modal-overlay" onClick={close}>
      <div className="modal modal-panel--wide share-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-stack">
            <div className="modal-kicker">
              {lang === 'fr' ? 'Partager un verset' : 'Share a Verse'}
            </div>
            <h2 className="modal-title">
              {lang === 'fr' ? 'Image calligraphique' : 'Calligraphic Image'}
            </h2>
            <div className="modal-subtitle">
              {surahName} · {lang === 'fr' ? 'verset' : 'verse'} {currentAyah}
            </div>
          </div>
          <button className="modal-close" onClick={close}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Arabic text override */}
        <div className="share-section">
          <label className="share-label">
            {lang === 'fr' ? 'Texte arabe' : 'Arabic text'}
          </label>
          <textarea
            className="share-textarea share-textarea--ar"
            dir="rtl"
            value={arabicText}
            onChange={e => setArabicText(e.target.value)}
            rows={3}
            placeholder="أدخل النص العربي…"
          />
        </div>

        {/* Translation toggle */}
        <div className="share-section share-section--row">
          <label className="share-label">
            {lang === 'fr' ? 'Inclure la traduction' : 'Include translation'}
          </label>
          <button
            className={`share-toggle ${includeTranslation ? 'on' : 'off'}`}
            onClick={() => setIncludeTranslation(v => !v)}
          >
            {includeTranslation ? 'ON' : 'OFF'}
          </button>
        </div>
        {includeTranslation && (
          <div className="share-section">
            <textarea
              className="share-textarea"
              value={translationText}
              onChange={e => setTranslationText(e.target.value)}
              rows={2}
              placeholder={lang === 'fr' ? 'Traduction…' : 'Translation…'}
            />
          </div>
        )}

        {/* Color preset picker */}
        <div className="share-section">
          <label className="share-label">
            {lang === 'fr' ? 'Thème' : 'Theme'}
          </label>
          <div className="share-presets">
            {BG_PRESETS.map(p => (
              <button
                key={p.id}
                className={`share-preset-btn ${preset === p.id ? 'active' : ''}`}
                style={{ background: p.bg, color: p.text, borderColor: preset === p.id ? p.text : 'transparent' }}
                onClick={() => setPreset(p.id)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Preview */}
        <div className="share-preview" ref={svgRef}>
          <div
            className="share-preview__svg"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>

        {/* Download actions */}
        <div className="share-actions">
          <button className="share-action-btn share-action-btn--svg" onClick={handleDownloadSVG}>
            <i className="fas fa-file-code"></i>
            SVG
          </button>
          <button className="share-action-btn share-action-btn--png" onClick={handleDownloadPNG} disabled={downloading}>
            {downloading
              ? <i className="fas fa-spinner fa-spin"></i>
              : <i className="fas fa-image"></i>}
            PNG
          </button>
          <button className="share-action-btn share-action-btn--copy" onClick={handleCopyLink}>
            <i className={`fas ${copied ? 'fa-check' : 'fa-link'}`}></i>
            {copied
              ? (lang === 'fr' ? 'Copié !' : 'Copied!')
              : (lang === 'fr' ? 'Lien' : 'Link')}
          </button>
          {navigator.share && (
            <button className="share-action-btn share-action-btn--web" onClick={handleWebShare}>
              <i className="fas fa-share-nodes"></i>
              {lang === 'fr' ? 'Partager' : 'Share'}
            </button>
          )}
          <button className="share-action-btn share-action-btn--whatsapp" onClick={handleWhatsAppShare}>
            <i className="fab fa-whatsapp"></i>
            WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
