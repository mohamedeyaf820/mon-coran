import SURAHS from "../../data/surahs";
import { cn } from "../../lib/utils";
import PlatformLogo from "../PlatformLogo";
import { EmptyState } from "./HomePrimitives";

export default function HeroSection({
  lang,
  isRtl,
  now,
  riwayaLabel,
  currentPrayer,
  greeting,
  hasReadingHistory,
  primaryReadingCtaLabel,
  surahLabel,
  continueReading,
  goSurah,
  openDuas,
  t,
  activeInfo,
  onSelectInfo,
  infoTabs,
  bookmarks,
  notes,
  suggestionSet,
  goSurahAyah,
  children,
}) {
  return (
    <section className="home-hero-compact relative z-10 overflow-hidden rounded-2xl border border-border/75 bg-bg-primary px-4 py-5 shadow-lg sm:px-6 sm:py-6 lg:p-7">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent" />

      <div className="relative z-10 flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)] xl:gap-7">
        <div className="flex min-w-0 flex-col">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-primary">
              <i className={`fas ${currentPrayer.icon}`} />
              <span>{greeting[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}</span>
            </div>
            <span className="rounded-full border border-border/50 bg-bg-secondary/80 px-3 py-1.5 text-[0.72rem] font-medium text-text-secondary">
              {now.toLocaleDateString(
                lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
                { weekday: "short", day: "numeric", month: "short" },
              )}
            </span>
          </div>

          <div className="flex items-center gap-4 max-[520px]:items-start max-[520px]:gap-3">
            <PlatformLogo
              className="h-14 w-14 shrink-0 rounded-2xl shadow-sm sm:h-16 sm:w-16"
              imgClassName="h-10 w-10 object-cover sm:h-12 sm:w-12"
              decorative
            />
            <div className="min-w-0">
              <div className="pointer-events-none mb-1 text-right font-quran text-2xl text-text-muted/30" dir="rtl">
                ﷽
              </div>
              <h1 className="mb-2 text-[clamp(1.75rem,4vw,2.45rem)] font-black leading-none tracking-tight text-text-primary">
                MushafPlus
              </h1>
              <div className="flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-bg-secondary px-3 py-1 text-[0.74rem] font-semibold text-text-secondary">
                  <i className="fas fa-feather-pointed text-[0.7rem]" />
                  {riwayaLabel}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border/40 bg-bg-secondary px-3 py-1 text-[0.74rem] font-semibold text-text-secondary">
                  <i className={`fas ${currentPrayer.icon}`} />
                  {currentPrayer[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-4 max-w-[58ch] text-[0.95rem] leading-relaxed text-text-secondary max-[520px]:text-[0.88rem] max-[520px]:leading-snug">
            {lang === "ar"
              ? "اقرأ القرآن الكريم وتدبر معانيه في مساحة أكثر سكينة"
              : lang === "fr"
                ? "Lisez, méditez, mémorisez - La Parole d'Allah dans toute sa beauté"
                : "Read, reflect and memorize the Holy Quran in beauty"}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3 max-[520px]:gap-2">
            <button
              className="inline-flex h-12 items-center gap-2.5 rounded-2xl bg-primary px-5 text-[0.9rem] font-bold text-white shadow-lg shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-dark max-[520px]:w-full max-[520px]:justify-center"
              aria-label={primaryReadingCtaLabel}
              onClick={hasReadingHistory ? continueReading : () => goSurah(1)}
              type="button"
            >
              <i className={`fas ${hasReadingHistory ? "fa-circle-play" : "fa-book-open"} text-[1.1rem]`} />
              <span className="truncate max-[520px]:max-w-[62vw]">
                {hasReadingHistory
                  ? t("continueReading")
                  : lang === "ar"
                    ? "ابدأ القراءة"
                    : lang === "fr"
                      ? "Commencer la lecture"
                      : "Start reading"}
              </span>
              {!hasReadingHistory && (
                <span className="ml-1 rounded-md bg-white/20 px-2 py-0.5 text-[0.75rem] max-[520px]:hidden">
                  الفاتحة
                </span>
              )}
            </button>

            <button
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-bg-secondary px-5 text-[0.9rem] font-bold text-text-primary transition-all duration-300 hover:-translate-y-0.5 hover:bg-bg-tertiary max-[520px]:w-full max-[520px]:justify-center"
              onClick={openDuas}
              type="button"
            >
              <i className="fas fa-hands-praying" />
              <span>{t("duas")}</span>
            </button>
          </div>

          <aside className="home-info-panel mt-5 hidden xl:block">
            <div className="overflow-hidden rounded-2xl border border-border/50 bg-bg-secondary/40 backdrop-blur-md">
              <div className="flex items-center overflow-x-auto border-b border-border/50 no-scrollbar">
                {infoTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-[0.82rem] font-semibold text-text-secondary transition-colors hover:text-text-primary",
                      activeInfo === tab.id && "border-primary bg-primary/5 text-primary",
                    )}
                    onClick={() => onSelectInfo(tab.id)}
                    type="button"
                  >
                    <i className={`fas ${tab.icon} text-[0.9rem]`} />
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/10 px-1.5 text-[0.65rem] font-bold text-primary">
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              <div className="flex max-h-[188px] flex-col overflow-y-auto p-2 no-scrollbar">
                {activeInfo === "bookmarks" &&
                  (bookmarks.length === 0 ? (
                    <div className="py-5">
                      <EmptyState icon="fa-bookmark" text={t("noBookmarks")} />
                    </div>
                  ) : (
                    bookmarks.slice(0, 6).map((bk) => {
                      const s = SURAHS[bk.surah - 1];
                      return (
                        <button
                          key={bk.id}
                          className="group flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-bg-tertiary"
                          onClick={() => goSurahAyah(bk.surah, bk.ayah)}
                          type="button"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-primary shadow-sm">
                            <i className="fas fa-bookmark" />
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span className="mb-0.5 text-right font-quran text-[1.05rem] text-text-primary">
                              {s?.ar}
                            </span>
                            <span className="truncate text-[0.78rem] text-text-secondary">
                              {lang === "fr" ? s?.fr : s?.en} · v.{bk.ayah}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ))}

                {activeInfo === "notes" &&
                  (notes.length === 0 ? (
                    <div className="py-5">
                      <EmptyState icon="fa-note-sticky" text={t("noNotes")} />
                    </div>
                  ) : (
                    notes.slice(0, 6).map((note) => {
                      const s = SURAHS[note.surah - 1];
                      return (
                        <button
                          key={note.id}
                          className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-bg-tertiary"
                          onClick={() => goSurahAyah(note.surah, note.ayah)}
                          type="button"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-gold shadow-sm">
                            <i className="fas fa-note-sticky" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="block truncate text-[0.82rem] font-semibold text-text-primary">
                              {lang === "fr" ? s?.fr : s?.en} · v.{note.ayah}
                            </span>
                            <span className="line-clamp-1 text-[0.74rem] text-text-secondary">
                              {note.text}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  ))}

                {activeInfo === "suggest" && (
                  <>
                    <div className="home-suggestion-heading mb-2 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-primary">
                      <i className={`fas ${suggestionSet.icon}`} aria-hidden="true" />
                      <span className="text-[0.86rem] font-extrabold">
                        {suggestionSet.period[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}
                      </span>
                    </div>
                    {suggestionSet.surahs.map((s) => (
                      <button
                        key={s.n}
                        className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-bg-tertiary"
                        onClick={() => goSurah(s.n)}
                        type="button"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-primary shadow-sm">
                          {s.n}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-[0.85rem] font-bold text-text-primary">
                            {lang === "fr" ? s.fr : s.en}
                          </span>
                          <span className="block text-right font-quran text-[1rem] text-text-secondary" dir="rtl">
                            {s.ar}
                          </span>
                        </div>
                        <i className={`fas fa-chevron-${isRtl ? "left" : "right"} text-[0.75rem] text-text-muted`} />
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>

        <div className="home-hero-compact__side flex flex-col gap-4">{children}</div>
      </div>
    </section>
  );
}
