import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getJuzForAyah } from "../../data/juz";
import { t } from "../../i18n";
import { getSurah, toAr } from "../../data/surahs";
import ReadingToolbar from "../Quran/ReadingToolbar";
import AyahActionsModal from "./AyahActionsModal";
import QuranMushafPage from "./QuranMushafPage";
import { usesMushafPageGlyphs } from "./HafsPageRenderer";
import QCVerseByVerseView from "./QCVerseByVerseView";
import usePageStream from "./usePageStream";
import { useApp } from "../../context/AppContext";
import ReaderContextCard from "./ReaderContextCard";
import { modePaneShellClass } from "./displayClasses";

function PageMode({
  activeAyah,
  ayahs,
  calibration,
  classes: _classes,
  currentPage,
  currentPlayingAyah,
  currentSurah,
  fontFamily: _fontFamily,
  getTranslationForAyah,
  getTransliterationForAyah,
  isQCF4: _isQCF4,
  lang,
  mushafLayout,
  onNextPage,
  onOpenFullscreen,
  onPlayAyah: _onPlayAyah,
  onPlaySurah,
  onPrevPage,
  onToggleActive,
  onToggleMushaf,
  pageGroups: _pageGroups = [],
  pageTopSurah,
  preparingSurah,
  readingFontSize,
  riwaya,
  showTajwid,
  showTranslation,
  showTransliteration,
  surahGroups: _surahGroups,
}) {
  const prevPageRef = useRef(currentPage);
  const [turnClass, setTurnClass] = useState("");
  const { dispatch, state } = useApp();
  const pageNavigationSource = state.pageNavigationSource;

  useEffect(() => {
    if (prevPageRef.current === currentPage) return;
    const direction = currentPage > prevPageRef.current ? "next" : "prev";
    prevPageRef.current = currentPage;
    // Continuous reading changes the page from the scroll position: no
    // page-turn animation there, it would move the text under the reader.
    if (pageNavigationSource === "scroll") return;
    setTurnClass(`page-turn--${direction}`);
    const id = setTimeout(() => setTurnClass(""), 280);
    return () => clearTimeout(id);
  }, [currentPage]);

  const activeAyahData = ayahs.find(
    (ayah) => ayah.number === activeAyah || ayah.numberInSurah === activeAyah,
  );
  const currentJuz =
    ayahs[0]?.juz ||
    getJuzForAyah(ayahs[0]?.surah?.number, ayahs[0]?.numberInSurah);
  const onVisiblePage = useCallback(
    (page) => {
      if (page !== currentPage) dispatch({ type: "NAVIGATE_PAGE", payload: { page, source: "scroll" } });
    },
    [currentPage, dispatch],
  );
  // Continuous reading: pages stream in as the reader scrolls, in both
  // directions, instead of a page-turn control.
  const stream = usePageStream({
    ayahs,
    currentJuz,
    currentPage,
    currentSurah,
    fallbackGetTranslation: getTranslationForAyah,
    lang,
    onVisiblePage,
    repaginationKey: `${mushafLayout}:${riwaya}`,
    riwaya,
    showTranslation,
    translationLangs: state.translationLangs,
    warshStrictMode: state.warshStrictMode,
  });
  // The print engine draws with per-page QCF glyph fonts. Seed data may carry
  // only glyph codes, so a sheet stays blank until its font resolves: start
  // the load the moment a page enters the stream window (the loader dedupes
  // with the renderer's own request). Tajweed switches the whole stream to the
  // coloured v4 cut, so the prefetch must follow the same version. Faces that
  // print as continuous flow never ask for those files — Warsh has no glyph
  // cut at all — so prefetching there only spends the reader's data.
  useEffect(() => {
    if (mushafLayout !== "mushaf") return undefined;
    if (!usesMushafPageGlyphs(state.fontFamily, riwaya) && !(riwaya === "hafs" && showTajwid)) return undefined;
    let active = true;
    const numbers = stream.pages.map(({ page }) => page).join(",");
    const version = showTajwid ? "v4" : "v2";
    import("../../services/fontLoader").then(({ ensureQcfPageFontLoaded }) => {
      if (!active) return;
      numbers.split(",").forEach((page) => {
        if (page) ensureQcfPageFontLoaded(Number(page), version);
      });
    });
    return () => {
      active = false;
    };
  }, [mushafLayout, riwaya, showTajwid, state.fontFamily, stream.pages]);
  const streamPages = useMemo(
    () =>
      stream.pages.map(({ page, ayahs: pageAyahs }) => {
        const groups = [];
        let group = null;
        pageAyahs.forEach((ayah) => {
          const surahNumber = ayah.surah?.number || currentSurah;
          if (!group || group.surah !== surahNumber) {
            group = { surah: surahNumber, ayahs: [] };
            groups.push(group);
          }
          group.ayahs.push(ayah);
        });
        return { page, ayahs: pageAyahs, surahGroups: groups };
      }),
    [currentSurah, stream.pages],
  );
  const pageLabel = lang === "ar" ? toAr(currentPage) : currentPage;
  const pageWord = lang === "fr" ? "Page" : lang === "ar" ? "صفحة" : "Page";
  const contextSecondary = currentJuz
    ? `${t("settings.juzMode", lang)} ${lang === "ar" ? toAr(currentJuz) : currentJuz}`
    : null;

  const touchStartX = useRef(null);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 55) return;
    const isRTL = document.documentElement.dir === 'rtl';
    const goNext = isRTL ? delta > 0 : delta < 0;
    if (goNext) {
      if (currentPage < 604) onNextPage();
    } else {
      if (currentPage > 1) onPrevPage();
    }
  }, [currentPage, onNextPage, onPrevPage]);

  const handleMushafDoubleClick = useCallback(
    (event) => {
      if (mushafLayout !== "mushaf") return;
      if (!event.target.closest(".qcm-page-shell")) return;
      if (event.target.closest("button, a, input, select, textarea, [role='button']")) return;
      onOpenFullscreen?.();
    },
    [mushafLayout, onOpenFullscreen],
  );

  return (
    <div
      className={`quran-mode-pane quran-mode-pane--page ${mushafLayout === "mushaf" ? "quran-mode-pane--mushaf" : ""} ${modePaneShellClass}`}
      role="region"
      aria-label={t("settings.pageMode", lang)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <section
        className="reader-control-deck"
        aria-label={lang === "fr" ? "Commandes de lecture" : lang === "ar" ? "أدوات القراءة" : "Reading controls"}
      >
        <ReaderContextCard
          kind="page"
          label={pageWord}
          value={pageLabel}
          numericValue={currentPage}
          total={604}
          secondary={contextSecondary}
          riwaya={riwaya}
          lang={lang}
        />
        <ReadingToolbar
          onPlay={onPlaySurah}
          playLabel={lang === "ar" ? undefined : t("audio.listenPage", lang)}
          preparingSurah={preparingSurah}
          surahNum={pageTopSurah || currentSurah}
          onToggleMushaf={onToggleMushaf}
          onOpenFullscreen={onOpenFullscreen}
        />
      </section>

      <div
        ref={stream.rootRef}
        className={`page-turn-container page-stream ${turnClass}`}
        onDoubleClick={handleMushafDoubleClick}
      >
        <div ref={stream.topRef} className="page-stream__sentinel" aria-hidden="true" />
        {streamPages.map(({ page, ayahs: pageAyahs, surahGroups: pageSurahGroups }) => (
          <section
            key={`stream-page-${page}`}
            className="page-stream__page"
            data-stream-page={page}
            aria-label={`${pageWord} ${lang === "ar" ? toAr(page) : page}`}
          >
            {mushafLayout === "mushaf" ? (
              <QuranMushafPage
                activeAyah={activeAyah}
                ayahs={pageAyahs}
                currentPage={page}
                currentPlayingAyah={currentPlayingAyah}
                fontFamily={state.fontFamily}
                lang={lang}
                onToggleActive={onToggleActive}
                riwaya={riwaya}
                showTajwid={showTajwid}
                surface="pane"
              />
            ) : (
              <QCVerseByVerseView
                surahGroups={pageSurahGroups}
                currentPlayingAyah={currentPlayingAyah}
                activeAyah={activeAyah}
                lang={lang}
                getTranslationForAyah={stream.getTranslationForAyah}
                getTransliterationForAyah={getTransliterationForAyah}
                showTajwid={showTajwid}
                showTranslation={showTranslation}
                showTransliteration={showTransliteration}
                calibration={calibration}
                riwaya={riwaya}
                fontSize={readingFontSize}
                onToggleActive={onToggleActive}
                displayMode="page"
                showPageSeparators
              />
            )}
          </section>
        ))}
        <div ref={stream.bottomRef} className="page-stream__sentinel" aria-hidden="true" />
        {stream.pausedAtSurah ? (
          <div className="page-stream__end" role="status">
            <span>
              {lang === "ar"
                ? `نهاية سورة ${getSurah(stream.endedSurah)?.ar || ""}`
                : lang === "en"
                  ? `End of ${getSurah(stream.endedSurah)?.en || "the surah"}`
                  : `Fin de la sourate ${getSurah(stream.endedSurah)?.fr || ""}`}
            </span>
            {stream.endedSurah < 114 ? (
              <button type="button" className="page-stream__end-action" onClick={stream.continueStream}>
                {lang === "ar"
                  ? `متابعة إلى ${getSurah(stream.endedSurah + 1)?.ar || ""}`
                  : lang === "en"
                    ? `Continue to ${getSurah(stream.endedSurah + 1)?.en || ""}`
                    : `Continuer vers ${getSurah(stream.endedSurah + 1)?.fr || ""}`}
              </button>
            ) : null}
          </div>
        ) : streamPages.length > 0 && stream.hasNext ? (
          <p className="page-stream__status" aria-live="polite">
            {lang === "ar" ? "الصفحة التالية تُحمَّل أثناء التمرير…" : lang === "en" ? "The next page loads as you scroll…" : "La page suivante se charge au fil du défilement…"}
          </p>
        ) : null}
        {mushafLayout === "mushaf" ? (
          <AyahActionsModal
            activeAyah={activeAyah}
            onClose={() => onToggleActive(null)}
            surah={activeAyahData?.surah?.number || currentSurah}
            ayahData={activeAyahData}
            translations={activeAyahData ? stream.getTranslationForAyah(activeAyahData) : []}
          />
        ) : null}
      </div>
    </div>
  );
}

export default memo(PageMode);
