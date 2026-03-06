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

function getAutoReciterCalibration(reciter, family, baseline) {
    if (!reciter) return {};

    const reciterId = String(reciter.id || '').toLowerCase();
    const cdnType = String(reciter.cdnType || '').toLowerCase();
    const style = String(reciter.style || '').toLowerCase();

    // CDN bias: everyayah links tend to feel slightly late on first consonants
    const cdnBias = cdnType === 'everyayah' ? 0.02 : 0;

    let offsetSec = baseline.offsetSec ?? 0;
    let smoothing = baseline.smoothing ?? 0.62;

    if (style === 'mujawwad') {
        offsetSec += family === 'warsh' ? -0.04 : -0.08;
        smoothing = Math.min(0.72, smoothing + 0.02);
    } else if (style === 'tartil') {
        offsetSec += family === 'warsh' ? -0.02 : -0.05;
        smoothing = Math.min(0.72, smoothing + 0.01);
    }

    if (/(mujawwad|tablawi|minshawi)/.test(reciterId)) {
        offsetSec += family === 'warsh' ? -0.03 : -0.05;
    }

    if (/(husary|alafasy|sudais|shuraym|ghamdi|ajamy|rifai)/.test(reciterId)) {
        smoothing = Math.max(0.56, smoothing - 0.02);
    }

    if (family === 'warsh') {
        // Warsh tends to need slight anticipation in this app's highlighting model
        offsetSec += 0.03;
    }

    return {
        offsetSec: Number((offsetSec + cdnBias).toFixed(3)),
        smoothing: Number(Math.max(0.48, Math.min(0.78, smoothing)).toFixed(2)),
        lagWordsBase: 0,
        lagWordsLong: 0,
    };
}

export function getKaraokeCalibration(reciterId, riwaya = 'hafs') {
    const family = riwaya === 'warsh' ? 'warsh' : 'hafs';
    const defaults = KARAOKE_DEFAULTS[family] || KARAOKE_DEFAULTS.hafs;
    const reciter = reciterId ? getReciter(reciterId, family) : null;
    const stylePreset = reciter?.style
        ? (KARAOKE_STYLE_PRESETS[family]?.[reciter.style] || {})
        : {};
    const baseline = {
        offsetSec: stylePreset.offsetSec ?? defaults.offsetSec,
        smoothing: stylePreset.smoothing ?? defaults.smoothing,
        lagWordsBase: stylePreset.lagWordsBase ?? defaults.lagWordsBase,
        lagWordsLong: stylePreset.lagWordsLong ?? defaults.lagWordsLong,
    };
    const autoCalibration = getAutoReciterCalibration(reciter, family, baseline);
    const override = reciterId
        ? (KARAOKE_RECITER_OVERRIDES[family]?.[reciterId] || {})
        : {};

    return {
        offsetSec:    override.offsetSec    ?? autoCalibration.offsetSec    ?? baseline.offsetSec,
        smoothing:    override.smoothing    ?? autoCalibration.smoothing    ?? baseline.smoothing,
        lagWordsBase: override.lagWordsBase ?? autoCalibration.lagWordsBase ?? baseline.lagWordsBase,
        lagWordsLong: override.lagWordsLong ?? autoCalibration.lagWordsLong ?? baseline.lagWordsLong,
    };
}
