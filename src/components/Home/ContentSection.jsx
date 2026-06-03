import { useState } from "react";
import { cn } from "../../lib/utils";
import { JUZ_DATA } from "../../data/juz";
import { THEMATIC_STATIONS } from "../../services/StationService";
import audioService from "../../services/audioService";
import { SurahCard, JuzCard, EmptyState } from "./HomePrimitives";
import { getReciterVisual } from "../../data/reciters";

/**
 * ContentSection — onglets, barre de recherche/tri, grille de contenu,
 * mini-player audio du bas.
 *
 * Props :
 *   lang                   {string}
 *   isRtl                  {boolean}
 *   activeTab              {string}    "surah" | "juz" | "recitations" | "radio" | "blog"
 *   onSelectTab            {function}
 *   filter                 {string}
 *   onFilterChange         {function}
 *   reciterStyleFilter     {string}    "all" | "murattal" | "mujawwad" | "muallim"
 *   onStyleFilterChange    {function}
 *   sortDir                {string}    "asc" | "desc"
 *   onToggleSort           {function}
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
 *   availableReciters      {Array}
 *   resumeState            {object|null}
 *   resumeListening        {function}
 *   t                      {function}  fonction de traduction
 */
export default function ContentSection({
  lang,
  isRtl,
  activeTab,
  onSelectTab,
  filter,
  onFilterChange,
  reciterStyleFilter,
  onStyleFilterChange,
  sortDir,
  onToggleSort,
  viewMode,
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
  goJuz,
  playFromHome,
  playReciterRadio,
  playStation,
  setSelectedReciterId,
  availableReciters,
  resumeState,
  resumeListening,
  onSetAudioSpeed,
  t,
}) {
  const STYLE_FILTERS = [
    { id: "all", label: "Tous" },
    { id: "murattal", label: "Murattal" },
    { id: "mujawwad", label: "Mujawwad" },
    { id: "muallim", label: "Muallim" },
  ];

  // Pagination des récitateurs
  const [showAllReciters, setShowAllReciters] = useState(false);
  const displayedReciters = showAllReciters
    ? filteredReciters
    : filteredReciters.slice(0, 8);

  const refinedCollectionCopy = {
    surah: {
      fr: ["Explorer les sourates", "Une liste claire, rapide a parcourir, avec recherche et tri."],
      en: ["Explore surahs", "A clear, fast list with search and sorting."],
      ar: ["استكشاف السور", "قائمة واضحة وسريعة مع البحث والترتيب."],
    },
    juz: {
      fr: ["Lecture par Juz", "Avance par sections regulieres, pratique pour suivre une khatma."],
      en: ["Read by Juz", "Move through regular sections, useful for khatma tracking."],
      ar: ["القراءة حسب الجزء", "تصفح الاجزاء بسهولة لمتابعة الختمة."],
    },
    recitations: {
      fr: ["Choisir une recitation", "Photos, styles et modes audio sont regroupes pour choisir une voix rapidement."],
      en: ["Choose a recitation", "Photos, styles and audio modes are grouped so you can choose a voice quickly."],
      ar: ["اختر التلاوة", "الصور والانماط واوضاع الصوت مجمعة لاختيار القارئ بسرعة."],
    },
    radio: {
      fr: ["Stations audio", "Lance une station thematique ou une voix favorite en un geste."],
      en: ["Audio stations", "Start a themed station or a favorite voice in one step."],
      ar: ["محطات الاستماع", "شغل محطة موضوعية او صوتا مفضلا بسرعة."],
    },
  };
  const [displayCollectionTitle, displayCollectionSubtitle] =
    refinedCollectionCopy[activeTab]?.[lang] ||
    refinedCollectionCopy[activeTab]?.fr ||
    refinedCollectionCopy.surah.fr;

  return (
    <section className="home-content-section flex flex-col gap-6">
      <div className="home-collection-heading">
        <div className="home-collection-heading__copy">
          <span className="home-collection-heading__eyebrow">
            {activeCollectionCount} {activeCollectionLabel}
          </span>
          <h2>{displayCollectionTitle}</h2>
          <p>{displayCollectionSubtitle}</p>
        </div>
      </div>

      {/* ── Barre d'actions sticky ──────────────────────────────────────── */}
      <div className="home-content-toolbar z-20 flex flex-col md:flex-row items-center gap-3 p-3 rounded-[1.18rem] bg-bg-card/90 border border-border/50 shadow-lg backdrop-blur-xl">
        {/* Onglets */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-secondary border border-border/50 shadow-sm overflow-x-auto w-full md:w-auto no-scrollbar">
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[0.8rem] sm:text-[0.85rem] font-bold text-text-secondary whitespace-nowrap transition-all hover:text-text-primary",
              activeTab === "surah" && "bg-bg-primary text-primary shadow-sm",
            )}
            onClick={() => onSelectTab("surah")}
            aria-pressed={activeTab === "surah"}
          >
            <i className="fas fa-align-justify text-[0.85em] opacity-70" />
            {t("surahs")}
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[0.8rem] sm:text-[0.85rem] font-bold text-text-secondary whitespace-nowrap transition-all hover:text-text-primary",
              activeTab === "juz" && "bg-bg-primary text-primary shadow-sm",
            )}
            onClick={() => onSelectTab("juz")}
            aria-pressed={activeTab === "juz"}
          >
            <i className="fas fa-book-open text-[0.85em] opacity-70" />
            {t("juz")}
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[0.8rem] sm:text-[0.85rem] font-bold text-text-secondary whitespace-nowrap transition-all hover:text-text-primary",
              activeTab === "recitations" &&
                "bg-bg-primary text-primary shadow-sm",
            )}
            onClick={() => onSelectTab("recitations")}
            aria-pressed={activeTab === "recitations"}
          >
            <i className="fas fa-microphone-lines text-[0.85em] opacity-70" />
            {t("recitations")}
          </button>
          <button
            type="button"
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[0.8rem] sm:text-[0.85rem] font-bold text-text-secondary whitespace-nowrap transition-all hover:text-text-primary",
              activeTab === "radio" && "bg-bg-primary text-primary shadow-sm",
            )}
            onClick={() => onSelectTab("radio")}
            aria-pressed={activeTab === "radio"}
          >
            <i className="fas fa-broadcast-tower text-[0.85em] opacity-70" />
            {t("radio")}
          </button>
        </div>

        {/* Recherche */}
        {(activeTab === "surah" || activeTab === "recitations") && (
          <div className="relative flex flex-1 items-center w-full min-w-[200px]">
            <i className="fas fa-magnifying-glass absolute left-3.5 text-[0.9rem] text-text-muted" />
            <input
              className="h-10 sm:h-11 w-full rounded-xl border border-border/70 bg-bg-secondary pl-10 pr-10 text-[0.85rem] sm:text-[0.9rem] text-text-primary outline-none transition-colors focus:border-primary focus:bg-bg-primary focus:ring-1 focus:ring-primary"
              placeholder={
                activeTab === "surah" ? t("search") : t("searchReciter")
              }
              aria-label={
                activeTab === "surah" ? t("search") : t("searchReciter")
              }
              value={filter}
              onChange={(e) => onFilterChange(e.target.value)}
            />
            {filter && (
              <button
                type="button"
                className="absolute right-2 flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full text-[0.8rem] text-text-muted transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                onClick={() => onFilterChange("")}
                aria-label={
                  lang === "fr"
                    ? "Effacer la recherche"
                    : lang === "ar"
                      ? "مسح البحث"
                      : "Clear search"
                }
              >
                <i className="fas fa-xmark" />
              </button>
            )}
          </div>
        )}

        {/* Tri + vue */}
        <div className="flex items-center justify-between gap-3 w-full md:w-auto">
          <span className="text-[0.75rem] font-bold text-text-muted uppercase tracking-wider hidden sm:inline-block">
            {activeCollectionCount} {activeCollectionLabel}
          </span>
          <div className="flex items-center gap-1.5 ml-auto">
            {activeTab === "surah" && (
              <button
                type="button"
                className="flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-bg-secondary border border-border/50 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                onClick={onToggleSort}
                title={sortDir === "asc" ? "Decroissant" : "Croissant"}
                aria-label={
                  sortDir === "asc" ? "Tri décroissant" : "Tri croissant"
                }
              >
                <i
                  className={`fas fa-sort-${sortDir === "asc" ? "down" : "up"} text-[1.1rem]`}
                />
              </button>
            )}
            {(activeTab === "surah" || activeTab === "juz") && (
              <div className="flex items-center gap-1 p-1 rounded-xl bg-bg-secondary border border-border/50 shadow-sm">
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-text-secondary transition-colors hover:text-text-primary",
                    viewMode === "grid" &&
                      "bg-bg-primary text-primary shadow-sm",
                  )}
                  onClick={() => onChangeViewMode("grid")}
                  title="Grille"
                  aria-label="Grille"
                  aria-pressed={viewMode === "grid"}
                >
                  <i className="fas fa-grip" />
                </button>
                <button
                  type="button"
                  className={cn(
                    "flex items-center justify-center h-8 w-8 sm:h-9 sm:w-9 rounded-lg text-text-secondary transition-colors hover:text-text-primary",
                    viewMode === "list" &&
                      "bg-bg-primary text-primary shadow-sm",
                  )}
                  onClick={() => onChangeViewMode("list")}
                  title="Liste"
                  aria-label="Liste"
                  aria-pressed={viewMode === "list"}
                >
                  <i className="fas fa-list" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filtre de style récitateur */}
      {activeTab === "recitations" && (
        <div className="home-style-filters flex flex-wrap items-center gap-2">
          {STYLE_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                "home-style-filter px-3.5 py-1.5 rounded-full text-[0.8rem] font-bold border transition-colors",
                reciterStyleFilter === item.id
                  ? "bg-primary text-white border-primary"
                  : "bg-bg-secondary text-text-secondary border-border hover:bg-bg-tertiary hover:text-text-primary",
              )}
              onClick={() => onStyleFilterChange(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* ── Grille / liste de contenu ───────────────────────────────────── */}
      <div
        className={cn(
          viewMode === "grid"
            ? cn(
                "hp-grid",
                activeTab === "surah" && "hp-grid--surah",
                activeTab === "recitations" && "hp-grid--reciters",
                activeTab === "radio" && "hp-grid--radio",
              )
            : "hp-list",
        )}
      >
        {/* SOURATES */}
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
                isActive={
                  s.n === state.currentSurah && state.displayMode === "surah"
                }
                isPlaying={
                  state.isPlaying && state.currentPlayingAyah?.surah === s.n
                }
                animIndex={idx}
              />
            ))
          )
        ) : /* JUZ */
        activeTab === "juz" ? (
          JUZ_DATA.map((j, idx) => (
            <JuzCard
              key={j.juz}
              juzData={j}
              lang={lang}
              viewMode={viewMode}
              onClick={goJuz}
              isActive={
                j.juz === state.currentJuz && state.displayMode === "juz"
              }
              animIndex={idx}
            />
          ))
        ) : /* RÉCITATEURS */
        activeTab === "recitations" ? (
          filteredReciters.length === 0 ? (
            <EmptyState
              icon="fa-microphone-lines"
              text={
                lang === "fr"
                  ? "Aucun recitateur trouve"
                  : lang === "ar"
                    ? "لا يوجد قارئ مطابق"
                    : "No reciter found"
              }
            />
          ) : (
            <>
              {displayedReciters.map((reciter) => {
                const reciterLabel =
                  lang === "ar"
                    ? reciter.name
                    : lang === "fr"
                      ? reciter.nameFr
                      : reciter.nameEn;
                const isFavorite = (state.favoriteReciters || []).includes(
                  reciter.id,
                );
                const visual = getReciterVisual(reciter);
                const avatar = visual.avatar;

                return (
                  <div
                    key={reciter.id}
                    data-reciter-card="true"
                    className="reciter-card group relative flex min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--border-light)] bg-[var(--bg-card)] p-3.5 shadow-sm transition-all duration-300 animate-fadeInScale hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg sm:p-4"
                  >
                    <div className="reciter-card__top relative z-10 flex min-w-0 items-start gap-3">
                      <button
                        type="button"
                        className="reciter-card__media relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/30 shadow-sm transition-transform duration-300 group-hover:scale-[1.02] sm:h-[72px] sm:w-[72px]"
                        onClick={() => playReciterRadio(reciter)}
                        aria-label={lang === "fr" ? `Écouter ${reciterLabel}` : `Play ${reciterLabel}`}
                      >
                        {visual.photo ? (
                          <img
                            src={visual.photo}
                            alt={reciterLabel}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            loading="lazy"
                          />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center text-lg font-black uppercase tracking-normal text-white"
                            style={{ backgroundColor: avatar.color }}
                          >
                            {avatar.initials}
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--primary)] shadow-md">
                            <i className="fas fa-play text-[0.72rem] pl-[1px]" />
                          </span>
                        </div>
                      </button>

                      <div className="min-w-0 flex-1 text-left">
                        <span
                          className="reciter-card__name line-clamp-2 text-[0.95rem] font-extrabold leading-snug text-text-primary transition-colors duration-200 group-hover:text-primary sm:text-[1rem]"
                          dir={lang === "ar" ? "rtl" : "ltr"}
                        >
                          {reciterLabel}
                        </span>
                        <div className="mt-1.5 flex max-w-full flex-wrap items-center gap-1.5">
                          <span className="reciter-card__chip inline-flex items-center rounded-full border border-[rgba(var(--primary-rgb),0.14)] bg-[rgba(var(--primary-rgb),0.07)] px-2 py-0.5 text-[0.62rem] font-extrabold uppercase tracking-wider text-[var(--primary)]">
                            {reciter.style || "murattal"}
                          </span>
                          {reciter.cdnType === "everyayah" ? (
                            <span className="reciter-card__chip inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-1.5 py-0.5 text-[0.58rem] font-bold text-cyan-600 dark:text-cyan-400">
                              {lang === "fr" ? "Verset" : lang === "ar" ? "آية" : "Ayah"}
                            </span>
                          ) : (
                            <span className="reciter-card__chip inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[0.58rem] font-bold text-amber-600 dark:text-amber-400">
                              {lang === "fr" ? "Sourate" : lang === "ar" ? "سورة" : "Surah"}
                            </span>
                          )}
                          {reciter.verifiedWarsh && (
                            <span className="reciter-card__chip inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[0.58rem] font-bold text-emerald-600 dark:text-emerald-400">
                              Warsh
                            </span>
                          )}
                        </div>
                        {reciter.country && (
                          <div className="mt-2 text-[0.68rem] font-semibold text-text-secondary">
                            {reciter.country}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="my-3 h-px bg-gradient-to-r from-transparent via-[var(--border-light)] to-transparent" />

                    <div className="reciter-card__actions relative z-10 flex flex-wrap items-center justify-between gap-2">
                      <button
                        className={cn(
                          "flex h-9 min-w-0 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-bold transition-all shrink-0 cursor-pointer active:scale-95",
                          isFavorite
                            ? "border border-gold/25 bg-gold/15 text-gold hover:bg-gold/20"
                            : "border border-border/40 bg-bg-secondary text-text-muted hover:bg-bg-tertiary hover:text-text-primary",
                        )}
                        type="button"
                        onClick={() => onToggleFavoriteReciter(reciter.id)}
                      >
                        <i className={`fas ${isFavorite ? "fa-star" : "fa-star-half-stroke"}`} />
                        <span>{isFavorite ? (lang === "fr" ? "Favori" : "Favorite") : (lang === "fr" ? "Ajouter" : "Add")}</span>
                      </button>

                      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
                        <button
                          className="flex h-9 items-center justify-center gap-1 rounded-lg bg-primary px-3 text-xs font-bold text-white transition-all shrink-0 cursor-pointer active:scale-95 hover:bg-primary-dark hover:shadow-md"
                          type="button"
                          onClick={() => playReciterRadio(reciter)}
                        >
                          <i className="fas fa-play text-[0.66rem]" />
                          <span>{lang === "fr" ? "Ecouter" : lang === "ar" ? "\u0627\u0633\u062a\u0645\u0627\u0639" : "Listen"}</span>
                        </button>
                        <button
                          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border/40 bg-bg-secondary text-text-muted transition-all active:scale-95 hover:bg-bg-tertiary hover:text-text-primary"
                          type="button"
                          onClick={() => setSelectedReciterId(reciter.id)}
                          title={lang === "fr" ? "Details du recitateur" : lang === "ar" ? "تفاصيل القارئ" : "Reciter details"}
                          aria-label={lang === "fr" ? "Details du recitateur" : lang === "ar" ? "تفاصيل القارئ" : "Reciter details"}
                        >
                          <i className={`fas fa-chevron-${lang === "ar" ? "left" : "right"} text-xs`} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!showAllReciters && filteredReciters.length > 8 && (
                <button
                  type="button"
                  className="w-full mt-2 py-2.5 text-sm font-semibold text-[var(--primary)] border border-[rgba(var(--primary-rgb),0.3)] rounded-xl hover:bg-[rgba(var(--primary-rgb),0.06)] transition-colors"
                  onClick={() => setShowAllReciters(true)}
                >
                  {lang === "fr"
                    ? `Voir tous les récitateurs (${filteredReciters.length})`
                    : lang === "ar"
                      ? `عرض جميع القراء (${filteredReciters.length})`
                      : `View all reciters (${filteredReciters.length})`}
                </button>
              )}
            </>
          )
        ) : (
          /* RADIO */
          <>
            {THEMATIC_STATIONS.map((station) => (
              <button
                key={station.id}
                className="group relative flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-border bg-bg-primary shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-[2px] hover:border-primary/40 hover:bg-bg-secondary hover:shadow-md animate-fadeInScale"
                type="button"
                onClick={() => playStation(station)}
              >
                <span className="flex items-center justify-center h-9 w-9 rounded-full bg-bg-secondary text-text-secondary border border-border/40 group-hover:text-primary group-hover:border-primary/30 transition-colors">
                  <i className={`fas ${station.icon}`} />
                </span>
                <div className="flex flex-col flex-1 min-w-0">
                  <span
                    className="text-[0.95rem] sm:text-[1.05rem] font-bold text-text-primary text-left truncate"
                    dir={lang === "ar" ? "rtl" : "ltr"}
                  >
                    {lang === "ar"
                      ? station.titleAr
                      : lang === "fr"
                        ? station.titleFr
                        : station.titleEn}
                  </span>
                  <span className="text-[0.7rem] sm:text-[0.75rem] text-text-secondary text-left truncate mt-0.5">
                    {station.surahs.length}{" "}
                    {lang === "fr" ? "sourates" : "surahs"}
                  </span>
                </div>
                <div className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-bg-primary border border-border text-text-muted transition-all hover:bg-primary hover:text-white hover:border-primary shrink-0">
                  <i className="fas fa-circle-play text-[0.8rem] sm:text-[0.9rem] pl-[1px]" />
                </div>
              </button>
            ))}

            {availableReciters.slice(0, 8).map((reciter) => {
              const visual = getReciterVisual(reciter);
              const reciterLabel =
                lang === "ar"
                  ? reciter.name
                  : lang === "fr"
                    ? reciter.nameFr
                    : reciter.nameEn;
              return (
                <button
                  key={`r-${reciter.id}`}
                        className="reciter-radio-card group relative flex min-w-0 items-center gap-3 rounded-xl border border-border bg-bg-primary p-3 shadow-sm transition-all duration-200 animate-fadeInScale hover:-translate-y-[2px] hover:border-primary/40 hover:bg-bg-secondary hover:shadow-md sm:gap-4 sm:p-4"
                  type="button"
                  onClick={() =>
                    playStation({
                      id: `r-${reciter.id}`,
                      icon: "fa-user-astronaut",
                      titleFr: reciter.nameFr,
                      titleEn: reciter.nameEn,
                      titleAr: reciter.name,
                      surahs: [1, 36, 55, 67],
                      reciterId: reciter.id,
                    })
                  }
                >
                  <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-bg-secondary text-sm font-black text-white shadow-sm transition-colors group-hover:border-primary/30 sm:h-12 sm:w-12">
                    {visual.photo ? (
                      <img
                        src={visual.photo}
                        alt={reciterLabel}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span
                        className="flex h-full w-full items-center justify-center"
                        style={{ backgroundColor: visual.avatar.color }}
                      >
                        {visual.avatar.initials}
                      </span>
                    )}
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span
                      className="text-left text-[0.95rem] font-bold leading-snug text-text-primary line-clamp-2 sm:text-[1.05rem]"
                      dir={lang === "ar" ? "rtl" : "ltr"}
                    >
                      {reciterLabel}
                    </span>
                    <span className="mt-0.5 truncate text-left text-[0.7rem] text-text-secondary sm:text-[0.75rem]">
                      4 {lang === "fr" ? "sourates" : "surahs"} · {reciter.style || "murattal"}
                    </span>
                  </div>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-bg-primary text-text-muted transition-all hover:border-primary hover:bg-primary hover:text-white sm:h-10 sm:w-10">
                    <i className="fas fa-circle-play pl-[1px] text-[0.9rem]" />
                  </div>
                </button>
              );
            })}
          </>
        )}
      </div>

      {/* ── Mini-player audio (recitations + radio) ─────────────────────── */}
      {(activeTab === "recitations" || activeTab === "radio") && (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="px-3.5 py-1.5 rounded-full text-[0.8rem] font-bold border border-border bg-bg-secondary text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary disabled:opacity-50 disabled:pointer-events-none"
              onClick={resumeListening}
              disabled={!resumeState}
            >
              {lang === "fr"
                ? "Reprendre l'ecoute"
                : lang === "ar"
                  ? "استئناف الاستماع"
                  : "Resume listening"}
            </button>
            <span className="text-xs opacity-70">
              {resumeState
                ? `S${resumeState.surah} · ${resumeState.source}`
                : lang === "fr"
                  ? "Aucune reprise"
                  : "No resume"}
            </span>
            <span className="text-xs opacity-70">
              {(audioService.playlist || []).length} queued
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-border px-3 py-2">
            {[0.75, 1, 1.25, 1.5].map((speed) => (
              <button
                key={speed}
                type="button"
                className={cn(
                  "px-2.5 py-1 rounded-full text-[0.75rem] font-bold border transition-colors",
                  state.audioSpeed === speed
                    ? "bg-primary text-white border-primary"
                    : "bg-bg-secondary text-text-secondary border-border hover:bg-bg-tertiary hover:text-text-primary",
                )}
                onClick={() => {
                  onSetAudioSpeed?.(speed);
                }}
              >
                {speed}x
              </button>
            ))}
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-secondary text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary ml-auto"
              onClick={() => audioService.prev()}
              aria-label={
                lang === "fr"
                  ? "Piste precedente"
                  : lang === "ar"
                    ? "المقطع السابق"
                    : "Previous track"
              }
            >
              <i className="fas fa-backward-step text-[0.8rem]" />
            </button>
            <button
              type="button"
              className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary text-white transition-colors hover:bg-primary-dark shadow-sm"
              onClick={() => audioService.toggle()}
              aria-label={
                state.isPlaying
                  ? lang === "fr"
                    ? "Pause"
                    : lang === "ar"
                      ? "ايقاف مؤقت"
                      : "Pause"
                  : lang === "fr"
                    ? "Lecture"
                    : lang === "ar"
                      ? "تشغيل"
                      : "Play"
              }
            >
              <i
                className={`fas ${state.isPlaying ? "fa-pause" : "fa-play"} text-[0.9rem] pl-[1px]`}
              />
            </button>
            <button
              type="button"
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-bg-secondary text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
              onClick={() => audioService.next()}
              aria-label={
                lang === "fr"
                  ? "Piste suivante"
                  : lang === "ar"
                    ? "المقطع التالي"
                    : "Next track"
              }
            >
              <i className="fas fa-forward-step text-[0.8rem]" />
            </button>
          </div>
        </div>
      )}

      {/* ── Bouton "charger plus" ────────────────────────────────────────── */}
      {hasMoreSurahs && (
        <div className="mt-6 flex justify-center">
          <button
            ref={loadMoreRef}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-bg-secondary text-text-primary font-bold transition-all hover:-translate-y-0.5 hover:bg-bg-tertiary"
            onClick={loadMoreSurahs}
          >
            <i className="fas fa-arrow-down text-[0.9rem]" />
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
