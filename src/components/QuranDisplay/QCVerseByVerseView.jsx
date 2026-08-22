import React, {
  useCallback,
  useMemo,
  memo,
} from "react";
import { Bookmark } from "lucide-react";
import { arabicToLatin } from "../../data/transliteration";
import { cn } from "../../lib/utils";
import SmartAyahRenderer from "../Quran/SmartAyahRenderer";
import QCVerseActions from "./QCVerseActions";
import AyahSkeleton from "../Quran/AyahSkeleton";
import VirtualizedItem from "../ui/VirtualizedItem";

function PageSeparator({ page }) {
  if (!page) return null;

  return (
    <div
      className="my-6 flex items-center justify-center gap-4 select-none"
      aria-hidden="true"
    >
      <div className="h-px flex-1 bg-gradient-to-r from-transparent to-[rgba(var(--primary-rgb),0.15)]" />
      <div className="flex items-center gap-2 rounded-full border border-[rgba(var(--primary-rgb),0.12)] bg-[var(--bg-secondary)] px-3 py-1">
        <Bookmark size={8} className="text-[var(--primary)]" />
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
  showTajwid,
  translation,
  calibration,
  riwaya,
  fontSize,
  onToggleActive,
  toggleId,
}) {
  const handleClick = useCallback(() => {
    if (typeof onToggleActive === "function") onToggleActive(toggleId);
  }, [onToggleActive, toggleId]);

  const transliterationText = useMemo(
    () =>
      showTransliteration
        ? arabicToLatin(
            riwaya === "warsh" && ayah.hafsText ? ayah.hafsText : ayah.text,
            riwaya,
          )
        : "",
    [showTransliteration, ayah.text, ayah.hafsText, riwaya],
  );

  const arabicContent = useMemo(
    () => (
      <SmartAyahRenderer
        ayah={ayah}
        showTajwid={showTajwid}
        isPlaying={isPlaying}
        surahNum={surahNum}
        calibration={calibration}
        riwaya={riwaya}
      />
    ),
    [
    ayah,
    surahNum,
    isPlaying,
    showTajwid,
    calibration,
    riwaya,
    ],
  );

  const translations = useMemo(() => {
    if (!Array.isArray(translation)) return [];
    return translation.filter((item) => {
      if (!item?.text || typeof item.text !== "string") return false;
      const text = item.text.trim();
      if (!text) return false;
      if (lang !== "ar") {
        const arabicCharCount = (text.match(/[\u0600-\u06FF]/g) || []).length;
        if (arabicCharCount > text.length * 0.5) return false;
      }
      return true;
    });
  }, [translation, lang]);

  return (
    <article
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
        <div
          className="qc-list-card__start"
          style={{ display: "flex", alignItems: "center", flexWrap: "nowrap" }}
        >
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
            translations={translations}
            lang={lang}
            layout="qcom-header-left"
          />
        </div>
        <div
          className="qc-list-card__end"
          style={{ display: "flex", alignItems: "center", flexWrap: "nowrap" }}
        >
          <QCVerseActions
            surah={surahNum}
            ayah={ayah.numberInSurah}
            ayahData={ayah}
            translations={translations}
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
          aria-label={`${
            lang === "fr"
              ? "Texte arabe du verset"
              : lang === "ar"
                ? "نص الآية"
                : "Arabic text for verse"
          } ${surahNum}:${ayah.numberInSurah}`}
        >
          {arabicContent}
        </div>

        {/* Transliteration */}
        {transliterationText ? (
          <div
            className="qc-ayah-transliteration"
            dir="ltr"
          >
            {transliterationText}
          </div>
        ) : null}

        {/* Translation block — clean, no card */}
        {showTranslation ? (
          <div
            className={cn(
              "qc-list-card__translation-slot mt-1",
              translations.length === 0 && "is-loading",
            )}
            aria-hidden={translations.length === 0 ? "true" : undefined}
          >
            {translations.length > 0
              ? translations.map((item, index) => (
                  <p
                    key={item.id || item.resourceId || index}
                    className={cn(
                      "text-left leading-[1.85] text-[var(--text-secondary)]",
                      index > 0 && "mt-2 pt-2 border-t border-[var(--border)]",
                    )}
                    style={{
                      fontSize: "var(--qd-translation-font-size, 0.95rem)",
                    }}
                    dir="ltr"
                  >
                    {item.text}
                  </p>
                ))
              : (
                  <>
                    <span />
                    <span />
                    <span />
                  </>
                )}
          </div>
        ) : null}

      </div>
    </article>
  );
});

