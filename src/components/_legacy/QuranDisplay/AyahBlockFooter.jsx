import React from "react";
import { cn } from "../../lib/utils";
import AyahActions from "../AyahActions";

export default function AyahBlockFooter({ ayah, isActive, surahNum }) {
  if (!isActive) return null;

  return (
    <div
      className={cn(
        "rd-actions mt-3 flex flex-wrap items-center gap-2",
        "opacity-100 transition-opacity duration-200",
        "max-[640px]:mt-[0.28rem] max-[640px]:gap-[0.34rem]",
        "max-[560px]:landscape:mt-[0.2rem] max-[560px]:landscape:gap-[0.24rem]",
      )}
    >
      <AyahActions
        surah={surahNum}
        ayah={ayah.numberInSurah}
        ayahData={ayah}
        compact
      />
    </div>
  );
}
