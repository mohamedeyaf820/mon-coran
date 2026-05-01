import React from "react";
import { cn } from "../../lib/utils";
import { shouldShowStandaloneBasmala } from "../../utils/quranUtils";
import SmartAyahRenderer from "../Quran/SmartAyahRenderer";
import AyahMarker from "../Quran/AyahMarker";

const BASMALA = "\uFDFD";

function PageSeparator({ page, lang }) {
  return (
    <div className="relative flex items-center justify-center gap-4 my-2 select-none" aria-hidden="true">
      <div className="flex-1 h-px bg-gradient-to-r from-transparent to-[rgba(var(--primary-rgb),0.12)]" />
      <span className="text-[0.6rem] font-semibold text-[var(--text-muted)] tracking-wide uppercase px-2">
        {lang === "ar" ? "صفحة" : "P."} {page}
      </span>
      <div className="flex-1 h-px bg-gradient-to-l from-transparent to-[rgba(var(--primary-rgb),0.12)]" />
    </div>
  );
}

/**
 * QCReadingView — continuous Mushaf-style reading flow.
 * Text is rendered inline (RTL), verse markers are embedded in the flow.
 * Clean, minimal, distraction-free.
 */
export default function QCReadingView({
  ayahs,
  surahGroups,
  lang,
  currentPlayingAyah,
  activeAyah,
  showTranslation,
  showTajwid,
  getTranslationForAyah,
  calibration,
  riwaya,
  fontSize,
  onToggleActive,
  displayMode,
  showPageSeparators,
}) {
  // Flatten groups → items
  const items = surahGroups
    ? surahGroups.flatMap((g) =>
        g.ayahs.map((a) => ({ ayah: a, surahNum: g.surah }))
      )
    : (ayahs || []).map((a) => ({ ayah: a, surahNum: a.surah?.number || 1 }));

  if (items.length === 0) return null;

  const firstAyah = items[0]?.ayah;
  const firstSurahNum = items[0]?.surahNum;
  const showBasmala =
    firstAyah &&
    shouldShowStandaloneBasmala(firstSurahNum, riwaya, firstAyah.text) &&
    firstAyah.numberInSurah === 1;

  return (
    <div className="qc-reading-view w-full max-w-[860px] mx-auto px-3 sm:px-6 py-6">
      {/* Parchment-style reading card */}
      <div
        className={cn(
          "relative rounded-2xl border border-[var(--border)]",
          "bg-[var(--mushaf-bg,var(--bg-card))]",
          "shadow-[0_4px_24px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,0.6)]",
          "px-6 sm:px-10 pt-8 pb-10",
          "overflow-hidden",
        )}
      >
        {/* Gold top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(184,134,11,0.45) 25%, rgba(184,134,11,0.75) 50%, rgba(184,134,11,0.45) 75%, transparent)",
          }}
          aria-hidden="true"
        />

        {/* Basmala */}
        {showBasmala && (
          <div
            className="text-center text-[2rem] leading-[2] font-[var(--font-quran,serif)] text-[var(--text-quran,var(--text-primary))] mb-6 pb-4 border-b border-[rgba(var(--primary-rgb),0.1)]"
            dir="rtl"
            lang="ar"
            aria-label="Basmala"
          >
            {BASMALA}
          </div>
        )}

        {/* Flowing Arabic text */}
        <div
          dir="rtl"
          lang="ar"
          className="leading-[2.2] text-[var(--text-quran,var(--text-primary))] font-[var(--qd-font-family,var(--font-quran,'Amiri Quran'))] [-webkit-font-smoothing:antialiased] [text-rendering:optimizeLegibility] text-right [word-spacing:0.08em]"
          style={{ fontSize: `${fontSize || 40}px` }}
        >
          {items.map(({ ayah, surahNum }, index) => {
            const toggleId = displayMode === "surah" ? ayah.numberInSurah : ayah.number;
            const isPlaying =
              currentPlayingAyah?.ayah === ayah.numberInSurah &&
              currentPlayingAyah?.surah === surahNum;
            const isActive = activeAyah === toggleId;

            const showSep =
              showPageSeparators &&
              index > 0 &&
              items[index - 1].ayah.page !== ayah.page;

            return (
              <React.Fragment key={ayah.number}>
                {showSep && (
                  <span className="inline-block w-full">
                    <PageSeparator page={ayah.page} lang={lang} />
                  </span>
                )}
                <span
                  id={displayMode === "surah" ? `ayah-${ayah.numberInSurah}` : `ayah-${ayah.number}`}
                  data-surah-number={surahNum}
                  data-ayah-number={ayah.numberInSurah}
                  data-ayah-global={ayah.number}
                  role="button"
                  tabIndex={0}
                  aria-label={`${lang === "fr" ? "Verset" : "Verse"} ${ayah.numberInSurah}`}
                  aria-current={isPlaying ? "true" : undefined}
                  onClick={() => onToggleActive?.(toggleId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onToggleActive?.(toggleId);
                    }
                  }}
                  className={cn(
                    "qc-reading-verse inline rounded-[6px] transition-all duration-200 cursor-pointer",
                    isActive && "bg-[rgba(var(--primary-rgb),0.06)]",
                    isPlaying && [
                      "bg-[rgba(var(--primary-rgb),0.08)]",
                      "text-[color:color-mix(in_srgb,var(--text-quran)_80%,var(--primary)_20%)]",
                      "shadow-[0_0_0_2px_rgba(var(--primary-rgb),0.18)]",
                      "animate-[verse-glow_2.8s_ease-in-out_infinite]",
                    ],
                    "hover:bg-[rgba(var(--primary-rgb),0.04)]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--primary-rgb),0.4)]",
                  )}
                >
                  <SmartAyahRenderer
                    ayah={ayah}
                    showTajwid={showTajwid}
                    isPlaying={isPlaying}
                    surahNum={surahNum}
                    calibration={calibration}
                    riwaya={riwaya}
                  />
                  <AyahMarker
                    num={ayah.numberInSurah}
                    isPlaying={isPlaying}
                    size="0.92em"
                  />
                  {"\u200A"}
                </span>
              </React.Fragment>
            );
          })}
        </div>

        {/* Translation panel — below the Arabic block */}
        {showTranslation && getTranslationForAyah && (
          <div className="mt-6 pt-4 border-t border-[rgba(var(--primary-rgb),0.1)] space-y-3">
            {items.map(({ ayah, surahNum }) => {
              const trans = getTranslationForAyah(ayah);
              if (!Array.isArray(trans) || trans.length === 0) return null;
              const isPlaying =
                currentPlayingAyah?.ayah === ayah.numberInSurah &&
                currentPlayingAyah?.surah === surahNum;

              return (
                <div
                  key={`trans-${ayah.number}`}
                  className={cn(
                    "flex gap-3 text-[0.82rem] leading-relaxed",
                    isPlaying && "text-[var(--primary)]",
                  )}
                  dir={lang === "ar" ? "rtl" : "ltr"}
                >
                  <span className="shrink-0 mt-0.5 font-[var(--font-ui)] text-[0.62rem] font-bold text-[var(--text-muted)] min-w-[2.2rem] text-right">
                    {ayah.numberInSurah}
                  </span>
                  <div className="text-[var(--text-secondary)]">
                    {trans.map((item, i) => (
                      <span key={item.id || i}>{item.text} </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom gold accent */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(184,134,11,0.2) 40%, rgba(184,134,11,0.4) 50%, rgba(184,134,11,0.2) 60%, transparent)",
          }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
