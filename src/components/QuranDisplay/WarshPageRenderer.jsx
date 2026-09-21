import React, { useEffect, useMemo, useState } from "react";
import { ensureFontLoaded } from "../../services/fontLoader";
import { resolveFontFamily, stripEmbeddedAyahMarkers } from "../../data/fonts";
import MushafFlowPage, { buildFlowSegments } from "./MushafFlowPage";
import { getPageMeta, normalizeArabicText } from "./mushafPageComposition";

function getCleanWarshWords(ayah) {
  const source = Array.isArray(ayah?.warshWords) && ayah.warshWords.length > 0
    ? ayah.warshWords
        .map((word) => (typeof word === "string" ? word : word?.text || ""))
        .join(" ")
    : ayah?.text || "";
  return stripEmbeddedAyahMarkers(normalizeArabicText(source), {
    ayahNumber: ayah?.numberInSurah,
  })
    .split(/\s+/u)
    .filter(Boolean);
}

export default function WarshPageRenderer({
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
  const fallbackFontFamily = resolveFontFamily(fontFamily, riwaya);
  const [fontLoaded, setFontLoaded] = useState(false);

  const segments = useMemo(
    () =>
      buildFlowSegments(ayahs, {
        getWords: getCleanWarshWords,
        riwaya: "warsh",
        showTajwid,
      }),
    [ayahs, showTajwid],
  );
  const meta = useMemo(
    () => getPageMeta(ayahs, currentPage, lang),
    [ayahs, currentPage, lang, riwaya],
  );

  useEffect(() => {
    let cancelled = false;
    setFontLoaded(false);
    // Load the Warsh font file so --font-quran resolves correctly.
    // fontFamily defaults to "qpc-warsh" when not supplied.
    ensureFontLoaded(fontFamily || "qpc-warsh").then((result) => {
      if (!cancelled) setFontLoaded(Boolean(result.loaded || result.cached));
    });
    return () => {
      cancelled = true;
    };
  }, [fontFamily]);

  return (
    <MushafFlowPage
      activeAyah={activeAyah}
      currentPage={currentPage}
      currentPlayingAyah={currentPlayingAyah}
      fallbackFontFamily={fallbackFontFamily}
      fitSignal={`${fontLoaded}|${fontFamily}|${showTajwid ? "t" : "-"}`}
      lang={lang}
      meta={meta}
      onToggleActive={onToggleActive}
      riwaya={riwaya}
      segments={segments}
      showTajwid={showTajwid}
    />
  );
}
