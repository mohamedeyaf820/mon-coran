import React from "react";
import { useAppLocale } from "../../context/AppContext";

const BISMILLAH_TRANSLATIONS = {
  fr: "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux",
  en: "In the name of Allah, the Entirely Merciful, the Especially Merciful",
  ar: ""
};

/**
 * Bismillah component renders the opening ornament.
 */
const Bismillah = React.memo(function Bismillah() {
  const { lang } = useAppLocale();

  return (
    <div className="bismillah-container flex flex-col items-center justify-center my-6 select-none pointer-events-none">
      <div className="bismillah relative mb-[0.25rem] flex items-center justify-center gap-[1.2rem] px-4 pb-2 pt-4 text-center before:block before:h-[1.5px] before:max-w-[120px] before:flex-1 before:rounded-[1px] before:bg-[linear-gradient(90deg,transparent,var(--gold-border,rgba(184,134,11,0.3))_40%,var(--gold,rgba(184,134,11,0.65)))] after:block after:h-[1.5px] after:max-w-[120px] after:flex-1 after:rounded-[1px] after:bg-[linear-gradient(90deg,var(--gold,rgba(184,134,11,0.65)),var(--gold-border,rgba(184,134,11,0.3))_60%,transparent)]">
        <span
          className='relative z-[1] text-center text-[clamp(2.2rem,5vw,2.8rem)] text-[var(--bismillah-color)] animate-[bisAppear_0.65s_cubic-bezier(0.22,1,0.36,1)_0.3s_both] [font-feature-settings:"calt"_1,"liga"_1,"rlig"_1,"kern"_1] [font-kerning:normal] [font-synthesis:none] leading-[calc(var(--arabic-reading-line-height,2.46)-0.08)] tracking-[0]'
          dir="rtl"
          style={{ fontFamily: "var(--qd-font-family, var(--font-quran, serif))" }}
        >
          {"\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650"}
        </span>
      </div>
      {lang !== "ar" && BISMILLAH_TRANSLATIONS[lang] && (
        <div className="bismillah-translation text-xs italic font-medium text-[var(--gold,#c8a84b)] opacity-95 text-center mt-1 animate-[fadeIn_0.5s_ease_both]">
          {BISMILLAH_TRANSLATIONS[lang]}
        </div>
      )}
    </div>
  );
});

export default Bismillah;