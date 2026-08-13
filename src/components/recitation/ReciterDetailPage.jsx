import React from "react";
import {
  BookOpen,
  Headphones,
  ImageIcon,
  ListMusic,
  RadioTower,
  UserRound,
  X,
} from "lucide-react";
import "../../styles/recitationStyles.js";
import ReciterHero from "./ReciterHero";
import ReciterBioCollapse from "./ReciterBioCollapse";
import ReciterRadioButton from "./ReciterRadioButton";
import SurahRecitationList from "./SurahRecitationList";
import FullQuranDownloadCard from "./FullQuranDownloadCard";
import { cn } from "../../lib/utils";
import {
  getReciterProfileSource,
  getReciterSourceInfo,
  getReciterVisual,
} from "../../data/reciters";
import {
  preloadReciterProfiles,
  useReciterProfile,
} from "../../hooks/useReciterProfile";

export function preloadReciterDetailData() {
  return preloadReciterProfiles();
}

function labelFor(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

export default function ReciterDetailPage({
  lang,
  reciter,
  onPlayRadio,
  onClose,
  onPlaySurah,
  onOpenSurah,
  onOpenSurahIntent,
  dialogRef,
  closeBtnRef,
}) {
  const isRtl = lang === "ar";
  const sourceInfo = getReciterSourceInfo(reciter);
  const visual = getReciterVisual(reciter);
  const researchedProfile = useReciterProfile(reciter?.id);
  const biographySource =
    researchedProfile?.bioSource || getReciterProfileSource(reciter);
  const profileSources = researchedProfile?.verificationSources?.length
    ? researchedProfile.verificationSources
    : biographySource
      ? [biographySource]
      : [];
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
          <X className="recitation-icon recitation-icon--md" size={18} aria-hidden="true" />
        </button>

        <span className="reciter-detail__eyebrow">
          <Headphones className="recitation-icon recitation-icon--xs" size={13} aria-hidden="true" />
          {labelFor(lang, "Bibliothèque audio", "Audio library", "المكتبة الصوتية")}
        </span>

        <ReciterHero reciter={reciter} lang={lang} />

        <div className="reciter-detail__quick-actions">
          <ReciterRadioButton lang={lang} onClick={() => onPlayRadio(reciter)} />
          <span className="reciter-detail__meta-pill">
            <ListMusic className="recitation-icon recitation-icon--xs" size={13} aria-hidden="true" />
            {audioModeLabel}
          </span>
          <span className="reciter-detail__meta-pill reciter-detail__meta-pill--riwaya">
            <BookOpen className="recitation-icon recitation-icon--xs" size={13} aria-hidden="true" />
            {riwayaLabel}
          </span>
        </div>
      </header>

      <div className="rd-scrollable-body reciter-detail__layout">
        <aside className="reciter-detail__aside">
          <div className="reciter-detail__bio">
            <h3>
              <UserRound className="recitation-icon recitation-icon--sm" size={14} aria-hidden="true" />
              {labelFor(lang, "À propos du récitateur", "About the reciter", "عن القارئ")}
            </h3>
            <ReciterBioCollapse lang={lang} reciter={reciter} />
          </div>

          <section
            className="reciter-detail__sources"
            aria-label={labelFor(lang, "Sources", "Sources", "المصادر")}
          >
            <h3>
              <BookOpen className="recitation-icon recitation-icon--sm" size={14} aria-hidden="true" />
              {labelFor(lang, "Sources vérifiées", "Verified sources", "المصادر المتحققة")}
            </h3>
            <div className="reciter-detail__source-links">
              {profileSources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  title={source.url}
                >
                  {source.provider}
                </a>
              ))}
            </div>
            {sourceInfo ? (
              <div className="reciter-detail__source-row">
                <RadioTower className="recitation-icon recitation-icon--sm" size={14} aria-hidden="true" />
                <span>{labelFor(lang, "Source audio", "Audio source", "مصدر الصوت")}</span>
                <strong>{sourceInfo.label}</strong>
              </div>
            ) : null}
            {visual.attribution ? (
              <div className="reciter-detail__source-row">
                <ImageIcon className="recitation-icon recitation-icon--sm" size={14} aria-hidden="true" />
                <span>{labelFor(lang, "Portrait", "Portrait", "الصورة")}</span>
                <a
                  href={visual.attribution.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {visual.attribution.provider}
                </a>
              </div>
            ) : null}
          </section>

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
            <ListMusic className="recitation-icon recitation-icon--md" size={18} aria-hidden="true" />
          </div>

          <FullQuranDownloadCard
            lang={lang}
            reciter={reciter}
            riwaya={reciter.verifiedWarsh ? "warsh" : "hafs"}
          />

          <SurahRecitationList
            lang={lang}
            reciter={reciter}
            onPlaySurah={onPlaySurah}
            onOpenSurah={onOpenSurah}
            onOpenSurahIntent={onOpenSurahIntent}
          />
        </main>
      </div>
    </div>
  );
}
