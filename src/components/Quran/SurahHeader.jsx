import React from "react";
import { getSurah, toAr } from "../../data/surahs";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";
import { useAppState } from "../../context/AppContext";

/**
 * SurahHeader component â€“ renders the decorative header for each surah.
 */
const SurahHeader = React.memo(function SurahHeader({ surahNum, lang }) {
  const { theme } = useAppState();
  const s = getSurah(surahNum);
  if (!s) return null;

  const surahLabel = lang === "ar" ? toAr(surahNum) : surahNum;
  const isMeccan = s.type === "Meccan";
  const isDarkTheme = theme === "dark";
  
  // Format surah number to 3 digits (e.g. 1 -> 001) for the calligraphy font
  const paddedId = String(surahNum).padStart(3, "0");
  const primaryName = lang === "fr" ? s.fr || s.en : s.en;
  const secondaryName =
    lang === "fr" && s.en && s.en !== primaryName ? s.en : null;

  return (
    <div
      className={cn(
        "qc-surah-header relative mb-2 flex flex-col items-center overflow-hidden border-b border-[var(--border)] px-4 pb-6 pt-8 text-center",
        "bg-[radial-gradient(circle_at_50%_-10%,rgba(var(--primary-rgb),0.1)_0%,transparent_52%),radial-gradient(circle_at_50%_115%,rgba(var(--primary-rgb),0.06)_0%,transparent_50%),linear-gradient(175deg,color-mix(in_srgb,var(--bg-primary)_84%,var(--primary)_16%)_0%,var(--bg-primary)_45%,color-mix(in_srgb,var(--bg-secondary)_74%,var(--primary)_26%)_100%)]",
        "before:pointer-events-none before:absolute before:inset-0 before:z-0 before:bg-[radial-gradient(circle,rgba(var(--primary-rgb),0.045)_1.5px,transparent_1.5px)] before:bg-[length:22px_22px]",
        "after:absolute after:left-0 after:right-0 after:top-0 after:h-[3px] after:bg-[linear-gradient(90deg,transparent_0%,rgba(var(--primary-rgb),0.1)_15%,var(--primary)_50%,rgba(var(--primary-rgb),0.1)_85%,transparent_100%)]",
        isMeccan &&
          "after:bg-[linear-gradient(90deg,transparent_0%,rgba(234,179,8,0.15)_15%,rgb(234,179,8)_50%,rgba(234,179,8,0.15)_85%,transparent_100%)]",
      )}
      data-surah-type={isMeccan ? "meccan" : "medinan"}
    >
      <div className="qc-header-top relative z-[1] mb-3">
        <span
          className={cn(
            "qc-header-num relative z-[1] inline-flex h-[38px] min-w-[38px] items-center justify-center rounded-full border px-[0.7rem]",
            "font-ui text-sm font-bold shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.05)]",
            isMeccan
              ? "border-[rgba(234,179,8,0.35)] bg-[rgba(234,179,8,0.08)] text-[rgb(234,179,8)] shadow-[0_0_0_4px_rgba(234,179,8,0.06)]"
              : "border-[rgba(var(--primary-rgb),0.22)] bg-[rgba(var(--primary-rgb),0.08)] text-[var(--primary)]",
          )}
        >
          {surahLabel}
        </span>
      </div>

      <div
        className={cn(
          "qc-sh-parchment relative z-[1] mb-4 inline-block min-w-[260px] max-w-[360px] rounded-[12px] px-8 pb-[14px] pt-4",
          isDarkTheme
            ? "border-[rgba(200,152,14,0.3)] bg-[linear-gradient(135deg,#1a180c_0%,#201c0e_50%,#1c1a0a_100%)] shadow-[0_4px_20px_rgba(200,152,14,0.08),inset_0_1px_0_rgba(255,255,255,0.04)]"
            : isMeccan
              ? "border-[#5c3500] bg-[linear-gradient(155deg,#fdf5d5_0%,#f2e4a0_48%,#faf0cc_100%)] shadow-[0_4px_20px_rgba(184,134,11,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]"
              : "border-[rgba(184,134,11,0.4)] bg-[linear-gradient(135deg,#f9f5e8_0%,#f6f0d8_50%,#ede3c0_100%)] shadow-[0_4px_20px_rgba(184,134,11,0.12),inset_0_1px_0_rgba(255,255,255,0.6)]",
        )}
      >
        <div
          className={cn(
            "qc-surah-calligraphy mb-1 text-center text-[2.8rem] leading-[1.4]",
            isDarkTheme ? "text-[#e8d8a0]" : "text-[#2c1a00]",
          )}
          style={{ fontFamily: "'surahnames', serif", direction: "rtl" }}
          aria-label={s.ar}
        >
          {paddedId}
        </div>
      </div>

      <div className="qc-header-meta relative z-[1] flex flex-col items-center gap-1.5">
        <span className="qc-header-name-en font-ui text-[1.05rem] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
          {primaryName}
        </span>
        {secondaryName && (
          <span className="qc-header-name-lat font-ui text-[0.8rem] italic text-[var(--text-tertiary)]">
            {secondaryName}
          </span>
        )}
        <div className="qc-header-details flex items-center gap-2">
          <span
            className={cn(
              "qc-sh-type-pill rounded-[20px] border px-[10px] py-[3px] font-ui text-[0.7rem] font-semibold uppercase tracking-[0.08em]",
              isMeccan
                ? "border-[rgba(234,179,8,0.3)] bg-[rgba(234,179,8,0.1)] text-[rgb(234,179,8)]"
                : "border-[rgba(16,90,48,0.2)] bg-[var(--emerald-tint)] text-[var(--emerald)]",
            )}
          >
            {isMeccan ? t("quran.meccan", lang) : t("quran.medinan", lang)}
          </span>
          <span className="qc-sh-detail-sep text-[0.8rem] text-[var(--text-muted)]">
            {"\u00b7"}
          </span>
          <span className="qc-sh-ayah-count font-ui text-[0.75rem] font-medium text-[var(--text-tertiary)]">
            {s.ayahs} {t("quran.ayahs", lang)}
          </span>
        </div>
      </div>
    </div>
  );
});

export default SurahHeader;
