import React, { useEffect, useMemo, useState } from "react";
import { getJuzForAyah } from "../../data/juz";
import { toAr } from "../../data/surahs";
import {
  ensureQcfPageFontLoaded,
  getQcfPageFontFamily,
} from "../../services/fontLoader";
import AyahMarker from "../Quran/AyahMarker";

function getVerseKey(word) {
  return `${Number(word.surah)}:${Number(word.ayah)}`;
}

function getWordGlyph(word, version) {
  if (version === "v1") return word.codeV1 || word.codeV2 || "";
  return word.codeV2 || word.codeV1 || "";
}

function getLineNumber(word) {
  const lineNumber = Number(word?.lineNumber || word?.lineV2 || word?.lineV1);
  return Number.isFinite(lineNumber) && lineNumber > 0 ? lineNumber : null;
}

function getSupportWords(ayah) {
  if (Array.isArray(ayah?.words) && ayah.words.length > 0) return ayah.words;
  if (Array.isArray(ayah?.hafsSupport?.words)) return ayah.hafsSupport.words;
  return [];
}

function isQuranWord(word) {
  return !word?.charType || word.charType === "word";
}

function groupWarshPageLines(ayahs) {
  const lines = new Map();

  ayahs.forEach((ayah) => {
    const surah = ayah.surah?.number;
    const ayahNum = ayah.numberInSurah;
    const supportWords = getSupportWords(ayah);
    const warshWords = Array.isArray(ayah.warshWords)
      ? [...ayah.warshWords]
      : String(ayah.text || "").split(/\s+/).filter(Boolean);
    let lastLineNumber = null;
    let warshIndex = 0;

    supportWords.forEach((supportWord) => {
      const lineNumber = getLineNumber(supportWord) || lastLineNumber;
      if (!lineNumber) return;
      lastLineNumber = lineNumber;
      if (!lines.has(lineNumber)) lines.set(lineNumber, []);

      if (supportWord.charType === "end") {
        lines.get(lineNumber).push({
          charType: "end",
          globalAyah: ayah.number,
          surah,
          ayah: ayahNum,
          isWarsh: true,
        });
        return;
      }

      if (!isQuranWord(supportWord)) return;

      const text = warshWords[warshIndex++];
      if (!text) return;
      lines.get(lineNumber).push({
        charType: "word",
        globalAyah: ayah.number,
        surah,
        ayah: ayahNum,
        position: warshIndex,
        text,
        isWarsh: true,
      });
    });

    const fallbackLine = lastLineNumber || Number(ayah.lineStart) || 15;
    while (warshIndex < warshWords.length) {
      if (!lines.has(fallbackLine)) lines.set(fallbackLine, []);
      lines.get(fallbackLine).push({
        charType: "word",
        globalAyah: ayah.number,
        surah,
        ayah: ayahNum,
        position: warshIndex + 1,
        text: warshWords[warshIndex++],
        isWarsh: true,
      });
    }
  });

  return Array.from({ length: 15 }, (_, index) => {
    const lineNumber = index + 1;
    return {
      lineNumber,
      words: lines.get(lineNumber) || [],
    };
  });
}

function groupPageLines(ayahs) {
  const lines = new Map();

  ayahs.forEach((ayah) => {
    const surah = ayah.surah?.number;
    const ayahNum = ayah.numberInSurah;
    const words = Array.isArray(ayah.words) ? ayah.words : [];

    words.forEach((word) => {
      const lineNumber = getLineNumber(word);
      if (!lineNumber) return;
      if (!lines.has(lineNumber)) lines.set(lineNumber, []);
      lines.get(lineNumber).push({
        ...word,
        globalAyah: ayah.number,
        surah: word.surah || surah,
        ayah: word.ayah || ayahNum,
      });
    });
  });

  return Array.from({ length: 15 }, (_, index) => {
    const lineNumber = index + 1;
    return {
      lineNumber,
      words: lines.get(lineNumber) || [],
    };
  });
}

function getPageMeta(ayahs, currentPage, lang, riwaya) {
  const first = ayahs[0] || {};
  const last = ayahs[ayahs.length - 1] || first;
  const juz =
    first.juz ||
    getJuzForAyah(first.surah?.number, first.numberInSurah) ||
    "";
  const hizb = first.hizb || "";
  const rub = first.rubElHizb || "";
  const page = lang === "ar" ? toAr(currentPage) : currentPage;

  return {
    page,
    top: `Page ${page}`,
    middle: `${riwaya.toUpperCase()} · ${first.surah?.number || ""}:${first.numberInSurah || ""} - ${last.surah?.number || ""}:${last.numberInSurah || ""}`,
    sideA: `${lang === "fr" ? "Juz" : "Juz"} ${lang === "ar" ? toAr(juz) : juz}`,
    sideB: `${lang === "fr" ? "Hizb" : "Hizb"} ${lang === "ar" ? toAr(hizb) : hizb}`,
    sideC: rub ? `Rub ${lang === "ar" ? toAr(rub) : rub}` : "",
  };
}

