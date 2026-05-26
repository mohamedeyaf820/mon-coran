/* i18n - lightweight translation system */
import ar from './ar';
import fr from './fr';
import en from './en';

const LOCALES_MAP = { ar, fr, en };

/**
 * Global translation function.
 * @param {string|object} key - The translation key or an object with language keys.
 * @param {string} lang - The target language code ('ar', 'fr', 'en').
 * @returns {string} The translated string or the key itself if not found.
 */
export function t(key, lang = 'fr') {
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

  if (val != null) return val;

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
