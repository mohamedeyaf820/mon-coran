import React, { useMemo } from "react";
import {
  ensureFontLoaded,
  ensureQcfPageFontLoaded,
  getQcfPageFontFamily,
} from "../../services/fontLoader";
import {
  getQuranWordTextForFont,
  resolveFontFamily,
} from "../../data/fonts";
import { playWordAudio } from "../../utils/wordAudio";
import { sanitizeHtml } from "../../lib/security";
import SURAHS, { getSurahLigature, toAr } from "../../data/surahs";
import { getJuzForAyah } from "../../data/juz";

const BASMALA_TEXT = "بِسْمِ اللهِ الرَّحْمَـٰنِ الرَّحِيمِ";

function decodeHtmlEntity(str) {
  if (!str) return "";
  return String(str)
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/&apos;/g, "'");
}

function getVerseKey(word) {
  return `${Number(word.surah)}:${Number(word.ayah)}`;
}

function getWordGlyph(word, version, page) {
  const glyphPage = version === "v1" ? word.v1Page : word.v2Page;
  if (Number(glyphPage || word.page) !== Number(page)) return "";
  return (version === "v1" ? word.codeV1 : word.codeV2) || "";
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
    const lineStart = Number(ayah.lineStart || 1);
    const lineEnd = Number(ayah.lineEnd || 15);
    for (let lineNo = lineStart; lineNo <= lineEnd; lineNo++) {
      if (!lines.has(lineNo)) lines.set(lineNo, { lineNumber: lineNo, words: [] });
      const line = lines.get(lineNo);
      line.words.push({
        ...ayah,
        lineNumber: lineNo,
        positionInLine: line.words.length + 1,
      });
    }
  });
  return Array.from(lines.values()).sort((a, b) => a.lineNumber - b.lineNumber);
}

function groupPageLines(ayahs) {
  const lines = [];
  ayahs.forEach((ayah) => {
    const lineNumber = Number(ayah.line || 1);
    if (!lines[lineNumber]) lines[lineNumber] = { lineNumber, words: [] };
    lines[lineNumber].words.push(ayah);
  });
  return Object.values(lines).sort((a, b) => a.lineNumber - b.lineNumber);
}

function getSurahMeta(surahNumber) {
  const surah = SURAHS[surahNumber] || {};
  return {
    name: surah.name || "",
    name_arabic: surah.name_arabic || surah.name || "",
    ar: surah.name_arabic || surah.name || "",
    en: surah.name || "",
    revelation: surah.revelation || "",
    ayahs: surah.ayahs || 0,
  };
}

