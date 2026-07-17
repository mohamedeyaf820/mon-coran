import React from "react";
import {
  BookOpen,
  Headphones,
  ImageIcon,
  Info,
  ListMusic,
  RadioTower,
  UserRound,
  X,
} from "lucide-react";
import "../../styles/domains/recitation-polish.css";
import "../../styles/reciter-enhanced.css";
import ReciterHero from "./ReciterHero";
import ReciterBioCollapse from "./ReciterBioCollapse";
import ReciterRadioButton from "./ReciterRadioButton";
import SurahRecitationList from "./SurahRecitationList";
import { cn } from "../../lib/utils";
import { getReciterSourceInfo, getReciterVisual } from "../../data/reciters";

function labelFor(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

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
  const sourceInfo = getReciterSourceInfo(reciter);
  const visual = getReciterVisual(reciter);
  const riwayaLabel = reciter.verifiedWarsh ? "Warsh" : isRtl ? "حفص" : "Hafs";
  const audioModeLabel =
    reciter.audioMode === "surah"
      ? labelFor(lang, "Sourate complète", "Full surah", "سورة كاملة")
      : labelFor(lang, "Verset par verset", "Ayah by ayah", "آية بآية");

  return (
    <div
      className="reciter-detail"
      onClick={(event) => event.stopPropagation()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reciter-modal-title"
      ref={dialogRef}
      dir={isRtl ? "rtl" : "ltr"}
    >
      <div className="reciter-detail__accent" aria-hidden="true" />

      <header className="rd-sticky-head">
        <button
          className={cn("reciter-detail__close", isRtl ? "is-rtl" : "")}
          type="button"
          onClick={onClose}
          ref={closeBtnRef}
          aria-label={labelFor(lang, "Fermer", "Close", "إغلاق")}
        >
          <X size={18} aria-hidden="true" />
        </button>

        <span className="reciter-detail__eyebrow">
          <Headphones size={13} aria-hidden="true" />
          {labelFor(lang, "Bibliothèque audio", "Audio library", "المكتبة الصوتية")}
        </span>

        <ReciterHero reciter={reciter} lang={lang} />

        <div className="reciter-detail__quick-actions">
          <ReciterRadioButton lang={lang} onClick={() => onPlayRadio(reciter)} />
          <span className="reciter-detail__meta-pill">
            <ListMusic size={13} aria-hidden="true" />
            {audioModeLabel}
          </span>
          <span className="reciter-detail__meta-pill reciter-detail__meta-pill--riwaya">
            <BookOpen size={13} aria-hidden="true" />
            {riwayaLabel}
          </span>
        </div>
      </header>

      <div className="rd-scrollable-body reciter-detail__layout">
        <aside className="reciter-detail__aside">
          <div className="reciter-detail__bio">
            <h3>
              <UserRound size={14} aria-hidden="true" />
              {labelFor(lang, "À propos du récitateur", "About the reciter", "عن القارئ")}
            </h3>
            <ReciterBioCollapse lang={lang} reciter={reciter} />
          </div>

          <section
            className="reciter-detail__sources"
            aria-label={labelFor(lang, "Sources", "Sources", "المصادر")}
          >
            {sourceInfo ? (
              <div className="reciter-detail__source-row">
                <RadioTower size={14} aria-hidden="true" />
                <span>{labelFor(lang, "Source audio", "Audio source", "مصدر الصوت")}</span>
                <strong>{sourceInfo.label}</strong>
              </div>
            ) : null}
            {visual.attribution ? (
              <div className="reciter-detail__source-row">
                <ImageIcon size={14} aria-hidden="true" />
                <span>{labelFor(lang, "Portrait", "Portrait", "الصورة")}</span>
                <strong>{visual.attribution.provider}</strong>
              </div>
            ) : null}
          </section>

          {!canDirectDownload ? (
            <p className="reciter-detail__notice">
              <Info size={14} aria-hidden="true" />
              {labelFor(
                lang,
                "Le téléchargement direct n’est pas disponible pour cette source.",
                "Direct download is unavailable for this source.",
                "التنزيل المباشر غير متاح لهذا المصدر.",
              )}
            </p>
          ) : null}
        </aside>

        <main className="reciter-detail__library">
          <div className="reciter-detail__section-heading">
            <div>
              <span>{labelFor(lang, "114 sourates", "114 surahs", "١١٤ سورة")}</span>
              <h3>
                {labelFor(
                  lang,
                  "Choisir une récitation",
                  "Choose a recitation",
                  "اختر تلاوة",
                )}
              </h3>
            </div>
            <ListMusic size={18} aria-hidden="true" />
          </div>

          <SurahRecitationList
            lang={lang}
            reciter={reciter}
            getDownloadUrl={getDownloadUrl}
            onPlaySurah={onPlaySurah}
            onOpenSurah={onOpenSurah}
          />
        </main>
      </div>
    </div>
  );
}
