import React from "react";
import { Check, LoaderCircle, Search, Star, X } from "lucide-react";
import { t } from "../../i18n";
import { cn } from "../../lib/utils";
import { formatCooldownLabel } from "../../utils/formatUtils";
import {
  getLatencyForReciter,
  getReciterUnavailableRemainingMs,
} from "../../utils/reciterRanking";
import { getReciterBio, getReciterPhoto, getReciterAvatar } from "../../data/reciters";
import { ReciterPhoto } from "./AudioPlayerPrimitives";

function pick(lang, values) {
  return values[lang] || values.fr;
}

function getReciterName(reciter, lang) {
  const name =
    lang === "ar"
      ? reciter.name
      : lang === "fr"
        ? reciter.nameFr
        : reciter.nameEn;

  return String(
    name || reciter.nameEn || reciter.nameFr || reciter.name || "",
  )
    .replace(/\s*\((?:warsh|hafs|ورش|حفص)\)\s*$/iu, "")
    .trim();
}

function getRiwayaLabel(reciter, lang) {
  const isWarsh = reciter.riwaya === "warsh" || reciter.verifiedWarsh === true;

  if (lang === "ar") return isWarsh ? "رواية ورش" : "رواية حفص";
  return isWarsh ? "Riwāya Warsh" : "Riwāya Hafs";
}

function getStyleLabel(reciter, lang) {
  const style = reciter.style || "murattal";

  if (lang === "ar") {
    if (style === "mujawwad") return "مجود";
    if (style === "tartil") return "ترتيل";
    return "مرتل";
  }

  if (style === "mujawwad") return "Mujawwad";
  if (style === "tartil") return "Tartīl";
  return "Murattal";
}

export default function ReciterOptionsList(props) {
  const {
    autoSelectFastestReciter,
    className,
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
    selected: pick(lang, {
      fr: "Récitateur sélectionné",
      en: "Selected reciter",
      ar: "القارئ المحدد",
    }),
    voices: pick(lang, {
      fr: "voix",
      en: "voices",
      ar: "أصوات",
    }),
  };

  const isAnyReciterSwitching = Boolean(reciterSwitchingId);

  return (
    <section
      className={cn(
        "audio-reciter-options audio-player-modal__tab-panel flex min-h-0 flex-col p-3 sm:p-3.5",
        className,
        playerSoftSurfaceClass,
      )}
    >
      <div className="audio-reciter-options__heading mb-2 flex items-center justify-between gap-2">
        <h4 className={playerSectionLabelClass}>
          {t("audio.reciter", lang)}
        </h4>
        <span
          className={cn(
            playerGoldMetaClass,
            "audio-reciter-options__count text-[0.6rem] font-semibold tabular-nums",
          )}
        >
          {filteredReciters.length !== currentReciters.length
            ? `${filteredReciters.length} / ${currentReciters.length} ${labels.voices}`
            : `${currentReciters.length} ${labels.voices}`}
        </span>
      </div>

      {currentReciters.length > 4 && (
        <div className="audio-reciter-options__search relative mb-2">
          <Search size={14} className="pointer-events-none absolute start-3.5 top-1/2 z-[1] -translate-y-1/2 text-[color-mix(in_srgb,var(--theme-text-muted)_76%,transparent_24%)]" />
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
              className="absolute end-2.5 top-1/2 z-[1] -translate-y-1/2 text-[0.58rem] text-[color-mix(in_srgb,var(--theme-text-muted)_80%,transparent_20%)]"
              aria-label={labels.clearSearch}
            >
              <X size={13} />
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

              const bio = getReciterBio(r, lang);
              const photo = getReciterPhoto(r.id);
              const avatar = getReciterAvatar(r);
              const displayName = getReciterName(r, lang);
              const riwayaLabel = getRiwayaLabel(r, lang);
              const styleLabel = getStyleLabel(r, lang);

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
                  aria-label={`${displayName}, ${riwayaLabel}, ${styleLabel}`}
                  data-testid="reciter-option"
                  data-reciter-id={r.id}
                  data-state={isLoading ? "loading" : active ? "selected" : "idle"}
                  disabled={isAnyReciterSwitching || (isUnavailable && !active)}
                >
                  {/* Photo or avatar — larger for the modal grid */}
                  <span className="audio-reciter-options__photo relative shrink-0 overflow-hidden rounded-xl border">
                    <span
                      className="audio-reciter-options__initials flex h-full w-full items-center justify-center font-black text-white"
                      style={{ background: avatar?.gradient }}
                      aria-hidden="true"
                    >
                      {avatar?.initials}
                    </span>
                    <ReciterPhoto
                      src={photo}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </span>

                  <span className="audio-reciter-options__copy flex min-w-0 flex-col gap-1">
                    <span className="audio-reciter-options__name-row flex min-w-0 items-center gap-1.5">
                      <span className="audio-reciter-options__name min-w-0 truncate text-[0.76rem] font-bold leading-snug">
                        {displayName}
                      </span>
                      {isFavorite && (
                        <Star
                          size={11}
                          className="audio-reciter-options__favorite shrink-0"
                          fill="currentColor"
                          aria-label={labels.favorite}
                        />
                      )}
                    </span>

                    <span className="audio-reciter-options__meta flex min-w-0 items-center gap-1.5">
                      <span className="audio-reciter-options__riwaya">
                        {riwayaLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{styleLabel}</span>
                      {r.audioMode === "surah" && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{labels.fullSurah}</span>
                        </>
                      )}
                    </span>

                    {/* Bio — compact 2-line clamp */}
                    {bio && (
                      <span
                        className="audio-reciter-options__bio line-clamp-1 text-[0.58rem] leading-[1.45]"
                        title={bio}
                      >
                        {bio}
                      </span>
                    )}

                    <span className="audio-reciter-options__badges flex flex-wrap gap-1">
                      <span className="audio-reciter-options__badge audio-reciter-options__source inline-flex w-fit items-center rounded-full border px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide">
                        {r.cdnType === "everyayah"
                          ? "EveryAyah CDN"
                          : r.cdnType === "mp3quran-surah"
                            ? "MP3Quran"
                            : "Islamic CDN"}
                      </span>
                      {autoSelectFastestReciter &&
                        filteredReciters[0]?.id === r.id && (
                          <span className="audio-reciter-options__badge audio-reciter-options__badge--fast inline-flex w-fit items-center rounded-full border px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide">
                            {labels.fast}
                          </span>
                        )}
                      {isUnavailable && (
                        <span className="audio-reciter-options__badge audio-reciter-options__badge--unavailable inline-flex w-fit items-center rounded-full border px-1.5 py-0.5 text-[0.52rem] font-semibold tracking-wide">
                          {`${labels.unavailable} ${formatCooldownLabel(unavailableMs, lang)}`}
                        </span>
                      )}
                    </span>
                  </span>

                  <span className="audio-reciter-options__status" aria-hidden="true">
                    {isLoading ? (
                      <span className="audio-reciter-options__check">
                        <LoaderCircle size={14} className="animate-spin" />
                      </span>
                    ) : active ? (
                      <span className="audio-reciter-options__check" title={labels.selected}>
                        <Check size={14} strokeWidth={3} />
                      </span>
                    ) : null}
                    {latency && !isUnavailable && (
                      <span className="audio-reciter-options__latency">
                        {Math.round(latency * 1000)} ms
                      </span>
                    )}
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
