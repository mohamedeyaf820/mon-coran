import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useApp } from "../context/AppContext";
import { getReciter } from "../data/reciters";
import SURAHS from "../data/surahs";
import { Icon } from "./ui/icon";

function buildUrl(reciter, surah, ayah) {
  const { cdn, cdnType } = reciter;
  if (cdnType === "everyayah") {
    const s = String(surah).padStart(3, "0");
    const a = String(ayah).padStart(3, "0");
    return `https://everyayah.com/data/${cdn}/${s}${a}.mp3`;
  }

  let global = 0;
  for (let i = 0; i < surah - 1; i += 1) global += SURAHS[i].ayahs;
  global += ayah;
  return `https://cdn.islamic.network/quran/audio/128/${cdn}/${global}.mp3`;
}

const COMPARE_RECITER_IDS = [
  "ar.alafasy",
  "ar.husary",
  "ar.minshawi",
  "ahmed_ajmy",
  "ali_jabir",
  "hudhaify",
  "yasser_dossari_hafs",
  "nasser_alqatami",
];

const COMPARE_RECITERS = COMPARE_RECITER_IDS.map((id) =>
  getReciter(id, "hafs"),
).filter(Boolean);

function ReciterTrack({ reciter, surah, ayah, lang }) {
  const audioRef = useRef(null);
  const [state, setState] = useState("idle");
  const [progress, setProgress] = useState(0);

  const url = buildUrl(reciter, surah, ayah);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return undefined;

    const onWaiting = () => setState("loading");
    const onCanPlay = () => setState((current) => (current === "loading" ? "paused" : current));
    const onPlay = () => setState("playing");
    const onPause = () => setState("paused");
    const onEnded = () => {
      setState("idle");
      setProgress(0);
    };
    const onError = () => setState("error");
    const onTimeUpdate = () => {
      if (audio.duration > 0) setProgress(audio.currentTime / audio.duration);
    };

    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [url]);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.src = url;
      audio.play().catch(() => setState("error"));
    } else {
      audio.pause();
    }
  }, [url]);

  const restart = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.src = url;
    audio.play().catch(() => setState("error"));
  }, [url]);

  const iconName =
    state === "playing" ? "pause" : state === "loading" ? "spinner" : "play";

  return (
    <div
      className={`rc-track ${state} rounded-2xl border border-[var(--border)] bg-white/[0.03] p-3 backdrop-blur-sm`}
    >
      <audio ref={audioRef} preload="none" />
      <div className="rc-track__name" dir="rtl">
        {reciter.name}
      </div>
      <div className="rc-track__name-en">{reciter.nameEn}</div>
      <div className="rc-track__controls !mt-2 !flex !items-center !gap-2">
        <button
          className="rc-btn rc-btn--play !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/14 !bg-sky-500/20 hover:!bg-sky-500/30"
          onClick={toggle}
          title={state === "playing" ? "Pause" : "Play"}
          type="button"
        >
          <Icon name={iconName} size={17} spin={state === "loading"} />
        </button>
        <button
          className="rc-btn rc-btn--restart !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/14 !bg-white/[0.05] hover:!bg-white/[0.12]"
          onClick={restart}
          title={lang === "fr" ? "Relire depuis le debut" : "Restart"}
          type="button"
        >
          <Icon name="rotate-left" size={17} />
        </button>
      </div>
      <div className="rc-progress !mt-2 !h-1.5 !overflow-hidden !rounded-full !bg-white/10">
        <div
          className="rc-progress__fill"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      {state === "error" ? (
        <div className="rc-error !mt-2 !inline-flex !items-center !gap-1.5 !rounded-lg !border !border-red-300/25 !bg-red-500/10 !px-2.5 !py-1.5 !text-xs !text-red-100">
          <Icon name="exclamation-triangle" size={14} />
          {lang === "fr" ? "Audio indisponible" : "Audio unavailable"}
        </div>
      ) : null}
    </div>
  );
}

