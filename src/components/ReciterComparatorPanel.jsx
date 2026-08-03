import React, { useCallback, useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useApp } from "../context/AppContext";
import { getReciter, getReciterVisual } from "../data/reciters";
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
  const visual = getReciterVisual(reciter);
  const displayName =
    lang === "ar" ? reciter.name : lang === "fr" ? reciter.nameFr : reciter.nameEn;

  return (
    <article className={`rc-track ${state}`}>
      <audio ref={audioRef} preload="none" />
      <div className="rc-track__header">
        <div className="rc-track__avatar" aria-hidden="true">
          <span style={{ background: visual.avatar.gradient }}>
            {visual.avatar.initials}
          </span>
          {visual.photo ? (
            <img
              src={visual.photo}
              alt=""
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              style={{ objectPosition: visual.focalPoint }}
              onError={(event) => {
                event.currentTarget.hidden = true;
              }}
            />
          ) : null}
        </div>
        <div className="rc-track__identity">
          <div className="rc-track__name">{displayName}</div>
          <div className="rc-track__name-ar" dir="rtl" lang="ar">
            {reciter.name}
          </div>
        </div>
        <span className={`rc-track__status rc-track__status--${state}`}>
          {state === "playing"
            ? lang === "fr" ? "En lecture" : "Playing"
            : state === "loading"
              ? lang === "fr" ? "Chargement" : "Loading"
              : lang === "fr" ? "Prêt" : "Ready"}
        </span>
      </div>
      <div className="rc-track__controls">
        <button
          className="rc-btn rc-btn--play"
          onClick={toggle}
          title={state === "playing" ? "Pause" : "Play"}
          type="button"
        >
          <Icon name={iconName} size={17} spin={state === "loading"} />
        </button>
        <button
          className="rc-btn rc-btn--restart"
          onClick={restart}
          title={lang === "fr" ? "Relire depuis le debut" : "Restart"}
          type="button"
        >
          <Icon name="rotate-left" size={17} />
        </button>
        <div className="rc-progress" aria-hidden="true">
          <div
            className="rc-progress__fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>
      {state === "error" ? (
        <div className="rc-error" role="status">
          <Icon name="exclamation-triangle" size={14} />
          {lang === "fr" ? "Audio indisponible" : "Audio unavailable"}
        </div>
      ) : null}
    </article>
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
            className="modal modal-panel--wide rc-panel"
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
            <div className="modal-header">
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
                className="modal-close"
                type="button"
                onClick={close}
                aria-label={lang === "fr" ? "Fermer" : "Close"}
              >
                <Icon name="xmark" size={18} />
              </button>
            </div>

            <div className="rc-ayah-selector">
              <label className="rc-selector-label" htmlFor="rc-surah-select">
                {lang === "fr" ? "Sourate" : "Surah"}
              </label>
              <select
                id="rc-surah-select"
                className="rc-select"
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
              <div className="rc-ayah-stepper">
                <button
                  className="rc-step-btn"
                  type="button"
                  onClick={() => setAyah((value) => Math.max(1, value - 1))}
                  disabled={ayah <= 1}
                  aria-label={
                    lang === "fr" ? "Verset précédent" : "Previous verse"
                  }
                >
                  <Icon name="minus" size={16} />
                </button>
                <span className="rc-ayah-num">
                  {ayah}
                </span>
                <button
                  className="rc-step-btn"
                  type="button"
                  onClick={() => setAyah((value) => Math.min(maxAyah, value + 1))}
                  disabled={ayah >= maxAyah}
                  aria-label={lang === "fr" ? "Verset suivant" : "Next verse"}
                >
                  <Icon name="plus" size={16} />
                </button>
              </div>
            </div>

            <div className="rc-picker">
              <div className="rc-picker__label">
                {lang === "fr"
                  ? `Récitateurs sélectionnés (max 4) - ${selected.length}/4`
                  : `Selected reciters (max 4) - ${selected.length}/4`}
              </div>
              <div className="rc-picker__grid">
                {COMPARE_RECITERS.map((reciter) => (
                  <button
                    key={reciter.id}
                    className={`rc-pick-btn ${selected.includes(reciter.id) ? "active" : ""}`}
                    onClick={() => toggleReciter(reciter.id)}
                    type="button"
                    aria-pressed={selected.includes(reciter.id)}
                    disabled={selected.length >= 4 && !selected.includes(reciter.id)}
                  >
                    <span dir="rtl">{reciter.name}</span>
                    {selected.includes(reciter.id) ? (
                      <Icon name="check" size={15} className="rc-pick-check" />
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            <div className="rc-tracks">
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
