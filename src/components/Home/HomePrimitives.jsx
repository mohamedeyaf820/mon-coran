import { memo } from "react";
import { cn } from "../../lib/utils";
import { toAr } from "../../data/surahs";
import {
  normalizeLatinSurahName,
  getSurahEnglishMeaning,
  TYPE_INFO,
} from "./homeConstants";

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
      <defs>
        <linearGradient
          id="home-progress-gradient"
          x1="0%"
          y1="0%"
          x2="100%"
          y2="0%"
        >
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--gold)" />
        </linearGradient>
      </defs>
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
        fill="url(#home-progress-gradient)"
      />
    </svg>
  );
}

/* ─── SurahCard ──────────────────────────────────────────────────────────── */
export const SurahCard = memo(function SurahCard({
  surah,
  onClick,
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
          "group flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-bg-primary border border-border/50 hover:bg-bg-secondary hover:border-primary/30 transition-all cursor-pointer",
          isActive && "bg-primary/5 border-primary/50",
          isPlaying && "bg-gold/5 border-gold/50",
        )}
        data-stype={surah.type?.toLowerCase()}
        onClick={() => onClick(surah.n)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(surah.n);
          }
        }}
        role="button"
        tabIndex={0}
        style={rowVisibilityStyle}
      >
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
          <span className="flex items-center gap-1.5 text-[0.7rem] text-text-muted truncate mt-0.5">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                surah.type === "Meccan" ? "bg-gold" : "bg-primary",
              )}
            />
            {typeLabel} · {ayahLabel}
            {pageLabel ? ` · ${pageLabel}` : ""}
          </span>
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
            onError={(e) => {
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "block";
            }}
          />
          <span style={{ display: "none" }}>{surah.ar}</span>
        </span>
        <button
          className={cn(
            "flex items-center justify-center w-8 h-8 rounded-full bg-bg-secondary text-text-muted hover:bg-primary hover:text-white transition-colors ml-2 shrink-0",
            isPlaying && "bg-gold text-white hover:bg-gold-bright",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onPlay(surah.n);
          }}
          aria-label={playAriaLabel}
        >
          <i
            className={`fas fa-${isPlaying ? "pause" : "play"} text-[0.8rem]`}
          />
        </button>
      </div>
    );
  }

  /* ── GRID CARD ── */
  const cardVisibilityStyle = {
    contentVisibility: "auto",
    containIntrinsicSize: "112px",
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border bg-bg-primary shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/40 hover:bg-bg-secondary hover:shadow-md overflow-hidden",
        isActive && "border-primary/60 bg-primary/5",
        isPlaying && "border-gold/60 bg-gold/5",
      )}
      data-stype={surah.type?.toLowerCase()}
      onClick={() => onClick(surah.n)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick(surah.n);
        }
      }}
      role="button"
      tabIndex={0}
      style={cardVisibilityStyle}
    >
      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-primary/80 to-primary/20 opacity-0 group-hover:opacity-40 transition-opacity" />

      <span className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-bg-secondary text-[0.8rem] font-bold text-text-secondary border border-border/40 group-hover:text-primary group-hover:border-primary/30 transition-colors">
        {surah.n}
      </span>

      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[0.95rem] sm:text-[1.05rem] font-bold text-text-primary truncate">
          {primaryLabel}
        </span>
        <span className="text-[0.7rem] sm:text-[0.75rem] text-text-secondary truncate mt-0.5">
          {secondaryLabel}
        </span>
        <span className="text-[0.65rem] sm:text-[0.7rem] text-text-muted truncate">
          {ayahLabel}
        </span>
      </div>

      <span
        className="text-[1.5rem] sm:text-[1.8rem] font-quran text-primary/80 group-hover:text-primary transition-colors ml-2 shrink-0"
        dir="rtl"
        lang="ar"
        aria-label={surah.ar}
        title={surah.ar}
      >
        <img
          src={`https://static.quran.com/images/surah/symbols/sname_${surah.n}.svg`}
          alt={surah.ar}
          className="h-10 sm:h-12 invert dark:invert-0 opacity-80 group-hover:opacity-100"
          onError={(e) => {
            e.target.style.display = "none";
            e.target.nextSibling.style.display = "block";
          }}
        />
        <span style={{ display: "none" }}>{surah.ar}</span>
      </span>

      <button
        className={cn(
          "absolute right-2 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full bg-bg-primary border border-border text-text-muted opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all hover:bg-primary hover:text-white hover:border-primary",
          isPlaying &&
            "opacity-100 translate-x-0 bg-gold border-gold text-white",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onPlay(surah.n);
        }}
        aria-label={playAriaLabel}
      >
        <i
          className={`fas fa-${isPlaying ? "pause" : "play"} text-[0.8rem] sm:text-[0.9rem] pl-[1px]`}
        />
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
          "group flex items-center gap-3 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl bg-bg-primary border border-border/50 hover:bg-bg-secondary hover:border-primary/30 transition-all text-left",
          isActive && "bg-primary/5 border-primary/50",
        )}
        onClick={() => onClick(juz)}
        style={rowVisibilityStyle}
      >
        <span className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-bg-secondary text-[0.75rem] font-bold text-text-secondary border border-border/40 group-hover:text-primary group-hover:border-primary/30 transition-colors">
          {juz}
        </span>
        <div className="flex items-baseline truncate">
          <span className="text-[0.95rem] font-bold text-text-primary">
            Juz {juz}
          </span>
          <span className="text-[0.8rem] text-text-secondary ml-2 truncate">
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
        "group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border bg-bg-primary shadow-sm transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/40 hover:bg-bg-secondary hover:shadow-md text-left overflow-hidden",
        isActive && "border-primary/60 bg-primary/5",
      )}
      onClick={() => onClick(juz)}
      style={cardVisibilityStyle}
    >
      <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-gradient-to-b from-primary/80 to-primary/20 opacity-0 group-hover:opacity-40 transition-opacity" />

      <span className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-full bg-bg-secondary text-[0.8rem] font-bold text-text-secondary border border-border/40 group-hover:text-primary group-hover:border-primary/30 transition-colors">
        {juz}
      </span>
      <div className="flex flex-col flex-1 min-w-0">
        <span className="text-[0.95rem] sm:text-[1.05rem] font-bold text-text-primary truncate">
          Juz {juz}
        </span>
        <span className="text-[0.75rem] text-text-secondary truncate mt-0.5">
          {name}
        </span>
      </div>
    </button>
  );
});

/* ─── BlogCard ───────────────────────────────────────────────────────────── */
export const BlogCard = memo(function BlogCard({ post, lang }) {
  return (
    <div className="hp-card hp-card--blog animate-fadeInScale">
      <div className="hp-blog-img-wrap">
        <img
          src={post.img}
          alt={post.title}
          className="hp-blog-img"
          loading="lazy"
        />
      </div>
      <div className="hp-blog-content">
        <span className="hp-blog-tag">{post.tag}</span>
        <h3 className="hp-blog-title">{post.title}</h3>
        <div className="hp-blog-footer">
          <span>{post.date}</span>
          <span>
            <i className="far fa-clock mr-1" /> {post.readTime}
          </span>
        </div>
      </div>
    </div>
  );
});

/* ─── EmptyState ─────────────────────────────────────────────────────────── */
export function EmptyState({ icon, text }) {
  return (
    <div className="hp-empty">
      <i className={`fas ${icon}`} />
      <p>{text}</p>
    </div>
  );
}
