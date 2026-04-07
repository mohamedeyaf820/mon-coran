import React, { useMemo } from "react";
import { getSurah } from "../../data/surahs";
import { useAppState } from "../../context/AppContext";
import SmartAyahRenderer from "./SmartAyahRenderer";
import CleanPageTranslationPanel from "./CleanPageTranslationPanel";
import {
  CleanPageSeparator,
  CleanPageSurahHeader,
  VerseMedallion,
} from "./CleanPageDecor";
import { buildFlowItems, getFlowClassName, getFlowFontClass } from "./cleanPageViewUtils";

export default function CleanPageView({
  ayahs,
  lang,
  fontSize,
  isQCF4,
  showTajwid,
  currentPlayingAyah,
  surahNum,
  calibration,
  riwaya,
  showTranslation,
  getTranslation,
  showSurahHeader = true,
}) {
  const { theme } = useAppState();
  const surahMeta = useMemo(() => getSurah(surahNum), [surahNum]);
  const isDarkTheme = theme === "dark" || theme === "night-blue";
  const showBasmala =
    surahNum !== 1 && surahNum !== 9 && ayahs.length > 0 && ayahs[0].numberInSurah === 1;
  const basmalaTranslation =
    showBasmala && lang !== "ar"
      ? lang === "fr"
        ? "Au nom d\u2019Allah, le Tout Mis\u00e9ricordieux, le Tr\u00e8s Mis\u00e9ricordieux"
        : "In the Name of Allah, the Most Compassionate, the Most Merciful"
      : null;
  const items = useMemo(() => buildFlowItems(ayahs), [ayahs]);

  return (
    <div className={`cpv-container${isQCF4 ? " cpv-qcf4" : ""} relative mx-auto w-full max-w-[820px] overflow-hidden rounded-[0.5rem] border border-[var(--cpv-border)] bg-[var(--cpv-bg)] px-12 pt-10 pb-12 shadow-[var(--cpv-shadow)] max-[768px]:rounded-[0.6rem] max-[768px]:px-4 max-[768px]:pt-5 max-[768px]:pb-8 max-[480px]:rounded-[0.5rem] max-[480px]:px-3 max-[480px]:pt-4 max-[480px]:pb-7`}>
      <div className="pointer-events-none mb-0 block h-[2px] bg-[linear-gradient(90deg,transparent,rgba(var(--primary-rgb),0.35)_25%,rgba(184,134,11,0.65)_50%,rgba(var(--primary-rgb),0.35)_75%,transparent)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.11]" aria-hidden="true" />
      {showSurahHeader && ayahs[0]?.numberInSurah === 1 && surahMeta ? <CleanPageSurahHeader surahMeta={surahMeta} lang={lang} /> : null}
      {showBasmala ? <div className="cpv-basmala-wrap relative mb-[1.6rem] border-b border-[rgba(var(--primary-rgb),0.1)] pb-[1.2rem] text-center after:pointer-events-none after:absolute after:bottom-[-0.55rem] after:left-1/2 after:-translate-x-1/2 after:bg-[var(--cpv-bg,var(--bg-card))] after:px-[0.4rem] after:text-[0.5rem] after:leading-none after:text-[var(--primary)] after:opacity-[0.4] after:content-['✦'] max-[768px]:mb-[1.2rem] max-[768px]:pb-[0.9rem] max-[420px]:after:bottom-[-0.48rem] max-[420px]:after:text-[0.46rem] max-[420px]:after:opacity-[0.34] max-[360px]:mb-[1rem] max-[360px]:pb-[0.78rem]"><div className={`cpv-basmala ${getFlowFontClass(fontSize)} mb-[0.5rem] border-b-0 pb-0 text-center [direction:rtl] [font-family:var(--font-quran)] leading-[2.4] text-[var(--text-quran)] [-webkit-font-smoothing:antialiased] max-[768px]:mb-[1.2rem] max-[768px]:text-[1.55rem] max-[420px]:mb-[0.4rem] max-[420px]:text-[1.22rem] max-[420px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)-0.04)] max-[420px]:[text-shadow:0_1px_1px_rgba(0,0,0,0.14)] max-[360px]:mb-[0.32rem] max-[360px]:text-[1.14rem] max-[360px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)-0.08)] max-[480px]:text-[1.3rem]`} dir="rtl" lang="ar" aria-label="Basmala">{"\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650"}</div>{basmalaTranslation ? <p className="cpv-basmala-translation m-0 text-center font-[var(--font-ui)] text-[0.72rem] italic leading-[1.6] tracking-[0.025em] text-[var(--cpv-gold)] opacity-[0.75] [direction:ltr] max-[420px]:text-[0.66rem] max-[420px]:leading-[1.45] max-[420px]:opacity-[0.7] max-[360px]:text-[0.62rem] max-[360px]:opacity-[0.66]">{basmalaTranslation}</p> : null}</div> : null}
      <div className={getFlowClassName(fontSize, riwaya, isQCF4)} dir="rtl" lang="ar">
        {items.map((item) => {
          if (item.type === "sep") return <CleanPageSeparator key={`sep-${item.pageNum}`} pageNum={item.pageNum} isDarkTheme={isDarkTheme} />;
          const ayah = item.data;
          const isPlaying = currentPlayingAyah?.ayah === ayah.numberInSurah && currentPlayingAyah?.surah === surahNum;
          return <span key={ayah.number} id={`ayah-${ayah.numberInSurah}`} data-surah-number={surahNum} data-ayah-number={ayah.numberInSurah} data-ayah-global={ayah.number} className={`cpv-verse inline transition-colors duration-200${isPlaying ? " cpv-verse--playing rounded-[5px] bg-[rgba(212,168,32,0.1)] px-[0.15em] py-[0.04em] text-[color:color-mix(in_srgb,var(--text-quran)_85%,var(--gold,#c9a33d)_15%)] shadow-[0_0_0_2px_rgba(212,168,32,0.18)] [text-shadow:0_0_20px_rgba(212,168,32,0.13)] animate-[cpv-glow_2.8s_ease-in-out_infinite]" : ""}`} aria-label={`${lang === "ar" ? "\u0627\u0644\u0622\u064a\u0629" : lang === "fr" ? "Verset" : "Verse"} ${ayah.numberInSurah}`} aria-current={isPlaying ? "true" : undefined}><SmartAyahRenderer ayah={ayah} showTajwid={showTajwid} isPlaying={isPlaying} surahNum={surahNum} calibration={calibration} riwaya={riwaya} /><VerseMedallion num={ayah.numberInSurah} isPlaying={isPlaying} />{"\u200A"}</span>;
        })}
        {ayahs.length > 0 ? <div className="cpv-closure mt-[1.8rem] mb-[0.5rem] flex w-full items-center gap-4 [direction:rtl]" aria-hidden="true"><span className="cpv-closure-line h-px flex-1 bg-[linear-gradient(to_right,transparent,var(--cpv-border))]" /><span className="cpv-closure-ornament shrink-0 whitespace-nowrap font-quran text-[1.1rem] leading-[1.8] tracking-[0.06em] text-[var(--cpv-gold)] opacity-[0.65] max-[768px]:text-[0.95rem]">{surahMeta?.ar || "\u2756"}</span><span className="cpv-closure-line h-px flex-1 bg-[linear-gradient(to_left,transparent,var(--cpv-border))]" /></div> : null}
      </div>
      {showTranslation && getTranslation && ayahs.length > 0 ? <CleanPageTranslationPanel ayahs={ayahs} currentPlayingAyah={currentPlayingAyah} getTranslation={getTranslation} lang={lang} surahNum={surahNum} /> : null}
    </div>
  );
}
