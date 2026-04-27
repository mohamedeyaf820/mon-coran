import React from "react";
import AyahActions from "../AyahActions";

export default function AyahBlockFooter({
  ayah,
  isActive,
  surahNum,
}) {
  if (!isActive) return null;

  return (
    <div className="rd-actions mt-2 flex flex-wrap items-center gap-2 max-[640px]:mt-[0.28rem] max-[640px]:gap-[0.34rem] max-[560px]:landscape:mt-[0.2rem] max-[560px]:landscape:gap-[0.24rem]">
      <AyahActions surah={surahNum} ayah={ayah.numberInSurah} ayahData={ayah} compact />
    </div>
  );
}
