import { memo } from "react";
import { Play, Pause } from "lucide-react";
import { cn } from "../../lib/utils";
import { getSurahLigature, toAr } from "../../data/surahs";
import {
  normalizeLatinSurahName,
  getSurahEnglishMeaning,
  TYPE_INFO,
} from "./homeConstants";
import Icon from "./HomeIcon";

/* ─── FlowerBadge ────────────────────────────────────────────────────────── */
export function FlowerBadge({ className = "" }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        fill="currentColor"
        d="M20 2.5c1.84 0 3.32 1.5 3.29 3.34-.01.87-.36 1.67-.92 2.25l-.26.26a2.8 2.8 0 0 0-.82 2v.36a2.8 2.8 0 0 0 .82 2l.26.26a3.3 3.3 0 0 1 0 4.64l-.26.26a2.8 2.8 0 0 0-.82 2v.36c0 .74.29 1.46.82 1.99l.26.26a3.3 3.3 0 0 1 0 4.64l-.26.26a2.8 2.8 0 0 0-.82 2v.36c0 1.84-1.48 3.34-3.3 3.34s-3.3-1.5-3.3-3.34v-.36a2.8 2.8 0 0 0-.82-2l-.26-.26a3.3 3.3 0 0 1 0-4.64l.26-.26a2.8 2.8 0 0 0 .82-1.99v-.36a2.8 2.8 0 0 0-.82-2l-.26-.26a3.3 3.3 0 0 1 0-4.64l.26-.26a2.8 2.8 0 0 0 .82-2v-.36a2.8 2.8 0 0 0-.82-2l-.26-.26a3.25 3.25 0 0 1-.92-2.25A3.3 3.3 0 0 1 20 2.5Zm-10.18 5.06c1.62 0 2.95 1.3 2.98 2.93.02.77-.26 1.5-.78 2.04l-.23.23a2.53 2.53 0 0 0 0 3.58l.23.23a3 3 0 0 1 0 4.2l-.23.23a2.53 2.53 0 0 0 0 3.58l.23.23a2.97 2.97 0 0 1 .78 2.04c-.03 1.62-1.36 2.94-2.98 2.94-1.64 0-2.98-1.34-2.98-3v-.32c0-.67-.26-1.31-.74-1.79l-.22-.22a2.97 2.97 0 0 1 0-4.2l.22-.22a2.53 2.53 0 0 0 0-3.58l-.22-.23a2.97 2.97 0 0 1 0-4.2l.22-.22c.48-.48.74-1.13.74-1.8v-.31c0-1.66 1.34-3 2.98-3Zm20.36 0c1.64 0 2.98 1.34 2.98 3v.31c0 .67.26 1.32.74 1.8l.22.22a2.97 2.97 0 0 1 0 4.2l-.22.23a2.53 2.53 0 0 0 0 3.58l.22.22a2.97 2.97 0 0 1 0 4.2l-.22.22a2.53 2.53 0 0 0-.74 1.79v.32c0 1.66-1.34 3-2.98 3-1.62 0-2.95-1.32-2.98-2.94a2.97 2.97 0 0 1 .78-2.04l.23-.23a2.53 2.53 0 0 0 0-3.58l-.23-.23a3 3 0 0 1 0-4.2l.23-.23a2.53 2.53 0 0 0 0-3.58l-.23-.23a2.9 2.9 0 0 1-.78-2.04c.03-1.63 1.36-2.93 2.98-2.93Z"
      />
      <circle
        cx="20"
        cy="20"
        r="9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
      />
    </svg>
  );
}

/* ─── PercentBar ─────────────────────────────────────────────────────────── */
export function PercentBar({ value }) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <svg
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
      className="block h-full w-full"
    >
      <rect
        x="0"
        y="0"
        width="100"
        height="8"
        rx="4"
        className="fill-black/5 dark:fill-white/10"
      />
      <rect
        x="0"
        y="0"
        width={pct}
        height="8"
        rx="4"
        fill="var(--primary)"
      />
    </svg>
  );
}

