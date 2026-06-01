import React from "react";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";
import { formatCooldownLabel } from "../../utils/formatUtils";
import {
  getLatencyForReciter,
  getReciterUnavailableRemainingMs,
} from "../../utils/reciterRanking";
import { ReciterAvatar } from "./AudioPlayerPrimitives";

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
  const isAnyReciterSwitching = Boolean(reciterSwitchingId);

  return (
            <section
              className={cn(
                "flex min-h-0 flex-col p-3 sm:p-3.5",
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
                <div className="relative mb-2">
                  <i className="fas fa-magnifying-glass pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[0.6rem] text-[rgba(241,230,209,0.35)]" />
                  <input
                    type="text"
                    value={reciterSearch}
                    onChange={(e) => setReciterSearch(e.target.value)}
                    placeholder={
                      lang === "fr"
                        ? "Rechercher un recitateur..."
                        : lang === "ar"
                          ? "ابحث عن قارئ..."
                          : "Search reciter..."
                    }
                    className={playerSearchInputClass}
                  />
                  {reciterSearch && (
                    <button
                      type="button"
                      onClick={() => setReciterSearch("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[0.58rem] text-[rgba(241,230,209,0.42)]"
                    >
                      <i className="fas fa-times" />
                    </button>
                  )}
                </div>
              )}

              <div
                className="min-h-0 flex-1 overflow-y-auto pr-1"
                data-scroll-panel="true"
              >
                {filteredReciters.length === 0 ? (
                  <div
                    className={cn(
                      playerFadedTextClass,
                      "py-6 text-center text-xs",
                    )}
                  >
                    {lang === "fr"
                      ? "Aucun recitateur trouve"
                      : lang === "ar"
                        ? "لا يوجد قارئ"
                        : "No reciter found"}
                  </div>
                ) : (
                  <div className="grid gap-2 xl:grid-cols-2">
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
                      const isFavorite = (favoriteReciters || []).includes(
                        r.id,
                      );
                      const latency = getLatencyForReciter(
                        r,
                        reciterLatencyByKey,
                      );
                      return (
                        <button
                          key={`modal-${r.id}`}
                          onClick={() => handleReciterSelect(r.id)}
                          className={playerReciterButtonClass(
                            active,
                            isLoading,
                            isUnavailable,
                          )}
                          aria-pressed={active}
                          disabled={
                            isAnyReciterSwitching || (isUnavailable && !active)
                          }
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
                              <span className="inline-flex w-fit items-center rounded-full border border-white/12 bg-white/[0.06] px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-[rgba(225,214,194,0.72)]">
                                {r.cdnType === "everyayah"
                                  ? "EveryAyah CDN"
                                  : r.cdnType === "mp3quran-surah"
                                    ? "MP3Quran"
                                    : "Islamic CDN"}
                              </span>
                              {r.audioMode === "surah" && (
                                <span className="inline-flex w-fit items-center rounded-full border border-fuchsia-300/30 bg-fuchsia-300/10 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-fuchsia-100">
                                  {lang === "fr"
                                    ? "Sourate complete"
                                    : lang === "ar"
                                      ? "سورة كاملة"
                                      : "Full surah"}
                                </span>
                              )}
                              {isFavorite && (
                                <span className="inline-flex w-fit items-center rounded-full border border-amber-300/35 bg-amber-300/10 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-amber-200">
                                  <i className="fas fa-star mr-1 text-[0.44rem]" />
                                  {lang === "fr"
                                    ? "Favori"
                                    : lang === "ar"
                                      ? "مفضل"
                                      : "Favorite"}
                                </span>
                              )}
                              {latency && (
                                <span className="inline-flex w-fit items-center rounded-full border border-sky-300/30 bg-sky-300/10 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-sky-100">
                                  {Math.round(latency * 1000)}ms
                                </span>
                              )}
                              {autoSelectFastestReciter &&
                                filteredReciters[0]?.id === r.id && (
                                  <span className="inline-flex w-fit items-center rounded-full border border-emerald-300/30 bg-emerald-300/10 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-emerald-100">
                                    {lang === "fr"
                                      ? "Rapide"
                                      : lang === "ar"
                                        ? "سريع"
                                        : "Fast"}
                                  </span>
                                )}
                              {isUnavailable && (
                                <span className="inline-flex w-fit items-center rounded-full border border-rose-300/40 bg-rose-300/16 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-rose-100">
                                  {lang === "fr"
                                    ? `Indisponible ${formatCooldownLabel(unavailableMs, lang)}`
                                    : lang === "ar"
                                      ? `غير متاح ${formatCooldownLabel(unavailableMs, lang)}`
                                      : `Unavailable ${formatCooldownLabel(unavailableMs, lang)}`}
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
