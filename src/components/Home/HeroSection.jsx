import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bookmark,
  ChevronRight,
  CirclePlay,
  Feather,
  HandHeart,
  Headphones,
  ListMusic,
  Sparkles,
  StickyNote,
} from "lucide-react";
import SURAHS, { getSurahLigature } from "../../data/surahs";
import PlatformLogo from "../PlatformLogo";

function localText(lang, fr, en, ar) {
  if (lang === "ar") return ar;
  return lang === "en" ? en : fr;
}

function TodaySuggestion({ isRtl, lang, onClick, onIntent, surah }) {
  const data = SURAHS[surah.n - 1] || surah;
  const ligature = getSurahLigature(surah.n);
  const label = lang === "ar" ? data.ar : lang === "en" ? data.en : data.fr;

  return (
    <button
      type="button"
      className="home-today-suggestion"
      onClick={onClick}
      onPointerEnter={onIntent}
      onFocus={onIntent}
      onTouchStart={onIntent}
      aria-label={`${label}, ${surah.n}`}
    >
      <span className="home-today-suggestion__number">{surah.n}</span>
      <span className="home-today-suggestion__copy">
        <strong>{label}</strong>
        <small>
          {localText(lang, "Lecture suggérée", "Suggested reading", "قراءة مقترحة")}
        </small>
      </span>
      <span
        className="home-today-suggestion__arabic font-surah-names"
        aria-hidden="true"
        dir={ligature ? "ltr" : "rtl"}
        lang={ligature ? "en" : "ar"}
      >
        {ligature || data.ar}
      </span>
      <span className="home-today-suggestion__arrow" aria-hidden="true">
        {isRtl ? <ArrowLeft size={13} /> : <ArrowRight size={13} />}
      </span>
    </button>
  );
}