function getPageMeta(ayahs, currentPage, lang, riwaya, isWarsh) {
  const first = ayahs[0];
  const last = ayahs[ayahs.length - 1];
  const juz = getJuzForAyah(first.globalAyah);
  const hizb = Math.ceil(juz * 2) % 2 === 0 ? juz * 2 : Math.ceil(juz * 2);
  const rub = ((hizb * 4) % 4 === 0 ? hizb * 4 : Math.ceil(hizb * 4)) - 3;

  return {
    top: lang === "ar" ? `الجزء ${toAr(juz)}` : `Juz ${juz}`,
    middle: `${first.surah?.ar || first.surah?.name_arabic || first.surah?.name || ""} · ${first.numberInSurah || ""}–${last.numberInSurah || ""}`,
    bottom: lang === "ar" ? `الجزء ${toAr(juz)}` : `Juz ${juz}`,
    sideA: `${lang === "ar" ? "جزء" : "Juz"} ${lang === "ar" ? toAr(juz) : juz}`,
    sideB: `${lang === "ar" ? "حزب" : "Hizb"} ${lang === "ar" ? toAr(hizb) : hizb}`,
    sideC: rub ? `${lang === "ar" ? "ربع" : "Rubʿ"} ${lang === "ar" ? toAr(rub) : rub}` : "",
    fontLabel: isWarsh ? (lang === "ar" ? "رواية ورش" : "Warsh") : (lang === "ar" ? "رواية حفص" : "Hafs"),
    page: currentPage,
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
  const [loadedFamily, setLoadedFamily] = React.useState(null);
  const fontLoaded = loadedFamily === pageFontFamily;
  const [fontFailed, setFontFailed] = React.useState(false);

  const lines = React.useMemo(
    () => (isWarsh ? groupWarshPageLines(ayahs) : groupPageLines(ayahs)),
    [ayahs, isWarsh],
  );
  const meta = React.useMemo(
    () => getPageMeta(ayahs, currentPage, lang, riwaya, isWarsh),
    [ayahs, currentPage, lang, riwaya, isWarsh],
  );

  React.useEffect(() => {
    let cancelled = false;
    setLoadedFamily(null);
    setFontFailed(false);

    if (isWarsh) {
      const warshFontId = fontFamily || "qpc-warsh";
      ensureFontLoaded(warshFontId).then((result) => {
        if (!cancelled) {
          const loaded = Boolean(result.loaded || result.cached);
          setLoadedFamily(loaded ? pageFontFamily : null);
          setFontFailed(!loaded);
        }
      });
    } else {
      ensureQcfPageFontLoaded(currentPage, version).then((result) => {
        if (!cancelled) {
          const loaded = Boolean(result.loaded || result.cached);
          setLoadedFamily(loaded ? pageFontFamily : null);
          setFontFailed(!loaded);
        }
      });
    }

    return () => {
      cancelled = true;
    };
  }, [currentPage, fontFamily, isWarsh, version, pageFontFamily]);

  const renderWord = (word, index) => {
    const verseKey = getVerseKey(word);
    const isPlaying =
      currentPlayingAyah?.surah === word.surah &&
      currentPlayingAyah?.ayah === word.ayah;
    const isActive = activeAyah === word.globalAyah;
    const isEnd = word.charType === "end";

    if (isEnd) {
      return (
        <span
          key={`${verseKey}:end:${index}`}
          className="qcm-ayah-marker"
          data-surah-number={word.surah}
          data-ayah-number={word.ayah}
          data-ayah-global={word.globalAyah}
          data-word-position={word.position}
          role="button"
          tabIndex={0}
          onClick={() => {
            playWordAudio(word.audioUrl || { surah: word.surah, ayah: word.ayah, position: word.position });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              playWordAudio(word.audioUrl || { surah: word.surah, ayah: word.ayah, position: word.position });
            }
          }}
        >
          {normalizeArabicText(word.text)}
        </span>
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
          onClick={() => {
            playWordAudio(word.audioUrl || { surah: word.surah, ayah: word.ayah, position: word.position });
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              playWordAudio(word.audioUrl || { surah: word.surah, ayah: word.ayah, position: word.position });
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
            marginInlineEnd: '0.035em',
          }}
        >
          {normalizeArabicText(word.text)}
        </span>
      );
    }

    const glyph = getWordGlyph(word, version, currentPage);
    const useGlyph = fontLoaded && Boolean(glyph);
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
        onClick={() => {
          playWordAudio(word.audioUrl || { surah: word.surah, ayah: word.ayah, position: word.position });
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            playWordAudio(word.audioUrl || { surah: word.surah, ayah: word.ayah, position: word.position });
          }
        }}
        style={{
          fontFamily: useGlyph ? pageFontFamily : fallbackFontFamily,
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
        }}
      >
        {decodeHtmlEntity(
          useGlyph
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
      <div className="qcm-page">
        <header className="qcm-page-header">
          <span className="text-[var(--text-muted)] text-[0.65rem] font-semibold">{meta.top}</span>
          <strong className="text-[var(--text-primary)] text-[0.72rem] font-bold tracking-wide">{meta.middle}</strong>
        </header>
        <div className="qcm-lines" dir="rtl" lang="ar" data-warsh={isWarsh ? "true" : undefined}>
          {lines.map((line) => {
            if (line.kind === "surah-header") {
              const surahMeta = getSurahMeta(line.surah);
              return (
                <div
                  key={line.lineNumber}
                  className="qcm-line qcm-line--surah-header"
                  data-line-number={line.lineNumber}
                >
                  <span
                    className="qcm-surah-title"
                    role="heading"
                    aria-level={2}
                    aria-label={`سورة ${surahMeta?.ar || line.surah}`}
                  >
                    <span
                      className="qcm-surah-title__name font-surah-names"
                      dir="ltr"
                      lang="en"
                      aria-hidden="true"
                    >
                      {getSurahLigature(line.surah)}
                    </span>
                  </span>
                </div>
              );
            }
            if (line.kind === "basmala") {
              return (
                <div
                  key={line.lineNumber}
                  className="qcm-line qcm-line--basmala"
                  data-line-number={line.lineNumber}
                >
                  <span
                    className="qcm-basmala"
                    lang="ar"
                    style={{ fontFamily: fallbackFontFamily }}
                  >
                    {BASMALA_TEXT}
                  </span>
                </div>
              );
            }
            const lineClass = line.words.length === 0
              ? "qcm-line qcm-line--empty"
              : line.endsSurah
                ? "qcm-line qcm-line--surah-end"
                : "qcm-line";
              return (
                <div
                  key={line.lineNumber}
                  className={lineClass}
                  data-line-number={line.lineNumber}
                >
                  {line.words.map(renderWord)}
                </div>
              );
          })}
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
