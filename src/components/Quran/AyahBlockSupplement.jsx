import React from "react";
import { cn } from "../../lib/utils";

export default function AyahBlockSupplement({
  ayahTransliteration,
  isRtl,
  riwaya,
  trans,
}) {
  const translations = Array.isArray(trans) ? trans : [];
  const hasContent = Boolean(ayahTransliteration) || translations.length > 0;

  if (!hasContent) return null;

  return (
    <div
      className="mt-7 flex flex-col gap-6 px-1 [font-family:var(--font-serif)]"
      dir="auto"
    >
      {/* Refined Transliteration styling */}
      {ayahTransliteration ? (
        <div className="text-[1.05rem] italic leading-[1.7] tracking-wide text-[var(--text-secondary)] opacity-80 max-w-[80ch] pb-4 border-b border-[color-mix(in_srgb,var(--border)_40%,transparent_60%)]">
          {ayahTransliteration}
        </div>
      ) : null}

      {/* Refined Translation styling */}
      {translations.map((item, index) => (
        <div
          key={item.edition?.identifier || index}
          className={cn(
            "flex flex-col gap-2 text-[1rem] leading-[1.8] text-[var(--text-primary)] opacity-90 max-w-[80ch]",
            riwaya === "warsh" && "[text-align:start] [unicode-bidi:isolate]",
            index < translations.length - 1 && "pb-6 border-b border-[color-mix(in_srgb,var(--border)_30%,transparent_70%)]"
          )}
        >
          {translations.length > 1 ? (
            <div className="text-[0.65rem] font-bold uppercase tracking-[0.1em] text-[var(--primary)] opacity-80">
              {item.edition?.name || item.edition?.identifier}
            </div>
          ) : null}
          <div className="font-medium text-[var(--text-primary)]">{item.text}</div>
        </div>
      ))}
    </div>
  );
}
