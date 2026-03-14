/* i18n - lightweight translation system */
import ar from './ar';
import fr from './fr';
import en from './en';

const locales = { ar, fr, en };

export function t(key, lang = 'fr') {
  if (key == null) return '';
  const safeLang = locales[lang] ? lang : 'fr';

  // Defensive fallback: some callsites may pass an object map by mistake.
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
  let val = locales[safeLang] || locales.fr;
  for (const k of keys) {
    if (!val) return safeKey;
    val = val[k];
  }
  if (val != null) return val;

  // Fallback to French tree when key is missing in current language.
  if (safeLang !== 'fr') {
    let frVal = locales.fr;
    for (const k of keys) {
      if (!frVal) return safeKey;
      frVal = frVal[k];
    }
    return frVal ?? safeKey;
  }

  return safeKey;
}

export const LANGUAGES = [
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
];

export default locales;
