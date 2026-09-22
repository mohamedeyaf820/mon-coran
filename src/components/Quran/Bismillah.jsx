import React from "react";
import { getBasmalaText } from "../../data/basmala";

/**
 * Bismillah component renders the opening ornament. The basmala is Quran on the
 * printed page: its meaning belongs to the translation panel, not to the sheet,
 * so no gloss is set under it.
 */
const Bismillah = React.memo(function Bismillah({ riwaya }) {
  return (
    <div className="bismillah-container flex flex-col items-center justify-center my-6 select-none pointer-events-none">
      <div className="bismillah relative mb-[0.25rem] flex items-center justify-center gap-[1.2rem] px-4 pb-2 pt-4 text-center before:block before:h-[1.5px] before:max-w-[120px] before:flex-1 before:rounded-[1px] before:bg-[linear-gradient(90deg,transparent,var(--gold-border,rgba(184,134,11,0.3))_40%,var(--gold,rgba(184,134,11,0.65)))] after:block after:h-[1.5px] after:max-w-[120px] after:flex-1 after:rounded-[1px] after:bg-[linear-gradient(90deg,var(--gold,rgba(184,134,11,0.65)),var(--gold-border,rgba(184,134,11,0.3))_60%,transparent)]">
        <span
          className='relative z-[1] text-center text-[clamp(2.2rem,5vw,2.8rem)] text-[var(--bismillah-color)] animate-[bisAppear_0.65s_cubic-bezier(0.22,1,0.36,1)_0.3s_both] [font-feature-settings:"calt"_1,"liga"_1,"rlig"_1,"kern"_1] [font-kerning:normal] [font-synthesis:none] leading-[calc(var(--arabic-reading-line-height,2.46)-0.08)] tracking-[0]'
          dir="rtl"
          style={{ fontFamily: "var(--qd-font-family, var(--font-quran, serif))" }}
        >
          {getBasmalaText(riwaya)}
        </span>
      </div>
    </div>
  );
});

export default Bismillah;