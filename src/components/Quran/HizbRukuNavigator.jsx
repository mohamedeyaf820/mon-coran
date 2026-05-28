import React from "react";
import { cn } from "../../lib/utils";
import { getHizbForAyah, getHizbForPage, getNextSajdah, getPrevSajdah, SAJDAH_DATA } from "../../data/juz";

/** Module-level constant — avoids recreation on every click/render */
const HIZB_DATA = [
  { hizb: 1, surah: 1, ayah: 1 },
  { hizb: 2, surah: 2, ayah: 26 },
  { hizb: 3, surah: 2, ayah: 142 },
  { hizb: 4, surah: 2, ayah: 203 },
  { hizb: 5, surah: 2, ayah: 253 },
  { hizb: 6, surah: 3, ayah: 15 },
  { hizb: 7, surah: 3, ayah: 93 },
  { hizb: 8, surah: 3, ayah: 171 },
  { hizb: 9, surah: 4, ayah: 24 },
  { hizb: 10, surah: 4, ayah: 88 },
  { hizb: 11, surah: 4, ayah: 148 },
  { hizb: 12, surah: 5, ayah: 27 },
  { hizb: 13, surah: 5, ayah: 82 },
  { hizb: 14, surah: 6, ayah: 36 },
  { hizb: 15, surah: 6, ayah: 111 },
  { hizb: 16, surah: 7, ayah: 31 },
  { hizb: 17, surah: 7, ayah: 88 },
  { hizb: 18, surah: 7, ayah: 171 },
  { hizb: 19, surah: 8, ayah: 41 },
  { hizb: 20, surah: 9, ayah: 33 },
  { hizb: 21, surah: 9, ayah: 93 },
  { hizb: 22, surah: 10, ayah: 26 },
  { hizb: 23, surah: 11, ayah: 6 },
  { hizb: 24, surah: 11, ayah: 83 },
  { hizb: 25, surah: 12, ayah: 53 },
  { hizb: 26, surah: 13, ayah: 35 },
  { hizb: 27, surah: 15, ayah: 1 },
  { hizb: 28, surah: 16, ayah: 51 },
  { hizb: 29, surah: 17, ayah: 1 },
  { hizb: 30, surah: 17, ayah: 99 },
  { hizb: 31, surah: 18, ayah: 75 },
  { hizb: 32, surah: 19, ayah: 59 },
  { hizb: 33, surah: 21, ayah: 1 },
  { hizb: 34, surah: 22, ayah: 1 },
  { hizb: 35, surah: 23, ayah: 1 },
  { hizb: 36, surah: 24, ayah: 21 },
  { hizb: 37, surah: 25, ayah: 21 },
  { hizb: 38, surah: 26, ayah: 111 },
  { hizb: 39, surah: 27, ayah: 56 },
  { hizb: 40, surah: 28, ayah: 51 },
  { hizb: 41, surah: 29, ayah: 46 },
  { hizb: 42, surah: 31, ayah: 22 },
  { hizb: 43, surah: 33, ayah: 31 },
  { hizb: 44, surah: 34, ayah: 24 },
  { hizb: 45, surah: 36, ayah: 28 },
  { hizb: 46, surah: 37, ayah: 145 },
  { hizb: 47, surah: 39, ayah: 32 },
  { hizb: 48, surah: 40, ayah: 41 },
  { hizb: 49, surah: 41, ayah: 47 },
  { hizb: 50, surah: 45, ayah: 33 },
  { hizb: 51, surah: 46, ayah: 1 },
  { hizb: 52, surah: 48, ayah: 18 },
  { hizb: 53, surah: 51, ayah: 31 },
  { hizb: 54, surah: 54, ayah: 28 },
  { hizb: 55, surah: 58, ayah: 1 },
  { hizb: 56, surah: 61, ayah: 1 },
  { hizb: 57, surah: 67, ayah: 1 },
  { hizb: 58, surah: 71, ayah: 11 },
  { hizb: 59, surah: 78, ayah: 1 },
  { hizb: 60, surah: 87, ayah: 1 },
];

/**
 * HizbRukuNavigator - Quick navigation to Hizb and Sajdah positions
 * Similar to Quran.com's verse navigation
 */
export function HizbRukuNavigator({
  currentSurah,
  currentAyah,
  currentPage,
  onNavigate,
  className,
}) {
  const currentHizb = currentPage
    ? getHizbForPage(currentPage)
    : getHizbForAyah(currentSurah, currentAyah);

  const nextSajdah = getNextSajdah(currentSurah, currentAyah);
  const prevSajdah = getPrevSajdah(currentSurah, currentAyah);

  const handleHizbClick = () => {
    const nextHizb = currentHizb >= 60 ? 1 : currentHizb + 1;
    const hizbInfo = HIZB_DATA[nextHizb - 1];
    if (hizbInfo && onNavigate) {
      onNavigate({ surah: hizbInfo.surah, ayah: hizbInfo.ayah });
    }
  };

  const handleNextSajdah = () => {
    if (nextSajdah && onNavigate) {
      onNavigate({ surah: nextSajdah.surah, ayah: nextSajdah.ayah });
    }
  };

  const handlePrevSajdah = () => {
    if (prevSajdah && onNavigate) {
      onNavigate({ surah: prevSajdah.surah, ayah: prevSajdah.ayah });
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs text-muted-foreground shrink-0 whitespace-nowrap",
        className
      )}
    >
      {/* Current Hizb Badge */}
      <button
        onClick={handleHizbClick}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-medium transition-colors shrink-0 whitespace-nowrap"
        title="Aller au prochain Hizb"
      >
        <i className="fas fa-bookmark text-[10px]" />
        <span>Hizb {currentHizb}/60</span>
      </button>

      {/* Sajdah Navigation */}
      <div className="flex items-center gap-1 shrink-0">
        {prevSajdah && (
          <button
            onClick={handlePrevSajdah}
            className="p-1.5 rounded-full hover:bg-accent transition-colors shrink-0"
            title={`Sajdah précédent: S${prevSajdah.surah}:A${prevSajdah.ayah}`}
          >
            <i className="fas fa-arrow-left text-[10px]" />
          </button>
        )}

        <span className="px-2.5 py-1 rounded-full bg-secondary/50 text-[10px] font-medium whitespace-nowrap shrink-0">
          Sajdah {SAJDAH_DATA.findIndex(
            (r) => r.surah === currentSurah && r.ayah === currentAyah
          ) + 1 || "-"}
          /{SAJDAH_DATA.length}
        </span>

        {nextSajdah && (
          <button
            onClick={handleNextSajdah}
            className="p-1.5 rounded-full hover:bg-accent transition-colors shrink-0"
            title={`Sajdah suivant: S${nextSajdah.surah}:A${nextSajdah.ayah}`}
          >
            <i className="fas fa-arrow-right text-[10px]" />
          </button>
        )}
      </div>
    </div>
  );
}

export default HizbRukuNavigator;
