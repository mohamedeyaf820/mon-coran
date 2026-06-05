import React from "react";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";

export default function PlaybackSettingsPanel(props) {
  const {
    audioSpeed,
    closeOptionsModal,
    cycleSpeed,
    handleVolumeChange,
    isSurahStreamReciter,
    lang,
    memMode,
    memPause,
    memRepeatCount,
    playerCardToggleClass,
    playerFadedTextClass,
    playerGoldMetaClass,
    playerMutedTextClass,
    playerNumberInputClass,
    playerOptionPillClass,
    playerSectionLabelClass,
    playerSoftSurfaceClass,
    playerSurfaceButtonClass,
    set,
    setSurahRepeatSetting,
    setSyncOffsetMs,
    showMemorizationControls,
    stop,
    surahRepeatCount,
    syncOffsetMs,
    volume,
  } = props;

  return (
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
                      {lang === "fr"
                        ? "Vitesse"
                        : lang === "ar"
                          ? "السرعة"
                          : "Speed"}
                    </span>
                    <span>{audioSpeed}x</span>
                  </button>
                </div>
              </div>

              <div className={cn("mb-3 p-3", playerSoftSurfaceClass)}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={playerSectionLabelClass}>
                    {lang === "fr"
                      ? "Repetition de sourate"
                      : lang === "ar"
                        ? "تكرار السورة"
                        : "Surah repeat"}
                  </span>
                  <span
                    className={cn(
                      playerGoldMetaClass,
                      "text-[0.64rem] tabular-nums",
                    )}
                  >
                    {surahRepeatCount === 0
                      ? lang === "fr"
                        ? "Infini"
                        : lang === "ar"
                          ? "بلا نهاية"
                          : "Infinite"
                      : `x${surahRepeatCount}`}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(playerMutedTextClass, "text-[0.68rem]")}
                    >
                      {lang === "fr"
                        ? "Nombre"
                        : lang === "ar"
                          ? "العدد"
                          : "Count"}
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
                    {lang === "fr"
                      ? "Une fois"
                      : lang === "ar"
                        ? "مرة واحدة"
                        : "Once"}
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
                    {lang === "fr"
                      ? "Infini"
                      : lang === "ar"
                        ? "بلا نهاية"
                        : "Infinite"}
                  </button>
                </div>

                <p
                  className={cn(
                    playerFadedTextClass,
                    "mt-2 text-[0.62rem] leading-relaxed",
                  )}
                >
                  {lang === "fr"
                    ? "0 = repetition infinie. La sourate recommence automatiquement a la fin."
                    : lang === "ar"
                       ? "0 يعني تكرارا بلا نهاية. تبدأ السورة من جديد تلقائيا عند النهاية."
                      : "0 means infinite repeat. The surah restarts automatically at the end."}
                </p>
              </div>

              <div className={cn("mb-3 p-3", playerSoftSurfaceClass)}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className={playerSectionLabelClass}>
                    {lang === "fr"
                      ? "Volume"
                      : lang === "ar"
                        ? "مستوى الصوت"
                        : "Volume"}
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
                    {lang === "fr"
                      ? "Synchronisation mot a mot"
                      : lang === "ar"
                        ? "مزامنة كلمة بكلمة"
                        : "Word sync"}
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
                    {lang === "fr"
                      ? "Reset"
                      : lang === "ar"
                        ? "إعادة"
                        : "Reset"}
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
                      ? "Ce récitateur lit la sourate complète, donc la synchro mot à mot n'est pas utilisée."
                      : lang === "ar"
                        ? "هذا القارئ يشغل السورة كاملة، لذلك لا تستخدم مزامنة كلمة بكلمة."
                        : "This reciter plays the full surah, so word-by-word sync is not used."
                    : lang === "fr"
                      ? "Le suivi des versets est verrouillé en automatique. La calibration se mémorise par récitateur."
                      : lang === "ar"
                        ? "متابعة الآيات تلقائية. تحفظ المعايرة لكل قارئ."
                        : "Verse follow is locked to automatic. Sync calibration is saved per reciter."}
                </p>
              </div>

              {showMemorizationControls && memMode && (
                <div className={cn("mb-3 p-3", playerSoftSurfaceClass)}>
                  <div className={playerSectionLabelClass}>
                    {t("audio.memorization", lang)}
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(playerMutedTextClass, "text-[0.68rem]")}
                      >
                        {t("audio.repeat", lang)}
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={memRepeatCount}
                        onChange={(e) =>
                          set({
                            memRepeatCount: parseInt(e.target.value, 10) || 1,
                          })
                        }
                        className={playerNumberInputClass}
                      />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={cn(playerMutedTextClass, "text-[0.68rem]")}
                      >{`${t("audio.pause", lang)} (s)`}</span>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={memPause}
                        onChange={(e) =>
                          set({ memPause: parseInt(e.target.value, 10) || 0 })
                        }
                        className={playerNumberInputClass}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pb-1">
                <button
                  onClick={stop}
                  className={cn(
                    playerSurfaceButtonClass,
                    "px-4 py-2 text-[0.68rem] font-semibold",
                  )}
                >
                  <i className="fas fa-stop mr-1" />
                  {t("audio.stop", lang)}
                </button>
                <button
                  onClick={closeOptionsModal}
                  className={cn(
                    playerSurfaceButtonClass,
                    "px-4 py-2 text-[0.68rem] font-semibold",
                  )}
                >
                  {lang === "fr" ? "Terminer" : lang === "ar" ? "تم" : "Done"}
                </button>
              </div>
            </section>
  );
}
