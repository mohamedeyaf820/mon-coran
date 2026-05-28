import React from "react";
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

  return (
    <div
      className="reciter-detail relative w-full max-w-5xl rounded-3xl border border-border/80 bg-bg-card/90 shadow-[0_25px_60px_rgba(0,0,0,0.35)] p-5 sm:p-7 overflow-hidden backdrop-blur-2xl animate-fadeInScale max-h-[90vh] flex flex-col"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reciter-modal-title"
      ref={dialogRef}
    >
      <div className="reciter-detail__accent absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[var(--primary)] to-transparent opacity-60" aria-hidden="true" />
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[rgba(var(--primary-rgb),0.04)] to-transparent pointer-events-none rounded-t-3xl" aria-hidden="true" />

      <button
        className={cn(
          "reciter-detail__close absolute top-4 z-10 flex items-center justify-center w-8 h-8 rounded-full border border-border bg-bg-card/85 text-text-muted hover:text-red-500 hover:border-red-200 active:scale-95 transition-all duration-200",
          isRtl ? "left-4" : "right-4",
        )}
        type="button"
        onClick={onClose}
        ref={closeBtnRef}
        aria-label={lang === "fr" ? "Fermer" : lang === "ar" ? "إغلاق" : "Close"}
      >
        <i className="fas fa-xmark text-sm" />
      </button>

      <div className="reciter-detail__header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
        <ReciterHero reciter={reciter} lang={lang} />

        <div className="flex items-center shrink-0 self-start sm:self-center">
          <ReciterRadioButton lang={lang} onClick={() => onPlayRadio(reciter)} />
        </div>
      </div>

      <div className="reciter-detail__bio my-4 p-4 rounded-2xl bg-[rgba(var(--primary-rgb),0.02)] border border-[rgba(var(--primary-rgb),0.05)] text-text-secondary leading-relaxed">
        <ReciterBioCollapse lang={lang} text={reciter?.bio} />

        {!canDirectDownload && (
          <p className="text-[0.7rem] text-text-muted font-semibold mt-2 flex items-center gap-1.5 opacity-75">
            <i className="fas fa-circle-info text-amber-500" />
            {lang === "fr"
              ? "Téléchargement direct non disponible pour ce serveur."
              : lang === "ar"
                ? "التنزيل المباشر غير متاح لهذا القارئ."
                : "Direct download is not supported for this reciter."}
          </p>
        )}
      </div>

      <div className="reciter-detail__section-title flex items-center gap-2 mb-3">
        <i className="fas fa-music text-xs text-[var(--primary)]" />
        <h4 className="font-[var(--font-ui)] text-xs font-bold text-text-muted uppercase tracking-wider">
          {lang === "fr" ? "Récitations par sourate" : lang === "ar" ? "تلاوات السور" : "Surah recitations"}
        </h4>
      </div>

      <div className="reciter-detail__list flex-1 overflow-y-auto min-h-0 pr-1">
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
