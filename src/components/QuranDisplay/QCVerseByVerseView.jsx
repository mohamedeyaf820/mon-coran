import React, {
  useCallback,
  useState,
  useEffect,
  useRef,
  useMemo,
  memo,
} from "react";
import { arabicToLatin } from "../../data/transliteration";
import { cn } from "../../lib/utils";
import MemorizationText from "../Quran/MemorizationText";
import SmartAyahRenderer from "../Quran/SmartAyahRenderer";
import WordByWordDisplay from "../Quran/WordByWordDisplay";
import QCVerseActions from "./QCVerseActions";
import AyahSkeleton from "../Quran/AyahSkeleton";

function getInitialVisibleCount(total, displayMode) {
  if (displayMode === "page") return total;
  if (displayMode === "juz") return Math.min(total, 64);
  return Math.min(total, 42);
}

function PageSeparator({ page }) {
  if (!page) return null;

  return (
    <div
      className="my-6 flex items-center justify-center gap-4 select-none"
      aria-hidden="true"
    >
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[rgba(var(--primary-rgb),0.15)]" />
      <div className="flex items-center gap-2 rounded-full border border-[rgba(var(--primary-rgb),0.12)] bg-[var(--bg-secondary)] px-3 py-1">
        <i className="fas fa-bookmark text-[0.5rem] text-[var(--primary)]" />
        <span className="font-[var(--font-ui)] text-[0.68rem] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Page {page}
        </span>
      </div>
      <div className="h-px flex-1 bg-gradient-to-l from-transparent to-[rgba(var(--primary-rgb),0.15)]" />
    </div>
  );
}

function SurahEndMarker({ lang }) {
  const label =
    lang === "fr"
      ? "Fin de la sourate"
      : lang === "ar"
        ? "نهاية السورة"
        : "End of Surah";

  return (
    <div
      className="flex flex-col items-center gap-4 py-10 text-center select-none"
      aria-hidden="true"
    >
      <div className="h-px w-3/4 bg-gradient-to-r from-transparent via-[rgba(var(--primary-rgb),0.3)] to-transparent" />
      <div className="flex items-center gap-3">
        <div className="text-lg text-[rgba(var(--primary-rgb),0.35)]">
          &#x2739;
        </div>
        <span className="font-[var(--font-ui)] text-[0.65rem] font-bold uppercase tracking-[0.3em] text-[var(--text-muted)]">
          {label}
        </span>
        <div className="text-lg text-[rgba(var(--primary-rgb),0.35)]">
          &#x2739;
        </div>
      </div>
      <div className="h-px w-3/4 bg-gradient-to-r from-transparent via-[rgba(var(--primary-rgb),0.3)] to-transparent" />
    </div>
  );
}

