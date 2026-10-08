import React from "react";
import DuaCard from "./DuaCard";
import { useDuaActions } from "./useDuaActions";
import { QURAN_CATEGORY_MAP, categoryLabel } from "./quranDuas";
import SURAHS from "../../data/surahs";

/** A supplication quoted from the Quran: its source is the verse itself. */
export default function QuranDuaCard({ dua, lang, badge }) {
  const { copyDua, shareDua, goToVerse } = useDuaActions(lang);
  const surah = SURAHS[dua.surah - 1] || { ar: "السورة", fr: "Sourate", en: "Surah" };
  const surahTitle = lang === "ar" ? surah.ar : lang === "fr" ? surah.fr : surah.en;
  const category = QURAN_CATEGORY_MAP[dua.category];
  const categoryText = badge ?? (category ? categoryLabel(category, lang) : "");
  const translation = lang === "fr" ? dua.fr : dua.en;
  const reference = `${surahTitle} ${dua.surah}:${dua.ayah}${dua.part ? ` (${dua.part})` : ""}`;

  return (
    <DuaCard
      lang={lang}
      arabic={dua.arabic}
      transliteration={dua.transliteration}
      translation={translation}
      refLabel={
        <>
          {surahTitle}
          <span className="dua-ref-nums">
            {" "}
            · {dua.surah}:{dua.ayah}
            {dua.part ? ` (${dua.part})` : ""}
          </span>
        </>
      }
      categoryLabel={categoryText}
      onShare={() =>
        shareDua({
          surah: dua.surah,
          ayah: dua.ayah,
          arabicText: dua.arabic || "",
          translationText: translation,
          occasion: categoryText,
          source: reference,
        })
      }
      onCopy={() =>
        copyDua(
          `${dua.arabic}\n\n${dua.transliteration ? `${dua.transliteration}\n\n` : ""}${translation}\n— ${reference}`,
        )
      }
      onOpenVerse={() => goToVerse(dua.surah, dua.ayah)}
    />
  );
}
