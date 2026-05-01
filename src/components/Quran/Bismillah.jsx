import React from "react";

/**
 * Bismillah component renders the opening ornament.
 */
const Bismillah = React.memo(function Bismillah() {
  return (
    <div className="bismillah relative mb-[0.85rem] flex cursor-default items-center justify-center gap-[1.2rem] px-4 pb-4 pt-6 text-center before:block before:h-[1.5px] before:max-w-[120px] before:flex-1 before:rounded-[1px] before:bg-[linear-gradient(90deg,transparent,rgba(184,134,11,0.3)_40%,rgba(184,134,11,0.65))] after:block after:h-[1.5px] after:max-w-[120px] after:flex-1 after:rounded-[1px] after:bg-[linear-gradient(90deg,rgba(184,134,11,0.65),rgba(184,134,11,0.3)_60%,transparent)] hover:before:drop-shadow-[0_0_4px_rgba(184,134,11,0.3)] hover:after:drop-shadow-[0_0_4px_rgba(184,134,11,0.3)]">
      <span
        className='relative z-[1] text-center text-[clamp(2.2rem,5vw,2.8rem)] text-[var(--bismillah-color)] animate-[bisAppear_0.65s_cubic-bezier(0.22,1,0.36,1)_0.3s_both] [font-feature-settings:"calt"_1,"liga"_1,"rlig"_1,"kern"_1] [font-kerning:normal] [font-synthesis:none] leading-[calc(var(--arabic-reading-line-height,2.46)-0.08)] tracking-[0] [text-shadow:0_1px_8px_rgba(0,0,0,0.28),0_0_26px_rgba(212,168,32,0.14)] transition-[color,text-shadow] duration-300 hover:[text-shadow:0_2px_16px_rgba(var(--primary-rgb),0.2),0_0_48px_rgba(184,134,11,0.12)] max-[640px]:leading-[var(--arabic-reading-line-height-mobile,2.22)] max-[420px]:text-[clamp(1.14rem,6.2vw,1.48rem)] max-[420px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)-0.02)] max-[420px]:tracking-[0.004em] max-[360px]:text-[clamp(1.02rem,5.9vw,1.32rem)] max-[360px]:leading-[calc(var(--arabic-reading-line-height-mobile,2.22)-0.05)]'
        dir="rtl"
        style={{ fontFamily: "var(--qd-font-family, var(--font-quran, serif))" }}
      >
        {"\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650"}
      </span>
    </div>
  );
});

export default Bismillah;