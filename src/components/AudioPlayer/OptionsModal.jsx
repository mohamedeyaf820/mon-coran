import React from "react";
import { cn } from "../../lib/utils";
import { t } from "../../i18n";
import { getQuranComRecitationId } from "../../services/quranComAudioTimingService";

export function OptionsModal({
  optionsModalOpen,
  closeOptionsModal,
  lang,
  optionsModalTitle,
  optionsModalSubtitle,
  optionsCloseButtonRef,
  playerSoftSurfaceClass,
  playerSectionLabelClass,
  filteredReciters,
  currentReciters,
  playerGoldMetaClass,
  reciterSearch,
  setReciterSearch,
  playerSearchInputClass,
  reciter,
  reciterSwitchingId,
  networkState,
  getReciterUnavailableRemainingMs,
  reciterAvailabilityById,
  getLatencyForReciter,
  reciterLatencyByKey,
  favoriteReciters,
  handleReciterSelect,
  playerReciterButtonClass,
  playerReciterAvatarClass,
  isAnyReciterSwitching,
  formatCooldownLabel,
  autoSelectFastestReciter,
  cycleSpeed,
  audioSpeed,
  surahRepeatCount,
  setSurahRepeatSetting,
  playerMutedTextClass,
  playerNumberInputClass,
  playerOptionPillClass,
  playerFadedTextClass,
  volume,
  handleVolumeChange,
  syncOffsetMs,
  setSyncOffsetMs,
  isSurahStreamReciter,
  playerCardToggleClass,
}) {
  if (!optionsModalOpen) return null;

  return (
    <div
      className="audio-player-modal fixed inset-0 z-[420] flex items-center justify-center p-2 sm:p-4"
      data-no-drag="true"
    >
      <button
        type="button"
        className="audio-player-modal__backdrop absolute inset-0 bg-[color-mix(in_srgb,var(--theme-bg)_68%,#040810_32%)] backdrop-blur-sm"
        onClick={closeOptionsModal}
        aria-label={lang === "fr" ? "Fermer les options" : "Close options"}
      />
      <div
        className="audio-player-modal__surface relative z-[421] flex h-[min(92vh,860px)] w-[min(96vw,1180px)] min-w-0 flex-col overflow-hidden rounded-3xl border border-[color-mix(in_srgb,var(--theme-border-strong)_30%,transparent_70%)] bg-[linear-gradient(165deg,color-mix(in_srgb,var(--theme-panel-bg-strong)_95%,var(--theme-primary)_5%),color-mix(in_srgb,var(--theme-panel-bg)_94%,var(--theme-bg)_6%))] shadow-[0_40px_90px_rgba(2,8,18,0.56)] backdrop-blur-2xl"
        style={{ width: "min(94vw, 940px)", height: "min(88vh, 720px)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="audio-options-modal-title"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5 sm:py-4">
          <div className="min-w-0">
            <h3
              id="audio-options-modal-title"
              className="truncate text-sm font-bold text-[color-mix(in_srgb,var(--theme-text)_92%,#ffffff_8%)] sm:text-base"
            >
              {optionsModalTitle}
            </h3>
            <p className="mt-1 truncate text-[0.66rem] text-[color-mix(in_srgb,var(--theme-text-muted)_88%,var(--theme-bg)_12%)] sm:text-xs">
              {optionsModalSubtitle}
            </p>
          </div>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_60%,transparent_40%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_74%,transparent_26%)] text-[0.72rem] text-[color-mix(in_srgb,var(--theme-text)_84%,var(--theme-bg)_16%)] transition-all duration-150 hover:border-[color-mix(in_srgb,var(--theme-primary)_44%,transparent_56%)] hover:bg-[rgba(var(--theme-primary-rgb),0.14)] hover:text-white"
            onClick={closeOptionsModal}
            aria-label={lang === "fr" ? "Fermer" : "Close"}
            ref={optionsCloseButtonRef}
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <div className="audio-player-modal__grid grid min-h-0 flex-1 gap-4 overflow-hidden p-3 sm:p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
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
                      ? "Rechercher un récitateur..."
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
                    ? "Aucun récitateur trouvé"
                    : lang === "ar"
                      ? "لا يوجد قارئ"
                      : "No reciter found"}
                </div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
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
                    const initial = (r.nameEn || r.name || "?")[0].toUpperCase();
                    const isFavorite = (favoriteReciters || []).includes(r.id);
                    const latency = getLatencyForReciter(r, reciterLatencyByKey);
                    const hasQuranComSync = Boolean(getQuranComRecitationId(r.id));
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
                        <span className={playerReciterAvatarClass(active)}>
                          {isLoading ? (
                            <i className="fas fa-spinner fa-spin text-[0.48rem]" />
                          ) : active ? (
                            <i className="fas fa-check text-[0.48rem]" />
                          ) : (
                            initial
                          )}
                        </span>
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-[0.7rem] font-semibold leading-tight">
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
                            {hasQuranComSync ? (
                              <span className="inline-flex w-fit items-center rounded-full border border-emerald-300/35 bg-emerald-300/12 px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-emerald-100">
                                <i className="fas fa-wave-square mr-1 text-[0.42rem]" />
                                {lang === "fr"
                                  ? "Sync audio"
                                  : lang === "ar"
                                    ? "مزامنة الصوت"
                                    : "Audio sync"}
                              </span>
                            ) : (
                              <span className="inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.035] px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide text-[rgba(225,214,194,0.5)]">
                                {lang === "fr"
                                  ? "Audio simple"
                                  : lang === "ar"
                                    ? "ØµÙˆØª Ø¹Ø§Ø¯ÙŠ"
                                    : "Basic audio"}
                              </span>
                            )}
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
                                  {lang === "fr" ? "Rapide" : lang === "ar" ? "سريع" : "Fast"}
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

          <section
            className="min-h-0 overflow-y-auto pr-1"
            data-scroll-panel="true"
          >
            <div className={cn("mb-3 p-3", playerSoftSurfaceClass)}>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={cycleSpeed}
                  className={cn(
                    playerCardToggleClass(false),
                    "min-w-[7.5rem]",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <i className="fas fa-gauge-high text-[0.62rem]" />
                    {lang === "fr" ? "Vitesse" : lang === "ar" ? "السرعة" : "Speed"}
                  </span>
                  <span>{audioSpeed}x</span>
                </button>
              </div>
            </div>

            <div className={cn("mb-3 p-3", playerSoftSurfaceClass)}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={playerSectionLabelClass}>
                  {lang === "fr" ? "Répétition de sourate" : lang === "ar" ? "تكرار السورة" : "Surah repeat"}
                </span>
                <span
                  className={cn(
                    playerGoldMetaClass,
                    "text-[0.64rem] tabular-nums",
                  )}
                >
                  {surahRepeatCount === 0
                    ? lang === "fr" ? "Infini" : lang === "ar" ? "لا نهائي" : "Infinite"
                    : `x${surahRepeatCount}`}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={cn(playerMutedTextClass, "text-[0.68rem]")}>
                    {lang === "fr" ? "Nombre" : lang === "ar" ? "العدد" : "Count"}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={999}
                    value={surahRepeatCount}
                    onChange={(e) => setSurahRepeatSetting(e.target.value)}
                    className={playerNumberInputClass}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setSurahRepeatSetting(1)}
                  className={playerOptionPillClass(surahRepeatCount === 1)}
                >
                  {lang === "fr" ? "Une fois" : lang === "ar" ? "مرة واحدة" : "Once"}
                </button>
                <button
                  type="button"
                  onClick={() => setSurahRepeatSetting(3)}
                  className={playerOptionPillClass(surahRepeatCount === 3)}
                >
                  x3
                </button>
                <button
                  type="button"
                  onClick={() => setSurahRepeatSetting(5)}
                  className={playerOptionPillClass(surahRepeatCount === 5)}
                >
                  x5
                </button>
                <button
                  type="button"
                  onClick={() => setSurahRepeatSetting(10)}
                  className={playerOptionPillClass(surahRepeatCount === 10)}
                >
                  x10
                </button>
                <button
                  type="button"
                  onClick={() => setSurahRepeatSetting(0)}
                  className={playerOptionPillClass(surahRepeatCount === 0)}
                >
                  {lang === "fr" ? "Infini" : lang === "ar" ? "لا نهائي" : "Infinite"}
                </button>
              </div>

              <p
                className={cn(
                  playerFadedTextClass,
                  "mt-2 text-[0.62rem] leading-relaxed",
                )}
              >
                {lang === "fr"
                  ? "0 = répétition infinie. La sourate recommence automatiquement à la fin."
                  : lang === "ar"
                    ? "0 يعني تكرارًا لا نهائيًا. تبدأ السورة من جديد تلقائيًا عند النهاية."
                    : "0 means infinite repeat. The surah restarts automatically at the end."}
              </p>
            </div>

            <div className={cn("mb-3 p-3", playerSoftSurfaceClass)}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={playerSectionLabelClass}>
                  {lang === "fr" ? "Volume" : lang === "ar" ? "مستوى الصوت" : "Volume"}
                </span>
                <span
                  className={cn(
                    playerGoldMetaClass,
                    "text-[0.64rem] tabular-nums",
                  )}
                >
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
                  className="h-8 w-8 shrink-0 rounded-lg border border-white/12 bg-white/[0.06] text-[0.8rem] text-[rgba(132,205,228,0.9)] transition-colors duration-150 hover:bg-[rgba(110,204,233,0.14)]"
                >
                  <i
                    className={`fas ${volume === 0 ? "fa-volume-xmark" : volume < 0.5 ? "fa-volume-low" : "fa-volume-high"}`}
                  />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={volume}
                  onChange={(e) =>
                    handleVolumeChange(parseFloat(e.target.value))
                  }
                  className="h-1.5 flex-1 cursor-pointer rounded-full accent-[rgb(110,204,233)]"
                />
              </div>
            </div>

            <div className={cn("mb-3 p-3", playerSoftSurfaceClass)}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className={playerSectionLabelClass}>
                  {lang === "fr" ? "Synchronisation mot a mot" : lang === "ar" ? "مزامنة كلمة بكلمة" : "Word sync"}
                </span>
                <span
                  className={cn(
                    playerGoldMetaClass,
                    "text-[0.64rem] tabular-nums",
                  )}
                >
                  {syncOffsetMs > 0 ? `+${syncOffsetMs}` : syncOffsetMs}ms
                </span>
              </div>
              <input
                type="range"
                min="-500"
                max="500"
                step="10"
                value={syncOffsetMs}
                disabled={isSurahStreamReciter}
                onChange={(e) => setSyncOffsetMs(e.target.value)}
                className="h-1.5 w-full cursor-pointer rounded-full accent-[rgb(110,204,233)]"
              />
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setSyncOffsetMs(syncOffsetMs - 40)}
                  className={playerOptionPillClass(false)}
                >
                  -40ms
                </button>
                <button
                  onClick={() => setSyncOffsetMs(syncOffsetMs + 40)}
                  className={playerOptionPillClass(false)}
                >
                  +40ms
                </button>
                <button
                  onClick={() => setSyncOffsetMs(0)}
                  className={playerOptionPillClass(syncOffsetMs === 0)}
                >
                  {lang === "fr" ? "Reset" : lang === "ar" ? "إعادة" : "Reset"}
                </button>
              </div>
              <p
                className={cn(
                  playerFadedTextClass,
                  "mt-2 text-[0.62rem] leading-relaxed",
                )}
              >
                {isSurahStreamReciter
                  ? lang === "fr"
                    ? "Ce recitateur lit la sourate complete, donc la synchro mot a mot n'est pas utilisee."
                    : lang === "ar"
                      ? "هذا القارئ يقرأ السورة كاملة، لذلك لا تستخدم مزامنة كلمة بكلمة."
                      : "This reciter reads the full surah, so word-by-word sync is not used."
                  : lang === "fr"
                    ? "Ajustez le délai si l'audio et les mots ne sont pas parfaitement synchronisés."
                    : lang === "ar"
                      ? "اضبط التأخير إذا لم تكن الصوت والكلمات متزامنة تمامًا."
                      : "Adjust the delay if audio and words are not perfectly synchronized."}
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default OptionsModal;
