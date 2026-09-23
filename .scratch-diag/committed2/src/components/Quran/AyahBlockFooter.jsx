import React from "react";
import { cn } from "../../lib/utils";
import AyahActions from "../AyahActions";

export default function AyahBlockFooter({ ayah, isActive, surahNum }) {
  if (!isActive) return null;

  return (
    <div
      className={cn(
        "mt-4 flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]",
        "opacity-100 transition-opacity duration-200",
        "max-[640px]:mt-3 max-[640px]:pt-2"
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