const QCVerseCard = memo(function QCVerseCard({
  ayah,
  surahNum,
  lang,
  isPlaying,
  isActive,
  showTranslation,
  showTransliteration,
  showWordByWord,
  showWordTranslation,
  showTajwid,
  translation,
  calibration,
  riwaya,
  fontSize,
  memMode,
  onToggleActive,
  toggleId,
  ayahId,
}) {
  const handleClick = useCallback(() => {
    if (typeof onToggleActive === "function") onToggleActive(toggleId);
  }, [onToggleActive, toggleId]);

  const transliterationText = useMemo(
    () =>
      showTransliteration && !showWordByWord
        ? arabicToLatin(
            riwaya === "warsh" && ayah.hafsText ? ayah.hafsText : ayah.text,
            riwaya,
          )
        : "",
    [showTransliteration, showWordByWord, ayah.text, ayah.hafsText, riwaya],
  );

  const arabicContent = useMemo(() => {
    if (memMode) {
      // For memorization, use the correct riwaya text
      const memoText =
        riwaya === "warsh" ? ayah.text : ayah.hafsText || ayah.text;
      return (
        <MemorizationText text={memoText} lang={lang} isPlaying={isPlaying} />
      );
    }
    if (showWordByWord) {
      return (
        <WordByWordDisplay
          surah={surahNum}
          ayah={ayah.numberInSurah}
          text={ayah.text}
          isPlaying={isPlaying}
          showTajwid={showTajwid}
          showTransliteration={showTransliteration}
          showWordTranslation={showWordTranslation}
          fontSize={fontSize}
          calibration={calibration}
          initialWords={ayah.words}
          warshWords={ayah.warshWords}
        />
      );
    }

    return (
      <SmartAyahRenderer
        ayah={ayah}
        showTajwid={showTajwid}
        isPlaying={isPlaying}
        surahNum={surahNum}
        calibration={calibration}
        riwaya={riwaya}
      />
    );
  }, [
    memMode,
    showWordByWord,
    ayah,
    surahNum,
    isPlaying,
    showTajwid,
    showTransliteration,
    showWordTranslation,
    fontSize,
    calibration,
    riwaya,
    lang,
  ]);

  const translations = Array.isArray(translation) ? translation : [];

  return (
    <article
      id={ayahId}
      data-surah-number={surahNum}
      data-ayah-number={ayah.numberInSurah}
      data-ayah-global={ayah.number}
      className={cn(
        "qc-verse-card qc-list-card group relative transition-colors duration-200 outline-none",
        "px-4 sm:px-6 py-5 sm:py-6",
        "border-b border-[var(--border)]",
        isPlaying && "is-playing",
        isActive && "is-active",
        isPlaying
          ? "bg-[rgba(var(--primary-rgb),0.05)] border-l-[3px] border-l-[var(--primary)]"
          : isActive
            ? "bg-[rgba(var(--primary-rgb),0.03)]"
            : "hover:bg-[var(--bg-secondary)]",
      )}
    >
      {/* Card Header: verse number + actions */}
      <div className="qc-list-card__top select-none">
        <div className="qc-list-card__start">
          <button
            type="button"
            onClick={handleClick}
            aria-label={`${lang === "fr" ? "Verset" : lang === "ar" ? "آية" : "Verse"} ${ayah.numberInSurah}`}
            aria-expanded={isActive}
            className={cn(
              "qc-list-card__reference",
              isPlaying && "is-playing",
              isActive && "is-active",
            )}
          >
            {surahNum}:{ayah.numberInSurah}
          </button>
          <QCVerseActions
            surah={surahNum}
            ayah={ayah.numberInSurah}
            ayahData={ayah}
            lang={lang}
            layout="qcom-header-left"
          />
        </div>
        <div className="qc-list-card__end">
          <QCVerseActions
            surah={surahNum}
            ayah={ayah.numberInSurah}
            ayahData={ayah}
            lang={lang}
            layout="qcom-header-right"
          />
        </div>
      </div>

      {/* Arabic text */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div
          dir="rtl"
          lang="ar"
          className="qc-ayah-text-ar text-right font-[var(--qd-font-family,var(--font-quran,'Amiri Quran'))] text-[var(--text-quran,var(--text-primary))] [-webkit-font-smoothing:antialiased] [text-rendering:optimizeLegibility]"
          style={{
            fontSize:
              "var(--reader-arabic-size, var(--qd-reading-font-size, 42px))",
            lineHeight: "var(--quran-line-height, 2.15)",
          }}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleClick();
            }
          }}
        >
          {arabicContent}
        </div>

        {/* Transliteration */}
        {transliterationText ? (
          <div
            className="font-[var(--font-ui)] text-[0.8rem] italic leading-relaxed text-[var(--text-muted)] text-left border-l-2 border-[rgba(var(--primary-rgb),0.15)] pl-3"
            dir="ltr"
          >
            {transliterationText}
          </div>
        ) : null}

        {/* Translation block — clean, no card */}
        {showTranslation && translations.length > 0 ? (
          <div className="mt-1">
            {translations.map((item, index) => (
              <p
                key={item.id || item.resourceId || index}
                className={cn(
                  "text-left leading-[1.85] text-[var(--text-secondary)]",
                  index > 0 && "mt-2 pt-2 border-t border-[var(--border)]",
                )}
                style={{ fontSize: "var(--qd-translation-font-size, 0.95rem)" }}
                dir="ltr"
              >
                {item.text}
              </p>
            ))}
          </div>
        ) : null}

        <div className="qc-list-card__study">
          <QCVerseActions
            surah={surahNum}
            ayah={ayah.numberInSurah}
            ayahData={ayah}
            lang={lang}
            layout="qcom-list-study"
          />
        </div>
      </div>
    </article>
  );
});

