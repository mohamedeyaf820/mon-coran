import React, { useMemo, useState } from "react";
import { CloudDownload, Search } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { t } from "../../i18n";
import { getRecitersByRiwaya, getReciterVisual } from "../../data/reciters";
import { Section, SliderRow } from "./controls";
import "../../styles/settings-panels.css";

function reciterName(item, lang) {
  if (lang === "fr") return item.nameFr || item.name;
  if (lang === "en") return item.nameEn || item.name;
  return item.name;
}

function ReciterAvatar({ reciter }) {
  const [imgError, setImgError] = useState(false);
  const visual = getReciterVisual(reciter);
  if (visual.type === "photo" && !imgError) {
    return (
      <span className="settings-reciter-avatar settings-reciter-avatar--photo">
        <img
          src={visual.photo}
          alt=""
          className="reciter-photo"
          style={{ objectPosition: visual.focalPoint }}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      </span>
    );
  }
  return (
    <span
      className="settings-reciter-avatar"
      style={{ "--avatar-bg": visual.avatar.color }}
      aria-hidden="true"
    >
      {visual.avatar.initials}
    </span>
  );
}

export default function AudioTab({ onOpenData }) {
  const { state, set } = useApp();
  const { audioSpeed = 1, volume = 1, reciter, lang, riwaya } = state;
  const activeRiwaya = riwaya || "hafs";
  const [search, setSearch] = useState("");

  const recitersList = useMemo(() => getRecitersByRiwaya(activeRiwaya), [activeRiwaya]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return recitersList;
    return recitersList.filter((item) =>
      [item.name, item.nameFr, item.nameEn, item.style, ...(item.searchAliases || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [search, recitersList]);
  const current = recitersList.find((item) => item.id === reciter);

  return (
    <div className="settings-panel-stack">
      {current ? (
        <section className="sp-current" aria-label={t("settings.currentReciter", lang)}>
          <ReciterAvatar reciter={current} />
          <span className="sp-current__text">
            <small>{t("settings.currentReciter", lang)}</small>
            <strong>{reciterName(current, lang)}</strong>
            <span>{current.style || "murattal"} · {activeRiwaya === "warsh" ? "Warsh" : "Hafs"}</span>
          </span>
        </section>
      ) : null}

      <Section title={t("settings.audioPlayback", lang)}>
        <SliderRow
          id="settings-audio-speed"
          label={t("audio.speed", lang)}
          min={0.5}
          max={2}
          step={0.25}
          value={audioSpeed}
          suffix="×"
          onChange={(value) => set({ audioSpeed: value })}
        />
        <SliderRow
          id="settings-audio-volume"
          label={t("audio.volume", lang)}
          min={0}
          max={100}
          value={Math.round(volume * 100)}
          suffix="%"
          onChange={(value) => set({ volume: value / 100 })}
        />
      </Section>

      <Section title={t("settings.selectReciter", lang)}>
        <div className="settings-search">
          <label className="sr-only" htmlFor="settings-reciter-search">
            {t("settings.searchReciters", lang)}
          </label>
          <Search size={16} aria-hidden="true" />
          <input
            id="settings-reciter-search"
            type="search"
            placeholder={t("settings.searchReciters", lang)}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="settings-reciter-list">
          {filtered.length ? (
            <div className="settings-reciter-grid">
              {filtered.map((item) => {
                const isActive = item.id === reciter;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className="settings-reciter-option"
                    data-active={isActive}
                    onClick={() => set({ reciter: item.id })}
                    aria-pressed={isActive}
                  >
                    <ReciterAvatar reciter={item} />
                    <span className="settings-reciter-option__text">
                      <span>{reciterName(item, lang)}</span>
                      <small>{item.style || "murattal"}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="settings-empty">{t("settings.noReciterFound", lang)}</p>
          )}
        </div>
      </Section>

      <aside className="sp-pointer">
        <CloudDownload size={18} aria-hidden="true" />
        <p>{t("settings.downloadsPointer", lang)}</p>
        <button type="button" className="settings-action-button" onClick={onOpenData}>
          {t("settings.manageDownloads", lang)}
        </button>
      </aside>
    </div>
  );
}
