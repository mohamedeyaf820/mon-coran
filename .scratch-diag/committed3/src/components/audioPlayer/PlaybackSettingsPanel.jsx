import React from "react";
import { Gauge, SlidersHorizontal, Volume2, Volume1, Square, VolumeOff } from "lucide-react";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";

function makeLabels(lang) {
  return {
    speed:
      lang === "fr"
        ? "Vitesse"
        : lang === "ar"
          ? "\u0627\u0644\u0633\u0631\u0639\u0629"
          : "Speed",
    surahRepeat:
      lang === "fr"
        ? "R\u00e9p\u00e9tition de sourate"
        : lang === "ar"
          ? "\u062a\u0643\u0631\u0627\u0631 \u0627\u0644\u0633\u0648\u0631\u0629"
          : "Surah repeat",
    infinite:
      lang === "fr"
        ? "Infini"
        : lang === "ar"
          ? "\u0628\u0644\u0627 \u0646\u0647\u0627\u064a\u0629"
          : "Infinite",
    count:
      lang === "fr"
        ? "Nombre"
        : lang === "ar"
          ? "\u0627\u0644\u0639\u062f\u062f"
          : "Count",
    once:
      lang === "fr"
        ? "Une fois"
        : lang === "ar"
          ? "\u0645\u0631\u0629 \u0648\u0627\u062d\u062f\u0629"
          : "Once",
    repeatHint:
      lang === "fr"
        ? "0 = r\u00e9p\u00e9tition infinie. La sourate recommence automatiquement \u00e0 la fin."
        : lang === "ar"
          ? "0 \u064a\u0639\u0646\u064a \u062a\u0643\u0631\u0627\u0631\u0627 \u0628\u0644\u0627 \u0646\u0647\u0627\u064a\u0629. \u062a\u0628\u062f\u0623 \u0627\u0644\u0633\u0648\u0631\u0629 \u0645\u0646 \u062c\u062f\u064a\u062f \u062a\u0644\u0642\u0627\u0626\u064a\u0627 \u0639\u0646\u062f \u0627\u0644\u0646\u0647\u0627\u064a\u0629."
          : "0 means infinite repeat. The surah restarts automatically at the end.",
    volume:
      lang === "fr"
        ? "Volume"
        : lang === "ar"
          ? "\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0635\u0648\u062a"
          : "Volume",
    mute:
      lang === "fr"
        ? "Couper ou r\u00e9tablir le son"
        : lang === "ar"
          ? "\u0643\u062a\u0645 \u0623\u0648 \u062a\u0634\u063a\u064a\u0644 \u0627\u0644\u0635\u0648\u062a"
          : "Mute or unmute",
    wordSync:
      lang === "fr"
        ? "Synchronisation mot \u00e0 mot"
        : lang === "ar"
          ? "\u0645\u0632\u0627\u0645\u0646\u0629 \u0643\u0644\u0645\u0629 \u0628\u0643\u0644\u0645\u0629"
          : "Word sync",
    reset:
      lang === "fr"
        ? "R\u00e9initialiser"
        : lang === "ar"
          ? "\u0625\u0639\u0627\u062f\u0629"
          : "Reset",
    syncDisabled:
      lang === "fr"
        ? "Ce r\u00e9citateur lit la sourate compl\u00e8te, donc la synchro mot \u00e0 mot n'est pas utilis\u00e9e."
        : lang === "ar"
          ? "\u0647\u0630\u0627 \u0627\u0644\u0642\u0627\u0631\u0626 \u064a\u0634\u063a\u0644 \u0627\u0644\u0633\u0648\u0631\u0629 \u0643\u0627\u0645\u0644\u0629\u060c \u0644\u0630\u0644\u0643 \u0644\u0627 \u062a\u0633\u062a\u062e\u062f\u0645 \u0645\u0632\u0627\u0645\u0646\u0629 \u0643\u0644\u0645\u0629 \u0628\u0643\u0644\u0645\u0629."
          : "This reciter plays the full surah, so precise verse synchronization is unavailable.",
    syncHint:
      lang === "fr"
        ? "Le suivi des versets est automatique. La calibration est m\u00e9moris\u00e9e par r\u00e9citateur."
        : lang === "ar"
          ? "\u0645\u062a\u0627\u0628\u0639\u0629 \u0627\u0644\u0622\u064a\u0627\u062a \u062a\u0644\u0642\u0627\u0626\u064a\u0629. \u062a\u062d\u0641\u0638 \u0627\u0644\u0645\u0639\u0627\u064a\u0631\u0629 \u0644\u0643\u0644 \u0642\u0627\u0631\u0626."
          : "Verse follow is automatic. Sync calibration is saved per reciter.",
    done:
      lang === "fr"
        ? "Terminer"
        : lang === "ar"
          ? "\u062a\u0645"
          : "Done",
    eq:
      lang === "fr"
        ? "\u00c9galiseur"
        : lang === "ar"
          ? "\u0627\u0644\u0645\u0639\u0627\u062f\u0644 \u0627\u0644\u0635\u0648\u062a\u064a"
          : "Equalizer",
    eqFlat:
      lang === "fr" ? "Plat" : lang === "ar" ? "\u0645\u062d\u0627\u064a\u062f" : "Flat",
    eqBass:
      lang === "fr" ? "Basses" : lang === "ar" ? "\u062c\u0647\u064a\u0631" : "Bass",
    eqTreble:
      lang === "fr" ? "Aigus" : lang === "ar" ? "\u062d\u0627\u062f" : "Treble",
    eqNear:
      lang === "fr" ? "Proche" : lang === "ar" ? "\u0642\u0631\u064a\u0628" : "Near",
    eqHall:
      lang === "fr" ? "Salle" : lang === "ar" ? "\u0642\u0627\u0639\u0629" : "Hall",
    eqVocals:
      lang === "fr" ? "Voix" : lang === "ar" ? "\u0635\u0648\u062a" : "Vocals",
    tartil:
      lang === "fr"
        ? "Mode Tartil (lecture lente)"
        : lang === "ar"
          ? "\u0648\u0636\u0639 \u0627\u0644\u062a\u0631\u062a\u064a\u0644"
          : "Tartil mode (slow recitation)",
    tartilHint:
      lang === "fr"
        ? "Ralentit la vitesse \u00e0 0.75\u00d7 pour une \u00e9coute m\u00e9ticuleuse."
        : lang === "ar"
          ? "\u064a\u0628\u0637\u0626 \u0627\u0644\u0633\u0631\u0639\u0629 \u0625\u0644\u0649 0.75\u00d7 \u0644\u0644\u0627\u0633\u062a\u0645\u0627\u0639 \u0627\u0644\u062f\u0642\u064a\u0642."
          : "Slows speed to 0.75\u00d7 for careful listening.",
    abRepeat:
      lang === "fr"
        ? "R\u00e9p\u00e9tition A-B"
        : lang === "ar"
          ? "\u062a\u0643\u0631\u0627\u0631 \u0623-\u0628"
          : "A-B Repeat",
    abRepeatActive:
      lang === "fr"
        ? "Actif \u2014 r\u00e9p\u00e9tition d'une plage de versets"
        : lang === "ar"
          ? "\u0646\u0634\u0637 \u2014 \u062a\u0643\u0631\u0627\u0631 \u0646\u0637\u0627\u0642 \u0627\u0644\u0622\u064a\u0627\u062a"
          : "Active \u2014 repeating a verse range",
    abRepeatInactive:
      lang === "fr"
        ? "Inactif \u2014 d\u00e9finissez la plage depuis le lecteur"
        : lang === "ar"
          ? "\u063a\u064a\u0631 \u0646\u0634\u0637 \u2014 \u062d\u062f\u062f \u0627\u0644\u0646\u0637\u0627\u0642 \u0645\u0646 \u0627\u0644\u0642\u0627\u0631\u0626"
          : "Inactive \u2014 set range from the reader",
    abRepeatClear:
      lang === "fr" ? "Effacer A-B" : lang === "ar" ? "\u0645\u0633\u062d \u0623-\u0628" : "Clear A-B",
  };
}

