import React from "react";
import { cn } from "../../lib/utils";
import AyahActions from "../AyahActions";

export default function AyahBlockFooter({
  ayah,
  isActive,
  isRtl,
  memoLevel,
  onStarClick,
  surahNum,
}) {
  return (
    <div className="rd-actions mt-2 flex flex-wrap items-center gap-2 max-[640px]:mt-[0.28rem] max-[640px]:gap-[0.34rem] max-[560px]:landscape:mt-[0.2rem] max-[560px]:landscape:gap-[0.24rem]">
      <AyahActions surah={surahNum} ayah={ayah.numberInSurah} ayahData={ayah} compact />
      {isActive || memoLevel > 0 ? (
        <div
          className={cn(
            "rd-action-meta rd-action-meta-stars flex gap-[0.15rem] font-[var(--font-ui)] text-[0.85rem] font-semibold text-[var(--text-muted)]",
            isRtl ? "mr-auto ml-0" : "ml-auto",
          )}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={(event) => onStarClick(event, value)}
              className={cn(
                "rd-star-btn cursor-pointer border-none bg-transparent p-0 leading-none text-[var(--border)] transition-colors",
                value <= memoLevel && "is-on text-[var(--gold)]",
              )}
            >
              {"\u2605"}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
