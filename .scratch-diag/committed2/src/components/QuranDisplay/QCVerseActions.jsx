import React from "react";
import AyahActions from "../AyahActions";

/**
 * Thin wrapper around AyahActions that provides Quran.com-style display.
 * compact=true → icon-only row (shown on hover in card header)
 * compact=false → full expanded row (shown when verse is active/selected)
 */
export default function QCVerseActions({ surah, ayah, ayahData, translations, compact = false, layout = "horizontal" }) {
  return (
    <AyahActions
      surah={surah}
      ayah={ayah}
      ayahData={ayahData}
      translations={translations}
      compact={compact}
      layout={layout}
    />
  );
}
