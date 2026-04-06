import React, { useMemo, useRef } from "react";
import { toAr, getSurah } from "../../data/surahs";
import { useAppState } from "../../context/AppContext";
import SmartAyahRenderer from "./SmartAyahRenderer";

function getFlowClassName(fontSize, riwaya, isQCF4) {
  const baseFontClass = getFlowFontClass(fontSize);
  const riwayaClass =
    riwaya === "hafs"
      ? " leading-[calc(var(--arabic-reading-line-height,2.46)+0.36)] [word-spacing:calc(var(--arabic-reading-word-spacing,0.072em)+0.024em)] max-[420px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)+0.27)]"
      : riwaya === "warsh"
        ? " leading-[calc(var(--arabic-reading-line-height,2.46)+0.28)] [word-spacing:calc(var(--arabic-reading-word-spacing,0.072em)+0.012em)] max-[420px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)+0.2)] max-[420px]:[word-spacing:calc(var(--arabic-reading-word-spacing-mobile,0.052em)+0.004em)]"
        : " leading-[calc(var(--arabic-reading-line-height,2.46)+0.34)] [word-spacing:calc(var(--arabic-reading-word-spacing,0.072em)+0.02em)] max-[420px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)+0.24)]";

  return `cpv-flow${isQCF4 ? " qcf4-container" : ""} ${baseFontClass} relative z-10 rounded-2xl border border-white/12 bg-[rgba(8,15,30,0.56)] p-5 text-center text-[var(--text-quran)] [direction:rtl] [font-family:var(--font-quran)] [font-feature-settings:"liga"_1,"calt"_1,"kern"_1,"mark"_1,"ccmp"_1] [letter-spacing:0.01em] [text-align-last:center] [text-rendering:optimizeLegibility] [-webkit-font-smoothing:antialiased] max-[768px]:text-[1.6rem] max-[768px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)+0.44)] max-[480px]:text-[1.4rem] max-[480px]:text-right max-[480px]:[text-align-last:right] max-[480px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)+0.28)] max-[360px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)+0.18)] ${riwayaClass}`;
}

/**
 * Surah title header banner Ã¢â‚¬â€ mushaf-style decorated box.
 */
function SurahHeader({ surahMeta, lang }) {
  const subtitle = lang === "fr" ? surahMeta?.fr : lang === "ar" ? null : surahMeta?.en;
  return (
    <div className="cpv-surah-header mb-6 flex items-center justify-center gap-[0.9rem] [direction:rtl]">
      <span className="cpv-surah-header-line h-px flex-1 bg-[linear-gradient(to_left,var(--cpv-gold),transparent)] opacity-[0.45]" />
      <div className="cpv-surah-header-frame relative inline-flex min-w-[210px] flex-col items-center border-[1.5px] border-[var(--cpv-gold)] bg-[linear-gradient(135deg,rgba(184,134,11,0.05)_0%,transparent_45%,transparent_55%,rgba(184,134,11,0.05)_100%)] px-8 pt-[0.45rem] pb-[0.5rem] shadow-[inset_0_0_0_3px_var(--cpv-bg),inset_0_0_0_5px_rgba(184,134,11,0.22)] [box-shadow:inset_0_0_0_3px_var(--cpv-bg),inset_0_0_0_5px_rgba(184,134,11,0.22)]">
        <span className="pointer-events-none absolute top-1/2 left-[-1.2em] -translate-y-1/2 text-[0.55rem] leading-none text-[var(--cpv-gold)] opacity-70">
          Ã¢Ââ€“
        </span>
        <span className="cpv-surah-header-name" dir="rtl" lang="ar">
          Ã˜Â³Ã™ÂÃ™Ë†Ã˜Â±Ã™Å½Ã˜Â©Ã™Â {surahMeta?.ar}
        </span>
        {subtitle && (
          <span className="cpv-surah-header-sub mt-[0.1rem] font-[var(--font-ui)] text-[0.62rem] uppercase tracking-[0.08em] text-[var(--text-secondary)] opacity-[0.55] [direction:ltr]">
            {subtitle}
          </span>
        )}
        <span className="pointer-events-none absolute top-1/2 right-[-1.2em] -translate-y-1/2 text-[0.55rem] leading-none text-[var(--cpv-gold)] opacity-70">
          Ã¢Ââ€“
        </span>
      </div>
      <span className="cpv-surah-header-line h-px flex-1 bg-[linear-gradient(to_right,var(--cpv-gold),transparent)] opacity-[0.45]" />
    </div>
  );
}

