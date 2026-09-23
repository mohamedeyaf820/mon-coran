import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/settings-enhanced.css";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpen,
  Check,
  Download,
  Info,
  Palette,
  Search,
  ShieldCheck,
  LockKeyhole,
  Trash2,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { getRecitersByRiwaya, getReciterVisual } from "../data/reciters";
import { THEMES as UI_THEMES } from "../data/themes";
import ThemePreview from "./settings/ThemePreview";
import {
  getFontOptionsForRiwaya,
  getNativeAyahMarker,
  normalizeFontId,
  resolveFontFamily,
} from "../data/fonts";
import { ensureFontLoaded } from "../services/fontLoader";
import { downloadExport, importFromFile } from "../services/exportService";
import { clearCache, TRANSLATION_CHOICES } from "../services/quranAPI";
import { clearAllLocalAppData } from "../services/localDataService";
import { confirmAction } from "../services/interactionService";
import { toast } from "../lib/utils";
import {
  hasEncryptionPassphraseConfigured,
  MIN_PASSPHRASE_LENGTH,
} from "../services/cryptoUtil";
import {
  changeProtectedModePassphrase,
  disableProtectedMode,
  enableProtectedMode,
  lockProtectedModeNow,
} from "../services/privacyProtectionService";
import {
  ARABIC_FONT_SIZE_MAX,
  ARABIC_FONT_SIZE_MIN,
} from "../utils/arabicTypography";
const TABS = [
  { id: "general", icon: Palette, labelKey: "settings.general" },
  { id: "reading", icon: BookOpen, labelKey: "settings.display" },
  { id: "audio", icon: Volume2, labelKey: "settings.audio" },
  { id: "privacy", icon: ShieldCheck, labelKey: "settings.privacy" },
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
          aria-pressed={value === option.id}
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
    autoNightMode,
    audioSpeed = 1,
    fontFamily,
    fontFamilyByRiwaya,
    lang,
    nightEnd,
    nightStart,
    quranFontSize,
    quranTranslationFontSize = 18,
    reciter,
    riwaya,
    currentJuz,
    currentPage,
    currentSurah,
    displayMode,
    showHome,
    showDuas,
    legalPage,
    warshStrictMode,
    showTajwid,
    showTranslation,
    showTransliteration,
    theme,
    translationLangs = ["fr"],
    volume = 1,
  } = state;

  const [cacheBusy, setCacheBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [reciterSearch, setReciterSearch] = useState("");
  const [privacyConfigured, setPrivacyConfigured] = useState(() =>
    hasEncryptionPassphraseConfigured(),
  );
  const [privacyBusy, setPrivacyBusy] = useState(false);
  const [privacyError, setPrivacyError] = useState("");
  const [privacyFields, setPrivacyFields] = useState({
    current: "",
    next: "",
    confirm: "",
    disable: "",
  });
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
      [item.name, item.nameFr, item.nameEn, item.style, ...(item.searchAliases || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [reciterSearch, recitersList]);

  const title = t("settings.title", lang);
  // Escape fires onEscapeKeyDown and then Radix's own dismiss (onOpenChange), so
  // a toggle here flipped the panel closed and straight back open again.
  const close = () => dispatch({ type: "SET", payload: { settingsOpen: false } });

  const handleRiwayaChange = async (nextRiwaya) => {
    const targetRiwaya = nextRiwaya === "warsh" ? "warsh" : "hafs";
    if (targetRiwaya === activeRiwaya) return;
    const targetFont = normalizeFontId(
      fontFamilyByRiwaya?.[targetRiwaya] || fontFamily,
      targetRiwaya,
    );
    const tasks = [ensureFontLoaded(targetFont).catch(() => null)];
    if (!showHome && !showDuas && !legalPage) {
      tasks.push(
        import("./QuranDisplay/useQuranDisplayData")
          .then(({ preloadQuranDisplayData }) =>
            preloadQuranDisplayData({
              currentJuz,
              currentPage,
              currentSurah,
              displayMode,
              lang,
              riwaya: targetRiwaya,
              warshStrictMode,
            }),
          )
          .catch(() => null),
      );
    }
    await Promise.allSettled(tasks);
    set({ riwaya: targetRiwaya });
  };

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
    if (cacheBusy) return;
    const approved = await confirmAction({
      message: t("settings.clearCacheConfirm", lang),
      tone: "danger",
    });
    if (!approved) return;
    setCacheBusy(true);
    try {
      await clearCache();
      toast(t("settings.cacheCleared", lang), "success");
    } catch (error) {
      if (import.meta.env.DEV) console.warn("clearCache error:", error);
      toast(t("errors.generic", lang), "error");
    } finally {
      setCacheBusy(false);
    }
  };

  const handleDeleteLocalData = async () => {
    const approved = await confirmAction({
      title: t("settings.deleteAllTitle", lang),
      message: t("settings.deleteAllMessage", lang),
      confirmLabel: t("settings.deleteAllConfirm", lang),
      cancelLabel: t("common.cancel", lang),
      tone: "danger",
    });
    if (!approved) return;

    setPrivacyBusy(true);
    try {
      await clearAllLocalAppData();
      toast(t("settings.dataDeletedToast", lang), "success");
      window.setTimeout(() => window.location.replace("/"), 350);
    } catch (error) {
      if (import.meta.env.DEV) console.warn("delete local data error:", error);
      setPrivacyBusy(false);
      toast(t("errors.generic", lang), "error");
    }
  };

  const setPrivacyField = (field, value) => {
    setPrivacyFields((current) => ({ ...current, [field]: value }));
    setPrivacyError("");
  };

  const privacyFailureText = (error) => {
    if (error === "Current passphrase is invalid") {
      return t("settings.passphraseInvalid", lang);
    }
    if (error === "Passphrase too short") {
      return t("settings.passphraseTooShort", lang).replace(
        "{min}",
        MIN_PASSPHRASE_LENGTH,
      );
    }
    return t("settings.migrationFailed", lang);
  };

  const handleEnableProtection = async (event) => {
    event.preventDefault();
    if (privacyFields.next !== privacyFields.confirm) {
      setPrivacyError(t("settings.passphraseMismatch", lang));
      return;
    }
    setPrivacyBusy(true);
    const result = await enableProtectedMode(privacyFields.next, lang);
    setPrivacyBusy(false);
    if (!result.ok) {
      setPrivacyError(privacyFailureText(result.error));
      return;
    }
    setPrivacyConfigured(true);
    setPrivacyFields({ current: "", next: "", confirm: "", disable: "" });
    toast(t("settings.protectedEnabledToast", lang), "success");
  };

  const handleChangeProtection = async (event) => {
    event.preventDefault();
    if (privacyFields.next !== privacyFields.confirm) {
      setPrivacyError(t("settings.passphraseMismatch", lang));
      return;
    }
    setPrivacyBusy(true);
    const result = await changeProtectedModePassphrase(
      privacyFields.current,
      privacyFields.next,
      lang,
    );
    setPrivacyBusy(false);
    if (!result.ok) {
      setPrivacyError(privacyFailureText(result.error));
      return;
    }
    setPrivacyFields({ current: "", next: "", confirm: "", disable: "" });
    toast(t("settings.passphraseChangedToast", lang), "success");
  };

  const handleDisableProtection = async (event) => {
    event.preventDefault();
    setPrivacyBusy(true);
    const result = await disableProtectedMode(privacyFields.disable);
    setPrivacyBusy(false);
    if (!result.ok) {
      setPrivacyError(privacyFailureText(result.error));
      return;
    }
    setPrivacyConfigured(false);
    setPrivacyFields({ current: "", next: "", confirm: "", disable: "" });
    toast(t("settings.protectedDisabledToast", lang), "success");
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
            const description = localText(
              lang,
              item.descriptionFr,
              item.descriptionEn,
              item.descriptionAr,
            );
            const isActive = theme === item.id;
            const periodLabel =
              item.period === "night"
                ? t("settings.periodNight", lang)
                : t("settings.periodDay", lang);
            return (
              <button
                type="button"
                key={item.id}
                className="settings-theme-tile"
                data-active={isActive}
                onClick={() => set({ theme: item.id })}
                aria-pressed={isActive}
                aria-label={`${label}. ${description}`}
              >
                <span
                  className="settings-theme-tile__visual"
                  style={{
                    "--theme-bg": item.palette?.bg || "var(--bg-primary)",
                    "--theme-primary": item.palette?.primary || "var(--primary)",
                    "--theme-text": item.palette?.text || "var(--text-primary)",
                  }}
                >
                  <ThemePreview themeId={item.id} />
                  {isActive ? (
                    <span
                      className="settings-theme-tile__check"
                      aria-hidden="true"
                    >
                      <Check size={13} />
                    </span>
                  ) : null}
                </span>
                <span className="settings-theme-tile__copy">
                  <span className="settings-theme-tile__heading">
                    <strong>{label}</strong>
                    <span className="settings-theme-tile__period">{periodLabel}</span>
                  </span>
                  <small>{description}</small>
                </span>
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
          <div className="settings-panel-stack">
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
          </div>
        ) : null}
      </Section>

    </div>
  );

  const renderReadingTab = () => (
    <div className="settings-panel-stack">
      <Section title={t("settings.riwayaDefault", lang)}>
        <Segmented
          ariaLabel="Riwaya"
          value={activeRiwaya}
          onChange={handleRiwayaChange}
          options={[
            { id: "hafs", label: "Hafs" },
            { id: "warsh", label: "Warsh" },
          ]}
        />
      </Section>

      <Section title={t("settings.arabicFontFamily", lang)}>
        <div className="settings-font-picker">
          <label className="sr-only" htmlFor="settings-font-family">
            {t("settings.arabicFontFamily", lang)}
          </label>
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

      <Section title={t("settings.textSizes", lang)}>
        <SliderRow
          id="settings-font-size-quran"
          label={t("settings.arabicFontSize", lang)}
          min={ARABIC_FONT_SIZE_MIN}
          max={ARABIC_FONT_SIZE_MAX}
          value={quranFontSize}
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
          {TRANSLATION_CHOICES.map((item) => {
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
                {item.labelKey ? t(item.labelKey, lang) : item.label}
              </button>
            );
          })}
        </div>
        {translationLangs.some((id) =>
          TRANSLATION_CHOICES.find((item) => item.id === id)?.riwaya === "warsh",
        ) && (
          <p className="settings-hint">{t("settings.translationWarshHint", lang)}</p>
        )}
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
      </Section>
    </div>
  );

  const renderAudioTab = () => (
    <div className="settings-panel-stack">
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

      <details className="settings-advanced-disclosure">
        <summary>{t("settings.troubleshooting", lang)}</summary>
        <Section title={t("settings.clearCache", lang)}>
          <div className="settings-cache-note">
            <Info size={16} />
            <span>{t("settings.cacheInfo", lang)}</span>
          </div>
          <button type="button" className="settings-danger-button" onClick={handleClearCache} disabled={cacheBusy} aria-busy={cacheBusy}>
            <Trash2 size={16} />
            <span>{t("settings.clearCache", lang)}</span>
          </button>
        </Section>
      </details>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="settings-panel-stack">
      <Section title={t("settings.dataPrivacy", lang)}>
        <div className="settings-cache-note">
          <Info size={16} aria-hidden="true" />
          <span>{t("settings.backupRestoreHint", lang)}</span>
        </div>
        <div className="settings-action-grid">
          <button type="button" className="settings-action-button" onClick={downloadExport}>
            <Download size={16} aria-hidden="true" />
            <span>{t("export.export", lang)}</span>
          </button>
          <label className="settings-action-button" htmlFor="settings-import-file">
            <Upload size={16} aria-hidden="true" />
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

      <details className="settings-advanced-disclosure">
        <summary>{t("settings.advancedProtection", lang)}</summary>
      <Section title={t("settings.localProtection", lang)}>
        <div className="settings-cache-note">
          <Info size={16} aria-hidden="true" />
          <span>
            {t("settings.protectionExplain", lang)}
          </span>
        </div>
        {privacyConfigured ? (
          <div className="settings-tool-link">
            <span>
              {t("settings.protectionActive", lang)}
            </span>
            <small>
              {t("settings.protectionKeyHint", lang)}
            </small>
          </div>
        ) : null}
      </Section>

      {!privacyConfigured ? (
        <Section title={t("settings.enableSection", lang)}>
          <form className="settings-panel-stack" onSubmit={handleEnableProtection}>
            <div className="settings-time-grid">
              <label htmlFor="settings-protection-new">
                <span>{t("settings.passphraseLabel", lang)}</span>
                <input
                  id="settings-protection-new"
                  type="password"
                  autoComplete="new-password"
                  minLength={MIN_PASSPHRASE_LENGTH}
                  maxLength={256}
                  value={privacyFields.next}
                  onChange={(event) => setPrivacyField("next", event.target.value)}
                  required
                />
              </label>
              <label htmlFor="settings-protection-confirm">
                <span>{t("confirm.confirm", lang)}</span>
                <input
                  id="settings-protection-confirm"
                  type="password"
                  autoComplete="new-password"
                  minLength={MIN_PASSPHRASE_LENGTH}
                  maxLength={256}
                  value={privacyFields.confirm}
                  onChange={(event) => setPrivacyField("confirm", event.target.value)}
                  required
                />
              </label>
            </div>
            <button type="submit" className="settings-action-button" disabled={privacyBusy}>
              <ShieldCheck size={16} aria-hidden="true" />
              <span>{privacyBusy ? t("settings.migrating", lang) : t("settings.enableProtected", lang)}</span>
            </button>
          </form>
        </Section>
      ) : (
        <>
          <Section title={t("settings.session", lang)}>
            <button type="button" className="settings-action-button" onClick={lockProtectedModeNow}>
              <LockKeyhole size={16} aria-hidden="true" />
              <span>{t("settings.lockNow", lang)}</span>
            </button>
          </Section>

          <Section title={t("settings.changePassphrase", lang)}>
            <form className="settings-panel-stack" onSubmit={handleChangeProtection}>
              <div className="settings-time-grid">
                <label htmlFor="settings-protection-current">
                  <span>{t("settings.currentPassphrase", lang)}</span>
                  <input id="settings-protection-current" type="password" autoComplete="current-password" maxLength={256} value={privacyFields.current} onChange={(event) => setPrivacyField("current", event.target.value)} required />
                </label>
                <label htmlFor="settings-protection-replacement">
                  <span>{t("settings.newPassphrase", lang)}</span>
                  <input id="settings-protection-replacement" type="password" autoComplete="new-password" minLength={MIN_PASSPHRASE_LENGTH} maxLength={256} value={privacyFields.next} onChange={(event) => setPrivacyField("next", event.target.value)} required />
                </label>
              </div>
              <div className="settings-time-grid">
                <label htmlFor="settings-protection-replacement-confirm">
                  <span>{t("settings.confirmNewPassphrase", lang)}</span>
                  <input id="settings-protection-replacement-confirm" type="password" autoComplete="new-password" minLength={MIN_PASSPHRASE_LENGTH} maxLength={256} value={privacyFields.confirm} onChange={(event) => setPrivacyField("confirm", event.target.value)} required />
                </label>
              </div>
              <button type="submit" className="settings-action-button" disabled={privacyBusy}>
                {t("settings.changeButton", lang)}
              </button>
            </form>
          </Section>

          <Section title={t("settings.disableSection", lang)}>
            <div className="settings-cache-note">
              <Info size={16} aria-hidden="true" />
              <span>{t("settings.disableNote", lang)}</span>
            </div>
            <form className="settings-panel-stack" onSubmit={handleDisableProtection}>
              <div className="settings-time-grid">
                <label htmlFor="settings-protection-disable">
                  <span>{t("settings.disableCurrentPassphrase", lang)}</span>
                  <input id="settings-protection-disable" type="password" autoComplete="current-password" maxLength={256} value={privacyFields.disable} onChange={(event) => setPrivacyField("disable", event.target.value)} required />
                </label>
              </div>
              <button type="submit" className="settings-danger-button" disabled={privacyBusy}>
                {t("settings.disableProtected", lang)}
              </button>
            </form>
          </Section>
        </>
      )}

      <p className="settings-cache-note" role="alert" aria-live="polite">
        {privacyError}
      </p>
      <Section title={t("settings.limits", lang)}>
        <div className="settings-cache-note">
          <Info size={16} aria-hidden="true" />
          <span>{t("settings.limitsNote", lang)}</span>
        </div>
      </Section>
      </details>
      <Section title={t("settings.dataDeletion", lang)}>
        <div className="settings-cache-note">
          <Info size={16} aria-hidden="true" />
          <span>{t("settings.deletionNote", lang)}</span>
        </div>
        <button
          type="button"
          className="settings-danger-button"
          onClick={handleDeleteLocalData}
          disabled={privacyBusy}
          data-testid="delete-local-data"
        >
          <Trash2 size={16} aria-hidden="true" />
          <span>{t("settings.deleteAllButton", lang)}</span>
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
                aria-label={t("settings.closeAria", lang)}
              >
                <X size={20} strokeWidth={2.4} />
              </button>
            </Dialog.Close>
          </header>

          <nav
            className="settings-drawer__tabs"
            role="tablist"
            aria-label={t("settings.tabsAria", lang)}
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

          <div className="settings-drawer__content">
            <div
              id={`settings-panel-${activeTab}`}
              role="tabpanel"
              aria-labelledby={`settings-tab-${activeTab}`}
            >
              {activeTab === "general" ? renderGeneralTab() : null}
              {activeTab === "reading" ? renderReadingTab() : null}
              {activeTab === "audio" ? renderAudioTab() : null}
              {activeTab === "privacy" ? renderPrivacyTab() : null}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
