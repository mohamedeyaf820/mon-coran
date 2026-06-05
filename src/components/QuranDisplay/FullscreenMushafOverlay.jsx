import React from "react";
import { getSurah, toAr } from "../../data/surahs";
import { t } from "../../i18n";

export default function FullscreenMushafOverlay({
  ayahs,
  currentPage,
  currentPlayingAyah,
  currentSurah,
  fullPage,
  lang,
  onClose,
  riwaya,
}) {
  if (!fullPage) return null;

  return (
    <div
      className="mfp-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={lang === "fr" ? "Vue pleine page" : "Full page view"}
    >
      <div className="mfp-page-container" onClick={(event) => event.stopPropagation()}>
        <button className="mfp-close-btn" onClick={onClose} aria-label="Fermer">
          <i className="fas fa-times" />
        </button>
        <div className="mfp-page-header">
          <div className="mfp-page-header__top">
            <span className="mfp-page-chip">
              {riwaya === "warsh"
                ? lang === "ar"
                  ? "\u0648\u0631\u0634"
                  : "Warsh"
                : lang === "ar"
                  ? "\u062d\u0641\u0635"
                  : "Hafs"}
            </span>
            <span className="mfp-page-chip">
              {t("quran.page", lang)} {lang === "ar" ? toAr(currentPage) : currentPage}
            </span>
          </div>
          <span className="mfp-bismillah">{"\ufdfd"}</span>
          <span className="mfp-surah-label">{getSurah(currentSurah)?.ar}</span>
        </div>
        <div className="mfp-content-area" dir="rtl">
          {ayahs.map((ayah) => (
            <React.Fragment key={ayah.number || ayah.numberInSurah}>
              <span
                className={
                  currentPlayingAyah?.ayah === ayah.numberInSurah &&
                  currentPlayingAyah?.surah === currentSurah
                    ? "mfp-playing"
                    : ""
                }
              >
                {ayah.text || ""}
              </span>{" "}
              <span className="mfp-ayah-num">
                {"\ufd3f"}
                {ayah.numberInSurah}
                {"\ufd3e"}
              </span>{" "}
            </React.Fragment>
          ))}
        </div>
        <div className="mfp-footer-bar">
          <span className="mfp-footer-text">
            {getSurah(currentSurah)
              ? lang === "fr"
                ? getSurah(currentSurah).fr
                : getSurah(currentSurah).en
              : ""}
            {" \u00b7 "}
            {ayahs.length} {lang === "fr" ? "versets" : "ayahs"}
          </span>
          <span className="mfp-footer-text mfp-footer-text--muted">MushafPlus</span>
        </div>
      </div>
    </div>
  );
}