export default function PlaybackSettingsPanel(props) {
  const {
    abRepeatActive,
    audioSpeed,
    className,
    closeOptionsModal,
    cycleSpeed,
    eqPreset,
    handleApplyEqPreset,
    handleClearAbRepeat,
    handleSetTartilMode,
    handleVolumeChange,
    isMobile,
    isSurahStreamReciter,
    lang,
    playerCardToggleClass,
    playerFadedTextClass,
    playerGoldMetaClass,
    playerMutedTextClass,
    playerNumberInputClass,
    playerOptionPillClass,
    playerSectionLabelClass,
    playerSoftSurfaceClass,
    playerSurfaceButtonClass,
    setSurahRepeatSetting,
    setSyncOffsetMs,
    stop,
    surahRepeatCount,
    syncOffsetMs,
    tartilMode,
    volume,
  } = props;

  const labels = makeLabels(lang);
  const offsetLabel = syncOffsetMs > 0 ? `+${syncOffsetMs}` : syncOffsetMs;

  return (
    <section
      className={cn(
        "audio-playback-settings audio-player-modal__tab-panel min-h-0 overflow-y-auto pr-1",
        className,
      )}
      data-scroll-panel="true"
    >
      <div className="audio-settings-intro">
        <span className="audio-settings-intro__icon" aria-hidden="true">
          <SlidersHorizontal size={15} />
        </span>
        <span>
          <strong>
            {lang === "fr"
              ? "Réglages audio avancés"
              : lang === "ar"
                ? "إعدادات الصوت المتقدمة"
                : "Advanced audio settings"}
          </strong>
          <small>
            {lang === "fr"
              ? "Ajustez la lecture sans quitter votre verset."
              : lang === "ar"
                ? "اضبط التشغيل دون مغادرة الآية."
                : "Tune playback without leaving your verse."}
          </small>
        </span>
      </div>

      <div className={cn("audio-settings-card mb-3 p-3", playerSoftSurfaceClass)}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={cycleSpeed}
            className={cn(
              playerCardToggleClass(audioSpeed !== 1),
              "audio-settings-speed min-w-[7.5rem]",
            )}
            aria-label={`${labels.speed} ${audioSpeed}x`}
          >
            <span className="flex items-center gap-2">
              <Gauge size={10} />
              {labels.speed}
            </span>
            <span>{audioSpeed}x</span>
          </button>
        </div>
      </div>

      <div className={cn("audio-settings-card mb-3 p-3", playerSoftSurfaceClass)}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className={playerSectionLabelClass}>{labels.surahRepeat}</span>
          <span className={cn(playerGoldMetaClass, "text-[0.64rem] tabular-nums")}>
            {surahRepeatCount === 0 ? labels.infinite : `x${surahRepeatCount}`}
          </span>
        </div>

        <div className="audio-settings-pills flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5">
            <span className={cn(playerMutedTextClass, "text-[0.68rem]")}>
              {labels.count}
            </span>
            <input
              type="number"
              min={0}
              max={999}
              value={surahRepeatCount}
              onChange={(e) => setSurahRepeatSetting(e.target.value)}
              className={playerNumberInputClass}
            />
          </label>
          <button type="button" onClick={() => setSurahRepeatSetting(1)} className={playerOptionPillClass(surahRepeatCount === 1)}>
            {labels.once}
          </button>
          <button type="button" onClick={() => setSurahRepeatSetting(3)} className={playerOptionPillClass(surahRepeatCount === 3)}>
            x3
          </button>
          <button type="button" onClick={() => setSurahRepeatSetting(5)} className={playerOptionPillClass(surahRepeatCount === 5)}>
            x5
          </button>
          <button type="button" onClick={() => setSurahRepeatSetting(10)} className={playerOptionPillClass(surahRepeatCount === 10)}>
            x10
          </button>
          <button type="button" onClick={() => setSurahRepeatSetting(0)} className={playerOptionPillClass(surahRepeatCount === 0)}>
            {labels.infinite}
          </button>
        </div>

        <p className={cn(playerFadedTextClass, "mt-2 text-[0.62rem] leading-relaxed")}>
          {labels.repeatHint}
        </p>
      </div>

      <div className={cn("audio-settings-card mb-3 p-3", playerSoftSurfaceClass)}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className={playerSectionLabelClass}>{labels.volume}</span>
            <span className={cn(playerGoldMetaClass, "text-[0.64rem] tabular-nums")}>
              {Math.round(volume * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleVolumeChange(volume > 0 ? 0 : 1)}
              className="audio-settings-icon-btn h-8 w-8 shrink-0 rounded-lg border border-white/12 bg-white/[0.06] text-[0.8rem] text-[rgba(132,205,228,0.9)] transition-colors duration-150 hover:bg-[rgba(110,204,233,0.14)]"
              aria-label={labels.mute}
            >
              {volume === 0 ? <VolumeOff size={13} /> : volume < 0.5 ? <Volume1 size={13} /> : <Volume2 size={13} />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="h-1.5 flex-1 cursor-pointer rounded-full accent-[rgb(110,204,233)]"
              aria-label={labels.volume}
            />
          </div>
        </div>

      <div className={cn("audio-settings-card mb-3 p-3", playerSoftSurfaceClass)}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className={playerSectionLabelClass}>{labels.wordSync}</span>
          <span className={cn(playerGoldMetaClass, "text-[0.64rem] tabular-nums")}>
            {offsetLabel}ms
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
          aria-label={labels.wordSync}
        />
        <div className="audio-settings-pills mt-2 flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={() => setSyncOffsetMs(syncOffsetMs - 40)} className={playerOptionPillClass(false)}>
            -40ms
          </button>
          <button type="button" onClick={() => setSyncOffsetMs(syncOffsetMs + 40)} className={playerOptionPillClass(false)}>
            +40ms
          </button>
          <button type="button" onClick={() => setSyncOffsetMs(0)} className={playerOptionPillClass(syncOffsetMs === 0)}>
            {labels.reset}
          </button>
        </div>
        <p className={cn(playerFadedTextClass, "mt-2 text-[0.62rem] leading-relaxed")}>
          {isSurahStreamReciter ? labels.syncDisabled : labels.syncHint}
        </p>
      </div>

      {!isMobile && (
      <div className={cn("audio-settings-card mb-3 p-3", playerSoftSurfaceClass)}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className={playerSectionLabelClass}>{labels.eq}</span>
          <span className={cn(playerGoldMetaClass, "text-[0.64rem] tabular-nums uppercase")}>
            {eqPreset}
          </span>
        </div>
        <div className="audio-settings-pills flex flex-wrap items-center gap-2">
          {[
            { id: "flat", label: labels.eqFlat },
            { id: "bass", label: labels.eqBass },
            { id: "treble", label: labels.eqTreble },
            { id: "near", label: labels.eqNear },
            { id: "hall", label: labels.eqHall },
            { id: "vocals", label: labels.eqVocals },
          ].map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleApplyEqPreset(id)}
              className={playerOptionPillClass(eqPreset === id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      )}

      <div className={cn("audio-settings-card mb-3 p-3", playerSoftSurfaceClass)}>
        <div className="flex items-center justify-between gap-2">
          <span className={playerSectionLabelClass}>{labels.tartil}</span>
          <button
            type="button"
            onClick={() => handleSetTartilMode(!tartilMode)}
            className={cn(playerCardToggleClass(tartilMode), "min-w-[5rem] text-[0.65rem]")}
            aria-pressed={tartilMode}
          >
            {tartilMode
              ? (lang === "fr" ? "Activé" : lang === "ar" ? "مفعّل" : "On")
              : (lang === "fr" ? "Désactivé" : lang === "ar" ? "معطّل" : "Off")}
          </button>
        </div>
        <p className={cn(playerFadedTextClass, "mt-2 text-[0.62rem] leading-relaxed")}>
          {labels.tartilHint}
        </p>
      </div>

      <div className={cn("audio-settings-card mb-3 p-3", playerSoftSurfaceClass)}>
        <div className="flex items-center justify-between gap-2">
          <span className={playerSectionLabelClass}>{labels.abRepeat}</span>
          {abRepeatActive && (
            <button
              type="button"
              onClick={handleClearAbRepeat}
              className={cn(playerOptionPillClass(false), "text-[0.65rem]")}
            >
              {labels.abRepeatClear}
            </button>
          )}
        </div>
        <p className={cn(playerFadedTextClass, "mt-1 text-[0.62rem] leading-relaxed")}>
          {abRepeatActive ? labels.abRepeatActive : labels.abRepeatInactive}
        </p>
      </div>

      <div className="audio-settings-actions flex flex-wrap items-center gap-2 pb-1">
        <button
          type="button"
          onClick={stop}
          className={cn(playerSurfaceButtonClass, "px-4 py-2 text-[0.68rem] font-semibold")}
        >
          <Square size={10} className="mr-1" />
          {t("audio.stop", lang)}
        </button>
        <button
          type="button"
          onClick={closeOptionsModal}
          className={cn(playerSurfaceButtonClass, "px-4 py-2 text-[0.68rem] font-semibold")}
        >
          {labels.done}
        </button>
      </div>
    </section>
  );
}
