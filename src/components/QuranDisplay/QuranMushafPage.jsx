import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { getJuzForAyah } from "../../data/juz";
import SURAHS, { getSurahLigature, toAr } from "../../data/surahs";
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
  stripEmbeddedAyahMarkers,
} from "../../data/fonts";
import { getBasmalaText } from "../../data/basmala";

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

function getCleanWarshWords(ayah) {
  const source = Array.isArray(ayah?.warshWords) && ayah.warshWords.length > 0
    ? ayah.warshWords
        .map((word) => typeof word === "string" ? word : word?.text || "")
        .join(" ")
    : ayah?.text || "";
  return stripEmbeddedAyahMarkers(normalizeArabicText(source), {
    ayahNumber: ayah?.numberInSurah,
  })
    .split(/\s+/u)
    .filter(Boolean);
}

function getWarshWordWeight(text) {
  const bases = normalizeArabicText(text)
    .replace(/[\u0610-\u061A\u0640\u064B-\u065F\u0670\u06D6-\u06ED]/gu, "");
  return Math.max(1, Array.from(bases).length);
}

function balanceWarshPageTokens(tokens) {
  if (tokens.length === 0) return new Map();
  const firstLine = Math.min(...tokens.map((token) => token.minLine));
  const lastLine = Math.max(...tokens.map((token) => token.maxLine));
  const occupiedLineCount = Math.max(1, lastLine - firstLine + 1);
  const targetWeight = tokens.reduce((sum, token) => sum + token.weight, 0) / occupiedLineCount;
  const states = Array.from({ length: 16 }, () => new Map());
  states[0].set(0, { cost: 0, previous: null });

  for (let lineNumber = 1; lineNumber <= 15; lineNumber += 1) {
    for (const [startIndex, state] of states[lineNumber - 1]) {
      let lineWeight = 0;
      for (let endIndex = startIndex; endIndex <= tokens.length; endIndex += 1) {
        if (endIndex > startIndex) {
          const token = tokens[endIndex - 1];
          if (lineNumber < token.minLine || lineNumber > token.maxLine) break;
          lineWeight += token.weight;
        }
        const isOccupiedLine = lineNumber >= firstLine && lineNumber <= lastLine;
        const deviation = isOccupiedLine ? lineWeight - targetWeight : lineWeight;
        const overflowPenalty = lineWeight > targetWeight * 1.12 ? 4 : 1;
        const cost = state.cost + deviation * deviation * overflowPenalty;
        const current = states[lineNumber].get(endIndex);
        if (!current || cost < current.cost) {
          states[lineNumber].set(endIndex, { cost, previous: startIndex });
        }
      }
    }
  }

  if (!states[15].has(tokens.length)) return new Map();
  const lines = new Map();
  let endIndex = tokens.length;
  for (let lineNumber = 15; lineNumber >= 1; lineNumber -= 1) {
    const state = states[lineNumber].get(endIndex);
    if (!state) return new Map();
    if (endIndex > state.previous) {
      lines.set(lineNumber, tokens.slice(state.previous, endIndex).map((token) => token.word));
    }
    endIndex = state.previous;
  }
  return lines;
}