export default function QCVerseByVerseView({
  ayahs,
  surahGroups,
  lang,
  currentPlayingAyah,
  activeAyah,
  showTranslation,
  showTransliteration,
  showWordByWord,
  showWordTranslation,
  showTajwid,
  getTranslationForAyah,
  calibration,
  riwaya,
  fontSize,
  memMode,
  onToggleActive,
  displayMode,
  showPageSeparators,
  surahMeta,
}) {
  const items = useMemo(
    () =>
      surahGroups
        ? surahGroups.flatMap((group) =>
            group.ayahs.map((ayah) => ({ ayah, surahNum: group.surah })),
          )
        : (ayahs || []).map((ayah) => ({
            ayah,
            surahNum: ayah.surah?.number || 1,
          })),
    [surahGroups, ayahs],
  );

  const contentKey = useMemo(() => {
    const first = items[0]?.ayah;
    const last = items[items.length - 1]?.ayah;
    return [
      displayMode,
      riwaya,
      items.length,
      first?.surah?.number,
      first?.numberInSurah,
      last?.surah?.number,
      last?.numberInSurah,
    ].join(":");
  }, [displayMode, items, riwaya]);

  const [visibleCount, setVisibleCount] = useState(() =>
    getInitialVisibleCount(items.length, displayMode),
  );
  const sentinelRef = useRef(null);

  const activeIndex = useMemo(() => {
    if (!activeAyah) return -1;
    return items.findIndex(({ ayah }) => {
      const toggleId =
        displayMode === "surah" ? ayah.numberInSurah : ayah.number;
      return toggleId === activeAyah;
    });
  }, [items, activeAyah, displayMode]);

  const playingIndex = useMemo(() => {
    if (!currentPlayingAyah) return -1;
    return items.findIndex(
      ({ ayah, surahNum }) =>
        ayah.numberInSurah === currentPlayingAyah.ayah &&
        surahNum === currentPlayingAyah.surah,
    );
  }, [items, currentPlayingAyah]);

  useEffect(() => {
    const targetIdx = Math.max(activeIndex, playingIndex);
    if (targetIdx !== -1 && targetIdx >= visibleCount) {
      setVisibleCount(targetIdx + 10);
    }
  }, [activeIndex, playingIndex, visibleCount]);

  useEffect(() => {
    setVisibleCount(getInitialVisibleCount(items.length, displayMode));
  }, [contentKey, displayMode, items.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 32, items.length));
        }
      },
      { rootMargin: "300px" },
    );

    const currentSentinel = sentinelRef.current;
    if (currentSentinel) {
      observer.observe(currentSentinel);
    }
    return () => {
      if (currentSentinel) {
        observer.unobserve(currentSentinel);
      }
    };
  }, [items.length]);

  if (items.length === 0)
    return <AyahSkeleton count={5} showTranslation={showTranslation} lang={lang} />;

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <div className="qc-verse-by-verse-view mx-auto w-full max-w-[1120px] px-2 sm:px-4 py-4">
      {visibleItems.map(({ ayah, surahNum }, index) => {
        const toggleId =
          displayMode === "surah" ? ayah.numberInSurah : ayah.number;
        const isPlaying =
          currentPlayingAyah?.ayah === ayah.numberInSurah &&
          currentPlayingAyah?.surah === surahNum;
        const isActive = activeAyah === toggleId;
        const translation = showTranslation
          ? getTranslationForAyah?.(ayah)
          : null;
        const showSeparator =
          showPageSeparators &&
          (index === 0 || items[index - 1].ayah.page !== ayah.page);

        return (
          <React.Fragment
            key={ayah.number || `${surahNum}:${ayah.numberInSurah}`}
          >
            {showSeparator ? <PageSeparator page={ayah.page} /> : null}
            <QCVerseCard
              ayah={ayah}
              surahNum={surahNum}
              lang={lang}
              isPlaying={isPlaying}
              isActive={isActive}
              showTranslation={showTranslation}
              showTransliteration={showTransliteration}
              showWordByWord={showWordByWord}
              showWordTranslation={showWordTranslation}
              showTajwid={showTajwid}
              translation={translation}
              calibration={calibration}
              riwaya={riwaya}
              fontSize={fontSize}
              memMode={memMode}
              onToggleActive={onToggleActive}
              toggleId={toggleId}
              ayahId={
                displayMode === "surah"
                  ? `ayah-${ayah.numberInSurah}`
                  : `ayah-${ayah.number}`
              }
            />
          </React.Fragment>
        );
      })}

      {hasMore && (
        <div
          ref={sentinelRef}
          className="flex justify-center p-4"
          aria-hidden="true"
        >
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {surahMeta && !hasMore ? <SurahEndMarker lang={lang} /> : null}
    </div>
  );
}
