import { useState } from "react";
import {
  AlignJustify,
  BookOpen,
  Mic2,
  Radio,
  Search,
  X,
  SortDesc,
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
import audioService from "../../services/audioService";
import { SurahCard, JuzCard, EmptyState } from "./HomePrimitives";
import {
  getReciterCountryLabel,
  getReciterSourceInfo,
  getReciterVisual,
} from "../../data/reciters";
import Icon from "./HomeIcon";

/**
 * ContentSection — onglets, barre de recherche/tri et grille de contenu.
 *
 * Props :
 *   lang                   {string}
 *   isRtl                  {boolean}
 *   activeTab              {string}    "surah" | "juz" | "recitations" | "radio" | "blog"
 *   onSelectTab            {function}
 *   onRecitationsIntent    {function}
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
  onRecitationsIntent,
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
  onSurahIntent,
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
      <div className="home-collection-heading flex items-end justify-between gap-4">
        <div className="home-collection-heading__copy">
          <span className="home-collection-heading__eyebrow inline-flex items-center gap-1.5">
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-primary"
              aria-hidden="true"
            />
            {activeCollectionCount} {activeCollectionLabel}
          </span>
          <h2 className="mt-1">{displayCollectionTitle}</h2>
          <p className="text-text-secondary text-[0.85rem] mt-0.5">{displayCollectionSubtitle}</p>
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
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[0.8rem] sm:text-[0.85rem] font-bold text-text-secondary whitespace-nowrap transition-all hover:text-text-primary",
              activeTab === "surah" && "bg-bg-primary text-primary shadow-sm",
            )}
            onClick={() => onSelectTab("surah")}
            onKeyDown={(e) => { if (e.key === "ArrowRight") onSelectTab("juz"); if (e.key === "ArrowLeft") onSelectTab("radio"); }}
          >
            <AlignJustify size={13} className="opacity-70" />
            {t("home.surahs", lang)}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "juz"}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[0.8rem] sm:text-[0.85rem] font-bold text-text-secondary whitespace-nowrap transition-all hover:text-text-primary",
              activeTab === "juz" && "bg-bg-primary text-primary shadow-sm",
            )}
            onClick={() => onSelectTab("juz")}
            onKeyDown={(e) => { if (e.key === "ArrowRight") onSelectTab("recitations"); if (e.key === "ArrowLeft") onSelectTab("surah"); }}
          >
            <BookOpen size={13} className="opacity-70" />
            {t("home.juz", lang)}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "recitations"}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[0.8rem] sm:text-[0.85rem] font-bold text-text-secondary whitespace-nowrap transition-all hover:text-text-primary",
              activeTab === "recitations" &&
                "bg-bg-primary text-primary shadow-sm",
            )}
            onClick={() => onSelectTab("recitations")}
            onPointerEnter={onRecitationsIntent}
            onFocus={onRecitationsIntent}
            onKeyDown={(e) => { if (e.key === "ArrowRight") onSelectTab("radio"); if (e.key === "ArrowLeft") onSelectTab("juz"); }}
          >
            <Mic2 size={13} className="opacity-70" />
            {t("home.recitations", lang)}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "radio"}
            className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-[0.8rem] sm:text-[0.85rem] font-bold text-text-secondary whitespace-nowrap transition-all hover:text-text-primary",
              activeTab === "radio" && "bg-bg-primary text-primary shadow-sm",
            )}
            onClick={() => onSelectTab("radio")}
            onKeyDown={(e) => { if (e.key === "ArrowRight") onSelectTab("surah"); if (e.key === "ArrowLeft") onSelectTab("recitations"); }}
          >
            <Radio size={13} className="opacity-70" />
            {t("home.radio", lang)}
          </button>
        </div>

        {/* Recherche */}
        {(activeTab === "surah" || activeTab === "recitations") && (
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
                {sortDir === "asc" ? <SortDesc size={17} /> : <SortAsc size={17} />}
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
                activeTab === "juz" && "hp-grid--juz",
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
                onIntent={onSurahIntent}
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
                const sourceInfo = getReciterSourceInfo(reciter);
                const countryLabel = getReciterCountryLabel(reciter, lang);
                const isFavorite = (favoriteReciters || []).includes(reciter.id);
                const favoriteLabel = isFavorite
                  ? t("home.removeFavorite", lang)
                  : t("home.addFavorite", lang);
                const listenLabel =
                  lang === "fr" ? "Écouter" : lang === "ar" ? "استماع" : "Listen";

                return (
                  <article
                    key={reciter.id}
                    data-reciter-card="true"
                    className="reciter-card group"
                  >
                    <button
                      type="button"
                      className="reciter-card__main"
                      onClick={() => setSelectedReciterId(reciter.id)}
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
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                            referrerPolicy="no-referrer"
                            onError={(event) => {
                              event.currentTarget.hidden = true;
                            }}
                          />
                        ) : null}
                      </div>

                      <div className="reciter-card__copy">
                        <span
                          className="reciter-card__name"
                          dir={lang === "ar" ? "rtl" : "ltr"}
                        >
                          {reciterLabel}
                        </span>
                        <div className="reciter-card__meta">
                          <span>{reciter.style || "murattal"}</span>
                          {countryLabel ? <span>{countryLabel}</span> : null}
                          {sourceInfo ? (
                            <span className="reciter-card__source">{sourceInfo.label}</span>
                          ) : null}
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
                        onClick={() => onToggleFavoriteReciter(reciter.id)}
                        aria-label={`${favoriteLabel} — ${reciterLabel}`}
                        aria-pressed={isFavorite}
                      >
                        <Star className="reciter-card__icon" size={15} fill={isFavorite ? "currentColor" : "none"} />
                      </button>
                      <button
                        className="reciter-card__listen"
                        type="button"
                        onClick={() => playReciterRadio(reciter)}
                        aria-label={`${listenLabel} — ${reciterLabel}`}
                      >
                        <Play className="reciter-card__icon reciter-card__icon--play" size={14} fill="currentColor" />
                        <span>{listenLabel}</span>
                      </button>
                    </div>
                  </article>
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

            {availableReciters.slice(0, 8).map((reciter) => {
              const visual = getReciterVisual(reciter);
              const avatar = visual.avatar;
              const reciterLabel =
                lang === "ar"
                  ? reciter.name
                  : lang === "fr"
                    ? reciter.nameFr
                    : reciter.nameEn;
              return (
                <button
                  key={`r-${reciter.id}`}
                  className="home-radio-card home-radio-card--reciter"
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
                  <span className="home-radio-card__media home-radio-card__media--photo">
                    <span
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: avatar.gradient }}
                      aria-hidden="true"
                    >
                      {avatar.initials}
                    </span>
                    {visual.photo ? (
                      <img
                        src={visual.photo}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(event) => {
                          event.currentTarget.hidden = true;
                        }}
                      />
                    ) : null}
                  </span>
                  <div className="home-radio-card__copy">
                    <span
                      className="home-radio-card__title"
                      dir={lang === "ar" ? "rtl" : "ltr"}
                    >
                      {reciterLabel}
                    </span>
                    <span className="home-radio-card__meta">
                      {lang === "ar" ? "٤" : "4"} {lang === "ar" ? "سور" : lang === "fr" ? "sourates" : "surahs"} · {reciter.style || "murattal"}
                    </span>
                  </div>
                  <span className="home-radio-card__play" aria-hidden="true">
                    <CirclePlay size={14} className="pl-[1px]" />
                  </span>
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
            <Play size={11} className="text-primary" />
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