/* ─── SurahCard ──────────────────────────────────────────────────────────── */
export const SurahCard = memo(function SurahCard({
  surah,
  onClick,
  onIntent,
  onPlay,
  isActive,
  lang,
  isPlaying,
  viewMode,
  animIndex = 0,
}) {
  const primaryLabel = normalizeLatinSurahName(
    surah.en || surah.fr || surah.ar || "",
  );

  const secondaryLabel =
    lang === "fr"
      ? surah.fr || getSurahEnglishMeaning(surah.n)
      : lang === "ar"
        ? TYPE_INFO[surah.type]?.ar || ""
        : getSurahEnglishMeaning(surah.n);
  const ayahLabel =
    lang === "ar"
      ? `${toAr(surah.ayahs)} آية`
      : lang === "fr"
        ? `${surah.ayahs} versets`
        : `${surah.ayahs} ayahs`;
  const playAriaLabel =
    lang === "fr" ? "Écouter" : lang === "ar" ? "استماع" : "Listen";
  const openAriaLabel =
    lang === "fr"
      ? `Ouvrir la sourate ${primaryLabel}`
      : lang === "ar"
        ? `فتح سورة ${surah.ar}`
        : `Open Surah ${primaryLabel}`;
  const pageLabel =
    surah.page &&
    (lang === "ar"
      ? `صفحة ${surah.page}`
      : lang === "fr"
        ? `Page ${surah.page}`
        : `Page ${surah.page}`);

  /* ── LIST ROW ── */
  if (viewMode === "list") {
    const typeLabel =
      surah.type === "Meccan"
        ? lang === "ar"
          ? "مكية"
          : lang === "fr"
            ? "Mecquoise"
            : "Meccan"
        : lang === "ar"
          ? "مدنية"
          : lang === "fr"
            ? "Médinoise"
            : "Medinan";

    const rowVisibilityStyle = {
      contentVisibility: "auto",
      containIntrinsicSize: "82px",
    };

    return (
      <div
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-bg-primary border border-border/50 hover:bg-bg-secondary hover:border-primary/30 transition-all cursor-pointer",
          isActive && "bg-primary/5 border-primary/50",
          isPlaying && "bg-gold/5 border-gold/50",
        )}
        data-stype={surah.type?.toLowerCase()}
        style={rowVisibilityStyle}
      >
        <button
          type="button"
          className="absolute inset-0 z-[1] rounded-xl"
          onClick={() => onClick(surah.n)}
          onPointerEnter={() => onIntent?.(surah.n)}
          onFocus={() => onIntent?.(surah.n)}
          onTouchStart={() => onIntent?.(surah.n)}
          aria-label={openAriaLabel}
        />
        <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-bg-secondary text-[0.75rem] font-bold text-text-secondary border border-border/40 group-hover:text-primary group-hover:border-primary/30 transition-colors">
          {surah.n}
        </span>
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-baseline truncate">
            <span className="text-[0.95rem] font-bold text-text-primary truncate">
              {primaryLabel}
            </span>
            <span className="text-[0.75rem] text-text-secondary ml-2 truncate hidden sm:inline-block">
              {secondaryLabel}
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center px-1.5 py-0 rounded text-[0.6rem] font-semibold leading-[1.6]",
                surah.type === "Meccan"
                  ? "bg-amber-400/10 text-amber-800 dark:text-amber-300"
                  : "bg-primary/10 text-primary",
              )}
            >
              {typeLabel}
            </span>
            <span className="text-[0.7rem] text-text-muted">{ayahLabel}{pageLabel ? ` · ${pageLabel}` : ""}</span>
          </div>
        </div>
        <span
          className="text-[1.2rem] sm:text-[1.4rem] font-quran text-text-primary opacity-80 group-hover:opacity-100 transition-opacity ml-2 shrink-0"
          dir="rtl"
          lang="ar"
          aria-label={surah.ar}
        >
          <img
            src={`https://static.quran.com/images/surah/symbols/sname_${surah.n}.svg`}
            alt={surah.ar}
            className="h-8 sm:h-10 invert dark:invert-0"
            loading="lazy"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "block";
            }}
          />
          <span style={{ display: "none" }}>{surah.ar}</span>
        </span>
        <button
          className={cn(
            "relative z-[2] flex items-center justify-center w-8 h-8 rounded-full bg-bg-secondary text-text-muted hover:bg-primary hover:text-white transition-colors ml-2 shrink-0",
            isPlaying && "bg-gold text-white hover:bg-gold-bright",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onPlay(surah.n);
          }}
          aria-label={playAriaLabel}
        >
          {isPlaying ? <Pause size={13} /> : <Play size={13} className="pl-[1px]" />}
        </button>
      </div>
    );
  }

  /* ── GRID CARD ── */
  const cardVisibilityStyle = {
    contentVisibility: "auto",
    containIntrinsicSize: "112px",
  };
  const isMeccan = surah.type === "Meccan";
  const surahLigature = getSurahLigature(surah.n);

  return (
    <div
      className={cn(
        "hp-card hp-card--surah group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border bg-bg-primary shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:shadow-md overflow-hidden",
        isActive ? "border-primary/60 bg-primary/5 hover:border-primary/70" : "border-border hover:border-primary/40 hover:bg-bg-secondary",
        isPlaying && "border-gold/60 bg-gold/5 hover:border-gold/70",
      )}
      data-stype={surah.type?.toLowerCase()}
      data-testid="surah-card"
      data-surah={surah.n}
      style={cardVisibilityStyle}
    >
      <button
        type="button"
        className="hp-card-open absolute inset-0 z-[1]"
        onClick={() => onClick(surah.n)}
        onPointerEnter={() => onIntent?.(surah.n)}
        onFocus={() => onIntent?.(surah.n)}
        onTouchStart={() => onIntent?.(surah.n)}
        aria-label={openAriaLabel}
        data-testid="surah-card-open"
      />

      {/* Type indicator strip */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-[3px] rounded-l-2xl",
          isMeccan ? "bg-amber-400/70" : "bg-primary/70",
        )}
        aria-hidden="true"
      />

      {/* Surah number badge */}
      <span
        className={cn(
          "hp-card-num flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full text-[0.8rem] font-bold border transition-colors",
          isActive || isPlaying
            ? "bg-primary/10 text-primary border-primary/30"
            : "bg-bg-secondary text-text-secondary border-border/40 group-hover:text-primary group-hover:border-primary/30",
        )}
      >
        <span className="hp-card-num-inner">{surah.n}</span>
      </span>

      <div className="hp-card-content flex flex-col flex-1 min-w-0">
        <span className="hp-card-name text-[0.95rem] sm:text-[1.05rem] font-bold text-text-primary truncate leading-tight">
          {primaryLabel}
        </span>
        <span className="hp-card-meta hp-card-meta--meaning text-[0.7rem] sm:text-[0.75rem] text-text-secondary truncate mt-0.5">
          {secondaryLabel}
        </span>
        <div className="flex items-center gap-1.5 mt-1">
          <span
            className={cn(
              "inline-flex items-center px-1.5 py-0 rounded text-[0.6rem] font-semibold leading-[1.6]",
              isMeccan
                ? "bg-amber-400/10 text-amber-800 dark:text-amber-300"
                : "bg-primary/10 text-primary",
            )}
          >
            {isMeccan
              ? (lang === "ar" ? "مكية" : lang === "fr" ? "Mecquoise" : "Meccan")
              : (lang === "ar" ? "مدنية" : lang === "fr" ? "Médinoise" : "Medinan")}
          </span>
          <span className="text-[0.62rem] text-text-muted">{ayahLabel}</span>
        </div>
      </div>

      {/* Arabic name */}
      <div
        className="hp-card-ar font-surah-names shrink-0 text-text-primary"
        aria-label={surah.ar}
        dir="ltr"
        lang="en"
      >
        <span aria-hidden="true">{surahLigature}</span>
      </div>

      {/* Play button — always visible on touch, hover on desktop */}
      <button
        className={cn(
          "hp-card-play absolute z-[2] right-1.5 sm:right-2 bottom-1.5 sm:bottom-2 w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full border transition-all",
          isPlaying
            ? "bg-amber-400 border-amber-400/60 text-white opacity-100"
            : "bg-bg-primary border-border text-text-muted opacity-60 group-hover:opacity-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary sm:opacity-0",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onPlay(surah.n);
        }}
        aria-label={playAriaLabel}
      >
        {isPlaying ? <Pause size={16} /> : <Play size={16} className="pl-[1px]" />}
      </button>
    </div>
  );
});