function groupWarshPageLines(ayahs) {
  const hasLineMetadata = ayahs.some((ayah) => Number(ayah?.lineStart) || Number(ayah?.lineEnd));
  if (!hasLineMetadata) {
    const tokens = [];
    ayahs.forEach((ayah) => {
      const surah = ayah.surah?.number;
      const ayahNum = ayah.numberInSurah;
      const warshWords = getCleanWarshWords(ayah);

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

  // ── Warsh dataset carries per-ayah lineStart/lineEnd metadata ─────────
  // When present, group words by their ACTUAL printed line numbers instead of
  // running the 15-bin balancing algorithm. This preserves the physical
  // line structure of the Warsh edition and eliminates the artificial
  // "grid of words" artifact that the optical balancing created.
  const linesByNumber = new Map();

  ayahs.forEach((ayah) => {
    const surah = ayah.surah?.number;
    const ayahNum = ayah.numberInSurah;
    const warshWords = getCleanWarshWords(ayah);
    if (warshWords.length === 0) return;

    const lineStart = Math.max(1, Math.min(15, Number(ayah.lineStart) || 1));
    const lineEnd = Math.max(lineStart, Math.min(15, Number(ayah.lineEnd) || 15));

    // First word of the ayah starts on lineStart; subsequent words stay on
    // lineStart until the lineEnd boundary is reached, then flow to lineEnd.
    // This matches the printed Mushaf layout where an ayah may span multiple
    // lines but always starts on a fresh line.
    warshWords.forEach((text, idx) => {
      const lineNumber = idx === 0 ? lineStart : (idx < warshWords.length - 1 ? lineStart : lineEnd);
      if (!linesByNumber.has(lineNumber)) linesByNumber.set(lineNumber, []);
      linesByNumber.get(lineNumber).push({
        charType: "word",
        globalAyah: ayah.number,
        surah,
        ayah: ayahNum,
        position: idx + 1,
        text,
        isWarsh: true,
      });
    });

    // End marker belongs on the last line of the ayah
    if (!linesByNumber.has(lineEnd)) linesByNumber.set(lineEnd, []);
    linesByNumber.get(lineEnd).push({
      charType: "end",
      globalAyah: ayah.number,
      surah,
      ayah: ayahNum,
      isWarsh: true,
    });
  });

  // Build the 15-line grid using actual line numbers from the dataset.
  // Lines without any words remain empty slots (printed blank rows).
  const pageLines = Array.from({ length: 15 }, (_, index) => {
    const lineNumber = index + 1;
    return {
      lineNumber,
      words: linesByNumber.get(lineNumber) || [],
    };
  });

  return markSurahEndings(placeSurahOpenings(pageLines, { warsh: true }));
}

function getSurahMeta(surah) {
  return SURAHS[Number(surah) - 1] || null;
}

// The words API only carries verses. In the Madani layout a surah opens on a
// fresh line under its title band and, except for Al-Fatiha (whose basmala is
// verse 1) and At-Tawbah, the basmala: those slots come back as empty lines
// above the first word, so this restores them the way the printed page reads.
// A single Warsh page may carry several small surahs (Al-Ikhlas, Al-Falaq,
// An-Nas) — every ayah-1 with an empty slot above receives its own header.
function placeSurahOpenings(lines, { warsh = false } = {}) {
  const processed = new Set();
  lines.forEach((line, index) => {
    const first = line.words[0];
    if (!first) return;
    if (Number(first.ayah) !== 1 || Number(first.position || 1) !== 1) return;
    const surah = Number(first.surah);
    const key = `${surah}:${index}`;
    if (processed.has(key)) return;
    processed.add(key);

    const above = lines[index - 1];
    if (!above || above.words.length > 0 || above.kind) return;
    const above2 = lines[index - 2];
    const hasBasmalaLine =
      surah !== 9 && (surah !== 1 || warsh) && above2 && above2.words.length === 0 && !above2.kind;
    if (hasBasmalaLine) {
      above2.kind = "surah-header";
      above2.surah = surah;
      above.kind = "basmala";
      above.surah = surah;
    } else {
      above.kind = "surah-header";
      above.surah = surah;
    }
  });
  return lines;
}

// A surah's final line is centred when it does not fill the measure.
function markSurahEndings(lines) {
  lines.forEach((line) => {
    const closes = line.words.some((word) => {
      if (word.charType !== "end") return false;
      const meta = getSurahMeta(word.surah);
      return meta && Number(word.ayah) === Number(meta.ayahs);
    });
    if (closes) line.endsSurah = true;
  });
  return lines;
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

  const pageLines = Array.from({ length: 15 }, (_, index) => {
    const lineNumber = index + 1;
    return {
      lineNumber,
      words: lines.get(lineNumber) || [],
    };
  });
  return markSurahEndings(placeSurahOpenings(pageLines));
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
  const surahMeta = getSurahMeta(first.surah?.number);
  const surahName = surahMeta
    ? lang === "ar"
      ? surahMeta.ar
      : lang === "en"
        ? surahMeta.en
        : surahMeta.fr
    : first.surah?.name || "";

  return {
    page,
    surahName,
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
  const pageFontFamily = getQcfPageFontFamily(currentPage, version);
  const fallbackFontFamily = resolveFontFamily(fontFamily, riwaya);
  const isWarsh = riwaya === "warsh";
  const [fontLoaded, setFontLoaded] = useState(false);
  const [fontFailed, setFontFailed] = useState(false);
  const [warshLineFits, setWarshLineFits] = useState({});
  const linesRef = useRef(null);

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

  const warshFitPassRef = useRef(0);
  const warshFitKeyRef = useRef("");
  const warshFitsRef = useRef({});
  warshFitsRef.current = warshLineFits;

  useLayoutEffect(() => {
    if (!isWarsh || !linesRef.current) {
      if (Object.keys(warshFitsRef.current).length > 0) {
        warshFitsRef.current = {};
        setWarshLineFits({});
      }
      return undefined;
    }

    // A new page, font state or line set restarts the refinement budget; a
    // fit update alone keeps refining until every row converges inside its
    // box instead of stopping after a single pass that still overflows.
    const inputKey = `${currentPage}|${fontLoaded}|${lines.length}`;
    if (warshFitKeyRef.current !== inputKey) {
      warshFitKeyRef.current = inputKey;
      warshFitPassRef.current = 0;
    }
    if (warshFitPassRef.current >= 8) return undefined;

    let frame = 0;
    let timer = 0;
    let disposed = false;

    const measure = () => {
      if (disposed || warshFitPassRef.current >= 8) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (disposed || !linesRef.current) return;
        const next = {};
        let stable = true;
        linesRef.current.querySelectorAll(".qcm-line").forEach((line) => {
          const children = [...line.children];
          if (children.length === 0) return;
          const lineRect = line.getBoundingClientRect();
          const currentScale = Number.parseFloat(
            getComputedStyle(line).getPropertyValue("--qcm-line-fit"),
          ) || 1;
          const left = Math.min(...children.map((child) => child.getBoundingClientRect().left));
          const right = Math.max(...children.map((child) => child.getBoundingClientRect().right));
          const naturalWidth = Math.max(1, (right - left) / currentScale);
          const fit = Math.max(0.32, Math.min(1, (lineRect.width - 6) / naturalWidth));
          const key = line.dataset.lineNumber;
          next[key] = fit;
          if (Math.abs((warshFitsRef.current[key] || 1) - fit) >= 0.004) stable = false;
        });
        if (stable || disposed) return;
        warshFitPassRef.current += 1;
        setWarshLineFits(next);
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
          if (!disposed) measure();
        }, 120);
      });
    };

    measure();
    const onResize = () => {
      warshFitKeyRef.current = "";
      warshFitsRef.current = {};
      setWarshLineFits({});
    };
    window.addEventListener("resize", onResize);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      window.removeEventListener("resize", onResize);
    };
  }, [currentPage, fontLoaded, isWarsh, lines]);

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
            fontSize: '1em',
            lineHeight: 'inherit',
            letterSpacing: 0,
            wordSpacing: 0,
            textRendering: 'optimizeLegibility',
            WebkitFontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1, "mark" 1, "mkmk" 1',
            fontFeatureSettings: '"kern" 1, "liga" 1, "calt" 1, "mark" 1, "mkmk" 1',
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
        <span className="qcm-corner qcm-corner--tl" aria-hidden="true" />
        <span className="qcm-corner qcm-corner--tr" aria-hidden="true" />
        <span className="qcm-corner qcm-corner--bl" aria-hidden="true" />
        <span className="qcm-corner qcm-corner--br" aria-hidden="true" />
        <header className="qcm-page-header">
          <span className="qcm-page-header__meta">{meta.sideA}</span>
          <strong className="qcm-page-header__name">{meta.surahName}</strong>
          <span className="qcm-page-header__meta">{meta.top}</span>
        </header>
        <div ref={linesRef} className="qcm-lines" dir="rtl" lang="ar" data-warsh={isWarsh ? "true" : undefined}>
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
                    {getBasmalaText(riwaya)}
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
                style={isWarsh ? { "--qcm-line-fit": warshLineFits[line.lineNumber] || 1 } : undefined}
              >
                {line.words.map(renderWord)}
              </div>
            );
          })}
        </div>
        <footer className="qcm-page-footer" aria-hidden="true">
          <span className="qcm-page-footer__label">{meta.fontLabel}</span>
          <span className="qcm-page-folio">{meta.page}</span>
          <span className="qcm-page-footer__label" />
        </footer>
      </div>
      <div className="qcm-edge qcm-edge--end">
        <span>{meta.sideC || meta.sideB}</span>
        <span>{meta.page}</span>
      </div>
    </section>
  );
}
