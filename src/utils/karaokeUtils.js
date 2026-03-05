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
const KARAOKE_DEFAULTS = {
    hafs:  { offsetSec: -0.10, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.58 },
    warsh: { offsetSec: -0.12, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.55 },
};

const KARAOKE_STYLE_PRESETS = {
    hafs: {
        murattal: { offsetSec: -0.10, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.58 },
        tartil:   { offsetSec: -0.18, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.52 },
        mujawwad: { offsetSec: -0.28, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.46 },
    },
    warsh: {
        murattal: { offsetSec: -0.12, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.55 },
        tartil:   { offsetSec: -0.20, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.50 },
        mujawwad: { offsetSec: -0.30, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.45 },
    },
};

const KARAOKE_RECITER_OVERRIDES = {
    hafs: {
        'ar.alafasy':             { offsetSec: -0.08, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.62 },
        'ar.husary':              { offsetSec: -0.05, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.60 },
        'ar.minshawi':            { offsetSec: -0.12, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.58 },
        'ar.abdulbasitmurattal':  { offsetSec: -0.14, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.55 },
        'ar.abdulbasitmujawwad':  { offsetSec: -0.28, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.46 },
    },
    warsh: {
        'warsh_abdulbasit':        { offsetSec: -0.15, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.52 },
        'warsh_ibrahim_aldosari':  { offsetSec: -0.12, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.55 },
        'warsh_yassin':            { offsetSec: -0.10, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.57 },
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
