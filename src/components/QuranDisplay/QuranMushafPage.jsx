import React, { useEffect, useMemo, useState } from "react";
import { getJuzForAyah } from "../../data/juz";
import { toAr } from "../../data/surahs";
import {
  ensureFontLoaded,
  ensureQcfPageFontLoaded,
  getQcfPageFontFamily,
} from "../../services/fontLoader";
import AyahMarker from "../Quran/AyahMarker";
import { playWordAudio } from "../../utils/wordAudio";
import { sanitizeHtml } from "../../lib/security";
import {
  getQuranWordTextForFont,
  resolveFontFamily,
} from "../../data/fonts";

function decodeHtmlEntity(str) {
  if (!str) return "";
  return String(str)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

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

// Normalize Arabic text to ensure proper diacritic rendering
function normalizeArabicText(text) {
  if (!text) return "";
  return String(text).normalize("NFC");
}

function groupWarshPageLines(ayahs) {
  const hasLineMetadata = ayahs.some((ayah) => Number(ayah?.lineStart) || Number(ayah?.lineEnd));
  if (!hasLineMetadata) {
    const tokens = [];
    ayahs.forEach((ayah) => {
      const surah = ayah.surah?.number;
      const ayahNum = ayah.numberInSurah;
      const rawText = normalizeArabicText(ayah.text || "");
      const warshWords = Array.isArray(ayah.warshWords)
        ? ayah.warshWords.map((word) => normalizeArabicText(word))
        : rawText.split(/\s+/).filter(Boolean);

      warshWords.forEach((text, index) => {
        tokens.push({
          charType: "word",
          globalAyah: ayah.number,
          surah,
          ayah: ayahNum,
          position: index + 1,
          text,
          isWarsh: true,
        });
      });
      tokens.push({
        charType: "end",
        globalAyah: ayah.number,
        surah,
        ayah: ayahNum,
        isWarsh: true,
      });
    });

    const perLine = Math.max(1, Math.ceil(tokens.length / 15));
    return Array.from({ length: 15 }, (_, index) => ({
      lineNumber: index + 1,
      words: tokens.slice(index * perLine, (index + 1) * perLine),
    }));
  }

  const lines = new Map();

  ayahs.forEach((ayah) => {
    const surah = ayah.surah?.number;
    const ayahNum = ayah.numberInSurah;
    const rawText = normalizeArabicText(ayah.text || "");
    const warshWords = Array.isArray(ayah.warshWords)
      ? ayah.warshWords.map(w => normalizeArabicText(w))
      : rawText.split(/\s+/).filter(Boolean);

    if (warshWords.length === 0) return;

    // Distribute words across lines using line_start and line_end from the ayah
    const lineStart = Number(ayah.lineStart) || 1;
    const lineEnd = Number(ayah.lineEnd) || 15;
    const lineSpan = Math.max(1, lineEnd - lineStart + 1);
    const wordsPerLine = Math.max(1, Math.ceil(warshWords.length / lineSpan));

    warshWords.forEach((text, idx) => {
      const lineIndex = Math.min(lineSpan - 1, Math.floor(idx / wordsPerLine));
      const lineNumber = lineStart + lineIndex;

      if (lineNumber < 1 || lineNumber > 15) return;
      if (!lines.has(lineNumber)) lines.set(lineNumber, []);

      lines.get(lineNumber).push({
        charType: "word",
        globalAyah: ayah.number,
        surah,
        ayah: ayahNum,
        position: idx + 1,
        text,
        isWarsh: true,
      });
    });

    // Add ayah end marker on the last line
    const lastLine = Math.min(15, lineEnd);
    if (lines.has(lastLine)) {
      lines.get(lastLine).push({
        charType: "end",
        globalAyah: ayah.number,
        surah,
        ayah: ayahNum,
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
  const seenEndMarkers = new Set();

  ayahs.forEach((ayah) => {
    const surah = ayah.surah?.number;
    const ayahNum = ayah.numberInSurah;
    const words = Array.isArray(ayah.words) ? ayah.words : [];

    words.forEach((word) => {
      const lineNumber = getLineNumber(word);
      if (!lineNumber) return;
      const charType = word.charType || word.charTypeName || word.char_type_name;
      const endKey = `${surah}:${ayahNum}`;
      if (charType === "end") {
        if (seenEndMarkers.has(endKey)) return;
        seenEndMarkers.add(endKey);
      }
      if (!lines.has(lineNumber)) lines.set(lineNumber, []);
      lines.get(lineNumber).push({
        ...word,
        charType,
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

function getPageMeta(ayahs, currentPage, lang, riwaya, isWarsh = riwaya === "warsh") {
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
    top: lang === "ar" ? `صفحة ${page}` : `Page ${page}`,
    middle:
      lang === "ar"
        ? `سورة ${first.surah?.number || ""} · ${first.numberInSurah || ""}‏–‏${last.numberInSurah || ""}`
        : `Surah ${first.surah?.number || ""} · ${first.numberInSurah || ""}–${last.numberInSurah || ""}`,
    sideA: `${lang === "ar" ? "جزء" : "Juz"} ${lang === "ar" ? toAr(juz) : juz}`,
    sideB: `${lang === "ar" ? "حزب" : "Hizb"} ${lang === "ar" ? toAr(hizb) : hizb}`,
    sideC: rub ? `${lang === "ar" ? "ربع" : "Rubʿ"} ${lang === "ar" ? toAr(rub) : rub}` : "",
    fontLabel: isWarsh ? (lang === "ar" ? "رواية ورش" : "Warsh") : (lang === "ar" ? "رواية حفص" : "Hafs"),
  };
}

export default function QuranMushafPage({
  activeAyah,
  ayahs,
  currentPage,
  currentPlayingAyah,
  fontFamily,
  lang,
  onToggleActive,
  riwaya,
  showTajwid,
}) {
  const version = showTajwid ? "v4" : "v2";
  const fontLabel = version === "v4" ? "QCF V4 Tajweed" : "QCF V2";
  const pageFontFamily = getQcfPageFontFamily(currentPage, version);
  const fallbackFontFamily = resolveFontFamily(fontFamily, riwaya);
  const isWarsh = riwaya === "warsh";
  const [fontLoaded, setFontLoaded] = useState(false);
  const [fontFailed, setFontFailed] = useState(false);

  const lines = useMemo(
    () => (isWarsh ? groupWarshPageLines(ayahs) : groupPageLines(ayahs)),
    [ayahs, isWarsh],
  );
  const meta = useMemo(
    () => getPageMeta(ayahs, currentPage, lang, riwaya, isWarsh),
    [ayahs, currentPage, lang, riwaya, isWarsh],
  );

  useEffect(() => {
    let cancelled = false;
    setFontLoaded(false);
    setFontFailed(false);

    if (isWarsh) {
      // Load the Warsh font file so --font-quran resolves correctly.
      // fontFamily defaults to "qpc-warsh" when not supplied.
      const warshFontId = fontFamily || "qpc-warsh";
      ensureFontLoaded(warshFontId).then((result) => {
        if (!cancelled) {
          const loaded = Boolean(result.loaded || result.cached);
          setFontLoaded(loaded);
          setFontFailed(!loaded);
        }
      });
    } else {
      ensureQcfPageFontLoaded(currentPage, version).then((result) => {
        if (!cancelled) {
          const loaded = Boolean(result.loaded || result.cached);
          setFontLoaded(loaded);
          setFontFailed(!loaded);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [currentPage, fontFamily, isWarsh, version]);

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
          onClick={() => { if (word.audioUrl) playWordAudio(word.audioUrl); onToggleActive?.(word.globalAyah); }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (word.audioUrl) playWordAudio(word.audioUrl);
              onToggleActive?.(word.globalAyah);
            }
          }}
          style={{
            fontFamily: 'var(--font-quran)',
            fontSize: 'var(--qd-font-size, 28px)',
            lineHeight: 'var(--line-height-quran)',
            letterSpacing: 0,
            wordSpacing: 0,
            textRendering: 'optimizeLegibility',
            WebkitFontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1',
            fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            unicodeBidi: 'isolate',
            whiteSpace: 'nowrap',
            // Words are separate interactive spans in page mode. This tiny
            // logical gap replaces the literal space without producing the
            // exaggerated Safari/WebKit spacing caused by word-spacing.
            marginInlineEnd: '0.035em',
          }}
        >
          {normalizeArabicText(word.text)}
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
        onClick={() => { if (word.audioUrl) playWordAudio(word.audioUrl); onToggleActive?.(word.globalAyah); }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (word.audioUrl) playWordAudio(word.audioUrl);
            onToggleActive?.(word.globalAyah);
          }
        }}
        style={{
          fontFamily: fontLoaded ? pageFontFamily : fallbackFontFamily,
        }}
      >
        {decodeHtmlEntity(
          fontLoaded && glyph
            ? glyph
            : getQuranWordTextForFont(word, fontFamily, riwaya)
        )}
      </span>
    );
  };

  return (
    <section className="qcm-page-shell" aria-label={`${lang === "ar" ? "صفحة" : "Page"} ${currentPage}`}>
      {fontFailed && !isWarsh && (
        <div className="qcm-font-warning" role="alert">
          <span>
            {lang === "ar"
              ? "تعذّر تحميل الخط — يُعرض النص بخط بديل"
              : lang === "fr"
                ? "Police non chargée — affichage en mode texte"
                : "Font failed to load — showing text fallback"}
          </span>
        </div>
      )}
      <div className="qcm-edge qcm-edge--start">
        <span>{meta.sideA}</span>
        <span>{meta.sideB}</span>
      </div>
      <div className="qcm-page">
        <header className="qcm-page-header">
          <span className="text-[var(--text-muted)] text-[0.65rem] font-semibold">{meta.top}</span>
          <strong className="text-[var(--text-primary)] text-[0.72rem] font-bold tracking-wide">{meta.middle}</strong>
        </header>
        <div className="qcm-lines" dir="rtl" lang="ar" data-warsh={isWarsh ? "true" : undefined}>
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
          <span>{meta.fontLabel}</span>
          <span>{meta.page} / 604</span>
        </footer>
      </div>
      <div className="qcm-edge qcm-edge--end">
        <span>{meta.sideC || meta.sideB}</span>
        <span>{meta.page}</span>
      </div>
    </section>
  );
}
