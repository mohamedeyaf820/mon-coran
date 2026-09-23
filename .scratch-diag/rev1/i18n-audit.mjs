import fr from '../../src/i18n/fr.js';
import en from '../../src/i18n/en.js';
import ar from '../../src/i18n/ar.js';

function flat(obj, pre = '') {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const key = pre ? pre + '.' + k : k;
    if (v && typeof v === 'object') Object.assign(out, flat(v, key));
    else out[key] = v;
  }
  return out;
}
const F = flat(fr), E = flat(en), A = flat(ar);
const kf = Object.keys(F), ke = new Set(Object.keys(E)), ka = new Set(Object.keys(A));

const missEn = kf.filter(k => !ke.has(k));
const missAr = kf.filter(k => !ka.has(k));
const extraEn = Object.keys(E).filter(k => !(k in F));
const extraAr = Object.keys(A).filter(k => !(k in F));

// ar values identical to fr (untranslated) — only count strings with latin letters
const arSame = kf.filter(k => A[k] !== undefined && String(A[k]) === String(F[k]) && /[A-Za-z]/.test(String(F[k])));
const enSame = kf.filter(k => E[k] !== undefined && String(E[k]) === String(F[k]) && /[A-Za-z\u00C0-\u017F]/.test(String(F[k])) && /[A-Za-z]/.test(String(F[k])));
// ar values with no Arabic chars (missing translation, latin-only)
const arNoArabic = kf.filter(k => typeof A[k] === 'string' && !/[\u0600-\u06FF]/.test(A[k]) && /[A-Za-z]/.test(A[k]));
// ar strings containing latin words (mixed) — exclude acronyms/numbers like PDF, MP3, Juz
// placeholder mismatch
const ph = s => (String(s).match(/\{\w+\}/g) || []).sort().join(',');
const phMismatchEn = kf.filter(k => E[k] !== undefined && ph(E[k]) !== ph(F[k]));
const phMismatchAr = kf.filter(k => A[k] !== undefined && ph(A[k]) !== ph(F[k]));
// empty values
const empty = kf.filter(k => (ka.has(k) && (A[k] === '' || A[k] == null)) || (ke.has(k) && (E[k] === '' || E[k] == null)));

console.log('total fr keys:', kf.length, '| en:', Object.keys(E).length, '| ar:', Object.keys(A).length);
console.log('missing in en:', missEn.length, missEn.slice(0, 80));
console.log('missing in ar:', missAr.length, missAr.slice(0, 80));
console.log('extra in en:', extraEn);
console.log('extra in ar:', extraAr);
console.log('ar === fr (untranslated):', arSame.length, arSame.slice(0, 100));
console.log('en === fr (maybe OK for short words):', enSame.length);
console.log('ar latin-only values:', arNoArabic.length, arNoArabic.map(k => [k, A[k]]));
console.log('placeholder mismatch en:', phMismatchEn.map(k => [k, F[k], E[k]]));
console.log('placeholder mismatch ar:', phMismatchAr.map(k => [k, F[k], A[k]]));
console.log('empty values:', empty);