/**
 * Ornamental verse-end medallion Ã¢â‚¬â€ quran.com style.
 * Rendered inline after each verse's text, sized relative to the font.
 */
function VerseMedallion({ num, isPlaying = false }) {
  const display = toAr(num);
  return (
    <span
      className={`cpv-medallion relative mx-[0.2em] inline-flex h-[1.25em] w-[1.25em] shrink-0 translate-y-[-0.04em] items-center justify-center align-middle text-[var(--cpv-gold)] transition-colors duration-200${isPlaying ? " text-[var(--gold,#c9a33d)]" : ""}`}
      aria-label={`Verse ${num}`}
    >
      {display}
    </span>
  );
}

/**
 * Page separator Ã¢â‚¬â€ a subtle horizontal rule with the page number centred.
 */
function PageSeparator({ pageNum, isDarkTheme = false }) {
  return (
    <div className="cpv-page-sep my-[1.2rem] mb-[1rem] flex w-full items-center gap-[0.85rem]" aria-hidden="true">
      <span className="cpv-page-sep-line h-px flex-1 bg-[linear-gradient(to_right,transparent,rgba(var(--primary-rgb),0.28),transparent)]" />
      <span
        className={`cpv-page-sep-label whitespace-nowrap font-["Scheherazade_New","Amiri",serif] text-[0.82rem] font-semibold tracking-[0.05em] text-[var(--primary)] [direction:rtl]${isDarkTheme ? " opacity-[0.42]" : " opacity-[0.55]"}`}
      >
        {toAr(pageNum)}
      </span>
      <span className="cpv-page-sep-line h-px flex-1 bg-[linear-gradient(to_right,transparent,rgba(var(--primary-rgb),0.28),transparent)]" />
    </div>
  );
}

function getFlowFontClass(fontSize) {
  const size = Number(fontSize);
  if (!Number.isFinite(size)) return "text-[40px]";
  if (size <= 34) return "text-[34px]";
  if (size <= 38) return "text-[38px]";
  if (size <= 42) return "text-[42px]";
  if (size <= 46) return "text-[46px]";
  if (size <= 50) return "text-[50px]";
  if (size <= 56) return "text-[56px]";
  return "text-[62px]";
}