export default function HeroSection({
  lang,
  isRtl,
  now,
  riwayaLabel,
  greeting,
  hasReadingHistory,
  primaryReadingCtaLabel,
  surahLabel,
  readingTarget,
  bookmarks,
  notes,
  playlists,
  continueReading,
  goSurah,
  onWarmSurah,
  openLibrary,
  openDuas,
  resumeListening,
  resumeState,
  suggestionSet,
  dailyVerse,
  vodSurahNum,
  vodAyahNum,
}) {
  const locale = lang === "ar" ? "ar-SA" : lang === "en" ? "en-GB" : "fr-FR";
  const greetingLabel = greeting[lang === "ar" ? "ar" : lang === "en" ? "en" : "fr"];
  const surahLigature = getSurahLigature(surahLabel?.n);
  const resumeTitle = hasReadingHistory
    ? localText(lang, "Reprendre votre lecture", "Continue reading", "متابعة القراءة")
    : localText(lang, "Commencer votre lecture", "Start reading", "ابدأ القراءة");

  return (
    <section className="home-overview" aria-labelledby="home-resume-title">
      <article className="home-resume-panel">
        <div className="home-resume-panel__glow" aria-hidden="true" />
        <div className="home-resume-panel__watermark" aria-hidden="true">
          {surahLigature || surahLabel?.ar}
        </div>

        <header className="home-resume-panel__header">
          <div className="home-resume-panel__brand" aria-label="MushafPlus">
            <PlatformLogo
              className="home-resume-panel__logo"
              imgClassName="h-full w-full object-cover"
              decorative
            />
            <span>MushafPlus</span>
          </div>
          <div className="home-resume-panel__meta">
            <span className="home-resume-panel__greeting">
              <Sparkles size={12} aria-hidden="true" />
              {greetingLabel}
            </span>
            <time dateTime={now.toISOString()}>
              {now.toLocaleDateString(locale, {
                weekday: "short",
                day: "numeric",
                month: "short",
              })}
            </time>
          </div>
        </header>

        <div className="home-resume-panel__body">
          <span className="home-resume-panel__eyebrow">
            <Feather size={12} aria-hidden="true" />
            {riwayaLabel}
          </span>
          <h1 id="home-resume-title">{resumeTitle}</h1>
          <div className="home-resume-panel__target">
            <strong>{readingTarget}</strong>
            {surahLabel ? (
              <span
                className="font-surah-names"
                aria-label={surahLabel.ar}
                role="img"
                dir={surahLigature ? "ltr" : "rtl"}
                lang={surahLigature ? "en" : "ar"}
              >
                <span aria-hidden="true">{surahLigature || surahLabel.ar}</span>
              </span>
            ) : null}
          </div>

          <nav
            className="home-resume-panel__library"
            aria-label={localText(lang, "Bibliothèque personnelle", "Personal library", "المكتبة الشخصية")}
          >
            <button type="button" onClick={() => openLibrary("favorites")}>
              <Bookmark size={13} aria-hidden="true" />
              <span><strong>{bookmarks.length}</strong> {localText(lang, "Favoris", "Saved", "محفوظ")}</span>
              <ChevronRight size={12} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => openLibrary("notes")}>
              <StickyNote size={13} aria-hidden="true" />
              <span><strong>{notes.length}</strong> {localText(lang, "Notes", "Notes", "ملاحظات")}</span>
              <ChevronRight size={12} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => openLibrary("playlists")}>
              <ListMusic size={13} aria-hidden="true" />
              <span><strong>{playlists.length}</strong> {localText(lang, "Listes", "Lists", "قوائم")}</span>
              <ChevronRight size={12} aria-hidden="true" />
            </button>
          </nav>
        </div>

        <footer className="home-resume-panel__actions">
          <button
            type="button"
            className="home-resume-panel__primary"
            aria-label={`${primaryReadingCtaLabel}: ${readingTarget}`}
            onClick={hasReadingHistory ? continueReading : () => goSurah(1)}
            onPointerEnter={() => onWarmSurah(hasReadingHistory ? undefined : 1)}
            onFocus={() => onWarmSurah(hasReadingHistory ? undefined : 1)}
          >
            {hasReadingHistory ? <CirclePlay size={16} aria-hidden="true" /> : <BookOpen size={16} aria-hidden="true" />}
            <span>{primaryReadingCtaLabel}</span>
            {isRtl ? <ArrowLeft size={14} aria-hidden="true" /> : <ArrowRight size={14} aria-hidden="true" />}
          </button>
          {resumeState && resumeListening ? (
            <button type="button" className="home-resume-panel__secondary" onClick={resumeListening}>
              <Headphones size={15} aria-hidden="true" />
              <span>{localText(lang, "Reprendre l'écoute", "Resume listening", "استئناف الاستماع")}</span>
            </button>
          ) : (
            <button type="button" className="home-resume-panel__secondary" onClick={openDuas}>
              <HandHeart size={15} aria-hidden="true" />
              <span>{localText(lang, "Invocations", "Supplications", "الأدعية")}</span>
            </button>
          )}
        </footer>
      </article>

      <aside className="home-today-panel" aria-labelledby="home-today-title">
        <header className="home-today-panel__header">
          <span>
            <Sparkles size={13} aria-hidden="true" />
            <strong id="home-today-title">{localText(lang, "Aujourd’hui", "Today", "اليوم")}</strong>
          </span>
          <small>
            {suggestionSet.period?.[lang === "ar" ? "ar" : lang === "en" ? "en" : "fr"]}
          </small>
        </header>

        <button
          type="button"
          className="home-today-verse"
          onClick={() => vodSurahNum && goSurah(vodSurahNum, vodAyahNum)}
          disabled={!vodSurahNum}
        >
          <span className="home-today-verse__label">
            {localText(lang, "Verset du jour", "Verse of the day", "آية اليوم")}
          </span>
          <span className="home-today-verse__arabic" dir="rtl" lang="ar">
            {dailyVerse.text}
          </span>
          {lang === "fr" && dailyVerse.trans_fr ? (
            <span className="home-today-verse__translation">{dailyVerse.trans_fr}</span>
          ) : lang === "en" && dailyVerse.trans_en ? (
            <span className="home-today-verse__translation">{dailyVerse.trans_en}</span>
          ) : null}
          <span className="home-today-verse__reference">
            {dailyVerse.ref}
            {isRtl ? <ArrowLeft size={12} aria-hidden="true" /> : <ArrowRight size={12} aria-hidden="true" />}
          </span>
        </button>

        <div className="home-today-panel__suggestions" aria-label={localText(lang, "Suggestions de lecture", "Reading suggestions", "اقتراحات القراءة")}>
          {suggestionSet.surahs.slice(0, 5).map((surah) => (
            <TodaySuggestion
              key={surah.n}
              isRtl={isRtl}
              lang={lang}
              surah={surah}
              onClick={() => goSurah(surah.n)}
              onIntent={() => onWarmSurah(surah.n)}
            />
          ))}
        </div>
      </aside>
    </section>
  );
}
