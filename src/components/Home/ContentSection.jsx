import { memo, useEffect, useState } from "react";
import {
  AlignJustify,
  BookOpen,
  Mic2,
  Radio,
  Search,
  X,
  SortAsc,
  LayoutGrid,
  List,
  Star,
  Play,
  ChevronLeft,
  ChevronRight,
  CirclePlay,
  ArrowDown,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { JUZ_DATA } from "../../data/juz";
import { THEMATIC_STATIONS } from "../../services/StationService";
import { SurahCard, JuzCard, EmptyState } from "./HomePrimitives";
import {
  getReciterCountryLabel,
  getReciterVisual,
} from "../../data/reciters";
import Icon from "./HomeIcon";

const INITIAL_RECITER_COUNT = 8;
const RECITER_BATCH_SIZE = 8;

const ReciterCard = memo(function ReciterCard({
  favoriteReciters,
  isPlaying,
  lang,
  onIntent,
  onOpen,
  onPlay,
  onToggleFavorite,
  reciter,
  t,
}) {
  const reciterLabel =
    lang === "ar"
      ? reciter.name
      : lang === "fr"
        ? reciter.nameFr
        : reciter.nameEn;
  const visual = getReciterVisual(reciter);
  const avatar = visual.avatar;
  const countryLabel = getReciterCountryLabel(reciter, lang);
  const isFavorite = (favoriteReciters || []).includes(reciter.id);
  const favoriteLabel = isFavorite
    ? t("home.removeFavorite", lang)
    : t("home.addFavorite", lang);
  const listenLabel = lang === "fr" ? "Écouter" : lang === "ar" ? "استماع" : "Listen";

  return (
    <article
      data-reciter-card="true"
      data-playing={isPlaying ? "true" : "false"}
      className="reciter-card group"
      style={{ contentVisibility: "auto", containIntrinsicSize: "88px" }}
    >
      <button
        type="button"
        className="reciter-card__main"
        onClick={() => onOpen(reciter.id)}
        onPointerEnter={() => onIntent?.(reciter)}
        onFocus={() => onIntent?.(reciter)}
        aria-label={reciterLabel}
      >
        <div className="reciter-card__media">
          <span
            className="absolute inset-0 flex items-center justify-center text-sm font-black uppercase text-white"
            style={{ background: avatar.gradient }}
            aria-hidden="true"
          >
            {avatar.initials}
          </span>
          {visual.photo ? (
            <img
              src={visual.photo}
              alt=""
              className="reciter-photo absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: visual.focalPoint }}
              loading="lazy"
              decoding="async"
              fetchpriority="low"
              referrerPolicy="no-referrer"
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          ) : null}
          {isPlaying ? (
            <span className="reciter-card__playing" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          ) : null}
        </div>

        <div className="reciter-card__copy">
          <span className="reciter-card__name" dir={lang === "ar" ? "rtl" : "ltr"}>
            {reciterLabel}
          </span>
          <div className="reciter-card__meta">
            <span>{reciter.style || "murattal"}</span>
            {countryLabel ? <span>{countryLabel}</span> : null}
          </div>
        </div>

        {lang === "ar" ? (
          <ChevronLeft className="reciter-card__icon reciter-card__icon--chevron" size={16} aria-hidden="true" />
        ) : (
          <ChevronRight className="reciter-card__icon reciter-card__icon--chevron" size={16} aria-hidden="true" />
        )}
      </button>

      <div className="reciter-card__actions">
        <button
          type="button"
          className={cn(
            "reciter-card__favorite",
            isFavorite && "reciter-card__favorite--active",
          )}
          onClick={() => onToggleFavorite(reciter.id)}
          aria-label={`${favoriteLabel} — ${reciterLabel}`}
          aria-pressed={isFavorite}
        >
          <Star className="reciter-card__icon" size={15} fill={isFavorite ? "currentColor" : "none"} />
        </button>
        <button
          className="reciter-card__listen"
          type="button"
          onClick={() => onPlay(reciter)}
          aria-label={`${listenLabel} — ${reciterLabel}`}
          aria-pressed={isPlaying}
        >
          <Play className="reciter-card__icon reciter-card__icon--play" size={14} fill="currentColor" />
          <span>{isPlaying ? (lang === "fr" ? "En cours" : lang === "ar" ? "يعمل" : "Playing") : listenLabel}</span>
        </button>
      </div>
    </article>
  );
});

/**
 * ContentSection — onglets, barre de recherche/tri et grille de contenu.
 *
 * Props :
 *   lang                   {string}
 *   isRtl                  {boolean}
 *   activeTab              {string}    "surah" | "juz" | "audio"
 *   onSelectTab            {function}
 *   onRecitationsIntent    {function}
 *   onReciterIntent        {function}
 *   filter                 {string}
 *   onFilterChange         {function}
 *   reciterStyleFilter     {string}    "all" | "murattal" | "mujawwad" | "muallim"
 *   onStyleFilterChange    {function}
 *   sortDir                {string}    "asc" | "desc"
 *   onChangeSort           {function}
 *   viewMode               {string}    "grid" | "list"
 *   onChangeViewMode       {function}
 *   activeCollectionCount  {number}
 *   activeCollectionLabel  {string}
 *   filteredSurahs         {Array}
 *   renderedSurahs         {Array}
 *   hasMoreSurahs          {boolean}
 *   loadMoreSurahs         {function}
 *   loadMoreRef            {React.Ref}
 *   filteredReciters       {Array}
 *   onToggleFavoriteReciter {function}
 *   favoriteReciters       {Array}
 *   state                  {object}    AppContext state (isPlaying, currentPlayingAyah, audioSpeed…)
 *   goSurah                {function}
 *   goJuz                  {function}
 *   playFromHome           {function}
 *   playReciterRadio       {function}
 *   playStation            {function}
 *   setSelectedReciterId   {function}
 *   resumeState            {object|null}
 *   resumeListening        {function}
 *   t                      {function}  fonction de traduction
 */
export default function ContentSection({
  lang,
  isRtl,
  activeTab,
  onSelectTab,
  onRecitationsIntent,
  onReciterIntent,
  filter,
  onFilterChange,
  reciterStyleFilter,
  onStyleFilterChange,
  sortDir,
  onChangeSort,
  viewMode,
  isCompactLayout,
  onChangeViewMode,
  activeCollectionCount,
  activeCollectionLabel,
  filteredSurahs,
  renderedSurahs,
  hasMoreSurahs,
  loadMoreSurahs,
  loadMoreRef,
  filteredReciters,
  onToggleFavoriteReciter,
  favoriteReciters,
  state,
  goSurah,
  onSurahIntent,
  goJuz,
  playFromHome,
  playReciterRadio,
  playStation,
  setSelectedReciterId,
  resumeState,
  resumeListening,
  t,
}) {
  const STYLE_FILTERS = [
    { id: "all", label: { fr: "Tous", en: "All", ar: "\u0627\u0644\u0643\u0644" } },
    { id: "murattal", label: { fr: "Murattal", en: "Murattal", ar: "\u0645\u0631\u062a\u0644" } },
    { id: "mujawwad", label: { fr: "Mujawwad", en: "Mujawwad", ar: "\u0645\u062c\u0648\u062f" } },
    { id: "muallim", label: { fr: "Muallim", en: "Muallim", ar: "\u0645\u0639\u0644\u0645" } },
    { id: "favorites", label: { fr: "Favoris", en: "Favorites", ar: "\u0627\u0644\u0645\u0641\u0636\u0644\u0629" } },
  ];

  const [audioView, setAudioView] = useState("reciters");
  const [visibleReciterCount, setVisibleReciterCount] = useState(INITIAL_RECITER_COUNT);
  const displayedReciters = filteredReciters.slice(0, visibleReciterCount);

  useEffect(() => {
    setVisibleReciterCount(INITIAL_RECITER_COUNT);
  }, [audioView, filter, reciterStyleFilter]);

  const refinedCollectionCopy = {
    surah: {
      fr: ["Explorer les sourates", "Une liste claire, rapide à parcourir, avec recherche et tri."],
      en: ["Explore surahs", "A clear, fast list with search and sorting."],
      ar: ["استكشاف السور", "قائمة واضحة وسريعة مع البحث والترتيب."],
    },
    juz: {
      fr: ["Lecture par Juz", "Avance par sections régulières pour retrouver facilement ton parcours."],
      en: ["Read by Juz", "Move through regular sections and easily resume your reading."],
      ar: ["القراءة حسب الجزء", "تصفح الاجزاء بسهولة لمتابعة الختمة."],
    },
    audio: {
      fr: ["Bibliothèque audio", "Choisissez une voix ou lancez une station thématique, sans quitter le même espace."],
      en: ["Audio library", "Choose a voice or start a themed station without leaving the same space."],
      ar: ["المكتبة الصوتية", "اختر قارئًا أو شغّل محطة موضوعية من مكان واحد."],
    },
  };
  const [displayCollectionTitle, displayCollectionSubtitle] =
    refinedCollectionCopy[activeTab]?.[lang] ||
    refinedCollectionCopy[activeTab]?.fr ||
    refinedCollectionCopy.surah.fr;

  return (
    <section className="home-content-section flex flex-col gap-6">
      <div className="home-collection-heading flex items-end justify-between gap-4">
        <div className="home-collection-heading__copy flex w-full flex-wrap items-end justify-between gap-x-5 gap-y-2">
          <div className="home-collection-heading__text min-w-0">
            <h2>{displayCollectionTitle}</h2>
            <p className="text-text-secondary text-[0.85rem] mt-0.5">{displayCollectionSubtitle}</p>
          </div>
          <span className="home-collection-heading__eyebrow inline-flex items-center gap-1.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            {activeCollectionCount} {activeCollectionLabel}
          </span>
        </div>
      </div>

      {/* ── Barre d'actions sticky ──────────────────────────────────────── */}
      <div className="home-content-toolbar z-20 flex flex-col md:flex-row items-center gap-3 p-3 rounded-[1.18rem] bg-bg-card/90 border border-border/50 shadow-lg backdrop-blur-xl">
        {/* Onglets */}
        <div
          role="tablist"
          aria-label={t("home.tabs", lang)}
          className="flex items-center gap-1 p-1 rounded-xl bg-bg-secondary border border-border/50 shadow-sm overflow-x-auto w-full md:w-auto no-scrollbar"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "surah"}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[0.8rem] sm:text-[0.85rem] font-bold text-text-secondary whitespace-nowrap transition-[background-color,color,box-shadow] hover:text-text-primary",
              activeTab === "surah" && "bg-bg-primary text-primary shadow-sm",
            )}
            onClick={() => onSelectTab("surah")}
            onKeyDown={(e) => { if (e.key === "ArrowRight") onSelectTab("juz"); if (e.key === "ArrowLeft") onSelectTab("audio"); }}
          >
            <AlignJustify size={13} className="opacity-70" />
            {t("home.surahs", lang)}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "juz"}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[0.8rem] sm:text-[0.85rem] font-bold text-text-secondary whitespace-nowrap transition-[background-color,color,box-shadow] hover:text-text-primary",
              activeTab === "juz" && "bg-bg-primary text-primary shadow-sm",
            )}
            onClick={() => onSelectTab("juz")}
            onKeyDown={(e) => { if (e.key === "ArrowRight") onSelectTab("audio"); if (e.key === "ArrowLeft") onSelectTab("surah"); }}
          >
            <BookOpen size={13} className="opacity-70" />
            {t("home.juz", lang)}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "audio"}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[0.8rem] sm:text-[0.85rem] font-bold text-text-secondary whitespace-nowrap transition-[background-color,color,box-shadow] hover:text-text-primary",
              activeTab === "audio" &&
                "bg-bg-primary text-primary shadow-sm",
            )}
            onClick={() => onSelectTab("audio")}
            onPointerEnter={onRecitationsIntent}
            onPointerDown={onRecitationsIntent}
            onFocus={onRecitationsIntent}
            onKeyDown={(e) => { if (e.key === "ArrowRight") onSelectTab("surah"); if (e.key === "ArrowLeft") onSelectTab("juz"); }}
          >
            <Radio size={13} className="opacity-70" />
            {lang === "ar" ? "الصوتيات" : lang === "en" ? "Audio" : "Audio"}
          </button>
        </div>

        {/* Recherche */}
        {(activeTab === "surah" || (activeTab === "audio" && audioView === "reciters")) && (
          <div className="relative flex flex-1 items-center w-full min-w-[200px]">
            <Search size={14} className="absolute left-3.5 text-text-muted" />
            <input
              className="h-11 w-full rounded-xl border border-border/70 bg-bg-secondary pl-10 pr-10 text-[0.85rem] sm:text-[0.9rem] text-text-primary outline-none transition-colors focus:border-primary focus:bg-bg-primary focus:ring-1 focus:ring-primary"
              placeholder={
                activeTab === "surah" ? t("search.placeholder", lang) : t("home.searchReciter", lang)
              }
              aria-label={
                activeTab === "surah" ? t("search.placeholder", lang) : t("home.searchReciter", lang)
              }
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
            />
            {filter && (
              <button
                type="button"
                className="absolute right-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-[0.8rem] text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                onClick={() => onFilterChange("")}
                aria-label={t("home.clearSearch", lang)}
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* Tri + vue */}
        <div className="flex items-center justify-between gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 ml-auto">
            {activeTab === "surah" && (
              <label className="home-sort-menu">
                <SortAsc size={14} aria-hidden="true" />
                <span className="sr-only">{lang === "ar" ? "ترتيب السور" : lang === "en" ? "Sort surahs" : "Trier les sourates"}</span>
                <select
                  value={sortDir}
                  onChange={(event) => onChangeSort(event.target.value)}
                  aria-label={lang === "ar" ? "ترتيب السور" : lang === "en" ? "Sort surahs" : "Trier les sourates"}
                >
                  <option value="asc">{lang === "ar" ? "١ ← ١١٤" : "1 → 114"}</option>
                  <option value="desc">{lang === "ar" ? "١١٤ ← ١" : "114 → 1"}</option>
                </select>
              </label>
            )}
            {!isCompactLayout && (activeTab === "surah" || activeTab === "juz") && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-secondary border border-border/50 shadow-sm">
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-text-secondary transition-colors hover:text-text-primary",
                    viewMode === "grid" &&
                      "bg-bg-primary text-primary shadow-sm",
                  )}
                  onClick={() => onChangeViewMode("grid")}
                  title={t("home.grid", lang)}
                  aria-label={t("home.grid", lang)}
                  aria-pressed={viewMode === "grid"}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-text-secondary transition-colors hover:text-text-primary",
                    viewMode === "list" &&
                      "bg-bg-primary text-primary shadow-sm",
                  )}
                  onClick={() => onChangeViewMode("list")}
                  title={t("home.list", lang)}
                  aria-label={t("home.list", lang)}
                  aria-pressed={viewMode === "list"}
                >
                  <List size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === "audio" && (
        <div className="home-audio-browser">
          <div className="home-audio-browser__tabs" role="tablist" aria-label={lang === "ar" ? "أقسام الصوتيات" : lang === "en" ? "Audio sections" : "Sections audio"}>
            <button
              type="button"
              role="tab"
              aria-selected={audioView === "reciters"}
              onClick={() => setAudioView("reciters")}
            >
              <Mic2 size={14} aria-hidden="true" />
              <span>{t("home.recitations", lang)}</span>
              <small>{filteredReciters.length}</small>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={audioView === "stations"}
              onClick={() => setAudioView("stations")}
            >
              <Radio size={14} aria-hidden="true" />
              <span>{t("home.radio", lang)}</span>
              <small>{THEMATIC_STATIONS.length}</small>
            </button>
          </div>

          {audioView === "reciters" && (
            <div className="home-audio-browser__filters">
              <div className="home-style-filters" role="group" aria-label={lang === "ar" ? "نمط التلاوة" : lang === "en" ? "Recitation style" : "Style de récitation"}>
                {STYLE_FILTERS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={cn("home-style-filter", reciterStyleFilter === item.id && "is-active")}
                    onClick={() => onStyleFilterChange(item.id)}
                    aria-pressed={reciterStyleFilter === item.id}
                  >
                    {item.id === "favorites" ? <Star size={12} fill={reciterStyleFilter === item.id ? "currentColor" : "none"} aria-hidden="true" /> : null}
                    {item.label[lang] || item.label.fr}
                  </button>
                ))}
              </div>
              <p className="home-audio-browser__hint">
                {lang === "ar"
                  ? "مرتل: قراءة هادئة · مجود: أداء مزخرف · معلم: للتعلّم"
                  : lang === "en"
                    ? "Murattal: measured · Mujawwad: ornamented · Muallim: learning"
                    : "Murattal : posé · Mujawwad : orné · Muallim : apprentissage"}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Grille / liste de contenu ───────────────────────────────────── */}
      <div
        className={cn(
          viewMode === "grid"
            ? cn(
                "hp-grid",
                activeTab === "surah" && "hp-grid--surah",
                activeTab === "juz" && "hp-grid--juz",
                activeTab === "audio" && audioView === "reciters" && "hp-grid--reciters",
                activeTab === "audio" && audioView === "stations" && "hp-grid--radio",
              )
            : "hp-list",
        )}
      >
        {/* SOURATES */}
        {activeTab === "surah" ? (
          filteredSurahs.length === 0 ? (
            <EmptyState icon="fa-magnifying-glass" text={t("search.noResults", lang)} />
          ) : (
            renderedSurahs.map((s) => (
              <SurahCard
                key={s.n}
                surah={s}
                lang={lang}
                viewMode={viewMode}
                onClick={goSurah}
                onIntent={onSurahIntent}
                onPlay={playFromHome}
                isActive={
                  s.n === state.currentSurah && state.displayMode === "surah"
                }
                isPlaying={
                  state.isPlaying && state.currentPlayingAyah?.surah === s.n
                }
              />
            ))
          )
        ) : /* JUZ */
        activeTab === "juz" ? (
          JUZ_DATA.map((j) => (
            <JuzCard
              key={j.juz}
              juzData={j}
              lang={lang}
              viewMode={viewMode}
              onClick={goJuz}
              isActive={
                j.juz === state.currentJuz && state.displayMode === "juz"
              }
            />
          ))
        ) : /* RÉCITATEURS */
        activeTab === "audio" && audioView === "reciters" ? (
          filteredReciters.length === 0 ? (
            <EmptyState
              icon="fa-microphone-lines"
              text={
                lang === "fr"
                  ? "Aucun récitateur trouvé"
                  : lang === "ar"
                    ? "لا يوجد قارئ مطابق"
                    : "No reciter found"
              }
            />
          ) : (
            <>
              {displayedReciters.map((reciter) => (
                <ReciterCard
                  key={reciter.id}
                  favoriteReciters={favoriteReciters}
                  isPlaying={Boolean(state.isPlaying && state.reciter === reciter.id)}
                  lang={lang}
                  onIntent={onReciterIntent}
                  onOpen={setSelectedReciterId}
                  onPlay={playReciterRadio}
                  onToggleFavorite={onToggleFavoriteReciter}
                  reciter={reciter}
                  t={t}
                />
              ))}
              {visibleReciterCount < filteredReciters.length && (
                <button
                  type="button"
                  className="home-reciter-load-more"
                  onClick={() =>
                    setVisibleReciterCount((current) =>
                      Math.min(filteredReciters.length, current + RECITER_BATCH_SIZE),
                    )
                  }
                >
                  {lang === "fr"
                    ? `Afficher plus de récitateurs (${filteredReciters.length - visibleReciterCount})`
                    : lang === "ar"
                      ? `عرض المزيد من القراء (${filteredReciters.length - visibleReciterCount})`
                      : `Show more reciters (${filteredReciters.length - visibleReciterCount})`}
                </button>
              )}
            </>
          )
        ) : (
          /* STATIONS */
          <>
            {THEMATIC_STATIONS.map((station) => (
              <button
                key={station.id}
                className="home-radio-card home-radio-card--theme"
                type="button"
                onClick={() => playStation(station)}
              >
                <span className="home-radio-card__media">
                  <Icon name={station.icon} aria-hidden="true" />
                </span>
                <div className="home-radio-card__copy">
                  <span
                    className="home-radio-card__title"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                  >
                    {lang === "ar"
                      ? station.titleAr
                      : lang === "fr"
                        ? station.titleFr
                        : station.titleEn}
                  </span>
                  <span className="home-radio-card__meta">
                    {station.surahs.length}{" "}
                    {lang === "ar" ? "سورة" : lang === "fr" ? "sourates" : "surahs"}
                  </span>
                </div>
                <span className="home-radio-card__play" aria-hidden="true">
                  <CirclePlay size={14} className="pl-[1px]" />
                </span>
              </button>
            ))}

          </>
        )}
      </div>

      {/* ── Compact audio utilities ── */}
      {activeTab === "audio" && resumeState && (
        <div className="flex flex-col items-stretch gap-2 rounded-2xl border border-primary/15 bg-bg-card/70 p-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <button
            type="button"
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/8 px-3.5 text-[0.78rem] font-semibold text-primary transition-colors hover:bg-primary/14"
            onClick={resumeListening}
          >
            <Play size={12} fill="currentColor" aria-hidden="true" />
            <span>
              {lang === "fr"
                ? "Reprendre l'écoute"
                : lang === "ar"
                  ? "استئناف الاستماع"
                  : "Resume listening"}
            </span>
            <span className="rounded-full bg-bg-card/80 px-1.5 py-0.5 text-[0.65rem] text-text-muted">
              S{resumeState.surah}
            </span>
          </button>
        </div>
      )}

      {/* ── Bouton "charger plus" ────────────────────────────────────────── */}
      {hasMoreSurahs && (
        <div className="mt-6 flex justify-center">
          <button
            ref={loadMoreRef}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-bg-secondary text-text-primary font-bold transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-bg-tertiary"
            onClick={loadMoreSurahs}
          >
            <ArrowDown size={14} />
            <span className="text-[0.9rem]">
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
  );
}