/**
 * CleanPageView Ã¢â‚¬â€ Mushaf-style flowing inline layout.
 *
 * All verses flow as continuous inline text (like a real Mushaf page).
 * Each verse ends with an ornamental medallion badge (quran.com style)
 * containing the verse number in Arabic numerals.
 *
 * Every verse span carries id="ayah-{numberInSurah}" so the parent
 * QuranDisplay auto-scroll effect can find and scroll to it during recitation.
 *
 * When showTranslation + getTranslation are provided, a numbered translation
 * panel is rendered below the flowing Arabic text.
 */
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
  onAyahClick,
  showSurahHeader = true,
}) {
  const { theme } = useAppState();
  const containerRef = useRef(null);
  const isDarkTheme = theme === "dark" || theme === "night-blue";

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Surah metadata Ã¢â€â‚¬Ã¢â€â‚¬ */
  const surahMeta = useMemo(() => getSurah(surahNum), [surahNum]);

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Basmala Ã¢â€â‚¬Ã¢â€â‚¬ */
  const showBasmala = useMemo(
    () =>
      surahNum !== 1 &&
      surahNum !== 9 &&
      ayahs.length > 0 &&
      ayahs[0].numberInSurah === 1,
    [surahNum, ayahs],
  );

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Surah header Ã¢â€â‚¬Ã¢â€â‚¬ show at the start of every surah (ayah 1) Ã¢â€â‚¬Ã¢â€â‚¬ */
  const showEmbeddedSurahHeader = useMemo(
    () =>
      showSurahHeader &&
      ayahs.length > 0 &&
      ayahs[0].numberInSurah === 1 &&
      surahMeta != null,
    [showSurahHeader, ayahs, surahMeta],
  );

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Basmala translation for FR/EN Ã¢â€â‚¬Ã¢â€â‚¬ */
  const basmalaTranslation = useMemo(() => {
    if (!showBasmala) return null;
    if (lang === "ar") return null;
    return lang === "fr"
      ? "Au nom d\u2019Allah, le Tout Mis\u00e9ricordieux, le Tr\u00e8s Mis\u00e9ricordieux"
      : "In the Name of Allah, the Most Compassionate, the Most Merciful";
  }, [lang, showBasmala]);

  /* Ã¢â€â‚¬Ã¢â€â‚¬ Build flat list: ayahs + page-separator markers Ã¢â€â‚¬Ã¢â€â‚¬ */
  const items = useMemo(() => {
    if (!ayahs || ayahs.length === 0) return [];
    const result = [];
    let lastPage = null;
    for (const ayah of ayahs) {
      const page = ayah.page || 1;
      if (lastPage !== null && page !== lastPage) {
        result.push({ type: "sep", pageNum: page });
      }
      result.push({ type: "ayah", data: ayah });
      lastPage = page;
    }
    return result;
  }, [ayahs]);

  const flowClassName = getFlowClassName(fontSize, riwaya, isQCF4);

  return (
    <div
      ref={containerRef}
      className={`cpv-container${isQCF4 ? " cpv-qcf4" : ""} relative mx-auto w-full max-w-[820px] overflow-hidden rounded-[0.5rem] border border-[var(--cpv-border)] bg-[var(--cpv-bg)] px-12 pt-10 pb-12 shadow-[var(--cpv-shadow)] max-[768px]:rounded-[0.6rem] max-[768px]:px-4 max-[768px]:pt-5 max-[768px]:pb-8 max-[480px]:rounded-[0.5rem] max-[480px]:px-3 max-[480px]:pt-4 max-[480px]:pb-7`}
    >
      <div
        className="pointer-events-none mb-0 block h-[2px] bg-[linear-gradient(90deg,transparent,rgba(var(--primary-rgb),0.35)_25%,rgba(184,134,11,0.65)_50%,rgba(var(--primary-rgb),0.35)_75%,transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-size-[64px_64px] opacity-[0.11]"
        aria-hidden="true"
      />
      {/* Surah title header */}
      {showEmbeddedSurahHeader && (
        <SurahHeader surahMeta={surahMeta} lang={lang} />
      )}

      {/* Basmala */}
      {showBasmala && (
        <div className="cpv-basmala-wrap relative mb-[1.6rem] border-b border-[rgba(var(--primary-rgb),0.1)] pb-[1.2rem] text-center after:pointer-events-none after:absolute after:bottom-[-0.55rem] after:left-1/2 after:-translate-x-1/2 after:bg-[var(--cpv-bg,var(--bg-card))] after:px-[0.4rem] after:text-[0.5rem] after:leading-none after:text-[var(--primary)] after:opacity-[0.4] after:content-['✦'] max-[768px]:mb-[1.2rem] max-[768px]:pb-[0.9rem] max-[420px]:after:bottom-[-0.48rem] max-[420px]:after:text-[0.46rem] max-[420px]:after:opacity-[0.34] max-[360px]:mb-[1rem] max-[360px]:pb-[0.78rem]">
          <div
            className={`cpv-basmala ${getFlowFontClass(fontSize)} mb-[0.5rem] border-b-0 pb-0 text-center [direction:rtl] [font-family:var(--font-quran)] leading-[2.4] text-[var(--text-quran)] [-webkit-font-smoothing:antialiased] max-[768px]:mb-[1.2rem] max-[768px]:text-[1.55rem] max-[420px]:mb-[0.4rem] max-[420px]:text-[1.22rem] max-[420px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)-0.04)] max-[420px]:[text-shadow:0_1px_1px_rgba(0,0,0,0.14)] max-[360px]:mb-[0.32rem] max-[360px]:text-[1.14rem] max-[360px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)-0.08)] max-[480px]:text-[1.3rem]`}
            dir="rtl"
            lang="ar"
            aria-label="Basmala"
          >
            {"\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650"}
          </div>
          {basmalaTranslation && (
            <p className="cpv-basmala-translation m-0 text-center font-[var(--font-ui)] text-[0.72rem] italic leading-[1.6] tracking-[0.025em] text-[var(--cpv-gold)] opacity-[0.75] [direction:ltr] max-[420px]:text-[0.66rem] max-[420px]:leading-[1.45] max-[420px]:opacity-[0.7] max-[360px]:text-[0.62rem] max-[360px]:opacity-[0.66]">
              {basmalaTranslation}
            </p>
          )}
        </div>
      )}

      {/* Flowing text block Ã¢â‚¬â€ all verses inline */}
      <div
        className={flowClassName}
        dir="rtl"
        lang="ar"
      >
        {items.map((item) => {
          /* Page separator Ã¢â‚¬â€ block-level break in the flow */
          if (item.type === "sep") {
            return (
              <PageSeparator
                key={`sep-${item.pageNum}`}
                pageNum={item.pageNum}
                isDarkTheme={isDarkTheme}
              />
            );
          }

          const ayah = item.data;
          const isPlaying =
            currentPlayingAyah?.ayah === ayah.numberInSurah &&
            currentPlayingAyah?.surah === surahNum;

          return (
            <span
              key={ayah.number}
              id={`ayah-${ayah.numberInSurah}`}
              data-surah-number={surahNum}
              data-ayah-number={ayah.numberInSurah}
              data-ayah-global={ayah.number}
              className={`cpv-verse inline transition-colors duration-200${isPlaying ? " cpv-verse--playing rounded-[5px] bg-[rgba(212,168,32,0.1)] px-[0.15em] py-[0.04em] text-[color:color-mix(in_srgb,var(--text-quran)_85%,var(--gold,#c9a33d)_15%)] shadow-[0_0_0_2px_rgba(212,168,32,0.18)] [text-shadow:0_0_20px_rgba(212,168,32,0.13)] animate-[cpv-glow_2.8s_ease-in-out_infinite]" : ""}`}
              aria-label={`${lang === "ar" ? "\u0627\u0644\u0622\u064a\u0629" : lang === "fr" ? "Verset" : "Verse"} ${ayah.numberInSurah}`}
              aria-current={isPlaying ? "true" : undefined}
            >
              {/* Arabic text */}
              <SmartAyahRenderer
                ayah={ayah}
                showTajwid={showTajwid}
                isPlaying={isPlaying}
                surahNum={surahNum}
                calibration={calibration}
                riwaya={riwaya}
              />
              {/* Ornamental verse-end medallion */}
              <VerseMedallion num={ayah.numberInSurah} isPlaying={isPlaying} />
              {/* Hair space between verses for breathing room */}
              {"\u200A"}
            </span>
          );
        })}
        {/* Ornamental end-of-surah closure */}
        {ayahs.length > 0 && (
          <div className="cpv-closure mt-[1.8rem] mb-[0.5rem] flex w-full items-center gap-4 [direction:rtl]" aria-hidden="true">
            <span className="cpv-closure-line h-px flex-1 bg-[linear-gradient(to_right,transparent,var(--cpv-border))]" />
            <span className="cpv-closure-ornament shrink-0 whitespace-nowrap font-quran text-[1.1rem] leading-[1.8] tracking-[0.06em] text-[var(--cpv-gold)] opacity-[0.65] max-[768px]:text-[0.95rem]">
              {surahMeta?.ar || "\u2756"}
            </span>
            <span className="cpv-closure-line h-px flex-1 bg-[linear-gradient(to_left,transparent,var(--cpv-border))]" />
          </div>
        )}
      </div>

      {/* Ã¢â€â‚¬Ã¢â€â‚¬ Translations panel Ã¢â‚¬â€ numbered list below the Arabic flow Ã¢â€â‚¬Ã¢â€â‚¬ */}
      {showTranslation && getTranslation && ayahs.length > 0 && (
        <div
          className="cpv-trans-panel mt-[1.8rem] flex flex-col gap-0 rounded-2xl border border-white/12 border-t-[1px] border-t-[rgba(var(--primary-rgb),0.12)] bg-[rgba(8,16,32,0.72)] p-3.5 pt-[1.4rem] [font-family:var(--font-ui)]"
          dir={lang === "ar" ? "rtl" : "ltr"}
          aria-label={lang === "ar" ? "Ã˜Â§Ã™â€žÃ˜ÂªÃ˜Â±Ã˜Â¬Ã™â€¦Ã˜Â©" : lang === "fr" ? "Traductions" : "Translations"}
        >
          {ayahs.map((ayah) => {
            const transArray = getTranslation(ayah);
            if (!Array.isArray(transArray) || transArray.length === 0) return null;
            const isPlaying =
              currentPlayingAyah?.ayah === ayah.numberInSurah &&
              (currentPlayingAyah?.surah === surahNum ||
                currentPlayingAyah?.surah == null);
            return (
              <div
                key={ayah.numberInSurah}
                className={`cpv-trans-entry flex items-baseline gap-3 rounded-[0.35rem] border-b border-[rgba(var(--primary-rgb),0.05)] px-[0.4rem] py-[0.55rem] text-[0.88rem] leading-[1.9] text-[var(--text-secondary)] transition-[background,color] duration-150 ease-out last:border-b-0 hover:bg-[rgba(var(--primary-rgb),0.025)] hover:text-[var(--text-primary)] max-[640px]:px-[0.3rem] max-[640px]:py-[0.45rem] max-[640px]:text-[0.82rem]${isPlaying ? " cpv-trans-entry--playing bg-[rgba(212,168,32,0.03)] text-[color:color-mix(in_srgb,var(--text-secondary)_80%,var(--gold,#c9a33d)_20%)]" : ""}`}
              >
                <span
                  className={`cpv-trans-num inline-flex h-[1.85rem] min-w-[1.85rem] shrink-0 items-center justify-center rounded-full border border-[rgba(var(--primary-rgb),0.12)] bg-[rgba(var(--primary-rgb),0.06)] font-["Scheherazade_New","Amiri",serif] text-[0.72rem] font-bold leading-none text-[var(--primary)] [direction:rtl] transition-[background] duration-150 ease-out max-[640px]:h-[1.6rem] max-[640px]:min-w-[1.6rem] max-[640px]:text-[0.66rem]${isPlaying ? " border-[rgba(212,168,32,0.3)] bg-[rgba(212,168,32,0.12)] text-[var(--gold,#c9a33d)]" : ""}`}
                >
                  {toAr(ayah.numberInSurah)}
                </span>
                <div className="cpv-trans-content flex-1">
                  {transArray.map((t, idx) => (
                    <div key={idx} className="cpv-trans-item">
                      {transArray.length > 1 && (
                        <span className="cpv-trans-edition">
                          [{t.edition?.name || t.edition?.identifier}]{" "}
                        </span>
                      )}
                      <span className="cpv-trans-text flex-1 font-[420] tracking-[0.008em]">
                        {t.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
