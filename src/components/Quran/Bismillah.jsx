import React from "react";

/**
 * Bismillah component – renders the opening ornament.
 */
const Bismillah = React.memo(function Bismillah() {
  return (
    <div className="bismillah relative mb-[0.85rem] flex cursor-default items-center justify-center gap-[1.2rem] px-4 pb-4 pt-6 text-center before:block before:h-[1.5px] before:max-w-[120px] before:flex-1 before:rounded-[1px] before:bg-[linear-gradient(90deg,transparent,rgba(184,134,11,0.3)_40%,rgba(184,134,11,0.65))] after:block after:h-[1.5px] after:max-w-[120px] after:flex-1 after:rounded-[1px] after:bg-[linear-gradient(90deg,rgba(184,134,11,0.65),rgba(184,134,11,0.3)_60%,transparent)] hover:before:drop-shadow-[0_0_4px_rgba(184,134,11,0.3)] hover:after:drop-shadow-[0_0_4px_rgba(184,134,11,0.3)]">
      <span
        className='bismillah-text relative z-[1] text-center font-quran text-[clamp(2.2rem,5vw,2.8rem)] leading-[1.7] tracking-[1.5px] text-[var(--bismillah-color)] [text-shadow:0_1px_12px_rgba(var(--primary-rgb),0.14),0_0_40px_rgba(184,134,11,0.08)] transition-[color,text-shadow] duration-300 hover:[text-shadow:0_2px_16px_rgba(var(--primary-rgb),0.2),0_0_48px_rgba(184,134,11,0.12)]'
        dir="rtl"
      >
        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
      </span>
    </div>
  );
});

export default Bismillah;
