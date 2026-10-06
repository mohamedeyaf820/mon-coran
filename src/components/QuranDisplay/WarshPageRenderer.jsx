import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { subscribeWarshArchive, getWarshArchiveSnapshot } from "../../utils/warshArchiveRules";
import { ensureFontLoaded } from "../../services/fontLoader";
import { resolveFontFamily } from "../../data/fonts";
import MushafFlowPage, { buildFlowSegments } from "./MushafFlowPage";
import { getPageMeta } from "./mushafPageComposition";
import { getWarshTajwidSource, warshDisplayWords } from "../../services/warshTajweedService";

function getCleanWarshWords(ayah) {
  return warshDisplayWords(ayah);
}

export { getCleanWarshWords };

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
  const [fontSettled, setFontSettled] = useState(false);
  const archive = useSyncExternalStore(subscribeWarshArchive, getWarshArchiveSnapshot, getWarshArchiveSnapshot);

  const segments = useMemo(
    () =>
      buildFlowSegments(ayahs, {
        getWords: getCleanWarshWords,
        // Warsh paints from the Dabt the pinned edition prints on its own text,
        // so the sheet reads a canonical source like the Hafs one. Markup stays
        // refused: no transport annotation ever reaches a Warsh word.
        getAnnotatedWords: () => [],
        getTajwidSource: showTajwid ? getWarshTajwidSource : undefined,
        riwaya: "warsh",
        showTajwid,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the archive is an external store read through module state: its snapshot is the invalidation signal
    [ayahs, showTajwid, archive],
  );
  const meta = useMemo(
    () => getPageMeta(ayahs, currentPage, lang),
    [ayahs, currentPage, lang],
  );

  useEffect(() => {
    let cancelled = false;
    setFontLoaded(false);
    setFontSettled(false);
    const revealFallback = window.setTimeout(() => {
      if (!cancelled) setFontSettled(true);
    }, 1500);
    // Load the Warsh font file so --font-quran resolves correctly.
    // fontFamily defaults to "qpc-warsh" when not supplied.
    ensureFontLoaded(fontFamily || "qpc-warsh").then((result) => {
      if (!cancelled) {
        setFontLoaded(Boolean(result.loaded || result.cached));
        setFontSettled(true);
      }
    }).catch(() => {
      if (!cancelled) setFontSettled(true);
    });
    return () => {
      cancelled = true;
      window.clearTimeout(revealFallback);
    };
  }, [fontFamily]);

  return (
    <MushafFlowPage
      activeAyah={activeAyah}
      currentPage={currentPage}
      currentPlayingAyah={currentPlayingAyah}
      fallbackFontFamily={fallbackFontFamily}
      fontReady={fontSettled}
      fitSignal={`${fontLoaded}|${fontFamily}|${showTajwid ? "t" : "-"}`}
      fontFamily={fontFamily}
      lang={lang}
      meta={meta}
      onToggleActive={onToggleActive}
      riwaya={riwaya}
      segments={segments}
      showTajwid={showTajwid}
    />
  );
}
