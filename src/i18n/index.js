/* i18n - lightweight translation system */
import fr from './fr.js';
import ux from './ux.js';

// French is the fallback of every missing key, so it ships with the entry.
// English and Arabic are separate chunks, loaded when they are the reading
// language (see ensureLocale): the entry no longer carries ~70 kB of copy the
// reader never sees.
const LOCALES_MAP = {
  fr: { ...fr, ux: ux.fr },
};

const LOCALE_LOADERS = {
  en: () => import('./en.js'),
  ar: () => import('./ar.js'),
};
const pendingLocales = new Map();
let localeVersion = 0;
const localeListeners = new Set();

/** Resolve once `lang` is translatable. Unknown or already loaded languages resolve at once. */
export function ensureLocale(lang) {
  if (LOCALES_MAP[lang] || !LOCALE_LOADERS[lang]) return Promise.resolve();
  if (!pendingLocales.has(lang)) {
    pendingLocales.set(lang, LOCALE_LOADERS[lang]().then((module) => {
      LOCALES_MAP[lang] = { ...module.default, ux: ux[lang] };
      localeVersion += 1;
      localeListeners.forEach((listener) => listener());
    }).finally(() => pendingLocales.delete(lang)));
  }
  return pendingLocales.get(lang);
}

export const getLocaleVersion = () => localeVersion;

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

export default LOCALES_MAP;
