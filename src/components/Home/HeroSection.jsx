import { cn } from "../../lib/utils";
import SURAHS from "../../data/surahs";
import { HOME_DEFERRED_SECTION_STYLE } from "./homeConstants";
import PlatformLogo from "../PlatformLogo";
import { EmptyState } from "./HomePrimitives";

/**
 * HeroSection — section hp2-hero complète.
 *
 * Contient :
 *  - Orbes / anneaux décoratifs
 *  - Bloc gauche : salutation, bismillah, brand, tagline, CTAs
 *  - Aside InfoPanel : onglets suggestions / favoris / notes
 *  - Colonne droite : `children` (DailyVerseCard + SessionCard)
 */
export default function HeroSection({
  lang,
  isRtl,
  now,
  riwayaLabel,
  currentPrayer,
  greeting,
  shouldReduceHomeFx,
  hasReadingHistory,
  primaryReadingCtaLabel,
  surahLabel,
  continueReading,
  goSurah,
  openDuas,
  t,
  /* InfoPanel */
  activeInfo,
  onSelectInfo,
  infoTabs,
  bookmarks,
  notes,
  suggestionSet,
  goSurahAyah,
  /* Colonne droite */
  children,
}) {
  return (
    <section className="relative z-10 overflow-hidden rounded-[28px] border border-border/75 bg-bg-primary px-4 py-6 sm:px-6 sm:py-8 lg:p-10 shadow-lg">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />

      {/* Anneaux tournants */}
      {!shouldReduceHomeFx && (
        <>
          <div className="pointer-events-none absolute -top-12 right-[14%] h-28 w-28 rounded-full border border-white/15 opacity-35 motion-safe:animate-spin [animation-duration:16s]" />
          <div className="pointer-events-none absolute -bottom-14 left-[44%] h-36 w-36 rounded-full border opacity-30 motion-safe:animate-spin [animation-direction:reverse] [animation-duration:22s]" />
        </>
      )}

      {/* Orbes décoratifs */}
      {!shouldReduceHomeFx && (
        <>
          <div
            className="absolute -top-20 -left-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl opacity-65 motion-safe:animate-pulse [animation-duration:9s]"
            aria-hidden="true"
          />
          <div
            className="absolute top-1/2 -right-20 h-72 w-72 -translate-y-1/2 rounded-full bg-emerald/10 blur-3xl opacity-60 motion-safe:animate-pulse [animation-duration:12s]"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-32 left-1/4 h-80 w-80 rounded-full bg-gold/10 blur-3xl opacity-55 motion-safe:animate-pulse [animation-duration:10s]"
            aria-hidden="true"
          />
        </>
      )}

      <div className="relative z-10 flex flex-col lg:grid lg:grid-cols-[1fr_380px] xl:grid-cols-[1fr_420px] gap-8 xl:gap-12">
        {/* ── Gauche ─────────────────────────────────────────────────────── */}
        <div className="flex flex-col">
          {/* Salutation + date */}
          <div className="flex items-center gap-3 mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[0.71rem] font-bold uppercase tracking-[0.12em] text-primary">
              <i className={`fas ${currentPrayer.icon}`} />
              <span>
                {greeting[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}
              </span>
            </div>
            <span className="rounded-full bg-bg-secondary/80 px-3 py-1.5 text-[0.72rem] font-medium text-text-secondary backdrop-blur-sm border border-border/50">
              {now.toLocaleDateString(
                lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
                { weekday: "short", day: "numeric", month: "short" },
              )}
            </span>
          </div>

          {/* Titre principal avec bismillah intégrée */}
          <div className="flex flex-col gap-2 relative">
            <div
              className="absolute -top-8 right-0 text-4xl opacity-20 font-quran select-none pointer-events-none"
              aria-hidden="true"
              dir="rtl"
            >
              ﷽
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 max-[520px]:gap-2.5 mt-2">
              <PlatformLogo
                className="h-16 w-16 sm:h-[84px] sm:w-[84px] rounded-2xl sm:rounded-3xl shadow-sm shrink-0"
                imgClassName="h-10 w-10 sm:h-[62px] sm:w-[62px] object-cover"
                decorative
              />
              <div className="flex flex-col">
                <h1 className="text-[clamp(1.75rem,5vw,2.5rem)] font-black tracking-tight text-text-primary break-words leading-none mb-2">
                  MushafPlus
                </h1>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-secondary px-3 py-1 text-[0.74rem] font-semibold text-text-secondary border border-border/40 backdrop-blur-sm">
                    <i className="fas fa-feather-pointed text-[0.7rem]" />
                    {riwayaLabel}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-bg-secondary px-3 py-1 text-[0.74rem] font-semibold text-text-secondary border border-border/40 backdrop-blur-sm">
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

          {/* Tagline */}
          <p className="mt-4 max-w-[62ch] text-[0.95rem] sm:text-[1.05rem] text-text-secondary leading-relaxed max-[520px]:text-[0.88rem] max-[520px]:leading-snug line-clamp-3">
            {lang === "ar"
              ? "اقرأ القرآن الكريم وتدبر معانيه في مساحة أكثر سكينة"
              : lang === "fr"
                ? "Lisez, méditez, mémorisez - La Parole d'Allah dans toute sa beauté"
                : "Read, reflect and memorize the Holy Quran in beauty"}
          </p>

          {/* CTAs */}
          <div className="mt-6 flex flex-wrap items-center gap-3 max-[520px]:gap-2">
            {hasReadingHistory ? (
              <button
                className="inline-flex items-center gap-2.5 h-12 rounded-2xl bg-primary px-5 text-[0.9rem] font-bold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-primary-dark max-[520px]:w-full max-[520px]:justify-center"
                aria-label={primaryReadingCtaLabel}
                onClick={continueReading}
              >
                <i className="fas fa-circle-play text-[1.1rem]" />
                <span className="truncate max-[520px]:max-w-[62vw]">
                  {t("continueReading")}
                </span>
                {surahLabel && (
                  <span className="ml-1 rounded-md bg-white/20 px-2 py-0.5 text-[0.75rem] max-[520px]:hidden">
                    {surahLabel.ar}
                  </span>
                )}
              </button>
            ) : (
              <button
                className="inline-flex items-center gap-2.5 h-12 rounded-2xl bg-primary px-5 text-[0.9rem] font-bold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-primary-dark max-[520px]:w-full max-[520px]:justify-center"
                aria-label={primaryReadingCtaLabel}
                onClick={() => goSurah(1)}
              >
                <i className="fas fa-book-open text-[1.1rem]" />
                <span className="truncate max-[520px]:max-w-[62vw]">
                  {lang === "ar"
                    ? "ابدأ القراءة"
                    : lang === "fr"
                      ? "Commencer la lecture"
                      : "Start reading"}
                </span>
                <span className="ml-1 rounded-md bg-white/20 px-2 py-0.5 text-[0.75rem] max-[520px]:hidden">
                  الفاتحة
                </span>
              </button>
            )}

            {hasReadingHistory && (
              <button
                className="inline-flex items-center gap-2 h-12 rounded-2xl border-2 border-primary/20 bg-transparent px-5 text-[0.9rem] font-bold text-primary transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 max-[520px]:w-full max-[520px]:justify-center"
                onClick={() => goSurah(1)}
              >
                <i className="fas fa-book-open-reader text-[1.05rem]" />
                <span>{t("startFatiha")}</span>
              </button>
            )}

            <button
              className="inline-flex items-center gap-2 h-12 rounded-2xl bg-bg-secondary px-5 text-[0.9rem] font-bold text-text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-bg-tertiary max-[520px]:w-full max-[520px]:justify-center"
              onClick={openDuas}
            >
              <i className="fas fa-hands-praying" />
              <span>{t("duas")}</span>
            </button>
          </div>

          {/* Aside — InfoPanel */}
          <aside
            className="mt-8 hidden lg:block"
            style={HOME_DEFERRED_SECTION_STYLE}
          >
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-bg-secondary/40 backdrop-blur-md">
              {/* Onglets */}
              <div className="flex items-center border-b border-border/50 overflow-x-auto no-scrollbar">
                {infoTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 text-[0.85rem] font-semibold text-text-secondary transition-colors whitespace-nowrap border-b-2 border-transparent hover:text-text-primary",
                      activeInfo === tab.id &&
                        "border-primary text-primary bg-primary/5",
                    )}
                    onClick={() => onSelectInfo(tab.id)}
                  >
                    <i className={`fas ${tab.icon} text-[0.9rem]`} />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="flex items-center justify-center min-w-[20px] h-5 rounded-full bg-primary/10 px-1.5 text-[0.65rem] font-bold text-primary">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Corps */}
              <div className="flex flex-col max-h-[320px] overflow-y-auto p-2 no-scrollbar">
                {/* Favoris */}
                {activeInfo === "bookmarks" &&
                  (bookmarks.length === 0 ? (
                    <div className="py-8">
                      <EmptyState icon="fa-bookmark" text={t("noBookmarks")} />
                    </div>
                  ) : (
                    bookmarks.slice(0, 10).map((bk) => {
                      const s = SURAHS[bk.surah - 1];
                      return (
                        <button
                          key={bk.id}
                          className="flex items-center gap-3 w-full p-2.5 rounded-xl transition-colors hover:bg-bg-tertiary text-left group"
                          onClick={() => goSurahAyah(bk.surah, bk.ayah)}
                        >
                          <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-primary text-primary shadow-sm shrink-0">
                            <i className="fas fa-bookmark" />
                          </span>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[1.1rem] font-quran text-text-primary text-right mb-0.5">
                              {s?.ar}
                            </span>
                            <span className="text-[0.8rem] text-text-secondary truncate">
                              {lang === "fr" ? s?.fr : s?.en} · v.{bk.ayah}
                              {bk.label && (
                                <em className="opacity-80"> - {bk.label}</em>
                              )}
                            </span>
                          </div>
                          <i
                            className={`fas fa-chevron-${isRtl ? "left" : "right"} text-[0.8rem] text-text-muted opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0`}
                          />
                        </button>
                      );
                    })
                  ))}

                {/* Notes */}
                {activeInfo === "notes" &&
                  (notes.length === 0 ? (
                    <div className="py-8">
                      <EmptyState icon="fa-pen-line" text={t("noNotes")} />
                    </div>
                  ) : (
                    notes.slice(0, 10).map((note) => {
                      const s = SURAHS[note.surah - 1];
                      return (
                        <button
                          key={note.id}
                          className="flex items-center gap-3 w-full p-2.5 rounded-xl transition-colors hover:bg-bg-tertiary text-left group"
                          onClick={() => goSurahAyah(note.surah, note.ayah)}
                        >
                          <span className="flex items-center justify-center w-10 h-10 rounded-lg bg-bg-primary text-emerald shadow-sm shrink-0">
                            <i className="fas fa-pen-line" />
                          </span>
                          <div className="flex flex-col flex-1 min-w-0">
                            <div className="flex items-baseline justify-between mb-0.5">
                              <span className="text-[0.8rem] font-semibold text-text-primary">
                                {lang === "fr" ? s?.fr : s?.en} · v.{note.ayah}
                              </span>
                              <span className="text-[1.05rem] font-quran text-text-secondary">
                                {s?.ar}
                              </span>
                            </div>
                            {note.text && (
                              <span className="text-[0.75rem] text-text-muted line-clamp-1">
                                {note.text}
                              </span>
                            )}
                          </div>
                          <i
                            className={`fas fa-chevron-${isRtl ? "left" : "right"} text-[0.8rem] text-text-muted opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0`}
                          />
                        </button>
                      );
                    })
                  ))}

                {/* Suggestions */}
                {activeInfo === "suggest" && (
                  <div className="flex flex-col gap-1 p-1">
                    <div className="flex items-center justify-center gap-2 py-2 mb-2 bg-primary/5 rounded-lg text-primary text-[0.8rem] font-semibold">
                      <i className={`fas ${suggestionSet.icon}`} />
                      <span>
                        {lang === "ar"
                          ? suggestionSet.period.ar
                          : lang === "fr"
                            ? suggestionSet.period.fr
                            : suggestionSet.period.en}
                      </span>
                    </div>
                    {suggestionSet.surahs.map(({ n, fr, en, ar: arLabel }) => {
                      const s = SURAHS[n - 1];
                      return (
                        <button
                          key={n}
                          className="flex items-center gap-3 w-full p-2.5 rounded-xl transition-colors hover:bg-bg-tertiary text-left group"
                          onClick={() => goSurahAyah(n, 1)}
                        >
                          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-bg-primary text-[0.75rem] font-bold text-text-secondary shadow-sm shrink-0">
                            {n}
                          </span>
                          <div className="flex flex-col flex-1 min-w-0">
                            <span className="text-[1.1rem] font-quran text-text-primary text-right mb-0.5">
                              {s?.ar}
                            </span>
                            <span className="text-[0.8rem] text-text-secondary truncate">
                              {lang === "ar"
                                ? arLabel
                                : lang === "fr"
                                  ? fr
                                  : en}
                            </span>
                          </div>
                          <i
                            className={`fas fa-chevron-${isRtl ? "left" : "right"} text-[0.8rem] text-text-muted opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0`}
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* ── Droite (DailyVerseCard + SessionCard injectés via children) ── */}
        <div className="relative z-10 flex flex-col gap-4 xl:gap-5 min-w-0 lg:mt-8">
          {children}
        </div>
      </div>
    </section>
  );
}
