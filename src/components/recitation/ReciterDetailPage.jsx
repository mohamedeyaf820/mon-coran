import React from "react";
import { X, List, Book, User, Info } from "lucide-react";
import "../../styles/domains/recitation-polish.css";
import ReciterHero from "./ReciterHero";
import ReciterBioCollapse from "./ReciterBioCollapse";
import ReciterRadioButton from "./ReciterRadioButton";
import SurahRecitationList from "./SurahRecitationList";
import { cn } from "../../lib/utils";

export default function ReciterDetailPage({
  lang,
  reciter,
  canDirectDownload,
  onPlayRadio,
  onClose,
  onPlaySurah,
  onOpenSurah,
  getDownloadUrl,
  dialogRef,
  closeBtnRef,
}) {
  const isRtl = lang === "ar";
  const riwayaLabel = reciter.verifiedWarsh
    ? "Warsh"
    : lang === "ar"
      ? "حفص"
      : "Hafs";
  const audioModeLabel =
    reciter.audioMode === "surah"
      ? lang === "fr"
        ? "Sourate complète"
        : lang === "ar"
          ? "سورة كاملة"
          : "Full surah"
      : lang === "fr"
        ? "Verset par verset"
        : lang === "ar"
          ? "آية بآية"
          : "Ayah by ayah";

  return (
    <div
      className="reciter-detail relative flex max-h-[92dvh] w-full max-w-2xl min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-bg-card shadow-2xl animate-fadeInScale"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reciter-modal-title"
      ref={dialogRef}
    >
      <div className="rd-sticky-head relative px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
        <button
          className={cn(
            "absolute top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-bg-secondary text-text-muted transition-all hover:bg-red-50 hover:text-red-500 active:scale-95",
            isRtl ? "left-3" : "right-3",
          )}
          type="button"
          onClick={onClose}
          ref={closeBtnRef}
          aria-label={
            lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"
          }
        >
          <X size={14} />
        </button>

        <ReciterHero reciter={reciter} lang={lang} />

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ReciterRadioButton lang={lang} onClick={() => onPlayRadio(reciter)} />
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-bg-secondary/70 px-3 py-2 text-[0.72rem] font-semibold text-text-muted">
            <List size={10} />
            {audioModeLabel}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-bg-secondary/70 px-3 py-2 text-[0.72rem] font-semibold text-text-muted">
            <Book size={10} />
            {riwayaLabel}
          </span>
        </div>
      </div>

      <div className="rd-scrollable-body px-5 pb-5 sm:px-6 sm:pb-6">
        <div className="reciter-detail__bio mb-5 rounded-xl border border-border bg-bg-secondary/50 p-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">
            <User size={10} className="text-primary" />
            {lang === "fr"
              ? "Biographie"
              : lang === "ar"
                ? "السيرة الذاتية"
                : "Biography"}
          </h4>
          <div className="text-[0.84rem] leading-relaxed text-text-secondary">
            <ReciterBioCollapse lang={lang} reciter={reciter} />
          </div>

          {!canDirectDownload && (
            <p className="mt-3 flex items-center gap-1.5 text-[0.7rem] text-text-muted">
              <Info size={10} className="text-amber-500" />
              {lang === "fr"
                ? "Téléchargement direct non disponible."
                : lang === "ar"
                  ? "التنزيل المباشر غير متاح."
                  : "Direct download not available."}
            </p>
          )}
        </div>

        <div className="mb-3 flex items-center gap-2">
          <h4 className="text-[0.76rem] font-semibold text-text-muted">
            {lang === "fr"
              ? "Recitations par sourate"
              : lang === "ar"
                ? "تلاوات السور"
                : "Surah recitations"}
          </h4>
          <div className="h-px flex-1 bg-border" />
        </div>

        <SurahRecitationList
          lang={lang}
          reciter={reciter}
          getDownloadUrl={getDownloadUrl}
          onPlaySurah={onPlaySurah}
          onOpenSurah={onOpenSurah}
        />
      </div>
    </div>
  );
}
