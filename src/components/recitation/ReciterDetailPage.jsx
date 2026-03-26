import React from "react";
import ReciterHero from "./ReciterHero";
import ReciterBioCollapse from "./ReciterBioCollapse";
import ReciterRadioButton from "./ReciterRadioButton";
import SurahRecitationList from "./SurahRecitationList";

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
  return (
    <div
      className="hp2-panel w-full max-w-5xl rounded-3xl border p-4"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reciter-modal-title"
      ref={dialogRef}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <ReciterHero reciter={reciter} lang={lang} />
          <ReciterBioCollapse lang={lang} text={reciter?.bio || reciter?.nameEn} />
          {!canDirectDownload && (
            <p className="text-xs opacity-70">{lang === "fr" ? "Telechargement direct indisponible pour ce recitateur" : lang === "ar" ? "التنزيل المباشر غير متاح لهذا القارئ" : "Direct download unavailable for this reciter"}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <ReciterRadioButton lang={lang} onClick={() => onPlayRadio(reciter)} />
          <button className="hp2-icon-btn" type="button" onClick={onClose} ref={closeBtnRef}><i className="fas fa-xmark" /></button>
        </div>
      </div>
      <SurahRecitationList
        lang={lang}
        reciter={reciter}
        getDownloadUrl={getDownloadUrl}
        onPlaySurah={onPlaySurah}
        onOpenSurah={onOpenSurah}
      />
    </div>
  );
}
