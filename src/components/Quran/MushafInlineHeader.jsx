import React from "react";
import { toAr } from "../../data/surahs";

export default function MushafInlineHeader({
  ayahCountLabel,
  basmalaTranslation,
  currentJuz,
  displayName,
  isQCF4,
  juzNum,
  juzNumEnd,
  lang,
  pageStart,
  revelBadge,
  showBasmala,
  surahNameAr,
}) {
  return (
    <>
      <div className="mp-header" dir="rtl">
        <div className="mp-header-side">
          <span className="mp-header-label">{lang === "ar" ? "\u062c\u0632\u0621" : "Juz"}</span>
          <span className="mp-header-value">
            {lang === "ar" ? toAr(juzNum) : juzNum}
            {juzNumEnd !== juzNum ? (
              <span className="mp-header-value-end">
                {" - "}
                {lang === "ar" ? toAr(juzNumEnd) : juzNumEnd}
              </span>
            ) : null}
          </span>
        </div>
        <div className="mp-header-center">
          <span className="mp-ornament" aria-hidden="true">
            {"\ufd3e"}
          </span>
          <div className="mp-surah-title">
            <span className="mp-surah-name-ar" dir="rtl">
              {"\u0633\u064f\u0648\u0631\u064e\u0629\u064f"} {surahNameAr}
            </span>
            {lang !== "ar" && displayName !== surahNameAr ? (
              <span className="mp-surah-name-tr">{displayName}</span>
            ) : null}
          </div>
          <span className="mp-ornament" aria-hidden="true">
            {"\ufd3f"}
          </span>
        </div>
        <div className="mp-header-side mp-header-side--end">
          <span className="mp-header-label">{revelBadge}</span>
          <span className="mp-header-value">
            {lang === "ar" ? toAr(ayahCountLabel) : ayahCountLabel}{" "}
            <span className="mp-header-label">
              {lang === "ar" ? "\u0622\u064a\u0629" : "v."}
            </span>
          </span>
        </div>
      </div>
      {showBasmala ? (
        <div className="mp-basmala-wrap">
          <div className="mp-basmala" dir="rtl" aria-label="Basmala">
            {isQCF4
              ? "\ufdfd"
              : "\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650"}
          </div>
          {basmalaTranslation ? (
            <div className="mp-basmala-translation">{basmalaTranslation}</div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
