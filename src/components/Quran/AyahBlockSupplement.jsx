import React from "react";
import { cn } from "../../lib/utils";

function Panel({ children, isRtl }) {
  return (
    <div
      className={cn(
        "rd-supplement-panel mt-[0.18rem] flex flex-col gap-[0.62rem] rounded-[0.74rem] border border-[rgba(var(--primary-rgb),0.18)] bg-[color-mix(in_srgb,rgba(var(--primary-rgb),0.05)_48%,transparent)] py-[0.58rem] [font-family:var(--font-ui)] max-[640px]:rounded-[0.64rem] max-[640px]:py-[0.5rem] max-[560px]:landscape:gap-[0.42rem] max-[560px]:landscape:py-[0.44rem]",
        isRtl
          ? "pl-[0.72rem] pr-[0.76rem] [border-inline-start:0] [border-inline-end:2px_solid_rgba(var(--primary-rgb),0.24)] max-[640px]:pl-[0.52rem] max-[640px]:pr-[0.62rem] max-[560px]:landscape:pl-[0.5rem] max-[560px]:landscape:pr-[0.6rem]"
          : "pl-[0.76rem] pr-[0.72rem] [border-inline-start:2px_solid_rgba(var(--primary-rgb),0.28)] max-[640px]:pl-[0.62rem] max-[640px]:pr-[0.56rem] max-[560px]:landscape:pl-[0.6rem] max-[560px]:landscape:pr-[0.54rem]",
      )}
      dir="auto"
    >
      {children}
    </div>
  );
}

export default function AyahBlockSupplement({
  ayahTransliteration,
  isRtl,
  lang,
  riwaya,
  trans,
}) {
  return (
    <>
      {ayahTransliteration ? (
        <Panel isRtl={isRtl}>
          <div className="rd-trans-item transliteration flex max-w-[72ch] flex-col gap-1 text-[clamp(0.86rem,0.82rem+0.16vw,0.94rem)] italic leading-[1.66] text-[color-mix(in_srgb,var(--text-primary)_80%,var(--text-secondary)_20%)] max-[640px]:text-[0.82rem] max-[640px]:leading-[1.56] max-[560px]:landscape:leading-[1.56]">
            {ayahTransliteration}
          </div>
        </Panel>
      ) : null}
      {Array.isArray(trans) && trans.length > 0 ? (
        <Panel isRtl={isRtl}>
          {trans.map((item, index) => (
            <div
              key={item.edition?.identifier || index}
              className={cn(
                "rd-trans-item flex max-w-[72ch] flex-col gap-1 text-[clamp(0.97rem,0.9rem+0.22vw,1.08rem)] leading-[1.78] text-[var(--text-secondary)] max-[640px]:text-[0.92rem] max-[640px]:leading-[1.66] max-[560px]:landscape:leading-[1.56]",
                riwaya === "warsh" && "[text-align:start] [unicode-bidi:isolate]",
              )}
            >
              {trans.length > 1 ? (
                <div className="rd-trans-author text-[0.8rem] font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">
                  {item.edition?.name || item.edition?.identifier}
                </div>
              ) : null}
              <div>{item.text}</div>
            </div>
          ))}
        </Panel>
      ) : null}
    </>
  );
}
