import React, { useMemo } from "react";
import useKaraokeWordIndex from "../../hooks/useKaraokeWordIndex";
import audioService from "../../services/audioService";
import { NATIVE_AYAH_MARKER_RE, getQuranWordTextForFont, normalizeFontId } from "../../data/fonts";
import { getFontSignVariant } from "../../utils/quranUtils";
import { useAppLocale } from "../../context/AppContext";
import {
  getReadableWaqfGlyph,
  normalizeQuranGlyphText,
} from "../../utils/quranUtils";
import TajweedText from "./TajweedText";
import { playWordAudio, getWordAudioUrl } from "../../utils/wordAudio";

const AYAH_MARKER_TOKEN_RE = /^[\u06dd\u06de\u06e9\ufd3f\ufd3e\d\u0660-\u0669\u06f0-\u06f9]+$/u;
const WAQF_MARKER_SPLIT_RE = /([\u06d6-\u06dc])/u;
const WAQF_MARKER_CHAR_RE = /^[\u06d6-\u06dc]$/u;

function getVerseLabel(lang, ayahNumber) {
  if (!ayahNumber) return undefined;
  const word = lang === "ar" ? "\u0627\u0644\u0622\u064a\u0629" : lang === "en" ? "Verse" : "Verset";
  return `${word} ${ayahNumber}`;
}

function CanonicalQuranText({ text, riwaya, words, surahNum, ayahNumber }) {
  const { lang } = useAppLocale();
  const verseLabel = getVerseLabel(lang, ayahNumber);
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
                      role="button"
                      tabIndex={0}
                      aria-label={isMarker ? verseLabel : undefined}
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
              role="button"
              tabIndex={0}
              aria-label={isMarker ? verseLabel : undefined}
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
  const currentIdx = useKaraokeWordIndex({
    text,
    isFirstAyah,
    calibration,
    recitableWords,
  });

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
        // While the ayah is being recited, a word click resumes the
        // recitation from that word (word timings), like a seek.
        const seekToWord = !isMarkerToken
          ? () => {
              const segments = Array.isArray(audioService.currentAyah?.segments)
                ? audioService.currentAyah.segments
                : [];
              const segment = segments.find((item) =>
                (Number.isFinite(item.wordIndex)
                  ? item.wordIndex
                  : Number(item.wordPosition || 1) - 1) === recitableIndex,
              );
              if (segment && Number.isFinite(segment.startMs)) {
                audioService.seek(segment.startMs / 1000);
                if (audioService.audio?.paused) audioService.resume?.();
                return;
              }
              if (wordAudioUrl) playWordAudio(wordAudioUrl);
            }
          : undefined;
        return (
          <React.Fragment key={index}>
            <span
              className={cls}
              onClick={seekToWord}
              role={seekToWord ? "button" : undefined}
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
  const safeWords = wordDataIsCoherent ? clickableWords : [];

  if (!text) return null;

  if (isPlaying && !(showTajwid && tajweedText)) {
    return (
      <HafsKaraokeText
        text={text}
        isFirstAyah={isFirstAyah}
        calibration={calibration}
        words={safeWords}
      />
    );
  }

  if (!showTajwid || !tajweedText) {
    return (
      <CanonicalQuranText
        text={text}
        riwaya={riwaya}
        words={safeWords}
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
      karaoke={isPlaying ? { isFirstAyah, calibration } : null}
      signVariant={getFontSignVariant(normalizeFontId(fontFamily, riwaya))}
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
