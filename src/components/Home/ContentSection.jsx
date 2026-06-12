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
    { id: "all", label: { fr: "Tous", en: "All", ar: "\u0627\u0644\u0643\u0644" } },
    { id: "murattal", label: { fr: "Murattal", en: "Murattal", ar: "\u0645\u0631\u062a\u0644" } },
    { id: "mujawwad", label: { fr: "Mujawwad", en: "Mujawwad", ar: "\u0645\u062c\u0648\u062f" } },
    { id: "muallim", label: { fr: "Muallim", en: "Muallim", ar: "\u0645\u0639\u0644\u0645" } },
  ];

  // Pagination des récitateurs
  const [showAllReciters, setShowAllReciters] = useState(false);
  const displayedReciters = showAllReciters
    ? filteredReciters
    : filteredReciters.slice(0, 8);

  const refinedCollectionCopy = {
    surah: {
      fr: ["Explorer les sourates", "Une liste claire, rapide à parcourir, avec recherche et tri."],
      en: ["Explore surahs", "A clear, fast list with search and sorting."],
      ar: ["استكشاف السور", "قائمة واضحة وسريعة مع البحث والترتيب."],
    },
    juz: {
      fr: ["Lecture par Juz", "Avance par sections régulières, pratique pour suivre une khatma."],
      en: ["Read by Juz", "Move through regular sections, useful for khatma tracking."],
      ar: ["القراءة حسب الجزء", "تصفح الاجزاء بسهولة لمتابعة الختمة."],
    },
    recitations: {
      fr: ["Choisir une récitation", "Photos, styles et modes audio sont regroupés pour choisir une voix rapidement."],
      en: ["Choose a recitation", "Photos, styles and audio modes are grouped so you can choose a voice quickly."],
      ar: ["اختر التلاوة", "الصور والانماط واوضاع الصوت مجمعة لاختيار القارئ بسرعة."],
    },
    radio: {
      fr: ["Stations audio", "Lance une station thématique ou une voix favorite en un geste."],
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
            {t("home.surahs", lang)}
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
            {t("home.juz", lang)}
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
            {t("home.recitations", lang)}
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
            {t("home.radio", lang)}
          </button>
        </div>

        {/* Recherche */}
        {(activeTab === "surah" || activeTab === "recitations") && (
          <div className="relative flex flex-1 items-center w-full min-w-[200px]">
            <i className="fas fa-magnifying-glass absolute left-3.5 text-[0.9rem] text-text-muted" />
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
                className="flex items-center justify-center h-11 w-11 rounded-xl bg-bg-secondary border border-border/50 text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
                onClick={onToggleSort}
                title={sortDir === "asc" ? t("home.sortDesc", lang) : t("home.sortAsc", lang)}
                aria-label={sortDir === "asc" ? t("home.sortDesc", lang) : t("home.sortAsc", lang)}
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
                  title={t("home.grid", lang)}
                  aria-label={t("home.grid", lang)}
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
                  title={t("home.list", lang)}
                  aria-label={t("home.list", lang)}
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
              {item.label[lang] || item.label.fr}
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
            <EmptyState icon="fa-magnifying-glass" text={t("search.noResults", lang)} />
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
                  ? "Aucun récitateur trouvé"
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
                const visual = getReciterVisual(reciter);
                const avatar = visual.avatar;
                const isFavorite = (favoriteReciters || []).includes(reciter.id);

                return (
                  <button
                    key={reciter.id}
                    data-reciter-card="true"
                    type="button"
                    className="reciter-card group flex w-full items-center gap-3 rounded-xl border-b border-border/60 bg-transparent px-2 py-3 text-left transition-all duration-200 active:scale-[0.98]"
                    onClick={() => setSelectedReciterId(reciter.id)}
                  >
                    {/* Avatar */}
                    <div className="reciter-card__media relative h-12 w-12 shrink-0 overflow-hidden rounded-full shadow-sm">
                      {visual.photo ? (
                        <img
                          src={visual.photo}
                          alt={reciterLabel}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div
                          className="flex h-full w-full items-center justify-center text-sm font-black uppercase text-white"
                          style={{ background: avatar.gradient }}
                        >
                          {avatar.initials}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <span
                        className="reciter-card__name block truncate text-[0.88rem] font-bold text-text-primary group-hover:text-primary transition-colors"
                        dir={lang === "ar" ? "rtl" : "ltr"}
                      >
                        {reciterLabel}
                      </span>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="text-[0.7rem] text-text-muted">
                          {reciter.style || "murattal"}
                        </span>
                        {reciter.country && (
                          <>
                            <span className="text-[0.5rem] text-text-muted/50">·</span>
                            <span className="text-[0.7rem] text-text-muted">
                              {reciter.country}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      className="flex shrink-0 items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Favori */}
                      <button
                        type="button"
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg border transition-all active:scale-95",
                          isFavorite
                            ? "border-amber-400/40 bg-amber-50 text-amber-500 dark:bg-amber-900/20"
                            : "border-border bg-transparent text-text-muted hover:text-amber-400",
                        )}
                        onClick={() => onToggleFavoriteReciter(reciter.id)}
                        aria-label={isFavorite ? t("home.removeFavorite", lang) : t("home.addFavorite", lang)}
                        aria-pressed={isFavorite}
                      >
                        <i className={`fas fa-star text-[0.6rem]`} />
                      </button>
                      {/* Écouter */}
                      <button
                        className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[0.7rem] font-bold text-white transition-all hover:bg-primary-dark active:scale-95"
                        type="button"
                        onClick={() => playReciterRadio(reciter)}
                      >
                        <i className="fas fa-play text-[0.6rem]" />
                        <span className="hidden sm:inline">{lang === "fr" ? "Écouter" : lang === "ar" ? "استماع" : "Listen"}</span>
                      </button>
                      <i className={`fas fa-chevron-${lang === "ar" ? "left" : "right"} text-[0.65rem] text-text-muted`} />
                    </div>
                  </button>
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

      {/* ── Audio speed controls (recitations) ── */}
      {activeTab === "recitations" && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="text-[0.72rem] text-text-muted">
            {lang === "fr" ? "Vitesse" : lang === "ar" ? "السرعة" : "Speed"}
          </span>
          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => {
            const isActive = (state?.audioSpeed ?? 1) === speed;
            return (
              <button
                key={speed}
                type="button"
                className={cn(
                  "rounded-md px-2 py-1 text-[0.7rem] font-bold transition-all active:scale-95",
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "border border-border bg-transparent text-text-muted hover:border-primary/40 hover:text-text-primary",
                )}
                onClick={() => onSetAudioSpeed(speed)}
                aria-pressed={isActive}
                aria-label={`${speed}x`}
              >
                {speed}x
              </button>
            );
          })}
        </div>
      )}

      {/* ── Resume listening button (recitations + radio) ── */}
      {(activeTab === "recitations" || activeTab === "radio") && resumeState && (
        <div className="mt-3 flex justify-center">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-[0.8rem] font-semibold border border-border bg-bg-secondary text-text-primary transition-colors hover:bg-bg-tertiary"
            onClick={resumeListening}
          >
            <i className="fas fa-play text-primary text-[0.65rem]" />
            {lang === "fr"
              ? "Reprendre l'écoute"
              : lang === "ar"
                ? "استئناف الاستماع"
                : "Resume listening"}
            <span className="text-[0.7rem] text-text-muted">
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
