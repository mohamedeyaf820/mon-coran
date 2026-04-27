import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { PercentBar } from "./HomePrimitives";
import {
  computePrayerTimes,
  fetchPrayerTimes,
} from "../../services/prayerTimesService";

/** Données statiques des prières (pas de plages hardcodées) */
const PRAYERS_BASE = [
  { key: "fajr", icon: "fa-star", fr: "Fajr", ar: "الفجر", en: "Fajr" },
  { key: "dhuhr", icon: "fa-sun", fr: "Dhuhr", ar: "الظهر", en: "Dhuhr" },
  { key: "asr", icon: "fa-cloud-sun", fr: "Asr", ar: "العصر", en: "Asr" },
  {
    key: "maghrib",
    icon: "fa-cloud-moon",
    fr: "Maghrib",
    ar: "المغرب",
    en: "Maghrib",
  },
  { key: "isha", icon: "fa-moon", fr: "Ishā", ar: "العشاء", en: "Ishā" },
];

/** Plages horaires de secours utilisées si le service est indisponible */
const FALLBACK_RANGES = {
  fajr: [4, 7],
  dhuhr: [12, 15],
  asr: [15, 18],
  maghrib: [18, 20],
  isha: [20, 4], // franchit minuit
};

/** Parse "HH:MM" → heures décimales */
function parseHHMM(str) {
  if (!str || !str.includes(":")) return null;
  const [h, m] = str.split(":").map(Number);
  return h + m / 60;
}

/**
 * Retourne la clé de la prière courante.
 * Si prayerTimes est null → plages fixes de secours.
 * @param {Date} now
 * @param {{ fajr: string, isha: string } | null} prayerTimes
 * @returns {string|null}
 */
function getCurrentPrayerKey(now, prayerTimes) {
  const h = now.getHours() + now.getMinutes() / 60;

  if (!prayerTimes) {
    for (const [key, r] of Object.entries(FALLBACK_RANGES)) {
      const active =
        r[0] < r[1] ? h >= r[0] && h < r[1] : h >= r[0] || h < r[1];
      if (active) return key;
    }
    return null;
  }

  const fajrH = parseHHMM(prayerTimes.fajr);
  const ishaH = parseHHMM(prayerTimes.isha);
  if (fajrH === null || ishaH === null) return null;

  // Estimations intermédiaires depuis fajr + isha
  const noonH = (fajrH + ishaH) / 2; // midi solaire ≈ milieu entre fajr et isha
  const fajrEnd = fajrH + 1.3; // lever du soleil ≈ fajr + 1h20
  const dhuhrEnd = noonH + 3.5; // fin dhuhr / début asr
  const asrEnd = ishaH - 1.5; // fin asr / début maghrib (coucher ≈ isha - 1h30)

  if (h >= ishaH || h < fajrH) return "isha"; // nuit (franchit minuit)
  if (h >= fajrH && h < fajrEnd) return "fajr";
  if (h >= noonH && h < dhuhrEnd) return "dhuhr";
  if (h >= dhuhrEnd && h < asrEnd) return "asr";
  if (h >= asrEnd && h < ishaH) return "maghrib";
  return null; // entre lever soleil et dhuhr → pas de prière active
}

/**
 * SessionCard — Carte session active + carte prières.
 * Migration complète : toutes les classes hp2-* remplacées par Tailwind CSS pur.
 *
 * Props :
 *   lang                   {string}   "fr" | "ar" | "en"
 *   riwayaLabel            {string}
 *   readingTarget          {string}   texte affiché dans le titre de session
 *   surahLabel             {object}   sourate courante { ar, fr, en }
 *   displayMode            {string}   "surah" | "juz" | "page"
 *   bookmarks              {Array}
 *   notes                  {Array}
 *   progressPct            {number}   0-100
 *   hasReadingHistory      {boolean}
 *   primaryReadingCtaLabel {string}
 *   continueReading        {function}
 *   now                    {Date}
 *   t                      {function} fonction de traduction
 */
