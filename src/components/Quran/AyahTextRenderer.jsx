import React, { useEffect, useMemo, useRef, useState } from "react";
import { useKaraoke } from "../../hooks/useKaraoke";
import audioService from "../../services/audioService";
import { NATIVE_AYAH_MARKER_RE, getQuranWordTextForFont } from "../../data/fonts";
import {
  getReadableWaqfGlyph,
  normalizeQuranGlyphText,
} from "../../utils/quranUtils";
import TajweedText from "./TajweedText";
import { playWordAudio, getWordAudioUrl } from "../../utils/wordAudio";

const AYAH_MARKER_TOKEN_RE = /^[\u06dd\u06de\u06e9\ufd3f\ufd3e\d\u0660-\u0669\u06f0-\u06f9]+$/u;
const WAQF_MARKER_SPLIT_RE = /([\u06d6-\u06dc])/u;
const WAQF_MARKER_CHAR_RE = /^[\u06d6-\u06dc]$/u;

function CanonicalQuranText({ text, riwaya, words, surahNum, ayahNumber }) {
  if (riwaya === "warsh") {
    const parts = String(text).split(WAQF_MARKER_SPLIT_RE).filter(Boolean);
    let wordRunningIndex = 0;
    return (
      <span className="quran-canonical-text" dir="rtl" lang="ar">
        {parts.map((part, index) => {
          if (WAQF_MARKER_CHAR_RE.test(part)) {
            return (
              <span
                key={`${part}-${index}`}
                className="warsh-waqf-marker waqf-marker"
                data-waqf={part.codePointAt(0)?.toString(16).toUpperCase()}
                aria-hidden="true"
              >
                {getReadableWaqfGlyph(part)}
              </span>
            );
          }
          const wordList = part.split(/\s+/).filter(Boolean);
          return (
            <React.Fragment key={`${index}-${part.length}`}>
              {wordList.map((w, wIdx) => {
                const isMarker = isAyahMarkerToken(w);
                const currentPos = ++wordRunningIndex;
                const audioUrl = !isMarker && surahNum && ayahNumber
                  ? getWordAudioUrl(surahNum, ayahNumber, currentPos)
                  : null;

                const handleClick = (e) => {
                  if (!isMarker) {
                    e.stopPropagation();
                    playWordAudio(audioUrl || { surah: surahNum, ayah: ayahNumber, position: currentPos });
                  }
                };

                return (
                  <React.Fragment key={wIdx}>
                    <span
                      className={isMarker ? "native-ayah-marker" : "quran-word-item cursor-pointer"}
                      onClick={!isMarker ? handleClick : undefined}
                      role={!isMarker ? "button" : undefined}
                      tabIndex={!isMarker ? 0 : undefined}
                      style={{ display: "inline" }}
                    >
                      {w}
                    </span>
                    {wIdx < wordList.length - 1 ? " " : null}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
      </span>
    );
  }

  const parts = String(text).split(/\s+/).filter(Boolean);
  return (
    <span className="quran-canonical-text" dir="rtl" lang="ar">
      {parts.map((wordStr, index) => {
        const isMarker = isAyahMarkerToken(wordStr);
        const dataWord = words && words[index];
        const wordPos = index + 1;
        const audioUrl = !isMarker ? (dataWord?.audioUrl || (surahNum && ayahNumber ? getWordAudioUrl(surahNum, ayahNumber, wordPos) : null)) : null;

        const handleClick = (e) => {
          if (!isMarker) {
            e.stopPropagation();
            playWordAudio(audioUrl || { surah: surahNum, ayah: ayahNumber, position: wordPos });
          }
        };

        return (
          <React.Fragment key={index}>
            <span
              className={isMarker ? "native-ayah-marker" : "quran-word-item cursor-pointer"}
              onClick={!isMarker ? handleClick : undefined}
              role={!isMarker ? "button" : undefined}
              tabIndex={!isMarker ? 0 : undefined}
              style={{ display: "inline" }}
            >
              {wordStr}
            </span>
            {index < parts.length - 1 ? (isAyahMarkerToken(parts[index + 1]) ? "\u202F" : " ") : null}
          </React.Fragment>
        );
      })}
    </span>
  );
}

function isAyahMarkerToken(word) {
  if (!word) return false;
  const compact = String(word).replace(/\s+/g, "");
  if (!compact) return false;
  return AYAH_MARKER_TOKEN_RE.test(compact) || NATIVE_AYAH_MARKER_RE.test(compact);
}

function comparableArabicText(value) {
  return normalizeQuranGlyphText(value)
    .normalize("NFC")
    .replace(/[\u0610-\u061A\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "")
    .replace(/[\u200C\u200D\u200E\u200F\u2066-\u2069]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasCoherentWordData(words, text, fontFamily, riwaya, surahNum, ayahNumber) {
  if (!Array.isArray(words) || words.length === 0) return false;
  const expected = comparableArabicText(
    String(text || "")
      .split(/\s+/u)
      .filter((word) => !isAyahMarkerToken(word))
      .join(" "),
  );
  const actual = comparableArabicText(
    words.map((word) => getQuranWordTextForFont(word, fontFamily, riwaya)).join(" "),
  );

  if (!expected || !actual || expected !== actual) return false;

  return words.every((word) => {
    const wordSurah = Number(word?.surah);
    const wordAyah = Number(word?.ayah);
    const hasSurahIdentity = Number.isFinite(wordSurah) && wordSurah > 0;
    const hasAyahIdentity = Number.isFinite(wordAyah) && wordAyah > 0;

    return (
      (!hasSurahIdentity || wordSurah === Number(surahNum)) &&
      (!hasAyahIdentity || wordAyah === Number(ayahNumber))
    );
  });
}

function buildWordWeights(words) {
  if (words.length === 0) return [];
  const raw = words.map((word, index) => {
    const base = word.replace(/[\u064B-\u065F\u0670\u06D6-\u06ED\u06E1]/g, "");
    let weight = Math.max(1, base.length);
    weight += (word.match(/[\u0627\u0648\u064a\u0670\u0649]/g) || []).length * 0.8;
    if (/[\u0627\u0648\u064a][\u0621\u0623\u0625\u0624\u0626]/.test(word)) weight += 1;
    weight += (word.match(/\u0651/g) || []).length * 0.5;
    if (/[\u064B\u064C\u064D]/.test(word)) weight += 0.4;
    if (/\u0627\u0644\u0644\u0647/.test(word)) weight += 0.8;
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

/**
 * Hafs karaoke text. Native ayah markers are rendered in the flow but are not
 * counted as recitable words, so timings and highlight indexes stay aligned.
 */
export const HafsKaraokeText = React.memo(function HafsKaraokeText({
  text,
  isFirstAyah,
  calibration,
  words,
}) {
  const lastIdxRef = useRef(0);
  const [exactWordIdx, setExactWordIdx] = useState(-1);

  const displayWords = useMemo(() => {
    if (!text) return [];
    return text.split(/\s+/).filter((word) => word.length > 0);
  }, [text]);
  const recitableWords = useMemo(
    () => displayWords.filter((word) => !isAyahMarkerToken(word)),
    [displayWords],
  );
  const recitableIndexByDisplayIndex = useMemo(() => {
    let nextIndex = -1;
    return displayWords.map((word) => {
      if (isAyahMarkerToken(word)) return -1;
      nextIndex += 1;
      return nextIndex;
    });
  }, [displayWords]);

  const dataWords = useMemo(
    () => words?.filter((w) => w.charType !== "end") ?? [],
    [words],
  );

  useEffect(() => {
    lastIdxRef.current = 0;
    setExactWordIdx(-1);
  }, [text]);

  const wordWeights = useMemo(
    () => buildWordWeights(recitableWords),
    [recitableWords],
  );

  const { progress, seekCount } = useKaraoke({
    isFirstAyah,
    wordCount: recitableWords.length,
    calibration,
  });

  const lagWords = useMemo(() => {
    if (!calibration) return 0;
    return recitableWords.length >= 24
      ? Number(calibration.lagWordsLong ?? 0)
      : Number(calibration.lagWordsBase ?? 0);
  }, [calibration, recitableWords.length]);

  useEffect(() => {
    lastIdxRef.current = 0;
  }, [seekCount]);

  useEffect(() => {
    const updateFromSegments = (timeSec = audioService.currentTime || 0) => {
      const segments = Array.isArray(audioService.currentAyah?.segments)
        ? audioService.currentAyah.segments
        : [];

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
  }, [text]);

  const currentIdx = useMemo(() => {
    if (exactWordIdx >= 0) {
      return Math.min(recitableWords.length - 1, exactWordIdx);
    }
    let idx = 0;
    for (let i = 0; i < wordWeights.length; i++) {
      if (progress < wordWeights[i]) {
        idx = i;
        break;
      }
      idx = i;
    }
    const adjustedIdx = Math.max(0, idx - Math.max(0, lagWords));
    const finalIdx = Math.max(lastIdxRef.current, adjustedIdx);
    lastIdxRef.current = finalIdx;
    return finalIdx;
  }, [exactWordIdx, progress, wordWeights, lagWords, recitableWords.length]);

  if (displayWords.length === 0) return <span>{text}</span>;

  return (
    <span className="wbw-container hafs-karaoke" dir="rtl" lang="ar">
      {displayWords.map((word, index) => {
        const isMarkerToken = isAyahMarkerToken(word);
        const recitableIndex = recitableIndexByDisplayIndex[index];
        const isRead = !isMarkerToken && recitableIndex < currentIdx;
        const isCurrent = !isMarkerToken && recitableIndex === currentIdx;

        let cls = "wbw-word";
        if (isRead) cls += " wbw-read";
        else if (isCurrent) cls += " wbw-current";
        else cls += " wbw-upcoming";
        if (isMarkerToken) cls += " wbw-marker-token native-ayah-marker";

        const wordAudioUrl = !isMarkerToken ? dataWords[recitableIndex]?.audioUrl : null;
        return (
          <React.Fragment key={index}>
            <span
              className={cls}
              onClick={wordAudioUrl ? () => playWordAudio(wordAudioUrl) : undefined}
              role={wordAudioUrl ? "button" : undefined}
            >
              {word}
            </span>
            {index < displayWords.length - 1 &&
              (isAyahMarkerToken(displayWords[index + 1]) ? "\u00A0" : " ")}
          </React.Fragment>
        );
      })}
    </span>
  );
});


export { HafsKaraokeText as KaraokeAyahText };

function AyahTextRendererComponent({
  text,
  tajweedText,
  showTajwid,
  isPlaying,
  isFirstAyah,
  calibration,
  riwaya,
  tajweedColors,
  words,
  fontFamily,
  surahNum,
  ayahNumber,
}) {
  const wordData = useMemo(() => ({
    clickableWords: Array.isArray(words)
      ? words.filter((word) => !word.charType || word.charType === "word")
      : [],
  }), [words]);
  const { clickableWords } = wordData;
  const wordDataIsCoherent = useMemo(
    () => hasCoherentWordData(clickableWords, text, fontFamily, riwaya, surahNum, ayahNumber),
    [ayahNumber, clickableWords, fontFamily, riwaya, surahNum, text],
  );

  if (!text) return null;

  if (isPlaying) {
    return (
      <HafsKaraokeText
        text={text}
        isFirstAyah={isFirstAyah}
        calibration={calibration}
        words={words}
      />
    );
  }

  if (!showTajwid || !tajweedText) {
    return (
      <CanonicalQuranText
        text={text}
        riwaya={riwaya}
        words={clickableWords}
        surahNum={surahNum}
        ayahNumber={ayahNumber}
      />
    );
  }

  return (
    <TajweedText
      text={tajweedText}
      enabled
      riwaya={riwaya}
      tajweedColors={tajweedColors}
      surahNum={surahNum}
      ayahNumber={ayahNumber}
    />
  );
}

function areAyahTextRendererEqual(prev, next) {
  return (
    prev.text === next.text &&
    prev.tajweedText === next.tajweedText &&
    prev.showTajwid === next.showTajwid &&
    prev.isPlaying === next.isPlaying &&
    prev.isFirstAyah === next.isFirstAyah &&
    prev.calibration === next.calibration &&
    prev.riwaya === next.riwaya &&
    prev.tajweedColors === next.tajweedColors &&
    prev.words === next.words &&
    prev.fontFamily === next.fontFamily &&
    prev.surahNum === next.surahNum &&
    prev.ayahNumber === next.ayahNumber
  );
}

export const AyahTextRenderer = React.memo(
  AyahTextRendererComponent,
  areAyahTextRendererEqual,
);