export default function QCVerseByVerseView({
  ayahs,
  surahGroups,
  lang,
  currentPlayingAyah,
  initialTargetAyah,
  activeAyah,
  showTranslation,
  showTransliteration,
  showTajwid,
  getTranslationForAyah,
  calibration,
  riwaya,
  fontSize,
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

  if (items.length === 0)
    return <AyahSkeleton count={5} showTranslation={showTranslation} lang={lang} />;

  const estimatedHeight = showTranslation || showTransliteration ? 350 : 250;
  const renderingProfile = [
    showTranslation ? 1 : 0,
    showTransliteration ? 1 : 0,
    Math.round(Number(fontSize) || 0),
  ].join("");

  return (
    <div
      className="qc-verse-by-verse-view mx-auto w-full max-w-[1120px] px-2 sm:px-4 py-4"
      role="list"
    >
      {items.map(({ ayah, surahNum }, index) => {
        const toggleId =
          displayMode === "surah" ? ayah.numberInSurah : ayah.number;
        const isPlaying =
          currentPlayingAyah?.ayah === ayah.numberInSurah &&
          currentPlayingAyah?.surah === surahNum;
        const isActive = activeAyah === toggleId;
        const isInitialTarget =
          displayMode === "surah" &&
          Number(initialTargetAyah) === Number(ayah.numberInSurah);
        const showSeparator =
          showPageSeparators &&
          (index === 0 || items[index - 1].ayah.page !== ayah.page);
        const ayahId =
          displayMode === "surah"
            ? `ayah-${ayah.numberInSurah}`
            : `ayah-${ayah.number}`;
        const itemKey = ayah.number || `${surahNum}:${ayah.numberInSurah}`;

        return (
          <VirtualizedItem
            key={itemKey}
            cacheKey={`${contentKey}:${renderingProfile}:${itemKey}`}
            eager={index < 10 || isInitialTarget}
            estimatedHeight={estimatedHeight + (showSeparator ? 70 : 0)}
            pinned={isPlaying || isActive || isInitialTarget}
            id={ayahId}
            data-surah-number={surahNum}
            data-ayah-number={ayah.numberInSurah}
            data-ayah-global={ayah.number || undefined}
            role="listitem"
            aria-current={isPlaying ? "true" : undefined}
            aria-label={`${lang === "fr" ? "Verset" : lang === "ar" ? "آية" : "Verse"} ${surahNum}:${ayah.numberInSurah}`}
            aria-posinset={index + 1}
            aria-setsize={items.length}
          >
            {() => (
              <>
                {showSeparator ? <PageSeparator page={ayah.page} /> : null}
                <QCVerseCard
                  ayah={ayah}
                  surahNum={surahNum}
                  lang={lang}
                  isPlaying={isPlaying}
                  isActive={isActive}
                  showTranslation={showTranslation}
                  showTransliteration={showTransliteration}
                  showTajwid={showTajwid}
                  translation={getTranslationForAyah?.(ayah)}
                  calibration={calibration}
                  riwaya={riwaya}
                  fontSize={fontSize}
                  onToggleActive={onToggleActive}
                  toggleId={toggleId}
                />
              </>
            )}
          </VirtualizedItem>
        );
      })}

      {surahMeta ? <SurahEndMarker lang={lang} /> : null}
    </div>
  );
}
