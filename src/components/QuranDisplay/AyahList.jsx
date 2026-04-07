import React from "react";
import { toAr } from "../../data/surahs";
import AyahBlock from "../Quran/AyahBlock";

function PageSeparator({ ayah, lang, theme }) {
  const isDarkTheme = theme === "dark" || theme === "night-blue";

  return (
    <div className="page-separator relative my-[2.25rem] flex items-center justify-center gap-[0.85rem] py-4 max-[640px]:my-[1.5rem] max-[640px]:gap-[0.6rem] max-[640px]:py-3">
      <span className="h-px flex-1 rounded-[1px] bg-[linear-gradient(to_right,transparent,rgba(var(--primary-rgb,27,94,59),0.35)_35%,rgba(var(--primary-rgb,27,94,59),0.55)_65%,transparent)]"></span>
      <span
        className={`inline-flex items-center gap-[0.45rem] whitespace-nowrap rounded-full border border-[rgba(var(--primary-rgb,27,94,59),0.18)] bg-[rgba(var(--primary-rgb,27,94,59),0.04)] px-[0.65rem] py-[0.2rem] font-[var(--font-ui,sans-serif)] text-[0.78rem] font-semibold uppercase tracking-[0.07em] text-[var(--primary,#d4a822)] transition-[opacity,background] duration-200 max-[640px]:px-[0.5rem] max-[640px]:py-[0.15rem] max-[640px]:text-[0.68rem] max-[640px]:tracking-[0.05em]${isDarkTheme ? " border-[rgba(var(--primary-rgb,42,158,94),0.2)] bg-[rgba(var(--primary-rgb,42,158,94),0.06)] opacity-[0.62]" : " opacity-[0.72]"}`}
      >
        <span className="text-[0.4em] leading-none text-[var(--gold,#b8860b)] opacity-60">
          {"\u2756"}
        </span>
        <span>
          {lang === "ar" ? "\u0635\u0641\u062d\u0629" : "Page"}{" "}
          {lang === "ar" ? toAr(ayah.page) : ayah.page}
        </span>
        <span className="text-[0.4em] leading-none text-[var(--gold,#b8860b)] opacity-60">
          {"\u2756"}
        </span>
      </span>
      <span className="h-px flex-1 rounded-[1px] bg-[linear-gradient(to_left,transparent,rgba(var(--primary-rgb,27,94,59),0.35)_35%,rgba(var(--primary-rgb,27,94,59),0.55)_65%,transparent)]"></span>
    </div>
  );
}

export default function AyahList({
  ayahs,
  className,
  currentPlayingAyah,
  activeAyah,
  lang,
  theme,
  currentSurah,
  getTranslationForAyah,
  showPageSeparators = false,
  showTajwid,
  showTranslation,
  showWordByWord,
  showTransliteration,
  showWordTranslation,
  calibration,
  riwaya,
  fontSize,
  memMode,
  onToggleActive,
  getToggleId,
  getAyahId,
  getSurahNumber,
}) {
  return (
    <div role="list" className={className}>
      {ayahs.map((ayah, index) => {
        const surahNumber = getSurahNumber(ayah);
        const toggleId = getToggleId(ayah);
        const isPlaying =
          currentPlayingAyah?.ayah === ayah.numberInSurah &&
          currentPlayingAyah?.surah === surahNumber;
        const trans = getTranslationForAyah(ayah);
        const showPageSeparator =
          showPageSeparators && index > 0 && ayahs[index - 1].page !== ayah.page;

        return (
          <React.Fragment key={ayah.number}>
            {showPageSeparator ? (
              <PageSeparator ayah={ayah} lang={lang} theme={theme} />
            ) : null}
            <AyahBlock
              ayah={ayah}
              ayahId={getAyahId(ayah)}
              isPlaying={isPlaying}
              isActive={activeAyah === toggleId}
              trans={trans}
              showTajwid={showTajwid}
              showTranslation={showTranslation}
              showWordByWord={showWordByWord}
              showTransliteration={showTransliteration}
              showWordTranslation={showWordTranslation}
              surahNum={surahNumber || currentSurah}
              calibration={calibration}
              riwaya={riwaya}
              lang={lang}
              fontSize={fontSize}
              memMode={memMode}
              toggleId={toggleId}
              onToggleActive={onToggleActive}
            />
          </React.Fragment>
        );
      })}
    </div>
  );
}
