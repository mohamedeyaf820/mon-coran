import { getReciter } from "../data/reciters";

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
// Calibration v4 — anticipatory offsets for zero-perceived-lag word highlighting.
// offsetSec: positive = highlight appears BEFORE the word is spoken (anticipatory).
//            negative = highlight appears AFTER the word starts (lag feeling).
// smoothing: close to 1.0 = very snappy & responsive (recommended 0.82–0.94).
//
// Rationale: HTML5 Audio currentTime reports the decoded position, which can trail
// the actual speaker output by 50–150 ms depending on the browser and CDN.
// A positive offsetSec compensates for both that pipeline delay and the inherent
// proportional-weight approximation in the timing model.
const KARAOKE_DEFAULTS = {
  hafs: { offsetSec: 0.15, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.9 },
  warsh: { offsetSec: 0.2, lagWordsBase: 0, lagWordsLong: 0, smoothing: 0.9 },
};

const KARAOKE_STYLE_PRESETS = {
  hafs: {
    // Murattal: brisk pace — moderate lead to anticipate word transitions.
    murattal: {
      offsetSec: 0.15,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    // Tartil: slower — slightly more lead because words last longer.
    tartil: {
      offsetSec: 0.22,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.87,
    },
    // Mujawwad: very slow, drawn-out — biggest lead needed.
    mujawwad: {
      offsetSec: 0.31,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.83,
    },
  },
  warsh: {
    murattal: {
      offsetSec: 0.2,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    tartil: {
      offsetSec: 0.25,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.87,
    },
    mujawwad: {
      offsetSec: 0.33,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.84,
    },
  },
};

// Per-reciter fine-tuning.  Overrides win over style presets + auto-calibration.
// islamic.network CDN is generally faster to buffer → slightly lower offset.
// everyayah.com CDN can have higher first-packet delay → +0.03 s extra.
//
// Smoothing is raised to 0.92 across the board (vs. old 0.88) for snappier
// response; mujawwad styles keep a lower value to avoid jitter on long syllables.
const KARAOKE_RECITER_OVERRIDES = {
  hafs: {
    // ── islamic.network CDN ────────────────────────────────────────────────
    // Alafasy: brisk murattal pace, responsive CDN → moderate lead
    "ar.alafasy": {
      offsetSec: 0.18,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.92,
    },
    // Al-Husary: measured murattal, very consistent timing
    "ar.husary": {
      offsetSec: 0.14,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    // Minshawi murattal: slightly deliberate pace
    "ar.minshawi": {
      offsetSec: 0.14,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    // Minshawi mujawwad: very slow, drawn-out — maximum lead, lower smoothing
    "ar.minshawimujawwad": {
      offsetSec: 0.31,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.83,
    },
    // Abdul Basit murattal: clear and measured
    "ar.abdulbasitmurattal": {
      offsetSec: 0.22,
      lagWordsBase: 0,
      lagWordsLong: 1,
      smoothing: 0.88,
      driftPerProgress: 0.05,
      speedSensitivity: 0.07,
    },
    // Abdul Basit mujawwad: the slowest style — large lead, conservative smoothing
    "ar.abdulbasitmujawwad": {
      offsetSec: 0.42,
      lagWordsBase: 0,
      lagWordsLong: 1,
      smoothing: 0.8,
      driftPerProgress: 0.09,
      speedSensitivity: 0.1,
    },
    // Sudais: fast-to-moderate, energetic recitation
    "ar.abdurrahmaansudais": {
      offsetSec: 0.17,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.92,
    },
    // Shuraym: similar pace to Sudais
    "ar.saoodshuraym": {
      offsetSec: 0.18,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.92,
    },
    // ── everyayah.com CDN (+0.03 s for CDN first-packet latency) ──────────
    abdullaah_matrood: {
      offsetSec: 0.17,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.92,
    },
    abdullaah_basfar: {
      offsetSec: 0.17,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.92,
    },
    abdulsamad: {
      offsetSec: 0.24,
      lagWordsBase: 0,
      lagWordsLong: 1,
      smoothing: 0.84,
      driftPerProgress: 0.07,
      speedSensitivity: 0.08,
    },
    // Saad Al-Ghamdi: energetic, faster murattal
    "ar.maaboralmeem": {
      offsetSec: 0.18,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.92,
    },
    ahmed_ajmy: {
      offsetSec: 0.17,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    // Maher Al-Muaiqly: brisk pace, higher lead
    maher_almuaiqly: {
      offsetSec: 0.2,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.92,
    },
    abdulbari_thubayti: {
      offsetSec: 0.16,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    ali_jabir: {
      offsetSec: 0.15,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    hudhaify: {
      offsetSec: 0.17,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    muhammad_ayyoub: {
      offsetSec: 0.17,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    // Tablawi: notably slower, near-tartil pace — extra lead, gentler smoothing
    muhammad_tablawi: {
      offsetSec: 0.25,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.85,
    },
    hani_rifai: {
      offsetSec: 0.16,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    fares_abbad: {
      offsetSec: 0.17,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    // Yasser Ad-Dossari & Nasser Al-Qatami: clear, moderately brisk
    yasser_dossari_hafs: {
      offsetSec: 0.18,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.92,
    },
    nasser_alqatami: {
      offsetSec: 0.18,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.92,
    },
    ibrahim_akhdar: {
      offsetSec: 0.17,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    khalid_qahtani: {
      offsetSec: 0.18,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    sahl_yassin: {
      offsetSec: 0.18,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
  },
  warsh: {
    // Warsh reciters are all everyayah.com CDN; style is murattal unless noted.
    warsh_abdulbasit: {
      offsetSec: 0.22,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    warsh_ibrahim_aldosari: {
      offsetSec: 0.2,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    warsh_yassin: {
      offsetSec: 0.22,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.92,
    },
    // Additional Warsh reciters from reciters.js
    warsh_hussary: {
      offsetSec: 0.2,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    warsh_omar_al_qazabri: {
      offsetSec: 0.2,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    warsh_mohammad_saayed: {
      offsetSec: 0.23,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    warsh_al_qaria_yassen: {
      offsetSec: 0.24,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    warsh_aloyoon_al_koshi: {
      offsetSec: 0.23,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
    warsh_rachid_belalya: {
      offsetSec: 0.22,
      lagWordsBase: 0,
      lagWordsLong: 0,
      smoothing: 0.9,
    },
  },
};

function getAutoReciterCalibration(reciter, family, baseline) {
  if (!reciter) return {};

  const reciterId = String(reciter.id || "").toLowerCase();
  const cdnType = String(reciter.cdnType || "").toLowerCase();

  // everyayah.com CDN commonly has a slightly higher first-packet delay.
  const cdnBias =
    cdnType === "everyayah"
      ? 0.03
      : cdnType === "mp3quran-surah"
        ? 0.05
        : 0.0;

  let offsetSec = (baseline.offsetSec ?? 0.15) + cdnBias;
  let smoothing = baseline.smoothing ?? 0.9;

  // Tablawi recites in a notably slow, near-tartil style — needs extra lead.
  // (This auto-path is only reached when there is no explicit override entry.)
  if (/tablawi/.test(reciterId)) {
    offsetSec += 0.08;
    smoothing = Math.max(0.82, smoothing - 0.05);
  }

  return {
    offsetSec: Number(offsetSec.toFixed(3)),
    smoothing: Number(Math.max(0.82, Math.min(0.94, smoothing)).toFixed(2)),
    lagWordsBase: 0,
    lagWordsLong: 0,
  };
}

/**
 * Returns a fully-resolved karaoke calibration object for a given reciter + riwaya.
 *
 * Resolution order (highest priority wins):
 *   1. KARAOKE_RECITER_OVERRIDES  — explicit per-reciter table
 *   2. getAutoReciterCalibration  — CDN-bias + style heuristics
 *   3. KARAOKE_STYLE_PRESETS      — style-level defaults (murattal / tartil / mujawwad)
 *   4. KARAOKE_DEFAULTS           — riwaya-level fallback
 *
 * @param {string}  reciterId  — reciter id string (e.g. 'ar.alafasy')
 * @param {string}  riwaya     — 'hafs' | 'warsh'
 * @param {number}  [wordCount] — number of words in the current ayah;
 *                                when > 10 a small extra lead (+0.02 s) is applied
 *                                to compensate for timing-model drift on dense verses.
 */
export function getKaraokeCalibration(
  reciterId,
  riwaya = "hafs",
  wordCount = 0,
) {
  const family = riwaya === "warsh" ? "warsh" : "hafs";
  const defaults = KARAOKE_DEFAULTS[family] || KARAOKE_DEFAULTS.hafs;
  const reciter = reciterId ? getReciter(reciterId, family) : null;
  const stylePreset = reciter?.style
    ? KARAOKE_STYLE_PRESETS[family]?.[reciter.style] || {}
    : {};
  const baseline = {
    offsetSec: stylePreset.offsetSec ?? defaults.offsetSec,
    smoothing: stylePreset.smoothing ?? defaults.smoothing,
    lagWordsBase: stylePreset.lagWordsBase ?? defaults.lagWordsBase,
    lagWordsLong: stylePreset.lagWordsLong ?? defaults.lagWordsLong,
  };
  const autoCalibration = getAutoReciterCalibration(reciter, family, baseline);
  const override = reciterId
    ? KARAOKE_RECITER_OVERRIDES[family]?.[reciterId] || {}
    : {};
  const styleDynamics =
    reciter?.style === "mujawwad"
      ? { driftPerProgress: 0.07, speedSensitivity: 0.08 }
      : reciter?.style === "tartil"
        ? { driftPerProgress: 0.05, speedSensitivity: 0.07 }
        : { driftPerProgress: 0.03, speedSensitivity: 0.06 };

  let offsetSec =
    override.offsetSec ?? autoCalibration.offsetSec ?? baseline.offsetSec;

  // Longer ayahs (>10 words) get a slight extra lead (+0.02 s).
  // The proportional-weight timing model can drift slightly on dense verses;
  // this small cushion keeps the highlight from lagging behind late in the ayah.
  if (wordCount > 10) {
    offsetSec = Number((offsetSec + 0.02).toFixed(3));
  }

  return {
    offsetSec,
    smoothing:
      override.smoothing ?? autoCalibration.smoothing ?? baseline.smoothing,
    lagWordsBase:
      override.lagWordsBase ??
      autoCalibration.lagWordsBase ??
      baseline.lagWordsBase,
    lagWordsLong:
      override.lagWordsLong ??
      autoCalibration.lagWordsLong ??
      baseline.lagWordsLong,
    driftPerProgress: override.driftPerProgress ?? styleDynamics.driftPerProgress,
    speedSensitivity: override.speedSensitivity ?? styleDynamics.speedSensitivity,
  };
}

/**
 * Applies a small extra lead on long ayahs to compensate cumulative timing drift.
 * Returns a new object and never mutates the incoming calibration.
 */
export function withWordCountCalibrationBump(calibration, wordCount = 0) {
  if (!calibration || !wordCount || wordCount <= 10) return calibration;
  return {
    ...calibration,
    offsetSec: Number(((calibration.offsetSec ?? 0.15) + 0.02).toFixed(3)),
  };
}
