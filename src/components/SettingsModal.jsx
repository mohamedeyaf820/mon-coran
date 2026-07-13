import React, { useEffect, useMemo, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpen,
  Download,
  Info,
  Palette,
  Search,
  Trash2,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { getRecitersByRiwaya, getReciterVisual } from "../data/reciters";
import { THEMES as UI_THEMES } from "../data/themes";
import {
  getFontOptionsForRiwaya,
  getNativeAyahMarker,
  resolveFontFamily,
} from "../data/fonts";
import { ensureFontLoaded } from "../services/fontLoader";
import { downloadExport, importFromFile } from "../services/exportService";
import { clearCache } from "../services/quranAPI";
import { toast } from "../lib/utils";

const TRANSLATION_LANGS = [
  { id: "fr", label: "FR" },
  { id: "en", label: "EN" },
  { id: "es", label: "ES" },
  { id: "de", label: "DE" },
  { id: "tr", label: "TR" },
  { id: "ur", label: "UR" },
];

const TABS = [
  { id: "general", icon: Palette, labelKey: "settings.general" },
  { id: "reading", icon: BookOpen, labelKey: "settings.display" },
  { id: "audio", icon: Volume2, labelKey: "settings.audio" },
];

function localText(lang, fr, en, ar) {
  if (lang === "ar") return ar || en || fr;
  if (lang === "en") return en || fr;
  return fr;
}

function SettingsReciterAvatar({ reciter }) {
  const [imgError, setImgError] = React.useState(false);
  const visual = getReciterVisual(reciter);
  if (visual.type === "photo" && !imgError) {
    return (
      <span className="settings-reciter-avatar settings-reciter-avatar--photo">
        <img src={visual.photo} alt="" loading="lazy" onError={() => setImgError(true)} />
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

function Section({ title, children }) {
  return (
    <section className="settings-section">
      <h3 className="settings-section__title">{title}</h3>
      <div className="settings-section__body">{children}</div>
    </section>
  );
}

function SwitchRow({ checked, description, id, label, onChange }) {
  return (
    <label className="settings-control-row" htmlFor={id}>
      <span className="settings-control-row__copy">
        <span className="settings-control-row__label">{label}</span>
        {description ? (
          <span className="settings-control-row__description">{description}</span>
        ) : null}
      </span>
      <span className="settings-switch" aria-hidden="true" data-state={checked ? "checked" : "unchecked"}>
        <span />
      </span>
      <input
        id={id}
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        className="settings-visually-hidden"
      />
    </label>
  );
}

function SliderRow({ id, label, max, min, onChange, step = 1, suffix = "", value }) {
  return (
    <div className="settings-slider-row">
      <div className="settings-slider-row__head">
        <label htmlFor={id}>{label}</label>
        <span>{value}{suffix}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}

function Segmented({ ariaLabel, options, value, onChange }) {
  return (
    <div className="settings-segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => (
        <button
          type="button"
          key={option.id}
          className="settings-segmented__item"
          data-active={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export default function SettingsModal() {
  const { state, dispatch, set } = useApp();
  const {
    audioSpeed,
    autoNightMode,
    fontFamily,
    lang,
    nightEnd,
    nightStart,
    quranFontSize,
    quranTranslationFontSize = 18,
    reciter,
    riwaya,
    showTajwid,
    showTranslation,
    showTransliteration,
    showWordByWord,
    showWordTranslation,
    theme,
    translationLangs = ["fr"],
    volume,
  } = state;

  const [activeTab, setActiveTab] = useState("general");
  const [reciterSearch, setReciterSearch] = useState("");
  const firstInputRef = useRef(null);
  const activeRiwaya = riwaya || "hafs";

  const availableFontOptions = getFontOptionsForRiwaya(activeRiwaya);
  const selectedFontFamily = availableFontOptions.some((font) => font.id === fontFamily)
    ? fontFamily
    : availableFontOptions[0]?.id || "qpc-hafs";
  const selectedMarkerPreview = getNativeAyahMarker(
    1,
    selectedFontFamily,
    activeRiwaya,
  );
  const selectedMarkerFontFamily = resolveFontFamily(
    selectedFontFamily,
    activeRiwaya,
  );

  const recitersList = useMemo(
    () => getRecitersByRiwaya(activeRiwaya),
    [activeRiwaya],
  );
  const filteredReciters = useMemo(() => {
    const query = reciterSearch.trim().toLowerCase();
    if (!query) return recitersList;
    return recitersList.filter((item) =>
      [item.name, item.nameFr, item.nameEn, item.style]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [reciterSearch, recitersList]);

  const title = localText(lang, "Paramètres", "Settings", "الإعدادات");
  const close = () => dispatch({ type: "TOGGLE_SETTINGS" });

  useEffect(() => {
    ensureFontLoaded(selectedFontFamily).catch(() => {});
  }, [selectedFontFamily]);

  const handleTabKeyDown = (event) => {
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);
    let nextIndex = -1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = TABS.length - 1;
    }
    if (nextIndex >= 0) {
      event.preventDefault();
      const nextTab = TABS[nextIndex].id;
      setActiveTab(nextTab);
      document.getElementById(`settings-tab-${nextTab}`)?.focus();
    }
  };

  const handleTranslationToggle = (translationLang) => {
    const current = Array.isArray(translationLangs) ? translationLangs : ["fr"];
    const next = current.includes(translationLang)
      ? current.filter((item) => item !== translationLang)
      : [...current, translationLang].slice(0, 3);
    set({ translationLangs: next.length ? next : ["fr"] });
  };

  const handleClearCache = async () => {
    try {
      await clearCache();
      toast(t("settings.cacheCleared", lang), "success");
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      if (import.meta.env.DEV) console.warn("clearCache error:", error);
      toast(t("errors.generic", lang), "error");
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const ok = await importFromFile(file);
      toast(
        t(ok ? "settings.importSettingsSuccess" : "settings.importSettingsFailed", lang),
        ok ? "success" : "error",
      );
      if (ok) setTimeout(() => window.location.reload(), 1200);
    } catch {
      toast(t("settings.importSettingsFailed", lang), "error");
    } finally {
      event.target.value = "";
    }
  };

  const renderGeneralTab = () => (
    <div className="settings-panel-stack">
      <Section title={t("settings.appLanguage", lang)}>
        <Segmented
          ariaLabel={t("settings.appLanguage", lang)}
          value={lang}
          onChange={(nextLang) => set({ lang: nextLang })}
          options={[
            { id: "fr", label: "Français" },
            { id: "en", label: "English" },
            { id: "ar", label: "العربية" },
          ]}
        />
      </Section>

      <Section title={t("settings.visualTheme", lang)}>
        <div className="settings-theme-grid" role="group" aria-label={t("settings.visualTheme", lang)}>
          {UI_THEMES.map((item) => {
            const label = localText(lang, item.fr, item.en, item.ar);
            const isActive = theme === item.id;
            return (
              <button
                type="button"
                key={item.id}
                className="settings-theme-tile"
                data-active={isActive}
                onClick={() => set({ theme: item.id })}
                aria-pressed={isActive}
              >
                <span
                  className="settings-theme-tile__swatch"
                  style={{
                    "--theme-bg": item.palette?.bg || "var(--bg-primary)",
                    "--theme-primary": item.palette?.primary || "var(--primary)",
                    "--theme-text": item.palette?.text || "var(--text-primary)",
                  }}
                />
                <span>{label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={t("settings.autoNightMode", lang)}>
        <SwitchRow
          id="settings-auto-night"
          checked={autoNightMode}
          onChange={(checked) => set({ autoNightMode: checked })}
          label={t("settings.autoNightMode", lang)}
          description={t("settings.autoNightHint", lang)}
        />
        {autoNightMode ? (
          <div className="settings-time-grid">
            <label>
              <span>{t("settings.start", lang)}</span>
              <input
                ref={firstInputRef}
                type="time"
                value={nightStart || "20:00"}
                onChange={(event) => set({ nightStart: event.target.value })}
              />
            </label>
            <label>
              <span>{t("settings.end", lang)}</span>
              <input
                type="time"
                value={nightEnd || "06:00"}
                onChange={(event) => set({ nightEnd: event.target.value })}
              />
            </label>
          </div>
        ) : null}
      </Section>

      <Section title={t("settings.backupRestore", lang)}>
        <div className="settings-action-grid">
          <button type="button" className="settings-action-button" onClick={downloadExport}>
            <Download size={16} />
            <span>{t("export.export", lang)}</span>
          </button>
          <label className="settings-action-button" htmlFor="settings-import-file">
            <Upload size={16} />
            <span>{t("export.import", lang)}</span>
            <input
              id="settings-import-file"
              type="file"
              accept=".json"
              onChange={handleImport}
              className="settings-visually-hidden"
            />
          </label>
        </div>
      </Section>

      <Section title={localText(lang, "Outils", "Tools", "الأدوات")}>
        <button
          type="button"
          className="settings-tool-link"
          onClick={() => {
            set({ toolsHubOpen: true });
            close();
          }}
        >
          <span>
            {localText(lang, "Espace Outils", "Tools Hub", "مركز الأدوات")}
          </span>
          <small>
            {localText(
              lang,
              "Flashcards, statistiques, mémorisation et plus",
              "Flashcards, stats, memorization and more",
              "البطاقات التعليمية والإحصائيات والحفظ",
            )}
          </small>
        </button>
      </Section>
    </div>
  );

  const renderReadingTab = () => (
    <div className="settings-panel-stack">
      <Section title="Riwaya">
        <Segmented
          ariaLabel="Riwaya"
          value={activeRiwaya}
          onChange={(nextRiwaya) => set({ riwaya: nextRiwaya })}
          options={[
            { id: "hafs", label: "Hafs" },
            { id: "warsh", label: "Warsh" },
          ]}
        />
      </Section>

      <Section title={t("settings.arabicFontFamily", lang)}>
        <div className="settings-font-picker">
          <span
            className="settings-font-marker-preview native-ayah-marker"
            dir="rtl"
            aria-hidden="true"
            style={{ fontFamily: selectedMarkerFontFamily }}
          >
            {selectedMarkerPreview}
          </span>
          <select
            id="settings-font-family"
            value={selectedFontFamily}
            onChange={(event) => set({ fontFamily: event.target.value })}
            className="settings-select"
          >
            {availableFontOptions.map((font) => (
              <option key={font.id} value={font.id}>
                {font.label} - {t(font.hintKey, lang)}
              </option>
            ))}
          </select>
        </div>
      </Section>

      <Section title={localText(lang, "Tailles de texte", "Text sizes", "حجم النص")}>
        <SliderRow
          id="settings-font-size-quran"
          label={t("settings.arabicFontSize", lang)}
          min={12}
          max={96}
          value={quranFontSize}
          suffix="px"
          onChange={(value) => set({ quranFontSize: value })}
        />
        <SliderRow
          id="settings-font-size-translation"
          label={t("settings.translationFontSize", lang)}
          min={14}
          max={28}
          value={quranTranslationFontSize}
          suffix="px"
          onChange={(value) => set({ quranTranslationFontSize: value })}
        />
      </Section>

      <Section title={t("settings.translationLang", lang)}>
        <div className="settings-chip-grid" role="group" aria-label={t("settings.translationLang", lang)}>
          {TRANSLATION_LANGS.map((item) => {
            const isActive = translationLangs.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                className="settings-chip"
                data-active={isActive}
                onClick={() => handleTranslationToggle(item.id)}
                aria-pressed={isActive}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </Section>

      <Section title={t("settings.readingHelpers", lang)}>
        <SwitchRow
          id="settings-show-tajwid"
          checked={showTajwid}
          onChange={(checked) => set({ showTajwid: checked })}
          label={t("settings.tajweedColors", lang)}
          description={t("settings.tajweedDesc", lang)}
        />
        <SwitchRow
          id="settings-show-translation"
          checked={showTranslation}
          onChange={(checked) => set({ showTranslation: checked })}
          label={t("settings.showTranslationsDetail", lang)}
          description={t("settings.showTranslationsDesc", lang)}
        />
        <SwitchRow
          id="settings-show-transliteration"
          checked={showTransliteration}
          onChange={(checked) => set({ showTransliteration: checked })}
          label={t("settings.showTransliteration", lang)}
          description={t("settings.showTransliterationDesc", lang)}
        />
        <SwitchRow
          id="settings-show-word-by-word"
          checked={showWordByWord}
          onChange={(checked) => set({ showWordByWord: checked })}
          label={t("settings.wordByWordMode", lang)}
          description={t("settings.wordByWordDesc", lang)}
        />
        <SwitchRow
          id="settings-show-word-translation"
          checked={showWordTranslation}
          onChange={(checked) => set({ showWordTranslation: checked })}
          label={localText(lang, "Traduction mot à mot", "Word translation", "ترجمة الكلمات")}
          description={localText(lang, "Affiche le sens des mots quand le mode mot à mot est actif.", "Shows word meanings when word-by-word mode is active.", "يعرض معاني الكلمات عند تفعيل وضع كلمة بكلمة.")}
        />
      </Section>
    </div>
  );

  const renderAudioTab = () => (
    <div className="settings-panel-stack">
      <Section title={t("settings.selectReciter", lang)}>
        <div className="settings-search">
          <Search size={16} aria-hidden="true" />
          <input
            id="settings-reciter-search"
            type="search"
            placeholder={t("settings.searchReciters", lang)}
            value={reciterSearch}
            onChange={(event) => setReciterSearch(event.target.value)}
          />
        </div>

        <div className="settings-reciter-list">
          {filteredReciters.length ? (
            <div className="settings-reciter-grid">
              {filteredReciters.map((item) => {
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
                    <SettingsReciterAvatar reciter={item} />
                    <span className="settings-reciter-option__text">
                      <span>
                        {lang === "fr"
                          ? item.nameFr || item.name
                          : lang === "en"
                            ? item.nameEn || item.name
                            : item.name}
                      </span>
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

      <Section title={localText(lang, "Lecture", "Playback", "التشغيل")}>
        <SliderRow
          id="settings-audio-speed"
          label={t("settings.playbackSpeed", lang)}
          min={0.5}
          max={2}
          step={0.1}
          value={audioSpeed}
          suffix="x"
          onChange={(value) => set({ audioSpeed: value })}
        />
        <SliderRow
          id="settings-audio-volume"
          label="Volume"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          suffix=""
          onChange={(value) => set({ volume: value })}
        />
      </Section>

      <Section title={t("settings.clearCache", lang)}>
        <div className="settings-cache-note">
          <Info size={16} />
          <span>{t("settings.cacheInfo", lang)}</span>
        </div>
        <button type="button" className="settings-danger-button" onClick={handleClearCache}>
          <Trash2 size={16} />
          <span>{t("settings.clearCache", lang)}</span>
        </button>
      </Section>
    </div>
  );

  return (
    <Dialog.Root open onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="settings-backdrop" />
        <Dialog.Content
          className="settings-drawer settings-qurancom"
          aria-label={title}
          onEscapeKeyDown={close}
        >
          <header className="settings-drawer__header">
            <div className="settings-drawer__heading">
              <span className="settings-drawer__icon">
                <BookOpen size={18} />
              </span>
              <div>
                <Dialog.Title className="settings-drawer__title">{title}</Dialog.Title>
                <Dialog.Description className="settings-drawer__subtitle">
                  {t("settings.readingSettings", lang)}
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                className="settings-close-button"
                aria-label={localText(
                  lang,
                  "Fermer les param\u00e8tres",
                  "Close settings",
                  "\u0625\u063a\u0644\u0627\u0642 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a",
                )}
              >
                <X size={18} />
              </button>
            </Dialog.Close>
          </header>

          <nav
            className="settings-drawer__tabs"
            role="tablist"
            aria-label={localText(lang, "Onglets des paramètres", "Settings tabs", "تبويبات الإعدادات")}
            onKeyDown={handleTabKeyDown}
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  type="button"
                  key={tab.id}
                  id={`settings-tab-${tab.id}`}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`settings-panel-${tab.id}`}
                  tabIndex={isActive ? 0 : -1}
                  className="settings-tab-button"
                  data-active={isActive}
                  data-id={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="settings-tab-button__icon">
                    <Icon size={16} />
                  </span>
                  <span className="settings-tab-button__label">{t(tab.labelKey, lang)}</span>
                </button>
              );
            })}
          </nav>

          <main className="settings-drawer__content">
            <div
              id={`settings-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`settings-tab-${activeTab}`}
            >
              {activeTab === "general" ? renderGeneralTab() : null}
              {activeTab === "reading" ? renderReadingTab() : null}
              {activeTab === "audio" ? renderAudioTab() : null}
            </div>
          </main>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
