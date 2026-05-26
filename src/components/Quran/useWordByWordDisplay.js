import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getWordByWord } from "../../services/wordByWordService";
import { useKaraoke } from "../../hooks/useKaraoke";
import {
  getKaraokeCalibration,
  withWordCountCalibrationBump,
} from "../../utils/karaokeUtils";
import audioService from "../../services/audioService";

function buildWordWeights(words) {
  const raw = words.map((word, index) => {
    const text = word.text || "";
    const base = text.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06E1]/g, "");
    let weight = Math.max(1, base.length);
    weight += (text.match(/[\u0627\u0648\u064a\u0670\u0649]/g) || []).length * 0.8;
    if (/[\u0627\u0648\u064a][\u0621\u0623\u0625\u0624\u0626]/.test(text)) weight += 1;
    weight += (text.match(/\u0651/g) || []).length * 0.5;
    if (/[\u064B\u064C\u064D]/.test(text)) weight += 0.4;
    if (/\u0627\u0644\u0644\u0647/.test(text)) weight += 0.8;
    if (index === 0) weight += 0.3;
    if (index === words.length - 1) weight += 0.5;
    return weight;
  });
  const total = raw.reduce((sum, value) => sum + value, 0);
  let cumulative = 0;
  return raw.map((value) => {
    cumulative += value / total;
    return cumulative;
  });
}

export default function useWordByWordDisplay({
  ayah,
  calibration,
  initialWords,
  isPlaying,
  reciter,
  riwaya,
  surah,
  wordTranslationLang,
}) {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState([]);
  const [activeWordId, setActiveWordId] = useState(null);
  const [exactWordIdx, setExactWordIdx] = useState(-1);
  const lastIdxRef = useRef(0);

  useEffect(() => {
    let cancelled = false;
    const embeddedWords = Array.isArray(initialWords)
      ? initialWords.filter((word) => (word.charType || word.char_type_name) === "word")
      : [];
    const embeddedWordsHaveTranslations =
      wordTranslationLang === "ar" || embeddedWords.some((word) => word.translation);

    if (embeddedWords.length > 0 && embeddedWordsHaveTranslations) {
      setWords(embeddedWords);
      setLoading(false);
      setError(null);
      return () => {
        cancelled = true;
      };
    }

    setLoading(true);
    setError(null);

    getWordByWord(surah, ayah, wordTranslationLang)
      .then((data) => {
        if (!cancelled) {
          setWords(data);
          setLoading(false);
        }
      })
      .catch((currentError) => {
        if (!cancelled) {
          console.error("Failed to load word-by-word:", currentError);
          setError(currentError.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [ayah, initialWords, surah, wordTranslationLang]);

  const effectiveCalibration = useMemo(() => {
    const reciterId = typeof reciter === "string" ? reciter : reciter?.id;
    const fallback = getKaraokeCalibration(reciterId, riwaya, words.length);
    return withWordCountCalibrationBump(
      calibration && typeof calibration === "object" ? calibration : fallback,
      words.length,
    );
  }, [calibration, reciter, riwaya, words.length]);
  const { progress, seekCount } = useKaraoke({
    isFirstAyah: ayah === 1 && surah !== 1 && surah !== 9,
    wordCount: words.length,
    calibration: effectiveCalibration,
  });
  const wordWeights = useMemo(() => buildWordWeights(words), [words]);
  const lagWords =
    words.length >= 24
      ? Number(effectiveCalibration?.lagWordsLong ?? 0)
      : Number(effectiveCalibration?.lagWordsBase ?? 0);

  useEffect(() => {
    lastIdxRef.current = 0;
    setExactWordIdx(-1);
    setActiveWordId(null);
  }, [ayah, seekCount, surah]);

  useEffect(() => {
    return audioService.addEndListener(() => {
      setActiveWordId(null);
    });
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      setExactWordIdx(-1);
      return undefined;
    }

    const updateFromSegments = (timeSec = audioService.currentTime || 0) => {
      const currentAyah = audioService.currentAyah;
      if (
        !currentAyah ||
        Number(currentAyah.surah) !== Number(surah) ||
        Number(currentAyah.ayah) !== Number(ayah)
      ) {
        setExactWordIdx(-1);
        return;
      }

      const segments = Array.isArray(currentAyah.segments) ? currentAyah.segments : [];
      if (segments.length === 0) {
        setExactWordIdx(-1);
        return;
      }

      const timeMs = timeSec * 1000;
      let nextIndex = -1;
      for (const segment of segments) {
        if (timeMs >= segment.startMs && timeMs <= segment.endMs) {
          nextIndex = Number.isFinite(segment.wordIndex)
            ? segment.wordIndex
            : Math.max(0, Number(segment.wordPosition || 1) - 1);
          break;
        }
        if (timeMs > segment.endMs) {
          nextIndex = Number.isFinite(segment.wordIndex)
            ? segment.wordIndex
            : Math.max(0, Number(segment.wordPosition || 1) - 1);
        }
      }

      setExactWordIdx(nextIndex);
    };

    updateFromSegments();
    return audioService.addTimeUpdateListener(updateFromSegments);
  }, [ayah, isPlaying, surah]);

  const currentWordIdx = useMemo(() => {
    if (exactWordIdx >= 0) return exactWordIdx;
    if (!isPlaying || words.length === 0) return -1;
    let currentIndex = 0;
    wordWeights.forEach((weight, index) => {
      if (progress >= weight) currentIndex = index;
    });
    const finalIndex = Math.max(lastIdxRef.current, Math.max(0, currentIndex - lagWords));
    lastIdxRef.current = finalIndex;
    return finalIndex;
  }, [exactWordIdx, isPlaying, lagWords, progress, wordWeights, words.length]);

  const handleWordClick = useCallback(
    (word, onSelect, event) => {
      event?.preventDefault?.();
      event?.stopPropagation?.();
      onSelect(word);
      const wordId = word?.id ?? `${surah}:${ayah}:${word?.position ?? ""}`;
      setActiveWordId(wordId);
      if (word?.audioUrl) {
        audioService
          .playWordAudio(word.audioUrl, {
            surah,
            ayah,
            wordId,
            wordPosition: word.position,
            wordText: word.text,
            translation: word.translation,
          })
          .then((played) => {
            if (!played) {
              setActiveWordId(null);
              audioService.playAyah(surah, ayah);
            }
          })
          .catch(() => {
            setActiveWordId(null);
            audioService.playAyah(surah, ayah);
          });
        return;
      }
      setActiveWordId(null);
      audioService.playAyah(surah, ayah);
    },
    [ayah, surah],
  );

  return { activeWordId, currentWordIdx, error, handleWordClick, loading, words };
}