export default function SessionCard({
  lang,
  riwayaLabel,
  readingTarget,
  surahLabel,
  displayMode,
  bookmarks,
  notes,
  progressPct,
  hasReadingHistory,
  primaryReadingCtaLabel,
  continueReading,
  now,
  t,
}) {
  const [prayerTimes, setPrayerTimes] = useState(null);

  useEffect(() => {
    // 1. Essayer la géolocalisation du navigateur
    fetchPrayerTimes((result) => {
      if (result) {
        setPrayerTimes(result);
      } else {
        // 2. Fallback : calcul direct pour Paris si pas de géolocalisation
        const parisResult = computePrayerTimes(48.8566, 2.3522);
        if (parisResult) setPrayerTimes(parisResult);
        // 3. Si null (nuit polaire…) → getCurrentPrayerKey utilisera FALLBACK_RANGES
      }
    });
  }, []);

  const currentPrayerKey = getCurrentPrayerKey(now, prayerTimes);

  return (
    <>
      {/* ── Carte session active ──────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[1.4rem] p-[1.4rem_1.5rem] bg-[var(--bg-secondary)] border border-[var(--border)] shadow-[0_4px_20px_rgba(0,0,0,0.06),0_1px_4px_rgba(0,0,0,0.04)] transition-[box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(var(--primary-rgb),0.12),0_2px_8px_rgba(0,0,0,0.06)]">
        {/* Barre gradient animée en haut (remplace le ::before pseudo-element) */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[var(--primary)] via-[#d4a820] to-[var(--primary)]" />

        {/* ── En-tête ── */}
        <div className="flex items-center justify-between mb-[0.9rem]">
          <span className="flex items-center gap-[0.35rem] text-[0.62rem] font-[800] text-[var(--primary)] uppercase tracking-[0.1em] font-[var(--font-ui)]">
            <i className="fas fa-bolt" />
            {lang === "fr" ? "Session" : lang === "ar" ? "الجلسة" : "Session"}
          </span>
          <span className="text-[0.62rem] font-[600] text-[var(--text-muted)] font-[var(--font-ui)] bg-[var(--bg-primary)] px-[0.55rem] py-[0.18rem] rounded-full border border-[var(--border)]">
            {riwayaLabel}
          </span>
        </div>

        {/* ── Corps ── */}
        <div className="mb-4">
          <h2 className="text-[clamp(1.15rem,2vw,1.4rem)] font-[800] text-[var(--text)] m-0 mb-[0.3rem] font-[var(--font-ui)] tracking-[-0.02em] leading-[1.2]">
            {readingTarget}
          </h2>
          {surahLabel && displayMode !== "juz" && (
            <div
              className="font-[var(--font-quran,'Scheherazade_New',serif)] text-[1.4rem] text-[var(--primary)] opacity-70 leading-[2] text-end mt-[0.2rem]"
              dir="rtl"
            >
              {surahLabel.ar}
            </div>
          )}
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {/* Signets */}
          <span className="flex flex-col items-center gap-[0.15rem] px-[0.4rem] py-[0.6rem] bg-[var(--bg-primary)] rounded-[0.85rem] border border-[var(--border-light)] transition-all duration-200 hover:border-[rgba(var(--primary-rgb),0.25)] hover:bg-[rgba(var(--primary-rgb),0.04)]">
            <strong className="text-[1.1rem] font-[800] text-[var(--primary)] font-[var(--font-ui)] leading-none">
              {bookmarks.length}
            </strong>
            <span className="text-[0.58rem] text-[var(--text-muted)] font-[600] uppercase tracking-[0.06em] font-[var(--font-ui)]">
              {t("bookmarks")}
            </span>
          </span>

          {/* Notes */}
          <span className="flex flex-col items-center gap-[0.15rem] px-[0.4rem] py-[0.6rem] bg-[var(--bg-primary)] rounded-[0.85rem] border border-[var(--border-light)] transition-all duration-200 hover:border-[rgba(var(--primary-rgb),0.25)] hover:bg-[rgba(var(--primary-rgb),0.04)]">
            <strong className="text-[1.1rem] font-[800] text-[var(--primary)] font-[var(--font-ui)] leading-none">
              {notes.length}
            </strong>
            <span className="text-[0.58rem] text-[var(--text-muted)] font-[600] uppercase tracking-[0.06em] font-[var(--font-ui)]">
              {t("notes")}
            </span>
          </span>

          {/* Avancement */}
          <span className="flex flex-col items-center gap-[0.15rem] px-[0.4rem] py-[0.6rem] bg-[var(--bg-primary)] rounded-[0.85rem] border border-[var(--border-light)] transition-all duration-200 hover:border-[rgba(var(--primary-rgb),0.25)] hover:bg-[rgba(var(--primary-rgb),0.04)]">
            <strong className="text-[1.1rem] font-[800] text-[var(--primary)] font-[var(--font-ui)] leading-none">
              {progressPct}%
            </strong>
            <span className="text-[0.58rem] text-[var(--text-muted)] font-[600] uppercase tracking-[0.06em] font-[var(--font-ui)]">
              {lang === "fr"
                ? "Avancement"
                : lang === "ar"
                  ? "التقدم"
                  : "Progress"}
            </span>
          </span>
        </div>

        {/* ── Barre de progression ── */}
        <div className="mb-4">
          <div className="h-[5px] bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-light)]">
            <div className="h-full bg-gradient-to-r from-[var(--primary)] to-[#d4a820] rounded-full transition-[width] duration-700 min-w-[4px] shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]">
              <PercentBar value={progressPct} />
            </div>
          </div>
        </div>

        {/* ── Bouton CTA ── */}
        <button
          className="flex items-center justify-center gap-2 w-full py-[0.8rem] rounded-[1rem] bg-[var(--primary)] text-white text-[0.86rem] font-[700] font-[var(--font-ui)] cursor-pointer border-none transition-all duration-200 shadow-[0_3px_12px_rgba(var(--primary-rgb),0.4),inset_0_1px_0_rgba(255,255,255,0.15)] tracking-[0.01em] hover:-translate-y-0.5 hover:shadow-[0_6px_22px_rgba(var(--primary-rgb),0.5)] hover:brightness-105"
          aria-label={primaryReadingCtaLabel}
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

      {/* ── Carte prières ─────────────────────────────────────────────── */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-[1.3rem] p-[1rem_1.1rem] shadow-[0_2px_10px_rgba(0,0,0,0.04)]">
        {/* En-tête prières */}
        <div className="flex items-center gap-[0.45rem] text-[0.7rem] font-[800] text-[var(--text)] mb-[0.75rem] font-[var(--font-ui)] uppercase tracking-[0.06em]">
          <i className="fas fa-mosque" />
          <span>
            {lang === "fr" ? "Prières" : lang === "ar" ? "الصلوات" : "Prayers"}
          </span>
          {/* Indicateur discret quand les heures sont précises */}
          {prayerTimes && (
            <span
              className="ml-auto text-[0.58rem] opacity-40 normal-case tracking-normal font-[var(--font-ui)]"
              title={`Fajr ${prayerTimes.fajr} · Ishā ${prayerTimes.isha}`}
            >
              <i className="fas fa-location-dot mr-0.5" />
              {lang === "ar" ? "دقيق" : lang === "fr" ? "précis" : "exact"}
            </span>
          )}
        </div>

        {/* Liste — grille 5 col sur mobile, colonne verticale sur md+ */}
        <div className="grid grid-cols-5 gap-[0.2rem] md:flex md:flex-col md:gap-[0.25rem]">
          {PRAYERS_BASE.map((p) => {
            const isActive = p.key === currentPrayerKey;

            return (
              <div
                key={p.key}
                className={cn(
                  "flex items-center gap-[0.7rem] px-[0.8rem] py-[0.55rem] rounded-[0.8rem] transition-all duration-200 border border-transparent",
                  isActive &&
                    "bg-[rgba(var(--primary-rgb),0.07)] border-[rgba(var(--primary-rgb),0.2)]",
                )}
              >
                {/* Icône */}
                <i
                  className={cn(
                    `fas ${p.icon}`,
                    "w-[1.6rem] h-[1.6rem] flex items-center justify-center rounded-[0.45rem] bg-[var(--bg-primary)] text-[var(--text-muted)] text-[0.68rem] flex-shrink-0 transition-all duration-200",
                    isActive &&
                      "bg-[rgba(var(--primary-rgb),0.15)] text-[var(--primary)]",
                  )}
                />

                {/* Nom de la prière */}
                <span
                  className={cn(
                    "flex-1 text-[0.78rem] font-[600] text-[var(--text-secondary)] font-[var(--font-ui)]",
                    isActive && "text-[var(--primary)] font-[700]",
                  )}
                >
                  {p[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}
                </span>

                {/* Badge "Maintenant" */}
                {isActive && (
                  <span className="text-[0.58rem] font-[800] text-[var(--primary)] bg-[rgba(var(--primary-rgb),0.12)] px-[0.5rem] py-[0.15rem] rounded-full uppercase tracking-[0.08em] font-[var(--font-ui)] animate-pulse">
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
    </>
  );
}
