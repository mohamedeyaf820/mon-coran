import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { getWordByWord } from "../../services/wordByWordService";
import { useApp } from "../../context/AppContext";
import { useKaraoke } from "../../hooks/useKaraoke";
import { getKaraokeCalibration } from "../../utils/karaokeUtils";
import TajweedText from "./TajweedText";

/**
 * WordByWordDisplay - Displays ayah text with word-by-word breakdown
 * Each word shows: Arabic text, transliteration, and translation.
 *
 * v2 improvements:
 * - Uses useKaraoke + getKaraokeCalibration instead of raw progress fraction
 *   for precise, reciter-aware word highlighting.
 * - Word weights match the same proportional algorithm used in HafsKaraokeText
 *   so the highlight tracks syllable complexity, not just word count.
 * - Backward-drift guard (lastIdxRef) prevents phantom de-highlights.
 * - Seek-snap: when the user scrubs the progress bar the highlighted word
 *   jumps immediately rather than smoothing through skipped words.
 */
const WordByWordDisplay = React.memo(function WordByWordDisplay({
  surah,
  ayah,
  isPlaying,
  showTransliteration = true,
  showWordTranslation = true,
  fontSize = 28,
  showTajwid = true,
  /** Optional pre-computed text to show while WBW loads */
  text,
}) {
  const { state } = useApp();
  const { wordTranslationLang, riwaya, reciter } = state;

  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredWord, setHoveredWord] = useState(null);

  /* ── Fetch word-by-word data ── */
  useEffect(() => {
    let cancelled = false;

    async function fetchWords() {
      setLoading(true);
      setError(null);
      try {
        const wbwData = await getWordByWord(surah, ayah, wordTranslationLang);
        if (!cancelled) {
          setWords(wbwData);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load word-by-word:", err);
          setError(err.message);
          setLoading(false);
        }
      }
    }

    if (surah && ayah) {
      fetchWords();
    }

    return () => {
      cancelled = true;
    };
  }, [surah, ayah, wordTranslationLang]);

  /* ── Karaoke calibration — same reciter-aware system as HafsKaraokeText ── */
  const calibration = useMemo(() => {
    const base = getKaraokeCalibration(reciter, riwaya, words.length);
    return base;
  }, [reciter, riwaya, words.length]);

  const isFirstAyah = ayah === 1 && surah !== 1 && surah !== 9;

  const { progress, seekCount } = useKaraoke({
    isFirstAyah,
    wordCount: words.length,
    calibration,
  });

  const lagWords = useMemo(() => {
    return words.length >= 24
      ? Number(calibration?.lagWordsLong ?? 0)
      : Number(calibration?.lagWordsBase ?? 0);
  }, [calibration, words.length]);

  /* ── Proportional word weights (same algorithm as HafsKaraokeText) ── */
  const wordWeights = useMemo(() => {
    if (words.length === 0) return [];

    // Use the Arabic word text for weights; fall back to WBW word id position
    const raw = words.map((word, idx) => {
      const w = word.text || "";
      const base = w.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06E1]/g, "");
      let weight = Math.max(1, base.length);

      // Madd (elongation) bonus
      const maddCount = (w.match(/[اوي\u0670\u0649]/g) || []).length;
      weight += maddCount * 0.8;
      // Hamzat wasl after madd
      if (/[اوي][\u0621\u0623\u0625\u0624\u0626]/.test(w)) weight += 1.0;
      // Shadda (gemination) bonus
      const shaddaCount = (w.match(/\u0651/g) || []).length;
      weight += shaddaCount * 0.5;
      // Tanwin (nunation) bonus — slightly drawn out
      if (/[\u064B\u064C\u064D]/.test(w)) weight += 0.4;
      // "Allah" bonus — always elongated
      if (/الله/.test(w)) weight += 0.8;
      // First word ramp-in
      if (idx === 0) weight += 0.3;
      // Last word fade-out
      if (idx === words.length - 1) weight += 0.5;

      return weight;
    });

    const total = raw.reduce((s, v) => s + v, 0);
    let cum = 0;
    return raw.map((w) => {
      cum += w / total;
      return cum;
    });
  }, [words]);

  /* ── Current word index — with backward-drift guard ── */
  const lastIdxRef = useRef(0);

  // Reset on seek or ayah change
  useEffect(() => {
    lastIdxRef.current = 0;
  }, [seekCount, surah, ayah]);

  const currentWordIdx = useMemo(() => {
    if (!isPlaying || words.length === 0) return -1;

    let idx = 0;
    for (let i = 0; i < wordWeights.length; i++) {
      if (progress < wordWeights[i]) {
        idx = i;
        break;
      }
      idx = i;
    }

    const adjustedIdx = Math.max(0, idx - Math.max(0, lagWords));
    // Monotone guard: never move backward unless seek was detected
    const finalIdx = Math.max(lastIdxRef.current, adjustedIdx);
    lastIdxRef.current = finalIdx;
    return finalIdx;
  }, [isPlaying, progress, wordWeights, words.length, lagWords]);

  /* ── Word click: play individual word audio ── */
  const handleWordClick = useCallback((word, index) => {
    if (word.audioUrl) {
      const audio = new Audio(word.audioUrl);
      audio.play().catch(() => {});
    }
    setHoveredWord(index);
  }, []);

  /* ── Loading / error states ── */
  if (loading) {
    return (
      <div className="wbw-display wbw-loading">
        {text && (
          <span
            className="wbw-text-fallback"
            style={{ fontSize: `${fontSize}px` }}
          >
            {text}
          </span>
        )}
        <span className="wbw-loading-indicator">
          <i className="fas fa-spinner fa-spin" />
        </span>
      </div>
    );
  }

  if (error || words.length === 0) {
    return (
      <span className="wbw-text-fallback" style={{ fontSize: `${fontSize}px` }}>
        {text || ""}
      </span>
    );
  }

  return (
    <div className="wbw-display" dir="rtl">
      {words.map((word, i) => {
        const isRead = isPlaying && i < currentWordIdx;
        const isCurrent = isPlaying && i === currentWordIdx;
        const isHovered = hoveredWord === i;

        let wordClass = "wbw-word-block";
        if (isRead) wordClass += " wbw-read";
        else if (isCurrent) wordClass += " wbw-current";
        if (isHovered) wordClass += " wbw-hovered";

        return (
          <div
            key={word.id ?? i}
            className={wordClass}
            onClick={() => handleWordClick(word, i)}
            onMouseEnter={() => setHoveredWord(i)}
            onMouseLeave={() => setHoveredWord(null)}
          >
            {/* Arabic text — tajweed-coloured when enabled */}
            <span className="wbw-arabic" style={{ fontSize: `${fontSize}px` }}>
              <TajweedText
                text={word.text}
                enabled={showTajwid}
                riwaya={riwaya}
                tajweedColors={null}
              />
            </span>

            {/* Transliteration */}
            {showTransliteration && word.transliteration && (
              <span className="wbw-transliteration" dir="ltr">
                {word.transliteration}
              </span>
            )}

            {/* Per-word translation */}
            {showWordTranslation && word.translation && (
              <span className="wbw-translation">{word.translation}</span>
            )}
          </div>
        );
      })}
    </div>
  );
});

export default WordByWordDisplay;
