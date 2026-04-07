import { useCallback, useEffect, useState } from "react";
import {
  getMemorizationLevel,
  setMemorizationLevel,
} from "../../services/memorizationService";

export default function useMemorizationLevel(surahNum, ayahNumber) {
  const [memoLevel, setMemoLevel] = useState(0);

  useEffect(() => {
    setMemoLevel(getMemorizationLevel(surahNum, ayahNumber));
  }, [ayahNumber, surahNum]);

  useEffect(() => {
    const handleSync = (event) => {
      if (event.detail?.surah === surahNum && event.detail?.ayah === ayahNumber) {
        setMemoLevel(Number(event.detail.level) || 0);
      }
    };

    window.addEventListener("quran-memorization-updated", handleSync);
    return () => window.removeEventListener("quran-memorization-updated", handleSync);
  }, [ayahNumber, surahNum]);

  const updateMemoLevel = useCallback(
    (event, level) => {
      event.stopPropagation();
      const nextLevel = memoLevel === level ? 0 : level;
      setMemorizationLevel(surahNum, ayahNumber, nextLevel);
      setMemoLevel(nextLevel);
      window.dispatchEvent(
        new CustomEvent("quran-memorization-updated", {
          detail: { surah: surahNum, ayah: ayahNumber, level: nextLevel },
        }),
      );
    },
    [ayahNumber, memoLevel, surahNum],
  );

  return { memoLevel, updateMemoLevel };
}
