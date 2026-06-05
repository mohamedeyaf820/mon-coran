import React from "react";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";
import PlaybackSettingsPanel from "./PlaybackSettingsPanel";
import ReciterOptionsList from "./ReciterOptionsList";

export default function AudioOptionsModal(props) {
  const {
    audioSpeed,
    autoSelectFastestReciter,
    closeOptionsModal,
    currentReciters,
    cycleSpeed,
    filteredReciters,
    favoriteReciters,
    handleReciterSelect,
    handleVolumeChange,
    isSurahStreamReciter,
    lang,
    memMode,
    memPause,
    memRepeatCount,
    networkState,
    optionsCloseButtonRef,
    optionsModalOpen,
    playerCardToggleClass,
    playerFadedTextClass,
    playerGoldMetaClass,
    playerMutedTextClass,
    playerNumberInputClass,
    playerOptionPillClass,
    playerReciterButtonClass,
    playerSearchInputClass,
    playerSectionLabelClass,
    playerSoftSurfaceClass,
    playerSurfaceButtonClass,
    reciter,
    reciterAvailabilityById,
    reciterLatencyByKey,
    reciterSearch,
    reciterSwitchingId,
    set,
    setReciterSearch,
    setSurahRepeatSetting,
    setSyncOffsetMs,
    showMemorizationControls,
    stop,
    surahRepeatCount,
    syncOffsetMs,
    volume,
  } = props;

  const optionsModalTitle =
    lang === "fr"
      ? "Réglages audio"
      : lang === "ar"
        ? "إعدادات الصوت"
        : "Audio settings";
  const optionsModalSubtitle =
    lang === "fr"
      ? "Récitateurs, volume et synchronisation"
      : lang === "ar"
        ? "القراء ومستوى الصوت والمزامنة"
        : "Reciters, volume, and synchronization";
  const cleanOptionsModalTitle =
    lang === "ar" ? "\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0627\u0644\u0635\u0648\u062a" : lang === "fr" ? "R\u00e9glages audio" : optionsModalTitle;
  const cleanOptionsModalSubtitle =
    lang === "ar"
      ? "\u0627\u0644\u0642\u0631\u0627\u0621 \u0648\u0645\u0633\u062a\u0648\u0649 \u0627\u0644\u0635\u0648\u062a \u0648\u0627\u0644\u0645\u0632\u0627\u0645\u0646\u0629"
      : lang === "fr"
        ? "R\u00e9citateurs, volume et synchronisation"
        : optionsModalSubtitle;
  const closeOptionsLabel =
    lang === "ar" ? "\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u062e\u064a\u0627\u0631\u0627\u062a" : lang === "fr" ? "Fermer les options" : "Close options";

  return optionsModalOpen ? (
      <div
        className="audio-player-modal fixed inset-0 z-[420] flex items-center justify-center p-2 sm:p-4"
        data-no-drag="true"
      >
        <button
          type="button"
          className="audio-player-modal__backdrop absolute inset-0 bg-[color-mix(in_srgb,var(--theme-bg)_68%,#040810_32%)] backdrop-blur-sm"
          onClick={closeOptionsModal}
          aria-label={closeOptionsLabel}
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
                {cleanOptionsModalTitle}
              </h3>
              <p className="mt-1 truncate text-[0.66rem] text-[color-mix(in_srgb,var(--theme-text-muted)_88%,var(--theme-bg)_12%)] sm:text-xs">
                {cleanOptionsModalSubtitle}
              </p>
            </div>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-[color-mix(in_srgb,var(--theme-border)_60%,transparent_40%)] bg-[color-mix(in_srgb,var(--theme-panel-bg-strong)_74%,transparent_26%)] text-[0.72rem] text-[color-mix(in_srgb,var(--theme-text)_84%,var(--theme-bg)_16%)] transition-all duration-150 hover:border-[color-mix(in_srgb,var(--theme-primary)_44%,transparent_56%)] hover:bg-[rgba(var(--theme-primary-rgb),0.14)] hover:text-white"
              onClick={closeOptionsModal}
              aria-label={lang === "ar" ? "\u0625\u063a\u0644\u0627\u0642" : lang === "fr" ? "Fermer" : "Close"}
              ref={optionsCloseButtonRef}
            >
              <i className="fas fa-times" />
            </button>
          </div>

          <div className="audio-player-modal__grid grid min-h-0 flex-1 gap-4 overflow-hidden p-3 sm:p-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <ReciterOptionsList
              autoSelectFastestReciter={autoSelectFastestReciter}
              currentReciters={currentReciters}
              filteredReciters={filteredReciters}
              favoriteReciters={favoriteReciters}
              handleReciterSelect={handleReciterSelect}
              lang={lang}
              networkState={networkState}
              playerFadedTextClass={playerFadedTextClass}
              playerGoldMetaClass={playerGoldMetaClass}
              playerReciterButtonClass={playerReciterButtonClass}
              playerSearchInputClass={playerSearchInputClass}
              playerSectionLabelClass={playerSectionLabelClass}
              playerSoftSurfaceClass={playerSoftSurfaceClass}
              reciter={reciter}
              reciterAvailabilityById={reciterAvailabilityById}
              reciterLatencyByKey={reciterLatencyByKey}
              reciterSearch={reciterSearch}
              reciterSwitchingId={reciterSwitchingId}
              setReciterSearch={setReciterSearch}
            />

            <PlaybackSettingsPanel
              audioSpeed={audioSpeed}
              closeOptionsModal={closeOptionsModal}
              cycleSpeed={cycleSpeed}
              handleVolumeChange={handleVolumeChange}
              isSurahStreamReciter={isSurahStreamReciter}
              lang={lang}
              memMode={memMode}
              memPause={memPause}
              memRepeatCount={memRepeatCount}
              playerCardToggleClass={playerCardToggleClass}
              playerFadedTextClass={playerFadedTextClass}
              playerGoldMetaClass={playerGoldMetaClass}
              playerMutedTextClass={playerMutedTextClass}
              playerNumberInputClass={playerNumberInputClass}
              playerOptionPillClass={playerOptionPillClass}
              playerSectionLabelClass={playerSectionLabelClass}
              playerSoftSurfaceClass={playerSoftSurfaceClass}
              playerSurfaceButtonClass={playerSurfaceButtonClass}
              set={set}
              setSurahRepeatSetting={setSurahRepeatSetting}
              setSyncOffsetMs={setSyncOffsetMs}
              showMemorizationControls={showMemorizationControls}
              stop={stop}
              surahRepeatCount={surahRepeatCount}
              syncOffsetMs={syncOffsetMs}
              volume={volume}
            />
          </div>
        </div>
      </div>
    ) : null;
}
