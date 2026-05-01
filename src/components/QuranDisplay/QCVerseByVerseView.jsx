import React, { useCallback } from "react";
import { arabicToLatin } from "../../data/transliteration";
import { cn } from "../../lib/utils";
import MemorizationText from "../Quran/MemorizationText";
import SmartAyahRenderer from "../Quran/SmartAyahRenderer";
import WordByWordDisplay from "../Quran/WordByWordDisplay";
import AyahMarker from "../Quran/AyahMarker";
import QCVerseActions from "./QCVerseActions";

function PageSeparator({ page }) {
  if (!page) return null;

  return (
    <div className="my-6 flex items-center justify-center gap-4 select-none" aria-hidden="true">
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
  const label = lang === "fr" ? "Fin de la sourate" : "End of surah";

  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center select-none" aria-hidden="true">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgba(var(--primary-rgb),0.25)] to-transparent" />
      <span className="font-[var(--font-ui)] text-[0.7rem] font-bold uppercase tracking-widest text-[var(--text-muted)]">
        {label}
      </span>
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[rgba(var(--primary-rgb),0.25)] to-transparent" />
    </div>
  );
}

function QCVerseCard({
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

  const transliterationText =
    showTransliteration && !showWordByWord
      ? arabicToLatin(
          riwaya === "warsh" && ayah.hafsText ? ayah.hafsText : ayah.text,
          riwaya,
        )
      : "";

  const arabicContent = (() => {
    if (memMode) return <MemorizationText text={ayah.hafsText || ayah.text} lang={lang} />;
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
  })();

  const translations = Array.isArray(translation) ? translation : [];

  return (
    <article
      id={ayahId}
      data-surah-number={surahNum}
      data-ayah-number={ayah.numberInSurah}
      data-ayah-global={ayah.number}
      className={cn(
        "qc-verse-card group relative rounded-2xl border bg-[var(--bg-card)] transition-all duration-200 outline-none",
        "hover:border-[rgba(var(--primary-rgb),0.22)] hover:bg-[rgba(var(--primary-rgb),0.025)]",
        isActive && "border-[rgba(var(--primary-rgb),0.35)] bg-[rgba(var(--primary-rgb),0.04)]",
        isPlaying && "border-[var(--primary)] bg-[rgba(var(--primary-rgb),0.055)] shadow-[0_0_0_2px_rgba(var(--primary-rgb),0.12)]",
      )}
    >
      {isPlaying ? <div className="absolute bottom-3 left-0 top-3 w-[3px] rounded-full bg-[var(--primary)]" /> : null}

      <div className="flex items-center justify-between px-4 pb-2 pt-3.5">
        <button
          type="button"
          onClick={handleClick}
          aria-label={`${lang === "fr" ? "Verset" : "Verse"} ${ayah.numberInSurah}`}
          aria-expanded={isActive}
          className={cn(
            "flex items-center gap-2 rounded-full px-2.5 py-1 font-[var(--font-ui)] text-[0.72rem] font-bold transition-all",
            isPlaying
              ? "bg-[var(--primary)] text-white"
              : "bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)] hover:bg-[rgba(var(--primary-rgb),0.14)]",
          )}
        >
          <span>{surahNum}:{ayah.numberInSurah}</span>
        </button>

        <div className="flex items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-within:opacity-100">
          <QCVerseActions
            surah={surahNum}
            ayah={ayah.numberInSurah}
            ayahData={ayah}
            lang={lang}
            compact
          />
        </div>
      </div>

      <div
        dir="rtl"
        lang="ar"
        className="px-5 py-3 text-right font-[var(--qd-font-family,var(--font-quran,'Amiri Quran'))] text-[var(--text-quran,var(--text-primary))] [-webkit-font-smoothing:antialiased] [text-rendering:optimizeLegibility]"
        style={{ fontSize: `${fontSize || 48}px`, lineHeight: "2.15" }}
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
        {!showWordByWord ? <AyahMarker num={ayah.numberInSurah} isPlaying={isPlaying} /> : null}
      </div>

      {transliterationText ? (
        <div className="px-5 pb-3 font-[var(--font-ui)] text-[0.82rem] italic leading-relaxed text-[var(--text-muted)]" dir="ltr">
          {transliterationText}
        </div>
      ) : null}

      {showTranslation && translations.length > 0 ? (
        <div className="mt-1 border-t border-[rgba(var(--primary-rgb),0.07)] px-5 pb-4 pt-3">
          {translations.map((item, index) => (
            <p
              key={item.id || item.resourceId || index}
              className={cn(
                "text-left text-[0.95rem] leading-relaxed text-[var(--text-secondary)]",
                index > 0 && "mt-2 border-t border-[var(--border)] pt-2",
              )}
              dir="ltr"
            >
              {item.text}
            </p>
          ))}
        </div>
      ) : null}

      {isActive ? (
        <div className="mt-1 border-t border-[var(--border)] px-4 pb-3.5 pt-3">
          <QCVerseActions
            surah={surahNum}
            ayah={ayah.numberInSurah}
            ayahData={ayah}
            lang={lang}
          />
        </div>
      ) : null}
    </article>
  );
}

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
  const items = surahGroups
    ? surahGroups.flatMap((group) =>
        group.ayahs.map((ayah) => ({ ayah, surahNum: group.surah })),
      )
    : (ayahs || []).map((ayah) => ({ ayah, surahNum: ayah.surah?.number || 1 }));

  if (items.length === 0) return null;

  return (
    <div className="qc-verse-by-verse-view mx-auto w-full max-w-[860px] space-y-3 px-3 py-4 sm:px-4">
      {items.map(({ ayah, surahNum }, index) => {
        const toggleId = displayMode === "surah" ? ayah.numberInSurah : ayah.number;
        const isPlaying =
          currentPlayingAyah?.ayah === ayah.numberInSurah &&
          currentPlayingAyah?.surah === surahNum;
        const isActive = activeAyah === toggleId;
        const translation = showTranslation ? getTranslationForAyah?.(ayah) : null;
        const showSeparator =
          showPageSeparators &&
          (index === 0 || items[index - 1].ayah.page !== ayah.page);

        return (
          <React.Fragment key={ayah.number || `${surahNum}:${ayah.numberInSurah}`}>
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
              ayahId={displayMode === "surah" ? `ayah-${ayah.numberInSurah}` : `ayah-${ayah.number}`}
            />
          </React.Fragment>
        );
      })}

      {surahMeta ? <SurahEndMarker lang={lang} /> : null}
    </div>
  );
}