export default function ReciterComparatorPanel() {
  const { state, dispatch } = useApp();
  const { lang, currentSurah, currentAyah } = state;

  const [selected, setSelected] = useState(() =>
    COMPARE_RECITERS.slice(0, 3).map((reciter) => reciter.id),
  );
  const [surah, setSurah] = useState(currentSurah);
  const [ayah, setAyah] = useState(currentAyah);

  const surahData = SURAHS[surah - 1];
  const maxAyah = surahData?.ayahs || 7;

  const close = () =>
    dispatch({ type: "SET", payload: { comparatorOpen: false } });

  const toggleReciter = (id) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((item) => item !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const selectedReciters = COMPARE_RECITERS.filter((reciter) =>
    selected.includes(reciter.id),
  );

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <Dialog.Portal>
        <div className="modal-overlay !p-3 sm:!p-5" onClick={close}>
          <Dialog.Content
            className="modal modal-panel--wide rc-panel !w-full !max-w-5xl !overflow-hidden !rounded-3xl !border !border-[var(--border)] !bg-[var(--bg-card)] !backdrop-blur-xl !shadow-[0_36px_90px_rgba(1,8,22,0.64)]"
            onClick={(event) => event.stopPropagation()}
            onEscapeKeyDown={(event) => {
              event.preventDefault();
              close();
            }}
            onInteractOutside={close}
          >
            <Dialog.Title className="sr-only">
              {lang === "ar" ? "مقارنة القراء" : lang === "en" ? "Reciter comparison" : "Comparateur de récitateurs"}
            </Dialog.Title>
            <div className="modal-header !border-b !border-[var(--border)] !bg-[var(--bg-secondary)]">
              <div className="modal-title-stack">
                <div className="modal-kicker">
                  {lang === "fr" ? "Écoute comparative" : "Comparative Listening"}
                </div>
                <h2 className="modal-title">
                  {lang === "fr" ? "Comparateur de récitateurs" : "Reciter Comparator"}
                </h2>
                <div className="modal-subtitle">
                  {lang === "fr"
                    ? "Écoutez le même verset par plusieurs récitateurs côte à côte."
                    : "Listen to the same verse by multiple reciters side by side."}
                </div>
              </div>
              <button
                className="modal-close !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-[var(--border)] !bg-white/[0.04] hover:!bg-white/[0.1]"
                type="button"
                onClick={close}
                aria-label={lang === "fr" ? "Fermer" : "Close"}
              >
                <Icon name="xmark" size={18} />
              </button>
            </div>

            <div className="rc-ayah-selector !grid !grid-cols-1 !gap-2 !p-3 sm:!grid-cols-[auto,1fr,auto,auto] sm:!items-center sm:!p-4">
              <label className="rc-selector-label">
                {lang === "fr" ? "Sourate" : "Surah"}
              </label>
              <select
                className="rc-select !min-h-11 !rounded-xl !border !border-white/15 !bg-white/[0.05] !px-3"
                value={surah}
                onChange={(event) => {
                  setSurah(Number(event.target.value));
                  setAyah(1);
                }}
              >
                {SURAHS.map((item, index) => (
                  <option key={index + 1} value={index + 1}>
                    {index + 1}. {item.ar} - {lang === "fr" ? item.fr || item.en : item.en}
                  </option>
                ))}
              </select>
              <label className="rc-selector-label">
                {lang === "fr" ? "Verset" : "Verse"}
              </label>
              <div className="rc-ayah-stepper !inline-flex !items-center !gap-2">
                <button
                  className="rc-step-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/14 !bg-white/[0.05] hover:!bg-white/[0.12]"
                  type="button"
                  onClick={() => setAyah((value) => Math.max(1, value - 1))}
                  disabled={ayah <= 1}
                  aria-label={
                    lang === "fr" ? "Verset précédent" : "Previous verse"
                  }
                >
                  <Icon name="minus" size={16} />
                </button>
                <span className="rc-ayah-num !min-w-10 !text-center !font-semibold">
                  {ayah}
                </span>
                <button
                  className="rc-step-btn !inline-flex !h-10 !w-10 !items-center !justify-center !rounded-xl !border !border-white/14 !bg-white/[0.05] hover:!bg-white/[0.12]"
                  type="button"
                  onClick={() => setAyah((value) => Math.min(maxAyah, value + 1))}
                  disabled={ayah >= maxAyah}
                  aria-label={lang === "fr" ? "Verset suivant" : "Next verse"}
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </div>

            <div className="rc-picker !space-y-2 !px-3 !pb-3 sm:!px-4">
              <div className="rc-picker__label">
                {lang === "fr"
                  ? `Récitateurs sélectionnés (max 4) - ${selected.length}/4`
                  : `Selected reciters (max 4) - ${selected.length}/4`}
              </div>
              <div className="rc-picker__grid !grid !grid-cols-2 !gap-2 md:!grid-cols-4">
                {COMPARE_RECITERS.map((reciter) => (
                  <button
                    key={reciter.id}
                    className={`rc-pick-btn !inline-flex !items-center !justify-between !rounded-xl !border !px-3 !py-2 !text-sm !transition-all hover:!border-sky-200/40 hover:!bg-white/[0.08] ${selected.includes(reciter.id) ? "!border-sky-200/40 !bg-sky-500/20 !text-white active" : "!border-white/14 !bg-white/[0.04]"} ${selected.length >= 4 && !selected.includes(reciter.id) ? "disabled !opacity-40" : ""}`}
                    onClick={() => toggleReciter(reciter.id)}
                    type="button"
                  >
                    <span dir="rtl">{reciter.name}</span>
                    {selected.includes(reciter.id) ? (
                      <Icon name="check" size={15} className="rc-pick-check" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="rc-tracks !grid !grid-cols-1 !gap-2 !px-3 !pb-4 sm:!px-4 md:!grid-cols-2">
              {selectedReciters.map((reciter) => (
                <ReciterTrack
                  key={`${reciter.id}-${surah}-${ayah}`}
                  reciter={reciter}
                  surah={surah}
                  ayah={ayah}
                  lang={lang}
                />
              ))}
              {selectedReciters.length === 0 ? (
                <div className="modal-empty">
                  <Icon name="user-music" size={28} />
                  <div>
                    {lang === "fr"
                      ? "Sélectionnez au moins un récitateur."
                      : "Select at least one reciter."}
                  </div>
                </div>
              ) : null}
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
