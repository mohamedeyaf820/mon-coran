/* i18n - lightweight translation system */
import ar from './ar.js';
import fr from './fr.js';
import en from './en.js';

const LOCALES_MAP = { ar, fr, en };

/**
 * Global translation function.
 * @param {string|object} key - The translation key or an object with language keys.
 * @param {string} lang - The target language code ('ar', 'fr', 'en').
 * @returns {string} The translated string or the key itself if not found.
 */
/**
 * Resolve Arabic plural form for a given count.
 * Arabic has 6 grammatical numbers; we handle the 4 most common CLDR forms.
 */
function arPlural(count) {
  const abs = Math.abs(count);
  if (abs === 0) return 'zero';
  if (abs === 1) return 'one';
  if (abs === 2) return 'two';
  if (abs % 100 >= 3 && abs % 100 <= 10) return 'few';
  if (abs % 100 >= 11 && abs % 100 <= 99) return 'many';
  return 'other';
}

function frPlural(count) {
  return Math.abs(count) <= 1 ? 'one' : 'other';
}

function enPlural(count) {
  return Math.abs(count) === 1 ? 'one' : 'other';
}

export function t(key, lang = 'fr', count) {
  if (key == null) return '';
  const safeLang = LOCALES_MAP[lang] ? lang : 'fr';

  // Defensive fallback: support object maps passed directly.
  if (typeof key === 'object') {
    if (Array.isArray(key)) {
      return key.filter(Boolean).join(' ');
    }
    return (
      key[safeLang] ??
      key.fr ??
      key.en ??
      key.ar ??
      Object.values(key)[0] ??
      ''
    );
  }

  const safeKey = typeof key === 'string' ? key : String(key ?? '');
  if (!safeKey || typeof safeKey.split !== 'function') return '';

  const keys = safeKey.split('.');
  
  // Use a fresh reference to the locale tree for each call to ensure we don't 
  // hit TDZ issues if this is called early in some complex module grafts.
  const currentLocale = LOCALES_MAP[safeLang] || LOCALES_MAP.fr;
  let val = currentLocale;

  for (const k of keys) {
    if (val == null) break;
    val = val[k];
  }

  if (val != null) {
    // Pluralization: if the resolved value is an object with plural keys, pick the right form.
    if (typeof val === 'object' && !Array.isArray(val) && count !== undefined) {
      const form = safeLang === 'ar' ? arPlural(count) : safeLang === 'en' ? enPlural(count) : frPlural(count);
      return (val[form] ?? val.other ?? val.one ?? Object.values(val)[0] ?? '').replace(/\{count\}/g, count);
    }
    return val;
  }

  // Global fallback to French for missing keys in other languages.
  if (safeLang !== 'fr') {
    let frVal = LOCALES_MAP.fr;
    for (const k of keys) {
      if (frVal == null) break;
      frVal = frVal[k];
    }
    if (frVal != null) return frVal;
  }

  return safeKey;
}

export const LANGUAGES = [
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
];

export default LOCALES_MAP;
