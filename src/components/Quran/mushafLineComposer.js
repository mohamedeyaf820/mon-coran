/**
 * mushafLineComposer.js
 * 
 * Composes Quranic page ayahs into canonical 15 Medina lines.
 * Uses line_v2 / line_number / line_v1 metadata from the dataset.
 */

import { toAr } from "../../data/surahs.js";

export function composeMushafLines(ayahs, currentPage = null, riwaya = "hafs") {
  if (!Array.isArray(ayahs) || ayahs.length === 0) {
    return [];
  }

  const pageNum = Number(currentPage || ayahs[0]?.page || 1);

  // Check if we have word-level line data
  const hasWordLineData = ayahs.some((ayah) =>
    Array.isArray(ayah.words) &&
    ayah.words.some((w) => Number(w.lineNumber || w.lineV2 || w.lineV1) > 0)
  );

  // 15 canonical lines
  const lines = Array.from({ length: 15 }, (_, i) => ({
    lineNumber: i + 1,
    surahHeader: null,
    isBismillah: false,
    verseSegments: [],
    isEmpty: true,
  }));

  // Find surahs starting on this page
  const surahStarts = [];
  ayahs.forEach((ayah) => {
    if (ayah.numberInSurah === 1) {
      const sNum = Number(ayah.surah?.number || ayah.surah);
      surahStarts.push({ surahNum: sNum, ayah });
    }
  });

  if (hasWordLineData) {
    // Map words & markers to their canonical line
    ayahs.forEach((ayah) => {
      const surahNum = Number(ayah.surah?.number || ayah.surah);
      const ayahNum = Number(ayah.numberInSurah);
      const words = Array.isArray(ayah.words) ? ayah.words : [];

      words.forEach((w, wordIdx) => {
        const lineNo = Number(w.lineNumber || w.lineV2 || w.lineV1);
        if (lineNo >= 1 && lineNo <= 15) {
          const lineObj = lines[lineNo - 1];
          lineObj.isEmpty = false;

          // Find or create current verse segment on this line
          let lastSegment = lineObj.verseSegments[lineObj.verseSegments.length - 1];
          if (!lastSegment || lastSegment.ayahNum !== ayahNum || lastSegment.surahNum !== surahNum) {
            lastSegment = {
              surahNum,
              ayahNum,
              globalAyah: ayah.number,
              ayah,
              items: [],
            };
            lineObj.verseSegments.push(lastSegment);
          }

          const isMarker = w.charType === "end";
          lastSegment.items.push({
            isMarker,
            word: w,
            ayah,
            surahNum,
            ayahNum,
            wordPosition: w.position || wordIdx + 1,
            text: w.textUthmani || w.text || "",
            textTajweed: w.textTajweed || "",
            codeV1: w.codeV1 || "",
            codeV2: w.codeV2 || "",
            audioUrl: w.audioUrl || null,
          });
        }
      });
    });

    // Special Medina opening spread layout (Pages 1 & 2)
    if (pageNum === 1) {
      lines[0].surahHeader = surahStarts[0]?.surahNum || 1;
      lines[0].isEmpty = false;
      // Line 2 has Bismillah as Ayah 1 of Al-Fatiha in the dataset
    } else if (pageNum === 2) {
      lines[0].surahHeader = surahStarts[0]?.surahNum || 2;
      lines[0].isEmpty = false;
      lines[1].isBismillah = true;
      lines[1].isEmpty = false;
    } else {
      // General case for pages 3 to 604: assign SurahHeader & Bismillah to empty lines preceding new surahs
      surahStarts.forEach(({ surahNum, ayah }) => {
        const firstWord = ayah.words?.[0];
        const firstLine = Number(firstWord?.lineNumber || firstWord?.lineV2 || firstWord?.lineV1 || 1);
        if (firstLine > 1) {
          if (surahNum !== 9 && firstLine > 2 && lines[firstLine - 2].isEmpty && lines[firstLine - 3].isEmpty) {
            lines[firstLine - 3].surahHeader = surahNum;
            lines[firstLine - 3].isEmpty = false;
            lines[firstLine - 2].isBismillah = true;
            lines[firstLine - 2].isEmpty = false;
          } else if (lines[firstLine - 2].isEmpty) {
            lines[firstLine - 2].surahHeader = surahNum;
            lines[firstLine - 2].isEmpty = false;
          }
        }
      });
    }

    return lines;
  }

  // Fallback (e.g. Warsh text or data without word-level line metadata)
  // Extract all tokens across ayahs and distribute across 15 lines
  const allTokens = [];
  ayahs.forEach((ayah) => {
    const surahNum = Number(ayah.surah?.number || ayah.surah);
    const ayahNum = Number(ayah.numberInSurah);

    // If new surah starts on this ayah
    if (ayahNum === 1 && pageNum > 2) {
      allTokens.push({ isSurahHeader: true, surahNum });
      if (surahNum !== 9 && surahNum !== 1) {
        allTokens.push({ isBismillah: true, surahNum });
      }
    }

    const rawWords = Array.isArray(ayah.warshWords)
      ? ayah.warshWords
      : Array.isArray(ayah.words) && ayah.words.length > 0
        ? ayah.words.map((w) => w.text || w.textUthmani)
        : String(ayah.text || "").split(/\s+/).filter(Boolean);

    rawWords.forEach((wordText, wIdx) => {
      allTokens.push({
        isMarker: false,
        word: { text: wordText, position: wIdx + 1 },
        ayah,
        surahNum,
        ayahNum,
        wordPosition: wIdx + 1,
        text: wordText,
      });
    });

    // Native marker
    allTokens.push({
      isMarker: true,
      ayah,
      surahNum,
      ayahNum,
      text: toAr(ayahNum),
    });
  });

  if (pageNum === 1) {
    lines[0].surahHeader = 1;
    lines[0].isEmpty = false;
  } else if (pageNum === 2) {
    lines[0].surahHeader = 2;
    lines[0].isEmpty = false;
    lines[1].isBismillah = true;
    lines[1].isEmpty = false;
  }

  const availableLines = lines.filter((l) => l.isEmpty);
  if (availableLines.length === 0) return lines;

  const tokensPerLine = Math.ceil(allTokens.length / availableLines.length);
  let tokenIdx = 0;

  availableLines.forEach((lineObj) => {
    lineObj.isEmpty = false;
    const slice = allTokens.slice(tokenIdx, tokenIdx + tokensPerLine);
    tokenIdx += tokensPerLine;

    slice.forEach((token) => {
      if (token.isSurahHeader) {
        lineObj.surahHeader = token.surahNum;
        return;
      }
      if (token.isBismillah) {
        lineObj.isBismillah = true;
        return;
      }

      let lastSegment = lineObj.verseSegments[lineObj.verseSegments.length - 1];
      if (!lastSegment || lastSegment.ayahNum !== token.ayahNum || lastSegment.surahNum !== token.surahNum) {
        lastSegment = {
          surahNum: token.surahNum,
          ayahNum: token.ayahNum,
          globalAyah: token.ayah?.number,
          ayah: token.ayah,
          items: [],
        };
        lineObj.verseSegments.push(lastSegment);
      }

      lastSegment.items.push(token);
    });
  });

  return lines;
}
