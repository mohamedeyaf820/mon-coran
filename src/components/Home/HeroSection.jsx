import { Feather, CirclePlay, BookOpen, HandHeart, Bookmark, ChevronLeft, ChevronRight } from "lucide-react";
import SURAHS from "../../data/surahs";
import { cn } from "../../lib/utils";
import PlatformLogo from "../PlatformLogo";
import { EmptyState } from "./HomePrimitives";
import Icon from "./HomeIcon";

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
  onWarmSurah,
  openDuas,
  t,
  activeInfo,
  onSelectInfo,
  infoTabs,
  bookmarks,
  suggestionSet,
  goSurahAyah,
  children,
}) {
  const uiLang = lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en";
  const heroCopy =
    uiLang === "ar"
      ? "\u0627\u0642\u0631\u0623 \u0627\u0644\u0642\u0631\u0622\u0646 \u0628\u0647\u062f\u0648\u0621\u060c \u0627\u0633\u062a\u0645\u0639\u060c \u0648\u0627\u062d\u0641\u0638 \u0628\u0648\u062a\u064a\u0631\u062a\u0643."
      : uiLang === "fr"
        ? "Lisez, \u00e9coutez et m\u00e9morisez le Coran dans une interface claire, rapide et apais\u00e9e."
        : "Read, listen and memorize the Quran in a clear, fast and calm interface.";
  const startReadingLabel =
    uiLang === "ar"
      ? "\u0627\u0628\u062f\u0623 \u0627\u0644\u0642\u0631\u0627\u0621\u0629"
      : uiLang === "fr"
        ? "Commencer la lecture"
        : "Start reading";
  const fatihaLabel =
    uiLang === "ar"
      ? "\u0627\u0644\u0641\u0627\u062a\u062d\u0629"
      : "Al-Fatiha";
  const headingLabel =
    uiLang === "ar"
      ? "القرآن الكريم مع MushafPlus"
      : uiLang === "fr"
        ? "Le Saint Coran avec MushafPlus"
        : "The Holy Quran with MushafPlus";

  return (
    <section className="home-hero-compact home-hero-shell relative z-10 overflow-hidden rounded-xl border border-border/50 bg-bg-primary px-4 py-4 sm:px-5 sm:py-5">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

      <div className={cn("home-hero-layout relative z-10 grid gap-5 xl:gap-7")}>
        <div className="home-hero-main flex min-w-0 flex-col">
          <div className="home-hero-kicker-row mb-4 flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.1em] text-primary">
              <Icon name={currentPrayer.icon} aria-hidden="true" />
              <span>
                {greeting[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}
              </span>
            </div>
            <span className="rounded-full border border-border/50 bg-bg-secondary/80 px-3 py-1.5 text-[0.72rem] font-medium text-text-secondary">
              {now.toLocaleDateString(
                lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
                { weekday: "short", day: "numeric", month: "short" },
              )}
            </span>
          </div>

          <div className="home-brand-row flex items-center gap-3">
            <PlatformLogo
              className="home-hero-logo h-12 w-12 shrink-0 rounded-xl shadow-sm"
              imgClassName="h-9 w-9 object-cover"
              decorative
            />
            <div className="min-w-0">
              <h1 className="home-hero-title text-[clamp(1.5rem,3.5vw,2rem)] font-black leading-none tracking-tight text-text-primary">
                {headingLabel}
              </h1>
              <span className="mt-1 inline-flex items-center gap-1.5 text-[0.75rem] font-semibold text-text-muted">
                <Feather size={10} className="text-primary" aria-hidden="true" />
                {riwayaLabel}
              </span>
            </div>
          </div>

          <p className="home-hero-copy mt-3 max-w-[52ch] text-[0.88rem] leading-relaxed text-text-secondary max-[520px]:text-[0.85rem]">
            {heroCopy}
          </p>

          <div className="home-hero-actions mt-5 flex flex-wrap items-center gap-3 max-[520px]:gap-2">
            <button
              className="home-cta-primary inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-[0.85rem] font-bold text-white shadow-md shadow-primary/20 transition-all duration-200 hover:bg-primary-dark active:scale-[0.97] max-[520px]:w-full max-[520px]:justify-center"
              aria-label={primaryReadingCtaLabel}
              onClick={hasReadingHistory ? continueReading : () => goSurah(1)}
              onPointerEnter={() =>
                onWarmSurah(hasReadingHistory ? undefined : 1)
              }
              onFocus={() => onWarmSurah(hasReadingHistory ? undefined : 1)}
              type="button"
            >
              {hasReadingHistory ? <CirclePlay size={15} aria-hidden="true" /> : <BookOpen size={15} aria-hidden="true" />}
              <span className="truncate">
                {hasReadingHistory ? t("continueReading") : startReadingLabel}
              </span>
            </button>

            <button
              className="home-cta-secondary inline-flex h-11 items-center gap-2 rounded-xl border border-border/60 bg-bg-secondary px-4 text-[0.85rem] font-bold text-text-primary transition-all duration-200 hover:bg-bg-tertiary active:scale-[0.97] max-[520px]:w-full max-[520px]:justify-center"
              onClick={openDuas}
              type="button"
            >
              <HandHeart size={14} className="text-primary" aria-hidden="true" />
              <span>{t("duas")}</span>
            </button>
          </div>
        </div>

        <div className="home-hero-side flex min-w-0 flex-col gap-4">
          <aside className="home-info-panel">
            <div className="home-info-card overflow-hidden rounded-2xl border border-border/50 bg-bg-secondary/40 backdrop-blur-md">
              <div
                className="flex items-center overflow-x-auto border-b border-border/50 no-scrollbar"
                role="tablist"
                aria-label={
                  uiLang === "fr"
                    ? "Informations rapides"
                    : uiLang === "ar"
                      ? "\u0645\u0639\u0644\u0648\u0645\u0627\u062a \u0633\u0631\u064a\u0639\u0629"
                      : "Quick information"
                }
              >
                {infoTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={cn(
                      "flex items-center gap-2 whitespace-nowrap border-b-2 border-transparent px-4 py-3 text-[0.82rem] font-semibold text-text-secondary transition-colors hover:text-text-primary",
                      activeInfo === tab.id &&
                        "border-primary bg-primary/5 text-primary",
                    )}
                    onClick={() => onSelectInfo(tab.id)}
                    type="button"
                    role="tab"
                    aria-selected={activeInfo === tab.id}
                  >
                    <Icon
                      name={tab.icon}
                      className="text-[0.9rem]"
                      aria-hidden="true"
                    />
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
                          onPointerEnter={() => onWarmSurah(bk.surah)}
                          onFocus={() => onWarmSurah(bk.surah)}
                          type="button"
                        >
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-primary shadow-sm">
                            <Bookmark size={14} aria-hidden="true" />
                          </span>
                          <div className="flex min-w-0 flex-1 flex-col">
                            <span
                              className="mb-0.5 text-right font-quran text-[1.05rem] text-text-primary"
                              lang="ar"
                              dir="rtl"
                            >
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

                {activeInfo === "suggest" && (
                  <>
                    <div className="home-suggestion-heading mb-2 flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-primary">
                      <Icon
                        name={suggestionSet.icon}
                        aria-hidden="true"
                      />
                      <span className="text-[0.86rem] font-extrabold">
                        {
                          suggestionSet.period[
                            lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"
                          ]
                        }
                      </span>
                    </div>
                    {suggestionSet.surahs.map((s) => (
                      <button
                        key={s.n}
                        className="flex w-full items-center gap-3 rounded-xl p-2.5 text-left transition-colors hover:bg-bg-tertiary"
                        onClick={() => goSurah(s.n)}
                        onPointerEnter={() => onWarmSurah(s.n)}
                        onFocus={() => onWarmSurah(s.n)}
                        onTouchStart={() => onWarmSurah(s.n)}
                        type="button"
                      >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-bg-primary text-primary shadow-sm">
                          {s.n}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block truncate text-[0.85rem] font-bold text-text-primary">
                            {lang === "fr" ? s.fr : s.en}
                          </span>
                          <span
                            className="block text-right font-quran text-[1rem] text-text-secondary"
                            lang="ar"
                            dir="rtl"
                          >
                            {s.ar}
                          </span>
                        </div>
                        {isRtl ? <ChevronLeft size={12} className="text-text-muted" aria-hidden="true" /> : <ChevronRight size={12} className="text-text-muted" aria-hidden="true" />}
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </aside>

          {children && (
            <div className="home-hero-compact__side flex flex-col gap-4">
              {children}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
