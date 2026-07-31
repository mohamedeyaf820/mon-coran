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
import {
  getFontOptionsForRiwaya,
  getNativeAyahMarker,
  normalizeFontId,
  resolveFontFamily,
} from "../data/fonts";
import { ensureFontLoaded } from "../services/fontLoader";
import { downloadExport, importFromFile } from "../services/exportService";
import { clearCache } from "../services/quranAPI";
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
    audioSpeed,
    autoNightMode,
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
    showWordByWord,
    showWordTranslation,
    theme,
    translationLangs = ["fr"],
    usePrayerTimes,
    volume,
  } = state;

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
      [item.name, item.nameFr, item.nameEn, item.style]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [reciterSearch, recitersList]);

  const title = localText(lang, "Paramètres", "Settings", "الإعدادات");
  const close = () => dispatch({ type: "TOGGLE_SETTINGS" });

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
    try {
      await clearCache();
      toast(t("settings.cacheCleared", lang), "success");
      setTimeout(() => window.location.reload(), 1200);
    } catch (error) {
      if (import.meta.env.DEV) console.warn("clearCache error:", error);
      toast(t("errors.generic", lang), "error");
    }
  };

  const setPrivacyField = (field, value) => {
    setPrivacyFields((current) => ({ ...current, [field]: value }));
    setPrivacyError("");
  };

  const privacyFailureText = (error) => {
    if (error === "Current passphrase is invalid") {
      return localText(
        lang,
        "La phrase secr\u00e8te actuelle est incorrecte.",
        "The current passphrase is incorrect.",
        "\u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062d\u0627\u0644\u064a\u0629 \u063a\u064a\u0631 \u0635\u062d\u064a\u062d\u0629.",
      );
    }
    if (error === "Passphrase too short") {
      return localText(
        lang,
        `Utilisez au moins ${MIN_PASSPHRASE_LENGTH} caract\u00e8res.`,
        `Use at least ${MIN_PASSPHRASE_LENGTH} characters.`,
        `\u0627\u0633\u062a\u062e\u062f\u0645 ${MIN_PASSPHRASE_LENGTH} \u0631\u0645\u0632\u064b\u0627 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.`,
      );
    }
    return localText(
      lang,
      "La migration s\u00e9curis\u00e9e a \u00e9chou\u00e9 et a \u00e9t\u00e9 annul\u00e9e autant que possible. Exportez une sauvegarde avant de r\u00e9essayer.",
      "The secure migration failed and was rolled back where possible. Export a backup before retrying.",
      "\u0641\u0634\u0644 \u0627\u0644\u062a\u0631\u062d\u064a\u0644 \u0627\u0644\u0622\u0645\u0646 \u0648\u062a\u0645 \u0627\u0644\u062a\u0631\u0627\u062c\u0639 \u0639\u0646\u0647 \u0642\u062f\u0631 \u0627\u0644\u0625\u0645\u0643\u0627\u0646. \u0635\u062f\u0651\u0631 \u0646\u0633\u062e\u0629 \u0627\u062d\u062a\u064a\u0627\u0637\u064a\u0629 \u0642\u0628\u0644 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629 \u0645\u062c\u062f\u062f\u064b\u0627.",
    );
  };

  const handleEnableProtection = async (event) => {
    event.preventDefault();
    if (privacyFields.next !== privacyFields.confirm) {
      setPrivacyError(localText(lang, "Les phrases ne correspondent pas.", "Passphrases do not match.", "\u0639\u0628\u0627\u0631\u062a\u0627 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0645\u062a\u0637\u0627\u0628\u0642\u062a\u064a\u0646."));
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
    toast(localText(lang, "Mode prot\u00e9g\u00e9 activ\u00e9.", "Protected mode enabled.", "\u062a\u0645 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u062d\u0645\u064a."), "success");
  };

  const handleChangeProtection = async (event) => {
    event.preventDefault();
    if (privacyFields.next !== privacyFields.confirm) {
      setPrivacyError(localText(lang, "Les phrases ne correspondent pas.", "Passphrases do not match.", "\u0639\u0628\u0627\u0631\u062a\u0627 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0645\u062a\u0637\u0627\u0628\u0642\u062a\u064a\u0646."));
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
    toast(localText(lang, "Phrase secr\u00e8te modifi\u00e9e.", "Passphrase changed.", "\u062a\u0645 \u062a\u063a\u064a\u064a\u0631 \u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0648\u0631."), "success");
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
    toast(localText(lang, "Mode prot\u00e9g\u00e9 d\u00e9sactiv\u00e9.", "Protected mode disabled.", "\u062a\u0645 \u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u062d\u0645\u064a."), "success");
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
                <span className="settings-theme-tile__copy">
                  <strong>{label}</strong>
                  <small>{description}</small>
                </span>
                {isActive ? (
                  <span
                    className="settings-theme-tile__check"
                    aria-hidden="true"
                  >
                    <Check size={13} />
                  </span>
                ) : null}
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
            <SwitchRow
              id="settings-prayer-times"
              checked={Boolean(usePrayerTimes)}
              onChange={(checked) => set({ usePrayerTimes: checked })}
              label={t("settings.prayerTimes", lang)}
              description={t("settings.prayerTimesHint", lang)}
            />
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

      <Section title={localText(lang, "Tailles de texte", "Text sizes", "حجم النص")}>
        <SliderRow
          id="settings-font-size-quran"
          label={t("settings.arabicFontSize", lang)}
          min={ARABIC_FONT_SIZE_MIN}
          max={ARABIC_FONT_SIZE_MAX}
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
        {activeRiwaya !== "warsh" ? (
          <>
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
          </>
        ) : null}
      </Section>
    </div>
  );

  const renderAudioTab = () => (
    <div className="settings-panel-stack">
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

  const renderPrivacyTab = () => (
    <div className="settings-panel-stack">
      <Section
        title={localText(
          lang,
          "Protection locale",
          "Local protection",
          "\u0627\u0644\u062d\u0645\u0627\u064a\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629",
        )}
      >
        <div className="settings-cache-note">
          <Info size={16} aria-hidden="true" />
          <span>
            {localText(
              lang,
              "Le mode prot\u00e9g\u00e9 chiffre les r\u00e9glages, la position de lecture, les notes et les favoris avec une cl\u00e9 d\u00e9riv\u00e9e de votre phrase secr\u00e8te.",
              "Protected mode encrypts settings, reading position, notes and bookmarks with a key derived from your passphrase.",
              "\u064a\u0634\u0641\u0651\u0631 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u062d\u0645\u064a \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a \u0648\u0645\u0648\u0636\u0639 \u0627\u0644\u0642\u0631\u0627\u0621\u0629 \u0648\u0627\u0644\u0645\u0644\u0627\u062d\u0638\u0627\u062a \u0648\u0627\u0644\u0625\u0634\u0627\u0631\u0627\u062a \u0628\u0645\u0641\u062a\u0627\u062d \u0645\u0634\u062a\u0642 \u0645\u0646 \u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0648\u0631.",
            )}
          </span>
        </div>
        {privacyConfigured ? (
          <div className="settings-tool-link">
            <span>
              {localText(
                lang,
                "Mode prot\u00e9g\u00e9 actif",
                "Protected mode is active",
                "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u062d\u0645\u064a \u0645\u0641\u0639\u0651\u0644",
              )}
            </span>
            <small>
              {localText(
                lang,
                "La cl\u00e9 reste seulement en m\u00e9moire jusqu\u2019au verrouillage ou au rechargement.",
                "The key remains in memory only until you lock or reload.",
                "\u064a\u0628\u0642\u0649 \u0627\u0644\u0645\u0641\u062a\u0627\u062d \u0641\u064a \u0627\u0644\u0630\u0627\u0643\u0631\u0629 \u0641\u0642\u0637 \u062d\u062a\u0649 \u0627\u0644\u0642\u0641\u0644 \u0623\u0648 \u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u062d\u0645\u064a\u0644.",
              )}
            </small>
          </div>
        ) : null}
      </Section>

      {!privacyConfigured ? (
        <Section
          title={localText(
            lang,
            "Activer",
            "Enable",
            "\u062a\u0641\u0639\u064a\u0644",
          )}
        >
          <form className="settings-panel-stack" onSubmit={handleEnableProtection}>
            <div className="settings-time-grid">
              <label htmlFor="settings-protection-new">
                <span>{localText(lang, "Phrase secr\u00e8te", "Passphrase", "\u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0648\u0631")}</span>
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
                <span>{localText(lang, "Confirmer", "Confirm", "\u062a\u0623\u0643\u064a\u062f")}</span>
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
              <span>{privacyBusy ? localText(lang, "Migration\u2026", "Migrating\u2026", "\u062c\u0627\u0631\u064d \u0627\u0644\u062a\u0631\u062d\u064a\u0644\u2026") : localText(lang, "Activer le mode prot\u00e9g\u00e9", "Enable protected mode", "\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u062d\u0645\u064a")}</span>
            </button>
          </form>
        </Section>
      ) : (
        <>
          <Section title={localText(lang, "Session", "Session", "\u0627\u0644\u062c\u0644\u0633\u0629")}>
            <button type="button" className="settings-action-button" onClick={lockProtectedModeNow}>
              <LockKeyhole size={16} aria-hidden="true" />
              <span>{localText(lang, "Verrouiller maintenant", "Lock now", "\u0642\u0641\u0644 \u0627\u0644\u0622\u0646")}</span>
            </button>
          </Section>

          <Section title={localText(lang, "Modifier la phrase secr\u00e8te", "Change passphrase", "\u062a\u063a\u064a\u064a\u0631 \u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0648\u0631")}>
            <form className="settings-panel-stack" onSubmit={handleChangeProtection}>
              <div className="settings-time-grid">
                <label htmlFor="settings-protection-current">
                  <span>{localText(lang, "Phrase actuelle", "Current passphrase", "\u0627\u0644\u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629")}</span>
                  <input id="settings-protection-current" type="password" autoComplete="current-password" maxLength={256} value={privacyFields.current} onChange={(event) => setPrivacyField("current", event.target.value)} required />
                </label>
                <label htmlFor="settings-protection-replacement">
                  <span>{localText(lang, "Nouvelle phrase", "New passphrase", "\u0627\u0644\u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u062c\u062f\u064a\u062f\u0629")}</span>
                  <input id="settings-protection-replacement" type="password" autoComplete="new-password" minLength={MIN_PASSPHRASE_LENGTH} maxLength={256} value={privacyFields.next} onChange={(event) => setPrivacyField("next", event.target.value)} required />
                </label>
              </div>
              <div className="settings-time-grid">
                <label htmlFor="settings-protection-replacement-confirm">
                  <span>{localText(lang, "Confirmer la nouvelle phrase", "Confirm new passphrase", "\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u062c\u062f\u064a\u062f\u0629")}</span>
                  <input id="settings-protection-replacement-confirm" type="password" autoComplete="new-password" minLength={MIN_PASSPHRASE_LENGTH} maxLength={256} value={privacyFields.confirm} onChange={(event) => setPrivacyField("confirm", event.target.value)} required />
                </label>
              </div>
              <button type="submit" className="settings-action-button" disabled={privacyBusy}>
                {localText(lang, "Modifier", "Change", "\u062a\u063a\u064a\u064a\u0631")}
              </button>
            </form>
          </Section>

          <Section title={localText(lang, "D\u00e9sactiver", "Disable", "\u0625\u064a\u0642\u0627\u0641")}>
            <div className="settings-cache-note">
              <Info size={16} aria-hidden="true" />
              <span>{localText(lang, "Les donn\u00e9es seront rechiffr\u00e9es avec la cl\u00e9 locale de ce navigateur.", "Data will be re-encrypted with this browser's local device key.", "\u0633\u062a\u0639\u0627\u062f \u062a\u0634\u0641\u064a\u0631 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0628\u0645\u0641\u062a\u0627\u062d \u0647\u0630\u0627 \u0627\u0644\u0645\u062a\u0635\u0641\u062d \u0627\u0644\u0645\u062d\u0644\u064a.")}</span>
            </div>
            <form className="settings-panel-stack" onSubmit={handleDisableProtection}>
              <div className="settings-time-grid">
                <label htmlFor="settings-protection-disable">
                  <span>{localText(lang, "Phrase secr\u00e8te actuelle", "Current passphrase", "\u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0627\u0644\u062d\u0627\u0644\u064a\u0629")}</span>
                  <input id="settings-protection-disable" type="password" autoComplete="current-password" maxLength={256} value={privacyFields.disable} onChange={(event) => setPrivacyField("disable", event.target.value)} required />
                </label>
              </div>
              <button type="submit" className="settings-danger-button" disabled={privacyBusy}>
                {localText(lang, "D\u00e9sactiver le mode prot\u00e9g\u00e9", "Disable protected mode", "\u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u062d\u0645\u064a")}
              </button>
            </form>
          </Section>
        </>
      )}

      <p className="settings-cache-note" role="alert" aria-live="polite">
        {privacyError}
      </p>
      <Section title={localText(lang, "Limites", "Limits", "\u0627\u0644\u062d\u062f\u0648\u062f")}>
        <div className="settings-cache-note">
          <Info size={16} aria-hidden="true" />
          <span>{localText(lang, "Cette protection r\u00e9duit l\u2019exposition des donn\u00e9es au repos, mais ne prot\u00e8ge pas un appareil compromis ni une page d\u00e9j\u00e0 d\u00e9verrouill\u00e9e. Il n\u2019existe aucune r\u00e9cup\u00e9ration de phrase secr\u00e8te.", "This reduces exposure of data at rest, but cannot protect a compromised device or an already unlocked page. Passphrases cannot be recovered.", "\u062a\u0642\u0644\u0644 \u0647\u0630\u0647 \u0627\u0644\u062d\u0645\u0627\u064a\u0629 \u0645\u0646 \u0643\u0634\u0641 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u062e\u0632\u0646\u0629\u060c \u0644\u0643\u0646\u0647\u0627 \u0644\u0627 \u062a\u062d\u0645\u064a \u062c\u0647\u0627\u0632\u064b\u0627 \u0645\u062e\u062a\u0631\u0642\u064b\u0627 \u0623\u0648 \u0635\u0641\u062d\u0629 \u0645\u0641\u062a\u0648\u062d\u0629. \u0644\u0627 \u064a\u0645\u0643\u0646 \u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0639\u0628\u0627\u0631\u0629 \u0627\u0644\u0645\u0631\u0648\u0631.")}</span>
        </div>
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
                <X size={20} strokeWidth={2.4} />
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
