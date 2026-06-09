import React from "react";
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
      {/* ── Sticky head ── */}
      <div className="rd-sticky-head relative px-5 pt-5 pb-4 sm:px-6 sm:pt-6">
        {/* Close button */}
        <button
          className={cn(
            "absolute top-3 z-20 flex items-center justify-center w-8 h-8 rounded-full bg-bg-secondary text-text-muted hover:text-red-500 hover:bg-red-50 active:scale-95 transition-all",
            isRtl ? "left-3" : "right-3",
          )}
          type="button"
          onClick={onClose}
          ref={closeBtnRef}
          aria-label={
            lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"
          }
        >
          <i className="fas fa-xmark text-sm" />
        </button>

        {/* Hero: avatar + name + badges */}
        <ReciterHero reciter={reciter} lang={lang} />

        {/* Radio button + audio mode tag */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <ReciterRadioButton
            lang={lang}
            onClick={() => onPlayRadio(reciter)}
          />
          <span className="inline-flex items-center gap-1.5 text-[0.72rem] font-medium text-text-muted">
            <i className="fas fa-list-ul text-[0.6rem]" />
            {audioModeLabel}
          </span>
        </div>
      </div>

      {/* ── Scrollable body ── */}
      <div className="rd-scrollable-body px-5 pb-5 sm:px-6 sm:pb-6">
        {/* Biography */}
        <div className="reciter-detail__bio mb-5 rounded-xl border border-border bg-bg-secondary/50 p-4">
          <h4 className="mb-2 flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-text-muted">
            <i className="fas fa-user text-[0.58rem] text-primary" />
            {lang === "fr" ? "Biographie" : lang === "ar" ? "السيرة الذاتية" : "Biography"}
          </h4>
          <div className="text-[0.84rem] leading-relaxed text-text-secondary">
            <ReciterBioCollapse
              lang={lang}
              reciter={reciter}
            />
          </div>

          {!canDirectDownload && (
            <p className="mt-3 flex items-center gap-1.5 text-[0.7rem] text-text-muted">
              <i className="fas fa-circle-info text-amber-500 text-[0.6rem]" />
              {lang === "fr"
                ? "Téléchargement direct non disponible."
                : lang === "ar"
                  ? "التنزيل المباشر غير متاح."
                  : "Direct download not available."}
            </p>
          )}
        </div>

        {/* Section heading */}
        <div className="mb-3 flex items-center gap-2">
          <h4 className="text-[0.76rem] font-semibold text-text-muted">
            {lang === "fr"
              ? "Récitations par sourate"
              : lang === "ar"
                ? "تلاوات السور"
                : "Surah recitations"}
          </h4>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Surah recitation list */}
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
