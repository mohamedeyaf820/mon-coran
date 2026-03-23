/* HomePage - Design epure, inspire de Quran.com */
import React, {
  memo,
  startTransition,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useApp } from "../context/AppContext";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA } from "../data/juz";
import { getAllBookmarks, getAllNotes } from "../services/storageService";
import { getRecentVisits } from "../services/recentHistoryService";
import { cn } from "../lib/utils";
import audioService from "../services/audioService";
import {
  getReciter,
  ensureReciterForRiwaya,
  isWarshVerifiedReciter,
} from "../data/reciters";

import { ErrorBoundary } from "./ErrorBoundary";
import PlatformLogo from "./PlatformLogo";
import Footer from "./Footer";
import { buildSurahAudioPlaylist } from "../utils/audioPlaylist";

const HOME_INITIAL_SURAHS = SURAHS.length;
const HOME_SURAHS_BATCH = 18;
const HOME_DEFERRED_SECTION_STYLE = {
  contentVisibility: "auto",
  containIntrinsicSize: "1px 360px",
};
const HOME_FOOTER_SECTION_STYLE = {
  contentVisibility: "auto",
  containIntrinsicSize: "1px 280px",
};

function runWhenIdle(callback, timeout = 160) {
  if (typeof window === "undefined") return () => {};

  if ("requestIdleCallback" in window) {
    const idleId = window.requestIdleCallback(callback, { timeout });
    return () => window.cancelIdleCallback(idleId);
  }

  const timeoutId = window.setTimeout(
    () =>
      callback({
        didTimeout: false,
        timeRemaining: () => 0,
      }),
    timeout,
  );

  return () => window.clearTimeout(timeoutId);
}

/* Sourates d'acces rapide */
const QUICK_ACCESS = [
  { n: 1, icon: "fa-mosque", label_fr: "Al-Fatiha", label_en: "The Opening" },
  { n: 18, icon: "fa-mountain-sun", label_fr: "Al-Kahf", label_en: "The Cave" },
  {
    n: 36,
    icon: "fa-star-and-crescent",
    label_fr: "Ya-Sin",
    label_en: "Ya-Sin",
  },
  { n: 55, icon: "fa-leaf", label_fr: "Ar-Rahman", label_en: "The Merciful" },
  { n: 67, icon: "fa-moon", label_fr: "Al-Mulk", label_en: "Sovereignty" },
  { n: 112, icon: "fa-infinity", label_fr: "Al-Ikhlas", label_en: "Sincerity" },
  { n: 113, icon: "fa-sun", label_fr: "Al-Falaq", label_en: "The Dawn" },
  { n: 114, icon: "fa-shield-halved", label_fr: "An-Nas", label_en: "Mankind" },
];

const SURAH_EN_MEANINGS = {
  1: "The Opening",
  2: "The Cow",
  3: "Family of Imran",
  4: "The Women",
  5: "The Table Spread",
  6: "The Cattle",
  7: "The Heights",
  8: "The Spoils of War",
  9: "The Repentance",
  10: "Jonah",
  11: "Hud",
  12: "Joseph",
  13: "The Thunder",
  14: "Abraham",
  15: "The Rocky Tract",
  16: "The Bee",
  17: "The Night Journey",
  18: "The Cave",
  19: "Mary",
  20: "Ta Ha",
  21: "The Prophets",
  22: "The Pilgrimage",
  23: "The Believers",
  24: "The Light",
  25: "The Criterion",
  26: "The Poets",
  27: "The Ant",
  28: "The Stories",
  29: "The Spider",
  30: "The Romans",
  31: "Luqman",
  32: "The Prostration",
  33: "The Confederates",
  34: "Sheba",
  35: "Originator",
  36: "Ya Sin",
  37: "Those Who Set the Ranks",
  38: "Sad",
  39: "The Groups",
  40: "The Forgiver",
  41: "Explained in Detail",
  42: "Consultation",
  43: "Gold Adornments",
  44: "The Smoke",
  45: "The Kneeling",
  46: "The Dunes",
  47: "Muhammad",
  48: "The Victory",
  49: "The Rooms",
  50: "Qaf",
  51: "The Winnowing Winds",
  52: "The Mount",
  53: "The Star",
  54: "The Moon",
  55: "The Most Merciful",
  56: "The Inevitable",
  57: "The Iron",
  58: "The Pleading Woman",
  59: "The Exile",
  60: "She That Is To Be Examined",
  61: "The Ranks",
  62: "The Congregation",
  63: "The Hypocrites",
  64: "Mutual Disillusion",
  65: "Divorce",
  66: "The Prohibition",
  67: "The Sovereignty",
  68: "The Pen",
  69: "The Reality",
  70: "The Ascending Stairways",
  71: "Noah",
  72: "The Jinn",
  73: "The Enshrouded One",
  74: "The Cloaked One",
  75: "The Resurrection",
  76: "Man",
  77: "Those Sent Forth",
  78: "The Great News",
  79: "Those Who Drag Forth",
  80: "He Frowned",
  81: "The Overthrowing",
  82: "The Cleaving",
  83: "Defrauding",
  84: "The Splitting Open",
  85: "The Mansions of the Stars",
  86: "The Morning Star",
  87: "The Most High",
  88: "The Overwhelming",
  89: "The Dawn",
  90: "The City",
  91: "The Sun",
  92: "The Night",
  93: "The Morning Hours",
  94: "The Relief",
  95: "The Fig",
  96: "The Clot",
  97: "The Power",
  98: "The Clear Proof",
  99: "The Earthquake",
  100: "The Courser",
  101: "The Calamity",
  102: "Rivalry in World Increase",
  103: "The Declining Day",
  104: "The Traducer",
  105: "The Elephant",
  106: "Quraysh",
  107: "Small Kindnesses",
  108: "Abundance",
  109: "The Disbelievers",
  110: "Divine Support",
  111: "The Palm Fiber",
  112: "Sincerity",
  113: "The Daybreak",
  114: "Mankind",
};

