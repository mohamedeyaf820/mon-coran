import React, { useEffect, useMemo, useRef, useState } from "react";
import { useKaraoke } from "../../hooks/useKaraoke";
import audioService from "../../services/audioService";
import { NATIVE_AYAH_MARKER_RE, getQuranWordTextForFont, getNativeAyahMarker, normalizeFontId, resolveFontFamily } from "../../data/fonts";
import TajweedText from "./TajweedText";
import { playWordAudio } from "../../utils/wordAudio";

const AYAH_MARKER_TOKEN_RE = /^[\u06dd\u06de\u06e9\ufd3f\ufd3e\d\u0660-\u0669\u06f0-\u06f9]+$/u;

function isAyahMarkerToken(word) {
  if (!word) return false;
  const compact = String(word).replace(/\s+/g, "");
  if (!compact) return false;
  return AYAH_MARKER_TOKEN_RE.test(compact) || NATIVE_AYAH_MARKER_RE.test(compact);
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
    <span className="wbw-container hafs-karaoke">
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
            {index < displayWords.length - 1 && " "}
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
}) {
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

  const clickableWords = words?.filter((w) => w.charType !== "end" && w.charType !== "separator");
  const endMarkerWord = words?.find((w) => w.charType === "end");
  const textHasEndMarker = NATIVE_AYAH_MARKER_RE.test(text);

  if (clickableWords?.length > 0) {
    const activeFont = normalizeFontId(fontFamily, riwaya);
    return (
      <span className="wbw-container">
        {clickableWords.map((word, i) => {
          const hasAudio = !!word.audioUrl;
          const wordText = getQuranWordTextForFont(word, fontFamily, riwaya);
          return (
            <React.Fragment key={i}>
              <span
                className={`wbw-word${hasAudio ? " wbw-word--clickable" : ""}`}
                onClick={hasAudio ? () => playWordAudio(word.audioUrl) : undefined}
                role={hasAudio ? "button" : undefined}
              >
                {showTajwid && word.textTajweed
                  ? <TajweedText text={word.textTajweed} enabled riwaya={riwaya} tajweedColors={tajweedColors} />
                  : wordText}
              </span>
              {" "}
            </React.Fragment>
          );
        })}
        {textHasEndMarker && endMarkerWord && (
          <span
            dir="rtl"
            className="ayah-marker-wrap ayat-marker qurancom-ayah-marker verse-end-marker native-ayah-marker inline-block select-none"
            aria-label={`Verset ${endMarkerWord.ayah}`}
            data-marker-font={activeFont}
            style={{ fontFamily: resolveFontFamily(activeFont, riwaya) }}
          >
            <span aria-hidden="true">{getNativeAyahMarker(endMarkerWord.ayah, activeFont, riwaya)}</span>
          </span>
        )}
      </span>
    );
  }

  return (
    <TajweedText
      text={showTajwid && tajweedText ? tajweedText : text}
      enabled={showTajwid}
      riwaya={riwaya}
      tajweedColors={tajweedColors}
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
    prev.fontFamily === next.fontFamily
  );
}

export const AyahTextRenderer = React.memo(
  AyahTextRendererComponent,
  areAyahTextRendererEqual,
);