/* ─── JuzCard ────────────────────────────────────────────────────────────── */
export const JuzCard = memo(function JuzCard({
  juzData,
  onClick,
  isActive,
  lang,
  viewMode,
  animIndex = 0,
}) {
  const { juz, name } = juzData;

  if (viewMode === "list") {
    const rowVisibilityStyle = {
      contentVisibility: "auto",
      containIntrinsicSize: "80px",
    };

    return (
      <button
        className={cn(
          "juz-card juz-card--list",
          isActive && "juz-card--active",
        )}
        onClick={() => onClick(juz)}
        style={rowVisibilityStyle}
      >
        <span className="juz-card__number">
          {juz}
        </span>
        <div className="juz-card__copy">
          <span className="juz-card__title">
            Juz {juz}
          </span>
          <span className="juz-card__arabic" dir="rtl" lang="ar">
            {name}
          </span>
        </div>
      </button>
    );
  }

  const cardVisibilityStyle = {
    contentVisibility: "auto",
    containIntrinsicSize: "120px",
  };

  return (
    <button
      className={cn(
        "juz-card",
        isActive && "juz-card--active",
      )}
      onClick={() => onClick(juz)}
      style={cardVisibilityStyle}
    >
      <span className="juz-card__accent" aria-hidden="true" />
      <span className="juz-card__number">
        {juz}
      </span>
      <div className="juz-card__copy">
        <span className="juz-card__title">
          Juz {juz}
        </span>
        <span className="juz-card__arabic" dir="rtl" lang="ar">
          {name}
        </span>
      </div>
    </button>
  );
});

/* ─── BlogCard ───────────────────────────────────────────────────────────── */
/* ─── EmptyState ─────────────────────────────────────────────────────────── */
export function EmptyState({ icon, text }) {
  return (
    <div className="hp-empty">
      <Icon name={icon} size={28} aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}
