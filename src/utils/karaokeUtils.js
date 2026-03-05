import { getReciter } from '../data/reciters';

/**
 * Unified karaoke calibration format:
 *   offsetSec     – time to add to currentTime before computing progress
 *                   negative = text appears slightly AFTER audio (lag)
 *                   positive = text appears slightly BEFORE audio (lead)
 *   smoothing     – 0‑1 exponential smoothing (lower = snappier, higher = smoother)
 *   lagWordsBase  – word-index lag for short ayahs (< 24 words)
 *   lagWordsLong  – word-index lag for long ayahs  (≥ 24 words)
 *
 * Typical values:
 *   – Murattal (normal speed): offsetSec -0.30 to -0.40
 *   – Tartil   (slower)      : offsetSec -0.40 to -0.55
 *   – Mujawwad (very slow)   : offsetSec -0.55 to -0.70
 */
/**
 * lagWordsBase / lagWordsLong = 0 means we rely purely on offsetSec for timing.
 * Set to 1 only if you observe the highlight still running 1 word ahead of speech.
 */
// Calibration revue — smoothing élevé pour réactivité maximale
// offsetSec légèrement négatif = infime avance audio / légère sécurité
// offsetSec sign: negative = highlight slightly BEHIND audio (lag)
//                 positive = highlight slightly AHEAD  (lead / anticipation)
// For Warsh, users report the highlight lags behind the spoken word.
// Shifting offsetSec toward 0 / slightly positive anticipates the word.
const KARAOKE_DEFAULTS = {
    hafs:  { offsetSec: -0.08, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.65 },
    warsh: { offsetSec:  0.05, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.65 },
};

const KARAOKE_STYLE_PRESETS = {
    hafs: {
        murattal: { offsetSec: -0.08, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.65 },
        tartil:   { offsetSec: -0.14, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.58 },
        mujawwad: { offsetSec: -0.22, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.50 },
    },
    // Warsh recitations tend to start words slightly early in the CDN files;
    // a small positive offset compensates for the perceived lag.
    warsh: {
        murattal: { offsetSec:  0.06, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.68 },
        tartil:   { offsetSec:  0.04, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.62 },
        mujawwad: { offsetSec:  0.00, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.56 },
    },
};

const KARAOKE_RECITER_OVERRIDES = {
    hafs: {
        'ar.alafasy':             { offsetSec: -0.06, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.68 },
        'ar.husary':              { offsetSec: -0.04, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.65 },
        'ar.minshawi':            { offsetSec: -0.10, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.62 },
        'ar.abdulbasitmurattal':  { offsetSec: -0.10, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.60 },
        'ar.abdulbasitmujawwad':  { offsetSec: -0.22, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.50 },
    },
    warsh: {
        // Each Warsh reciter calibrated individually — positive offset anticipates the word
        'warsh_abdulbasit':        { offsetSec:  0.08, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.65 },
        'warsh_ibrahim_aldosari':  { offsetSec:  0.06, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.68 },
        'warsh_yassin':            { offsetSec:  0.10, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.70 },
    },
};

export function getKaraokeCalibration(reciterId, riwaya = 'hafs') {
    const family = riwaya === 'warsh' ? 'warsh' : 'hafs';
    const defaults = KARAOKE_DEFAULTS[family] || KARAOKE_DEFAULTS.hafs;
    const reciter = reciterId ? getReciter(reciterId, family) : null;
    const stylePreset = reciter?.style
        ? (KARAOKE_STYLE_PRESETS[family]?.[reciter.style] || {})
        : {};
    const override = reciterId
        ? (KARAOKE_RECITER_OVERRIDES[family]?.[reciterId] || {})
        : {};

    return {
        offsetSec:    override.offsetSec    ?? stylePreset.offsetSec    ?? defaults.offsetSec,
        smoothing:    override.smoothing    ?? stylePreset.smoothing    ?? defaults.smoothing,
        lagWordsBase: override.lagWordsBase ?? stylePreset.lagWordsBase ?? defaults.lagWordsBase,
        lagWordsLong: override.lagWordsLong ?? stylePreset.lagWordsLong ?? defaults.lagWordsLong,
    };
}
