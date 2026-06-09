import React from "react";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";
import { formatCooldownLabel } from "../../utils/formatUtils";
import {
  getLatencyForReciter,
  getReciterUnavailableRemainingMs,
} from "../../utils/reciterRanking";
import { ReciterAvatar } from "./AudioPlayerPrimitives";

function pick(lang, values) {
  return values[lang] || values.fr;
}

export default function ReciterOptionsList(props) {
  const {
    autoSelectFastestReciter,
    currentReciters,
    filteredReciters,
    favoriteReciters,
    handleReciterSelect,
    lang,
    networkState,
    playerFadedTextClass,
    playerGoldMetaClass,
    playerReciterButtonClass,
    playerSearchInputClass,
    playerSectionLabelClass,
    playerSoftSurfaceClass,
    reciter,
    reciterAvailabilityById,
    reciterLatencyByKey,
    reciterSearch,
    reciterSwitchingId,
    setReciterSearch,
  } = props;

  const labels = {
    search: pick(lang, {
      fr: "Rechercher un r\u00e9citateur",
      en: "Search reciter",
      ar: "\u0627\u0628\u062d\u062b \u0639\u0646 \u0642\u0627\u0631\u0626",
    }),
    searchPlaceholder: pick(lang, {
      fr: "Rechercher un r\u00e9citateur...",
      en: "Search reciter...",
      ar: "\u0627\u0628\u062d\u062b \u0639\u0646 \u0642\u0627\u0631\u0626...",
    }),
    clearSearch: pick(lang, {
      fr: "Effacer la recherche",
      en: "Clear search",
      ar: "\u0645\u0633\u062d \u0627\u0644\u0628\u062d\u062b",
    }),
    noReciter: pick(lang, {
      fr: "Aucun r\u00e9citateur trouv\u00e9",
      en: "No reciter found",
      ar: "\u0644\u0627 \u064a\u0648\u062c\u062f \u0642\u0627\u0631\u0626",
    }),
    fullSurah: pick(lang, {
      fr: "Sourate compl\u00e8te",
      en: "Full surah",
      ar: "\u0633\u0648\u0631\u0629 \u0643\u0627\u0645\u0644\u0629",
    }),
    favorite: pick(lang, {
      fr: "Favori",
      en: "Favorite",
      ar: "\u0645\u0641\u0636\u0644",
    }),
    fast: pick(lang, {
      fr: "Rapide",
      en: "Fast",
      ar: "\u0633\u0631\u064a\u0639",
    }),
    unavailable: pick(lang, {
      fr: "Indisponible",
      en: "Unavailable",
      ar: "\u063a\u064a\u0631 \u0645\u062a\u0627\u062d",
    }),
  };

  const isAnyReciterSwitching = Boolean(reciterSwitchingId);

  return (
    <section
      className={cn(
        "audio-reciter-options flex min-h-0 flex-col p-3 sm:p-3.5",
        playerSoftSurfaceClass,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={playerSectionLabelClass}>
          {t("audio.reciter", lang)}
        </span>
        <span
          className={cn(
            playerGoldMetaClass,
            "text-[0.6rem] font-semibold tabular-nums",
          )}
        >
          {filteredReciters.length !== currentReciters.length
            ? `${filteredReciters.length} / ${currentReciters.length}`
            : currentReciters.length}
        </span>
      </div>

      {currentReciters.length > 4 && (
        <div className="audio-reciter-options__search relative mb-2">
          <i className="fas fa-magnifying-glass pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[0.6rem] text-[rgba(241,230,209,0.35)]" />
          <input
            type="text"
            value={reciterSearch}
            onChange={(e) => setReciterSearch(e.target.value)}
            placeholder={labels.searchPlaceholder}
            aria-label={labels.search}
            className={playerSearchInputClass}
          />
          {reciterSearch && (
            <button
              type="button"
              onClick={() => setReciterSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.58rem] text-[rgba(241,230,209,0.42)]"
              aria-label={labels.clearSearch}
            >
              <i className="fas fa-times" />
            </button>
          )}
        </div>
      )}

      <div
        className="audio-reciter-options__scroll min-h-0 flex-1 overflow-y-auto pr-1"
        data-scroll-panel="true"
      >
        {filteredReciters.length === 0 ? (
          <div
            className={cn(
              playerFadedTextClass,
              "py-6 text-center text-xs",
            )}
          >
            {labels.noReciter}
          </div>
        ) : (
          <div className="audio-reciter-options__grid grid grid-cols-2 gap-2 xl:grid-cols-3">
            {filteredReciters.map((r) => {
              const active = reciter === r.id;
              const isLoading =
                reciterSwitchingId === r.id ||
                (active && networkState === "loading");
              const unavailableMs = getReciterUnavailableRemainingMs(
                r.id,
                reciterAvailabilityById,
              );
              const isUnavailable = unavailableMs > 0;
              const isFavorite = (favoriteReciters || []).includes(r.id);
              const latency = getLatencyForReciter(r, reciterLatencyByKey);

              return (
                <button
                  key={`modal-${r.id}`}
                  onClick={() => handleReciterSelect(r.id)}
                  className={cn(
                    "audio-reciter-options__item",
                    playerReciterButtonClass(
                      active,
                      isLoading,
                      isUnavailable,
                    ),
                  )}
                  aria-pressed={active}
                  disabled={isAnyReciterSwitching || (isUnavailable && !active)}
                >
                  <ReciterAvatar
                    reciter={r}
                    active={active}
                    loading={isLoading}
                  />
                  <span className="flex min-w-0 flex-col">
                    <span className="text-[0.76rem] font-bold leading-snug">
                      {lang === "ar"
                        ? r.name
                        : lang === "fr"
                          ? r.nameFr
                          : r.nameEn}
                    </span>
                    <span className="mt-1 flex flex-wrap gap-1">
                      <span className="audio-reciter-options__badge inline-flex w-fit items-center rounded-full border border-white/12 bg-white/[0.06] px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-[rgba(225,214,194,0.72)]">
                        {r.cdnType === "everyayah"
                          ? "EveryAyah CDN"
                          : r.cdnType === "mp3quran-surah"
                            ? "MP3Quran"
                            : "Islamic CDN"}
                      </span>
                      {r.audioMode === "surah" && (
                        <span className="audio-reciter-options__badge inline-flex w-fit items-center rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-fuchsia-100">
                          {labels.fullSurah}
                        </span>
                      )}
                      {isFavorite && (
                        <span className="audio-reciter-options__badge inline-flex w-fit items-center rounded-full border border-amber-300/35 bg-amber-300/10 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-amber-200">
                          <i className="fas fa-star mr-1 text-[0.44rem]" />
                          {labels.favorite}
                        </span>
                      )}
                      {latency && (
                        <span className="audio-reciter-options__badge inline-flex w-fit items-center rounded-full border border-sky-300/30 bg-sky-300/10 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-sky-100">
                          {Math.round(latency * 1000)}ms
                        </span>
                      )}
                      {autoSelectFastestReciter &&
                        filteredReciters[0]?.id === r.id && (
                          <span className="audio-reciter-options__badge inline-flex w-fit items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-emerald-100">
                            {labels.fast}
                          </span>
                        )}
                      {isUnavailable && (
                        <span className="audio-reciter-options__badge inline-flex w-fit items-center rounded-full border border-rose-300/40 bg-rose-300/16 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-rose-100">
                          {`${labels.unavailable} ${formatCooldownLabel(unavailableMs, lang)}`}
                        </span>
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