export default function QuranMushafPage({
  activeAyah,
  ayahs,
  currentPage,
  currentPlayingAyah,
  lang,
  onToggleActive,
  riwaya,
  showTajwid,
}) {
  const version = showTajwid ? "v4" : "v2";
  const fontLabel = version === "v4" ? "QCF V4 Tajweed" : "QCF V2";
  const pageFontFamily = getQcfPageFontFamily(currentPage, version);
  const fallbackFontFamily = "var(--font-quran, 'QPC Hafs', serif)";
  const isWarsh = riwaya === "warsh";
  const [fontLoaded, setFontLoaded] = useState(false);

  const lines = useMemo(
    () => (isWarsh ? groupWarshPageLines(ayahs) : groupPageLines(ayahs)),
    [ayahs, isWarsh],
  );
  const meta = useMemo(
    () => getPageMeta(ayahs, currentPage, lang, riwaya),
    [ayahs, currentPage, lang, riwaya],
  );

  useEffect(() => {
    if (isWarsh) {
      setFontLoaded(false);
      return undefined;
    }

    let cancelled = false;
    setFontLoaded(false);
    ensureQcfPageFontLoaded(currentPage, version).then((result) => {
      if (!cancelled) setFontLoaded(Boolean(result.loaded || result.cached));
    });
    return () => {
      cancelled = true;
    };
  }, [currentPage, isWarsh, version]);

  const renderWord = (word, index) => {
    const verseKey = getVerseKey(word);
    const isPlaying =
      currentPlayingAyah?.surah === word.surah &&
      currentPlayingAyah?.ayah === word.ayah;
    const isActive = activeAyah === word.globalAyah;
    const isEnd = word.charType === "end";

    if (isEnd) {
      return (
        <AyahMarker
          key={`${verseKey}:end:${index}`}
          num={word.ayah}
          isPlaying={isPlaying}
          className="qcm-ayah-marker"
          size="1.04em"
        />
      );
    }

    if (word.isWarsh) {
      return (
        <span
          key={`${verseKey}:${word.position || index}:warsh`}
          className={`qcm-word qcm-word--warsh${isPlaying ? " qcm-word--playing" : ""}${isActive ? " qcm-word--active" : ""}`}
          data-surah-number={word.surah}
          data-ayah-number={word.ayah}
          data-ayah-global={word.globalAyah}
          data-word-position={word.position}
          role="button"
          tabIndex={0}
          onClick={() => onToggleActive?.(word.globalAyah)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onToggleActive?.(word.globalAyah);
            }
          }}
          style={{ fontFamily: "var(--quran-font-family)" }}
        >
          {word.text}
        </span>
      );
    }

    const glyph = getWordGlyph(word, version);
    return (
      <span
        key={`${verseKey}:${word.position || index}`}
        className={`qcm-word${isPlaying ? " qcm-word--playing" : ""}${isActive ? " qcm-word--active" : ""}`}
        data-surah-number={word.surah}
        data-ayah-number={word.ayah}
        data-ayah-global={word.globalAyah}
        data-word-position={word.position}
        role="button"
        tabIndex={0}
        onClick={() => onToggleActive?.(word.globalAyah)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onToggleActive?.(word.globalAyah);
          }
        }}
        style={{
          fontFamily: fontLoaded ? pageFontFamily : fallbackFontFamily,
        }}
        dangerouslySetInnerHTML={
          fontLoaded && glyph
            ? { __html: glyph }
            : { __html: word.textQpcHafs || word.textUthmani || word.text || "" }
        }
      />
    );
  };

  return (
    <section className="qcm-page-shell" aria-label={`Mushaf page ${currentPage}`}>
      <div className="qcm-edge qcm-edge--start">
        <span>{meta.sideA}</span>
        <span>{meta.sideB}</span>
      </div>
      <div className="qcm-page">
        <header className="qcm-page-header">
          <span>{meta.top}</span>
          <strong>{meta.middle}</strong>
        </header>
        <div className="qcm-lines" dir="rtl" lang="ar">
          {lines.map((line) => (
            <div
              key={line.lineNumber}
              className={`qcm-line${line.words.length === 0 ? " qcm-line--empty" : ""}`}
              data-line-number={line.lineNumber}
            >
              {line.words.map(renderWord)}
            </div>
          ))}
        </div>
        <footer className="qcm-page-footer" aria-hidden="true">
          <span>{isWarsh ? "Warsh Unicode" : fontLabel}</span>
          <span>{isWarsh ? "15 lignes" : fontLoaded ? "Glyphs actifs" : "Unicode fallback"}</span>
        </footer>
      </div>
      <div className="qcm-edge qcm-edge--end">
        <span>{meta.sideC || meta.sideB}</span>
        <span>{meta.page} / 604</span>
      </div>
    </section>
  );
}