function normalizeLatinSurahName(name = "") {
  return name.replace(/[-']+/g, " ").replace(/\s+/g, " ").trim();
}

function getSurahEnglishMeaning(surahNumber) {
  return SURAH_EN_MEANINGS[surahNumber] || "Surah";
}

/* Versets du jour - cycle de 30 jours */
const DAILY_VERSES = [
  {
    text: "إن مع العسر يسرا",
    ref: "Al-Inshirah  94:6",
    trans_fr: "Certes, avec la difficulté vient la facilité",
  },
  {
    text: "ومن يتق الله يجعل له مخرجا",
    ref: "At-Talaq  65:2",
    trans_fr: "Qui craint Allah, Il lui accordera une issue",
  },
  {
    text: "ألا بذكر الله تطمئن القلوب",
    ref: "Ar-Ra'd  13:28",
    trans_fr: "C'est par le rappel d'Allah que les coeurs trouvent la quiétude",
  },
  {
    text: "إن الله مع الصابرين",
    ref: "Al-Baqara  2:153",
    trans_fr: "Certes, Allah est avec ceux qui endurent",
  },
  {
    text: "إن الله لطيف بعباده",
    ref: "Ash-Shura  42:19",
    trans_fr: "Allah est plein de mansuétude envers Ses serviteurs",
  },
  {
    text: "قل هو الله أحد",
    ref: "Al-Ikhlas  112:1",
    trans_fr: "Dis : Il est Allah, Unique",
  },
];

/* Retourne l'index du verset selon le jour de l'année (change à minuit) */
function getDailyVerseIndex(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  return dayOfYear % DAILY_VERSES.length;
}

/* Suggestions contextuelles selon heure / jour de la semaine */
function getSuggestedSurahs(date = new Date()) {
  const h = date.getHours();
  const day = date.getDay(); // 0=Dim, 5=Ven

  if (day === 5)
    return {
      period: {
        fr: "Sunna du vendredi",
        en: "Friday Sunnah",
        ar: "سنة الجمعة",
      },
      icon: "fa-star-and-crescent",
      surahs: [
        {
          n: 18,
          fr: "Sunna du vendredi",
          en: "Friday Sunnah",
          ar: "سنة الجمعة",
        },
        { n: 1, fr: "L'Ouverture", en: "The Opening", ar: "الفاتحة" },
        { n: 36, fr: "Coeur du Coran", en: "Heart of Quran", ar: "قلب القرآن" },
        { n: 55, fr: "Ar-Rahman", en: "The Merciful", ar: "الرحمن" },
        { n: 67, fr: "Al-Mulk", en: "Sovereignty", ar: "الملك" },
      ],
    };

  if (h >= 4 && h < 12)
    return {
      period: {
        fr: "Lecture du matin",
        en: "Morning Reading",
        ar: "ورد الصباح",
      },
      icon: "fa-sun",
      surahs: [
        { n: 1, fr: "L'Ouverture", en: "The Opening", ar: "الفاتحة" },
        { n: 112, fr: "Sincerite pure", en: "Pure Sincerity", ar: "الإخلاص" },
        { n: 113, fr: "Protection de l'aube", en: "Dawn Guard", ar: "الفلق" },
        { n: 114, fr: "Protection du mal", en: "Against Evil", ar: "الناس" },
        { n: 36, fr: "Coeur du Coran", en: "Heart of Quran", ar: "قلب القرآن" },
      ],
    };

  if (h >= 12 && h < 17)
    return {
      period: {
        fr: "Lecture du midi",
        en: "Midday Reading",
        ar: "قراءة الظهر",
      },
      icon: "fa-cloud-sun",
      surahs: [
        {
          n: 55,
          fr: "Ar-Rahman - La Grace",
          en: "Ar-Rahman - Grace",
          ar: "الرحمن",
        },
        { n: 25, fr: "Le Critere", en: "The Criterion", ar: "الفرقان" },
        { n: 18, fr: "Al-Kahf", en: "The Cave", ar: "الكهف" },
        { n: 56, fr: "L'Evenement", en: "The Event", ar: "الواقعة" },
        { n: 2, fr: "Al-Baqara", en: "The Cow", ar: "البقرة" },
      ],
    };

  if (h >= 17 && h < 21)
    return {
      period: {
        fr: "Lecture du soir",
        en: "Evening Reading",
        ar: "ورد المساء",
      },
      icon: "fa-cloud-moon",
      surahs: [
        { n: 36, fr: "Coeur du Coran", en: "Heart of Quran", ar: "قلب القرآن" },
        { n: 67, fr: "Rappel du soir", en: "Evening Reminder", ar: "الملك" },
        { n: 55, fr: "Ar-Rahman", en: "The Merciful", ar: "الرحمن" },
        { n: 59, fr: "Al-Hashr", en: "The Gathering", ar: "الحشر" },
        { n: 103, fr: "Le Temps", en: "Time", ar: "العصر" },
      ],
    };

  return {
    period: { fr: "Lecture de nuit", en: "Night Reading", ar: "ورد الليل" },
    icon: "fa-moon",
    surahs: [
      {
        n: 67,
        fr: "Al-Mulk - Avant le sommeil",
        en: "Al-Mulk - Before Sleep",
        ar: "الملك",
      },
      { n: 32, fr: "As-Sajda", en: "The Prostration", ar: "السجدة" },
      { n: 36, fr: "Ya-Sin du soir", en: "Ya-Sin at Night", ar: "يس" },
      { n: 112, fr: "Al-Ikhlas", en: "Sincerity", ar: "الإخلاص" },
      { n: 113, fr: "Al-Falaq", en: "The Dawn", ar: "الفلق" },
    ],
  };
}

/*  Type info  */
const TYPE_INFO = {
  Meccan: { fr: "Mecquoise", en: "Meccan", ar: "مكية" },
  Medinan: { fr: "Medinoise", en: "Medinan", ar: "مدنية" },
};

function FlowerBadge({ className = "" }) {
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

function PercentBar({ value }) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <svg
      viewBox="0 0 100 8"
      preserveAspectRatio="none"
      className="block h-full w-full"
    >
      <defs>
        <linearGradient id="home-progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
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

/*  Carte sourate (grille)  */
const SurahCard = memo(function SurahCard({
  surah,
  onClick,
  onPlay,
  isActive,
  lang,
  isPlaying,
  viewMode,
  animIndex = 0,
}) {
  const primaryLabel = normalizeLatinSurahName(surah.en || surah.fr || surah.ar || "");
  const secondaryLabel = getSurahEnglishMeaning(surah.n);
  const ayahLabel = `${surah.ayahs} Ayat`;
  const playAriaLabel =
    lang === "fr" ? "Écouter" : lang === "ar" ? "استماع" : "Listen";
  const pageLabel =
    surah.page &&
    (lang === "ar"
      ? `صفحة ${surah.page}`
      : lang === "fr"
        ? `Page ${surah.page}`
        : `Page ${surah.page}`);

  /* LIST ROW (unchanged) */
  if (viewMode === "list") {
    const rowVisibilityStyle = {
      contentVisibility: "auto",
      containIntrinsicSize: "82px",
    };

    return (
      <div
        className={cn(
          "hpl-row !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.003]",
          isActive && "hpl-row--active",
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
        <span className={cn("hpl-row__num", isActive && "hpl-row__num--on")}>
          {surah.n}
        </span>
        <div className="hpl-row__body">
          <span className="hpl-row__name">{displayName}</span>
          <span className="hpl-row__sub">{subLabel}</span>
          <span className="hpl-row__meta">
            <span className={`hpl-dot hpl-dot--${surah.type?.toLowerCase()}`} />
            {typeLabel} · {ayahLabel}
            {pageLabel ? ` · ${pageLabel}` : ""}
          </span>
        </div>
        <span
          className="hpl-row__ar"
          dir="rtl"
          lang="ar"
          style={{
            fontFamily:
              'var(--font-surah-display, "Amiri Quran"), var(--font-quran), "KFGQPC Uthmanic Script HAFS", "ME Quran", "Amiri", serif',
            fontFeatureSettings: '"calt" 1, "liga" 1, "rlig" 1, "kern" 1',
            textRendering: "optimizeLegibility",
            WebkitFontSmoothing: "antialiased",
            fontKerning: "normal",
          }}
        >
          {surah.ar}
        </span>
        <button
          className={cn(
            "hpl-row__play !transition-all !duration-300 hover:!scale-110",
            isPlaying && "hpl-row__play--on motion-safe:animate-pulse",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onPlay(surah.n);
          }}
          aria-label={playAriaLabel}
        >
          <i className={`fas fa-${isPlaying ? "pause" : "play"}`} />
        </button>
      </div>
    );
  }

  /* ���� GRID CARD � reference-style layout ���� */
  const cardVisibilityStyle = {
    contentVisibility: "auto",
    containIntrinsicSize: "112px",
  };

  return (
    <div
      className={cn(
        "scard group !relative !flex !min-h-[94px] !w-full !flex-row !items-center !gap-3 !overflow-hidden !rounded-[14px] !border !border-[#e3dfd3] !bg-[#f7f5ef] !px-3.5 !py-2.5 !text-left !shadow-[0_2px_6px_rgba(28,25,19,0.06)] !transition-all !duration-200 hover:!border-[#d0c6ad] hover:!shadow-[0_5px_12px_rgba(28,25,19,0.10)]",
        isActive && "scard--active",
        isPlaying && "scard--playing",
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
      {/* Number badge */}
      <span
        className={cn(
          "scard__num !relative !z-10 !inline-flex !h-8 !w-8 !shrink-0 !items-center !justify-center !text-[0.8rem] !font-extrabold !text-[#a2894d]",
          isActive &&
            "scard__num--on !text-[#8f742f]",
        )}
      >
        <FlowerBadge className="!absolute !inset-0 !h-full !w-full !text-[#ece4d0]" />
        {surah.n}
      </span>

      {/* Transliteration + meta */}
      <div className="scard__body !min-w-0 !flex-1 !space-y-0.5">
        <span className="scard__name !block !truncate !text-[1.03rem] !font-semibold !tracking-[-0.01em] !text-[#191919]">
          <span className="!truncate">{primaryLabel}</span>
        </span>
        <span className="scard__trans !block !truncate !text-[0.76rem] !font-medium !text-[#55544f]">
          {secondaryLabel}
        </span>
        <span className="scard__meta !inline-flex !items-center !gap-1.5 !text-[0.76rem] !font-medium !text-[#5e5c55]">
          <span className="!truncate">{ayahLabel}</span>
        </span>
      </div>

      <span
        className="scard__ar !ml-auto !pr-1 !text-right !text-[clamp(1.85rem,2.1vw,2.35rem)] !leading-none !text-[#ba932f]"
        dir="rtl"
        lang="ar"
        style={{
          fontFamily:
            'var(--font-surah-display, "Amiri Quran"), var(--font-quran), "KFGQPC Uthmanic Script HAFS", "ME Quran", "Amiri", serif',
          fontFeatureSettings: '"calt" 1, "liga" 1, "rlig" 1, "kern" 1',
          textRendering: "optimizeLegibility",
          WebkitFontSmoothing: "antialiased",
          fontKerning: "normal",
        }}
      >
        {surah.ar}
      </span>

      {/* Play button (absolute bottom-right) */}
      <button
        className={cn(
          "scard__play !absolute !right-2 !top-2 !inline-flex !h-6 !w-6 !items-center !justify-center !rounded-md !border !border-[#d8d1bf] !bg-[#f1ecdf] !text-[0.6rem] !text-[#8f845f] !opacity-0 !transition-all !duration-200 group-hover:!opacity-80 hover:!scale-105",
          isPlaying && "scard__play--on motion-safe:animate-pulse",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onPlay(surah.n);
        }}
        aria-label={playAriaLabel}
      >
        <i className={`fas fa-${isPlaying ? "pause" : "play"}`} />
      </button>
    </div>
  );
});

/* Carte juz */
const JuzCard = memo(function JuzCard({
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
          "hpl-row !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.003]",
          isActive && "hpl-row--active",
        )}
        onClick={() => onClick(juz)}
        style={rowVisibilityStyle}
      >
        <span className={cn("hpl-row__num", isActive && "hpl-row__num--on")}>
          {juz}
        </span>
        <div className="hpl-row__body">
          <span className="hpl-row__name">Juz {juz}</span>
          <span className="hpl-row__meta">{name}</span>
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
        "hpq-card hpq-card--juz !transition-all !duration-300 hover:!-translate-y-1 hover:!scale-[1.01]",
        isActive && "hpq-card--active",
      )}
      onClick={() => onClick(juz)}
      style={cardVisibilityStyle}
    >
      <span className={cn("hpq-card__num", isActive && "hpq-card__num--on")}>
        {juz}
      </span>
      <div className="hpq-card__info">
        <span className="hpq-card__name">Juz {juz}</span>
        <span className="hpq-card__meta">{name}</span>
      </div>
    </button>
  );
});

/* Etat vide */
function EmptyState({ icon, text }) {
  return (
    <div className="hp2-empty">
      <i className={`fas ${icon}`} />
      <p>{text}</p>
    </div>
  );
}

/* HomePage principale */
export default function HomePage() {
  const { state, dispatch, set } = useApp();
  const { lang, currentSurah, currentAyah, currentJuz, displayMode, riwaya } =
    state;
  const isRtl = lang === "ar";

  const [activeTab, setActiveTab] = useState("surah");
  const [activeInfo, setActiveInfo] = useState("bookmarks");
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [now, setNow] = useState(() => new Date());
  const [recentVisits, setRecentVisits] = useState([]);
  const [visibleSurahCount, setVisibleSurahCount] =
    useState(HOME_INITIAL_SURAHS);
  const deferredFilter = useDeferredValue(filter);
  const loadMoreRef = useRef(null);

  // Historique réel = l'utilisateur a déjà navigué au-delà de Al-Fatiha v.1
  const hasReadingHistory =
    currentSurah > 1 || (currentSurah === 1 && currentAyah > 1);

  useEffect(() => {
    startTransition(() => {
      setActiveTab(displayMode === "juz" ? "juz" : "surah");
    });
  }, [displayMode]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    let cancelled = false;

    const cancelIdleLoad = runWhenIdle(async () => {
      const nextRecentVisits = getRecentVisits();

      try {
        const [bks, ns] = await Promise.all([getAllBookmarks(), getAllNotes()]);
        if (cancelled) return;

        startTransition(() => {
          setRecentVisits(nextRecentVisits);
          setBookmarks((bks || []).sort((a, b) => b.createdAt - a.createdAt));
          setNotes((ns || []).sort((a, b) => b.updatedAt - a.updatedAt));
        });
      } catch {
        if (cancelled) return;
        startTransition(() => {
          setRecentVisits(nextRecentVisits);
        });
      }
    });

    return () => {
      cancelled = true;
      cancelIdleLoad();
    };
  }, []);

  const playFromHome = useCallback(
    (surahNum) => {
      const safeId = ensureReciterForRiwaya(state.reciter, state.riwaya);
      const rec = getReciter(safeId, state.riwaya);
      if (!rec) return;
      if (
        state.riwaya === "warsh" &&
        state.warshStrictMode &&
        !isWarshVerifiedReciter(rec)
      )
        return;
      const items = buildSurahAudioPlaylist(surahNum);
      if (items.length === 0) return;
      set({
        displayMode: "surah",
        currentSurah: surahNum,
        currentAyah: 1,
      });
      audioService.loadPlaylist(items, rec.cdn, rec.cdnType || "islamic");
      audioService.play();
    },
    [state.reciter, state.riwaya, state.warshStrictMode, set],
  );

  const goSurah = useCallback(
    (n) => {
      set({ displayMode: "surah", showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: n, ayah: 1 } });
    },
    [set, dispatch],
  );

  const goSurahAyah = useCallback(
    (surah, ayah) => {
      set({ displayMode: "surah", showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah: ayah || 1 } });
    },
    [set, dispatch],
  );

  const goJuz = useCallback(
    (juz) => {
      set({ showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
    },
    [set, dispatch],
  );

  const continueReading = useCallback(() => {
    set({ showHome: false, showDuas: false });
    if (displayMode === "juz")
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz } });
    else
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: currentSurah, ayah: currentAyah },
      });
  }, [set, dispatch, displayMode, currentJuz, currentSurah, currentAyah]);

  const openDuas = useCallback(
    () => set({ showHome: false, showDuas: true }),
    [set],
  );

  const selectInfoTab = useCallback((tabId) => {
    startTransition(() => {
      setActiveInfo(tabId);
    });
  }, []);

  const selectContentTab = useCallback((tabId) => {
    startTransition(() => {
      setActiveTab(tabId);
    });
  }, []);

  const changeViewMode = useCallback((nextViewMode) => {
    startTransition(() => {
      setViewMode(nextViewMode);
    });
  }, []);

  const toggleSortDirection = useCallback(() => {
    startTransition(() => {
      setSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
    });
  }, []);

  const trimmedDeferredFilter = deferredFilter.trim();
  const normalizedDeferredFilter = trimmedDeferredFilter.toLowerCase();
  const hasSurahFilter = normalizedDeferredFilter.length > 0;

  const filteredSurahs = useMemo(() => {
    const source = !trimmedDeferredFilter
      ? [...SURAHS]
      : SURAHS.filter(
          (s) =>
            s.ar.includes(trimmedDeferredFilter) ||
            s.en.toLowerCase().includes(normalizedDeferredFilter) ||
            s.fr.toLowerCase().includes(normalizedDeferredFilter) ||
            String(s.n) === trimmedDeferredFilter,
        );
    source.sort((a, b) => (sortDir === "asc" ? a.n - b.n : b.n - a.n));
    return source;
  }, [normalizedDeferredFilter, sortDir, trimmedDeferredFilter]);

  const renderedSurahs = useMemo(
    () =>
      hasSurahFilter
        ? filteredSurahs
        : filteredSurahs.slice(0, visibleSurahCount),
    [filteredSurahs, hasSurahFilter, visibleSurahCount],
  );

  const hasMoreSurahs =
    activeTab === "surah" &&
    !hasSurahFilter &&
    visibleSurahCount < filteredSurahs.length;

  const loadMoreSurahs = useCallback(() => {
    startTransition(() => {
      setVisibleSurahCount((count) =>
        Math.min(count + HOME_SURAHS_BATCH, filteredSurahs.length),
      );
    });
  }, [filteredSurahs.length]);

  useEffect(() => {
    setVisibleSurahCount(HOME_INITIAL_SURAHS);
  }, [activeTab, normalizedDeferredFilter, sortDir]);

  useEffect(() => {
    if (!hasMoreSurahs) return;
    if (typeof window === "undefined" || !("IntersectionObserver" in window))
      return;

    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        loadMoreSurahs();
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMoreSurahs, loadMoreSurahs]);

  const dailyVerse = useMemo(
    () => DAILY_VERSES[getDailyVerseIndex(now)],
    [now],
  );
  const suggestionSet = useMemo(() => getSuggestedSurahs(now), [now]);
  const surahLabel = SURAHS[currentSurah - 1];
  const progressPct = Math.round(((Math.max(1, currentSurah) - 1) / 113) * 100);

  const riwayaLabel =
    riwaya === "warsh"
      ? lang === "fr"
        ? "Riwaya Warsh"
        : lang === "ar"
          ? "رواية ورش"
          : "Warsh"
      : lang === "fr"
        ? "Riwaya Hafs"
        : lang === "ar"
          ? "رواية حفص"
          : "Hafs";

  const readingModeLabel =
    displayMode === "juz"
      ? lang === "fr"
        ? "Mode Juz"
        : lang === "ar"
          ? "وضع الجزء"
          : "Juz mode"
      : displayMode === "page"
        ? lang === "fr"
          ? "Mode Page"
          : lang === "ar"
            ? "وضع الصفحة"
            : "Page mode"
        : lang === "fr"
          ? "Mode Sourate"
          : lang === "ar"
            ? "وضع السورة"
            : "Surah mode";

  const readingTarget =
    displayMode === "juz"
      ? lang === "ar"
        ? `الجزء ${toAr(currentJuz)}`
        : `Juz ${currentJuz}`
      : displayMode === "page"
        ? lang === "ar"
          ? `صفحة ${toAr(state.currentPage || 1)}`
          : `${lang === "fr" ? "Page" : "Page"} ${state.currentPage || 1}`
        : lang === "ar"
          ? `${surahLabel?.ar || "الفاتحة"} · ${toAr(currentAyah)}`
          : `${lang === "fr" ? surahLabel?.fr : surahLabel?.en} · v.${currentAyah}`;

  const quickResumeLabel = hasReadingHistory
    ? lang === "fr"
      ? "Reprendre la session"
      : lang === "ar"
        ? "متابعة الجلسة"
        : "Resume session"
    : lang === "fr"
      ? "Demarrer une lecture"
      : lang === "ar"
        ? "ابدأ القراءة"
        : "Start reading";

  const currentYear = now.getFullYear();

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h >= 4 && h < 12)
      return { fr: "Bonjour", en: "Good morning", ar: "صباح الخير" };
    if (h >= 12 && h < 17)
      return { fr: "Bon apres-midi", en: "Good afternoon", ar: "مساء النهار" };
    if (h >= 17 && h < 22)
      return { fr: "Bonsoir", en: "Good evening", ar: "مساء الخير" };
    return { fr: "Bonne nuit", en: "Good night", ar: "ليلة طيبة" };
  }, [now]);

  const currentPrayer = useMemo(() => {
    const h = now.getHours();
    if (h >= 4 && h < 7)
      return { icon: "fa-star", fr: "Fajr", ar: "الفجر", en: "Fajr" };
    if (h >= 7 && h < 12)
      return { icon: "fa-sun", fr: "Duha", ar: "الضحى", en: "Duha" };
    if (h >= 12 && h < 15)
      return { icon: "fa-sun", fr: "Dhuhr", ar: "الظهر", en: "Dhuhr" };
    if (h >= 15 && h < 18)
      return { icon: "fa-cloud-sun", fr: "Asr", ar: "العصر", en: "Asr" };
    if (h >= 18 && h < 20)
      return {
        icon: "fa-cloud-moon",
        fr: "Maghrib",
        ar: "المغرب",
        en: "Maghrib",
      };
    return { icon: "fa-moon", fr: "Isha", ar: "العشاء", en: "Isha" };
  }, [now]);

  const vodSurahNum = useMemo(() => {
    // Handles formats: "2:255", "Al-Baqarah 2:255", "البقرة - 2:255", "49:13"
    const match = dailyVerse.ref.match(/(\d{1,3}):\d+/);
    return match ? parseInt(match[1], 10) : null;
  }, [dailyVerse]);

  const T = {
    continueReading: { fr: "Continuer", en: "Continue", ar: "متابعة القراءة" },
    startFatiha: { fr: "Al-Fatiha", en: "Al-Fatihah", ar: "البداية" },
    duas: { fr: "Douas", en: "Duas", ar: "الأدعية" },
    surahs: { fr: "Sourates", en: "Surahs", ar: "السور" },
    juz: { fr: "Juz", en: "Juz", ar: "الأجزاء" },
    search: {
      fr: "Rechercher une sourate...",
      en: "Search a surah...",
      ar: "ابحث عن سورة...",
    },
    verseOfDay: {
      fr: "Verset du jour",
      en: "Verse of the Day",
      ar: "آية اليوم",
    },
    quickAccess: { fr: "Acces rapide", en: "Quick Access", ar: "وصول سريع" },
    noBookmarks: {
      fr: "Aucun favori - appuyez sur etoile",
      en: "No bookmarks yet",
      ar: "لا توجد إشارات",
    },
    noNotes: {
      fr: "Aucune note encore",
      en: "No notes yet",
      ar: "لا توجد ملاحظات",
    },
    noResults: {
      fr: "Aucune sourate trouvee",
      en: "No surah found",
      ar: "لم يتم العثور",
    },
    bookmarks: { fr: "Favoris", en: "Saved", ar: "المفضلة" },
    notes: { fr: "Notes", en: "Notes", ar: "ملاحظات" },
    suggest: { fr: "Suggestions", en: "Suggest", ar: "اقتراحات" },
  };
  const t = (k) =>
    T[k]?.[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"] ?? k;

  const infoTabs = [
    {
      id: "suggest",
      icon: "fa-lightbulb",
      label: t("suggest"),
      count: suggestionSet.surahs.length,
    },
    {
      id: "bookmarks",
      icon: "fa-bookmark",
      label: t("bookmarks"),
      count: bookmarks.length,
    },
    {
      id: "notes",
      icon: "fa-pen-line",
      label: t("notes"),
      count: notes.length,
    },
  ];
  const useSurahGridScroll = activeTab === "surah" && viewMode === "grid";

  return (
    <div className="hp2 hp2--platform !relative !overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -top-28 left-[6%] h-72 w-72 rounded-full blur-[110px] motion-safe:animate-pulse [animation-duration:8s]" />
        <div className="absolute top-[18%] -right-28 h-80 w-80 rounded-full blur-[120px] motion-safe:animate-pulse [animation-duration:11s]" />
        <div className="absolute -bottom-32 left-[30%] h-96 w-96 rounded-full blur-[130px] motion-safe:animate-pulse [animation-duration:9s]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.17)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>
      {/* HERO */}
      <section className="hp2-hero !relative !z-10 !overflow-hidden !rounded-[28px]">
        {/* Daily Verse section protégée */}
        <ErrorBoundary>
          {/* Remplacer ici par le composant réel si DailyVersesSection existe, sinon protéger le rendu du verset du jour */}
          <div className="hp2-daily-verse !mb-4">
            <div className="hp2-daily-verse__label !text-[0.92rem] !font-semibold !mb-1">
              {t("verseOfDay")}
            </div>
            <div className="hp2-daily-verse__text !text-[1.18rem] !font-quran !mb-1" dir="rtl" lang="ar">
              {dailyVerse.text}
            </div>
            <div className="hp2-daily-verse__ref !text-[0.82rem] !text-[var(--text-muted)]">
              {dailyVerse.ref}
            </div>
            <div className="hp2-daily-verse__trans !text-[0.92rem] !text-[var(--text-secondary)]">
              {dailyVerse.trans_fr}
            </div>
          </div>
        </ErrorBoundary>
        <div className="pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute -top-12 right-[14%] h-28 w-28 rounded-full border border-white/15 opacity-35 motion-safe:animate-spin [animation-duration:16s]" />
        <div className="pointer-events-none absolute -bottom-14 left-[44%] h-36 w-36 rounded-full border opacity-30 motion-safe:animate-spin [animation-direction:reverse] [animation-duration:22s]" />
        {/* Orbs décoratifs */}
        <div
          className="hp2-hero__orb hp2-hero__orb--1 !opacity-65 motion-safe:animate-pulse [animation-duration:9s]"
          aria-hidden="true"
        />
        <div
          className="hp2-hero__orb hp2-hero__orb--2 !opacity-60 motion-safe:animate-pulse [animation-duration:12s]"
          aria-hidden="true"
        />
        <div
          className="hp2-hero__orb hp2-hero__orb--3 !opacity-55 motion-safe:animate-pulse [animation-duration:10s]"
          aria-hidden="true"
        />

        <div className="hp2-hero__inner !relative !z-10">
          {/* Gauche */}
          <div className="hp2-hero__left">
            {/* Salutation + date */}
            <div className="hp2-hero__top-row !items-center !gap-3">
              <div className="hp2-hero__greeting !inline-flex !items-center !gap-2 !rounded-full !px-3 !py-1.5 !text-[0.71rem] !font-semibold !uppercase !tracking-[0.12em]">
                <i className={`fas ${currentPrayer.icon}`} />
                <span>
                  {greeting[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}
                </span>
              </div>
              <span className="hp2-hero__date-pill !rounded-full !px-3 !py-1.5 !text-[0.72rem] !font-medium !backdrop-blur-sm">
                {now.toLocaleDateString(
                  lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
                  { weekday: "short", day: "numeric", month: "short" },
                )}
              </span>
            </div>

            {/* Titre principal avec bismallah intégrée */}
            <div className="hp2-hero__headline">
              <div className="hp2-hero__bismallah" aria-hidden="true" dir="rtl">
                ﷽
              </div>
              <div className="hp2-hero__brand !items-center !gap-4 max-[520px]:!items-start max-[520px]:!gap-2.5">
                <PlatformLogo
                  className="hp2-hero__logo !h-[84px] !w-[84px] !rounded-3xl"
                  imgClassName="hp2-hero__logo-img !h-[62px] !w-[62px]"
                  decorative
                />
                <div className="hp2-hero__brand-text">
                  <h1 className="hp2-hero__title !text-[clamp(1.95rem,3vw,2.5rem)] !font-black !tracking-tight max-[520px]:!text-[clamp(1.45rem,7vw,1.95rem)] break-words">
                    MushafPlus
                  </h1>
                  <div className="hp2-hero__badges-row !mt-2 !flex !flex-wrap !gap-2">
                    <span className="hp2-hero__badge hp2-hero__badge--riwaya !rounded-full !px-3 !py-1 !text-[0.74rem] !font-semibold !backdrop-blur-sm">
                      <i className="fas fa-feather-pointed" />
                      {riwayaLabel}
                    </span>
                    <span className="hp2-hero__badge hp2-hero__badge--prayer !rounded-full !px-3 !py-1 !text-[0.74rem] !font-semibold !backdrop-blur-sm">
                      <i className={`fas ${currentPrayer.icon}`} />
                      {
                        currentPrayer[
                          lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"
                        ]
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="hp2-hero__tagline !mt-3 !max-w-[62ch] !text-[0.98rem] !leading-relaxed max-[520px]:!text-[0.88rem] max-[520px]:!leading-snug [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
              {lang === "ar"
                ? "اقرأ القرآن الكريم وتدبر معانيه في مساحة أكثر سكينة"
                : lang === "fr"
                  ? "Lisez, méditez, mémorisez - La Parole d'Allah dans toute sa beauté"
                  : "Read, reflect and memorize the Holy Quran in beauty"}
            </p>

            {/* CTAs */}
            <div className="hp2-hero__ctas !mt-5 !flex !flex-wrap gap-3 max-[520px]:!gap-2">
              {hasReadingHistory ? (
                <button
                  className="hp2-btn !h-12 !rounded-2xl !px-5 !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.01] max-[520px]:!w-full max-[520px]:!justify-center"
                  onClick={continueReading}
                >
                  <i className="fas fa-circle-play" />
                  <span className="truncate max-[520px]:max-w-[62vw]">
                    {t("continueReading")}
                  </span>
                  {surahLabel && (
                    <span className="hp2-btn__chip max-[520px]:hidden">
                      {surahLabel.ar}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  className="hp2-btn !h-12 !rounded-2xl !px-5 !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.01] max-[520px]:!w-full max-[520px]:!justify-center"
                  onClick={() => goSurah(1)}
                >
                  <i className="fas fa-book-open" />
                  <span className="truncate max-[520px]:max-w-[62vw]">
                    {lang === "ar"
                      ? "ابدأ القراءة"
                      : lang === "fr"
                        ? "Commencer la lecture"
                        : "Start reading"}
                  </span>
                  <span className="hp2-btn__chip max-[520px]:hidden">
                    الفاتحة
                  </span>
                </button>
              )}
              {hasReadingHistory && (
                <button
                  className="hp2-btn hp2-btn--outline !h-12 !rounded-2xl !px-5 !transition-all !duration-300 hover:!-translate-y-0.5 max-[520px]:!w-full max-[520px]:!justify-center"
                  onClick={() => goSurah(1)}
                >
                  <i className="fas fa-book-open-reader" />
                  <span>{t("startFatiha")}</span>
                </button>
              )}
              <button
                className="hp2-btn hp2-btn--soft !h-12 !rounded-2xl !px-5 !transition-all !duration-300 hover:!-translate-y-0.5 max-[520px]:!w-full max-[520px]:!justify-center"
                onClick={openDuas}
              >
                <i className="fas fa-hands-praying" />
                <span>{t("duas")}</span>
              </button>
            </div>

            {/* Panneau latéral */}
            <aside className="hp2-aside" style={HOME_DEFERRED_SECTION_STYLE}>
              <div className="hp2-panel !rounded-2xl !border !backdrop-blur-md">
                <div className="hp2-panel__tabs">
                  {infoTabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={cn(
                        "hp2-panel__tab",
                        activeInfo === tab.id && "hp2-panel__tab--on",
                      )}
                      onClick={() => selectInfoTab(tab.id)}
                    >
                      <i className={`fas ${tab.icon}`} />
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <span className="hp2-panel__count">{tab.count}</span>
                      )}
                    </button>
                  ))}
                </div>

                <div className="hp2-panel__body">
                  {activeInfo === "bookmarks" &&
                    (bookmarks.length === 0 ? (
                      <EmptyState icon="fa-bookmark" text={t("noBookmarks")} />
                    ) : (
                      bookmarks.slice(0, 10).map((bk) => {
                        const s = SURAHS[bk.surah - 1];
                        return (
                          <button
                            key={bk.id}
                            className="hp2-item"
                            onClick={() => goSurahAyah(bk.surah, bk.ayah)}
                          >
                            <span className="hp2-item__icon">
                              <i className="fas fa-bookmark" />
                            </span>
                            <div className="hp2-item__body">
                              <span className="hp2-item__ar">{s?.ar}</span>
                              <span className="hp2-item__sub">
                                {lang === "fr" ? s?.fr : s?.en} · v.{bk.ayah}
                                {bk.label && <em> � {bk.label}</em>}
                              </span>
                            </div>
                            <i
                              className={`fas fa-chevron-${isRtl ? "left" : "right"} hp2-item__caret`}
                            />
                          </button>
                        );
                      })
                    ))}

                  {activeInfo === "notes" &&
                    (notes.length === 0 ? (
                      <EmptyState icon="fa-pen-line" text={t("noNotes")} />
                    ) : (
                      notes.slice(0, 10).map((note) => {
                        const s = SURAHS[note.surah - 1];
                        return (
                          <button
                            key={note.id}
                            className="hp2-item"
                            onClick={() => goSurahAyah(note.surah, note.ayah)}
                          >
                            <span className="hp2-item__icon">
                              <i className="fas fa-pen-line" />
                            </span>
                            <div className="hp2-item__body">
                              <span className="hp2-item__ar">{s?.ar}</span>
                              <span className="hp2-item__sub">
                                {lang === "fr" ? s?.fr : s?.en} · v.{note.ayah}
                              </span>
                              {note.text && (
                                <span className="hp2-item__excerpt">
                                  {note.text.slice(0, 70)}
                                  {note.text.length > 70 ? "..." : ""}
                                </span>
                              )}
                            </div>
                            <i
                              className={`fas fa-chevron-${isRtl ? "left" : "right"} hp2-item__caret`}
                            />
                          </button>
                        );
                      })
                    ))}

                  {activeInfo === "suggest" && (
                    <>
                      <div className="hp2-suggest-period">
                        <i className={`fas ${suggestionSet.icon}`} />
                        <span>
                          {lang === "ar"
                            ? suggestionSet.period.ar
                            : lang === "fr"
                              ? suggestionSet.period.fr
                              : suggestionSet.period.en}
                        </span>
                      </div>
                      {suggestionSet.surahs.map(
                        ({ n, fr, en, ar: arLabel }) => {
                          const s = SURAHS[n - 1];
                          return (
                            <button
                              key={n}
                              className="hp2-item"
                              onClick={() => goSurah(n)}
                            >
                              <span className="hp2-item__num">{n}</span>
                              <div className="hp2-item__body">
                                <span className="hp2-item__ar">{s.ar}</span>
                                <span className="hp2-item__sub">
                                  {lang === "ar"
                                    ? arLabel
                                    : lang === "fr"
                                      ? fr
                                      : en}
                                </span>
                              </div>
                              <i
                                className={`fas fa-chevron-${isRtl ? "left" : "right"} hp2-item__caret`}
                              />
                            </button>
                          );
                        },
                      )}
                    </>
                  )}
                </div>
              </div>
            </aside>
          </div>

          {/* ���� Droite ���� */}
          <div className="hp2-hero__right !relative !z-10 space-y-3">
            {/* Verset du jour � carte principale droite */}
            <div className="hp2-vod !relative !overflow-hidden !rounded-2xl !border !p-4 !transition-all !duration-300 hover:!scale-[1.01]">
              <div className="pointer-events-none absolute -top-8 right-4 h-24 w-24 rounded-full blur-2xl motion-safe:animate-pulse [animation-duration:8s]" />
              <div className="hp2-vod__head !relative !z-10">
                <span className="hp2-vod__label !rounded-full !border !px-2.5 !py-1">
                  <i className="fas fa-star-and-crescent" />
                  {t("verseOfDay")}
                </span>
                <span className="hp2-vod__date">
                  {now.toLocaleDateString(
                    lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
                    { day: "numeric", month: "short" },
                  )}
                </span>
              </div>
              <p
                className="hp2-vod__text !relative !z-10 !text-[1.45rem] !leading-[1.95] max-[520px]:!text-[1.2rem] max-[520px]:!leading-[1.8]"
                dir="rtl"
              >
                {dailyVerse.text}
              </p>
              {lang === "fr" && dailyVerse.trans_fr && (
                <p className="hp2-vod__trans !relative !z-10 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:3] overflow-hidden">
                  {dailyVerse.trans_fr}
                </p>
              )}
              <span className="hp2-vod__ref !relative !z-10">
                {dailyVerse.ref}
              </span>
              {vodSurahNum && (
                <button
                  className="hp2-vod__btn !relative !z-10 !rounded-xl !border !px-3.5 !py-2 !transition-all !duration-300 hover:!-translate-y-0.5"
                  onClick={() => goSurah(vodSurahNum)}
                >
                  <i className="fas fa-book-open" />
                  {lang === "fr"
                    ? "Lire la sourate"
                    : lang === "ar"
                      ? "اقرأ السورة"
                      : "Read surah"}
                  <i className={`fas fa-arrow-${isRtl ? "left" : "right"}`} />
                </button>
              )}
            </div>

            {/* Carte session active */}
            <div className="hp2-focus-card !rounded-2xl !border !backdrop-blur-md !transition-all !duration-300">
              <div className="hp2-focus-card__head">
                <span className="hp2-focus-card__eyebrow">
                  <i className="fas fa-bolt" />
                  {lang === "fr"
                    ? "Session"
                    : lang === "ar"
                      ? "الجلسة"
                      : "Session"}
                </span>
                <span className="hp2-focus-card__riwaya">{riwayaLabel}</span>
              </div>
              <div className="hp2-focus-card__body">
                <h2 className="hp2-focus-card__title">{readingTarget}</h2>
                {surahLabel && displayMode !== "juz" && (
                  <div className="hp2-focus-card__surah-ar" dir="rtl">
                    {surahLabel.ar}
                  </div>
                )}
              </div>
              <div className="hp2-focus-card__stats">
                <span className="hp2-focus-card__stat">
                  <strong>{bookmarks.length}</strong>
                  <span>{t("bookmarks")}</span>
                </span>
                <span className="hp2-focus-card__stat">
                  <strong>{notes.length}</strong>
                  <span>{t("notes")}</span>
                </span>
                <span className="hp2-focus-card__stat">
                  <strong>{progressPct}%</strong>
                  <span>
                    {lang === "fr"
                      ? "Avancement"
                      : lang === "ar"
                        ? "التقدم"
                        : "Progress"}
                  </span>
                </span>
              </div>
              <div className="hp2-focus-card__progress">
                <div className="hp2-focus-card__progress-bar">
                  <div className="hp2-focus-card__progress-fill h-full w-full">
                    <PercentBar value={progressPct} />
                  </div>
                </div>
              </div>
              <button
                className="hp2-focus-card__cta !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.01]"
                onClick={continueReading}
              >
                <i className="fas fa-circle-play" />
                {hasReadingHistory
                  ? lang === "fr"
                    ? "Continuer"
                    : lang === "ar"
                      ? "متابعة"
                      : "Continue"
                  : lang === "fr"
                    ? "Commencer"
                    : lang === "ar"
                      ? "ابدأ"
                      : "Start"}
              </button>
            </div>

            {/* Prières */}
            <div className="hp2-prayers !rounded-2xl !border !p-3.5 !backdrop-blur-sm">
              <div className="hp2-prayers__head mb-2.5">
                <i className="fas fa-mosque" />
                <span>
                  {lang === "fr"
                    ? "Prières"
                    : lang === "ar"
                      ? "الصلوات"
                      : "Prayers"}
                </span>
              </div>
              <div className="hp2-prayers__list">
                {[
                  {
                    key: "fajr",
                    icon: "fa-star",
                    fr: "Fajr",
                    ar: "الفجر",
                    en: "Fajr",
                    r: [4, 7],
                  },
                  {
                    key: "dhuhr",
                    icon: "fa-sun",
                    fr: "Dhuhr",
                    ar: "الظهر",
                    en: "Dhuhr",
                    r: [12, 15],
                  },
                  {
                    key: "asr",
                    icon: "fa-cloud-sun",
                    fr: "Asr",
                    ar: "العصر",
                    en: "Asr",
                    r: [15, 18],
                  },
                  {
                    key: "maghrib",
                    icon: "fa-cloud-moon",
                    fr: "Maghrib",
                    ar: "المغرب",
                    en: "Maghrib",
                    r: [18, 20],
                  },
                  {
                    key: "isha",
                    icon: "fa-moon",
                    fr: "Ishā",
                    ar: "العشاء",
                    en: "Ishā",
                    r: [20, 4],
                  },
                ].map((p) => {
                  const h = now.getHours();
                  const on =
                    p.r[0] < p.r[1]
                      ? h >= p.r[0] && h < p.r[1]
                      : h >= p.r[0] || h < p.r[1];
                  return (
                    <div
                      key={p.key}
                      className={cn(
                        "hp2-prayer-row",
                        "transition-all duration-300",
                        on && "hp2-prayer-row--on",
                      )}
                    >
                      <i className={`fas ${p.icon}`} />
                      <span className="hp2-prayer-row__name">
                        {p[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}
                      </span>
                      {on && (
                        <span className="hp2-prayer-row__badge">
                          {lang === "fr"
                            ? "Maintenant"
                            : lang === "ar"
                              ? "الآن"
                              : "Now"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ACCES RAPIDE */}
      <nav
        className="hp2-quickbar !relative !z-10 !rounded-2xl !border !px-4 !py-3 !backdrop-blur-md"
        aria-label={t("quickAccess")}
        style={HOME_DEFERRED_SECTION_STYLE}
      >
        <span className="hp2-quickbar__title">
          <i className="fas fa-bolt" />
          {t("quickAccess")}
        </span>
        <div className="hp2-quickbar__track mt-2">
          <button
            className="hp2-qchip hp2-qchip--special !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.02]"
            onClick={openDuas}
          >
            <i className="fas fa-hands-praying" />
            {lang === "ar" ? "أدعية" : lang === "fr" ? "Douas" : "Duas"}
          </button>
          {QUICK_ACCESS.map(({ n, label_fr, label_en }) => {
            const s = SURAHS[n - 1];
            return (
              <button
                key={n}
                className="hp2-qchip !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.02]"
                onClick={() => goSurah(n)}
              >
                <span className="hp2-qchip__ar">{s?.ar}</span>
                <span className="hp2-qchip__sub">
                  {lang === "fr" ? label_fr : lang === "ar" ? s?.ar : label_en}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* BANDE STATS */}

      {/*  GRILLE PRINCIPALE  */}
      <div className="hp2-layout !relative !z-10">
        <div
          className="hp2-stats-strip !relative !z-10 !rounded-2xl !border !p-3"
          style={HOME_DEFERRED_SECTION_STYLE}
        >
          {[
            {
              num: "114",
              icon: "fa-quran",
              labelFr: "Sourates",
              labelEn: "Surahs",
              labelAr: "سور",
            },
            {
              num: "30",
              icon: "fa-layer-group",
              labelFr: "Juz'",
              labelEn: "Juz",
              labelAr: "جزء",
            },
            {
              num: "6 236",
              icon: "fa-star",
              labelFr: "Versets",
              labelEn: "Ayahs",
              labelAr: "آية",
            },
            {
              num: "77 430",
              icon: "fa-font",
              labelFr: "Mots",
              labelEn: "Words",
              labelAr: "كلمة",
            },
          ].map((s, i) => (
            <div
              key={i}
              className="hp2-stats-strip__item !rounded-xl !border !transition-all !duration-300 hover:!-translate-y-0.5"
            >
              <i className={`fas ${s.icon} hp2-stats-strip__icon`} />
              <span className="hp2-stats-strip__num">{s.num}</span>
              <span className="hp2-stats-strip__label">
                {lang === "ar"
                  ? s.labelAr
                  : lang === "fr"
                    ? s.labelFr
                    : s.labelEn}
              </span>
            </div>
          ))}
        </div>
        {/* Colonne sourates */}
        <section className="hp2-content !rounded-2xl !border !p-3.5 !backdrop-blur-md">
          <div className="hp2-toolbar !rounded-xl !border !px-3 !py-2.5">
            {/* Onglets Sourates / Juz */}
            <div className="hp2-segs !rounded-xl !border !p-1">
              <button
                className={cn(
                  "hp2-seg !transition-all !duration-300",
                  activeTab === "surah" && "hp2-seg--on",
                )}
                onClick={() => selectContentTab("surah")}
              >
                <i className="fas fa-align-justify" />
                {t("surahs")}
              </button>
              <button
                className={cn(
                  "hp2-seg !transition-all !duration-300",
                  activeTab === "juz" && "hp2-seg--on",
                )}
                onClick={() => selectContentTab("juz")}
              >
                <i className="fas fa-book-open" />
                {t("juz")}
              </button>
            </div>

            {/* Recherche */}
            {activeTab === "surah" && (
              <div className="hp2-search !rounded-xl !border !backdrop-blur-sm">
                <i className="fas fa-magnifying-glass hp2-search__ico" />
                <input
                  className="hp2-search__input"
                  placeholder={t("search")}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                {filter && (
                  <button
                    className="hp2-search__clear"
                    onClick={() => setFilter("")}
                  >
                    <i className="fas fa-xmark" />
                  </button>
                )}
              </div>
            )}

            {/* Tri + vue */}
            <div className="hp2-toolbar__end">
              <span className="hp2-toolbar__count">
                {activeTab === "surah"
                  ? filteredSurahs.length
                  : JUZ_DATA.length}
                <span>{activeTab === "surah" ? t("surahs") : t("juz")}</span>
              </span>
              {activeTab === "surah" && (
                <button
                  className="hp2-icon-btn hp2-icon-btn--with-label !transition-all !duration-300 hover:!scale-110"
                  onClick={toggleSortDirection}
                  title={sortDir === "asc" ? "Decroissant" : "Croissant"}
                >
                  <i
                    className={`fas fa-sort-${sortDir === "asc" ? "down" : "up"}`}
                  />
                  <span className="hp2-icon-btn__label">
                    {lang === "ar" ? "ترتيب" : lang === "fr" ? "Tri" : "Sort"}
                  </span>
                </button>
              )}
              <button
                className={cn(
                  "hp2-icon-btn hp2-icon-btn--with-label !transition-all !duration-300 hover:!scale-110",
                  viewMode === "grid" && "hp2-icon-btn--on",
                )}
                onClick={() => changeViewMode("grid")}
                title="Grille"
              >
                <i className="fas fa-grip" />
                <span className="hp2-icon-btn__label">
                  {lang === "ar" ? "شبكة" : lang === "fr" ? "Grille" : "Grid"}
                </span>
              </button>
              <button
                className={cn(
                  "hp2-icon-btn hp2-icon-btn--with-label !transition-all !duration-300 hover:!scale-110",
                  viewMode === "list" && "hp2-icon-btn--on",
                )}
                onClick={() => changeViewMode("list")}
                title="Liste"
              >
                <i className="fas fa-list" />
                <span className="hp2-icon-btn__label">
                  {lang === "ar" ? "قائمة" : lang === "fr" ? "Liste" : "List"}
                </span>
              </button>
            </div>
          </div>

          <div
            className={cn(
              "hp2-items !mt-3",
              viewMode === "grid"
                ? "hp2-items--grid !grid !grid-cols-1 lg:!grid-cols-3 !gap-3"
                : "hp2-items--list",
              useSurahGridScroll && "hp2-items--surah-scroll",
            )}
          >
            {activeTab === "surah" ? (
              filteredSurahs.length === 0 ? (
                <EmptyState icon="fa-magnifying-glass" text={t("noResults")} />
              ) : (
                renderedSurahs.map((s, idx) => (
                  <SurahCard
                    key={s.n}
                    surah={s}
                    lang={lang}
                    viewMode={viewMode}
                    onClick={goSurah}
                    onPlay={playFromHome}
                    isActive={s.n === currentSurah && displayMode === "surah"}
                    isPlaying={
                      state.isPlaying && state.currentPlayingAyah?.surah === s.n
                    }
                    animIndex={idx}
                  />
                ))
              )
            ) : (
              JUZ_DATA.map((j, idx) => (
                <JuzCard
                  key={j.juz}
                  juzData={j}
                  lang={lang}
                  viewMode={viewMode}
                  onClick={goJuz}
                  isActive={j.juz === currentJuz && displayMode === "juz"}
                  animIndex={idx}
                />
              ))
            )}
          </div>
          {hasMoreSurahs && (
            <div className="mt-4 !flex !justify-center">
              <button
                ref={loadMoreRef}
                className="hp2-btn hp2-btn--soft !min-h-11 !rounded-2xl !px-5 !transition-all !duration-300 hover:!-translate-y-0.5"
                onClick={loadMoreSurahs}
              >
                <i className="fas fa-arrow-down" />
                <span>
                  {lang === "ar"
                    ? "تحميل المزيد من السور"
                    : lang === "fr"
                      ? "Charger plus de sourates"
                      : "Load more surahs"}
                </span>
                <span className="hp2-btn__chip">
                  {renderedSurahs.length}/{filteredSurahs.length}
                </span>
              </button>
            </div>
          )}
        </section>
      </div>

      {/* FOOTER */}
      <div className="relative z-10" style={HOME_FOOTER_SECTION_STYLE}>
        <Footer goSurah={goSurah} />
      </div>
    </div>
  );
}
