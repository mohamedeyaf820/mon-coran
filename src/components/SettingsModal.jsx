import { offlineText } from "../i18n/offline.js";
import React, { useEffect, useState } from "react";
import "../styles/settings-enhanced.css";
import * as Dialog from "@radix-ui/react-dialog";
import {
  BookOpen,
  CalendarCheck,
  Database,
  Download,
  Info,
  LockKeyhole,
  Palette,
  ShieldCheck,
  Trash2,
  Upload,
  Volume2,
  X,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { t } from "../i18n";
import { downloadExport, importFromFile } from "../services/exportService";
import { clearCache } from "../services/quranAPI";
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
import { Section } from "./settings/controls";
import GeneralTab from "./settings/GeneralTab";
import ReadingTab from "./settings/ReadingTab";
import AudioTab from "./settings/AudioTab";
// The prayer panel and the downloads list are heavy (adhan, timings, cities,
// storage probes): they load only when their tab opens.
const OfflineDownloadsSection = React.lazy(() => import("./settings/OfflineDownloadsSection"));
const PrayerSettingsSection = React.lazy(() => import("./settings/PrayerSettingsSection"));

// Downloads and storage live under "data": that is where a reader looks for
// what is kept on the device, next to export and erasure.
const TABS = [
  { id: "general", icon: Palette, labelKey: "settings.general" },
  { id: "reading", icon: BookOpen, labelKey: "settings.display" },
  { id: "audio", icon: Volume2, labelKey: "settings.audio" },
  { id: "prayer", icon: CalendarCheck, labelKey: "settings.prayer" },
  { id: "privacy", icon: Database, labelKey: "settings.data" },
];

export default function SettingsModal() {
  const { state, dispatch, set } = useApp();
  const { lang } = state;

  const [cacheBusy, setCacheBusy] = useState(false);
  const [activeTab, setActiveTab] = useState(
    TABS.some((tab) => tab.id === state.settingsActiveTab) ? state.settingsActiveTab : "general",
  );
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

  const title = t("settings.title", lang);
  // Escape fires onEscapeKeyDown and then Radix's own dismiss (onOpenChange), so
  // a toggle here flipped the panel closed and straight back open again.
  const close = () => dispatch({ type: "SET", payload: { settingsOpen: false } });

  const handleTabKeyDown = (event) => {
    const currentIndex = TABS.findIndex((tab) => tab.id === activeTab);
    let nextIndex = -1;
    if (event.key === (lang === "ar" ? "ArrowLeft" : "ArrowRight") || event.key === "ArrowDown") {
      nextIndex = (currentIndex + 1) % TABS.length;
    } else if (event.key === (lang === "ar" ? "ArrowRight" : "ArrowLeft") || event.key === "ArrowUp") {
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

  useEffect(() => {
    document.getElementById(`settings-tab-${activeTab}`)?.scrollIntoView({
      block: "nearest",
      inline: "nearest",
    });
  }, [activeTab]);

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

  const renderDataTab = () => (
    <div className="settings-panel-stack">
      <React.Suspense fallback={<p role="status">{offlineText("checking", lang)}</p>}>
        <OfflineDownloadsSection lang={lang} />
      </React.Suspense>

      <Section title={t("settings.storageSection", lang)}>
        <div className="settings-cache-note">
          <Info size={16} aria-hidden="true" />
          <span>{t("settings.storageHint", lang)}</span>
        </div>
        <button type="button" className="settings-danger-button" onClick={handleClearCache} disabled={cacheBusy} aria-busy={cacheBusy}>
          <Trash2 size={16} aria-hidden="true" />
          <span>{t("settings.clearCache", lang)}</span>
        </button>
      </Section>

      <Section title={t("settings.backupSection", lang)}>
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
              {activeTab === "general" ? <GeneralTab /> : null}
              {activeTab === "reading" ? <ReadingTab /> : null}
              {activeTab === "audio" ? <AudioTab onOpenData={() => setActiveTab("privacy")} /> : null}
              {activeTab === "prayer" ? (
                <React.Suspense fallback={null}>
                  <PrayerSettingsSection lang={lang} state={state} set={set} />
                </React.Suspense>
              ) : null}
              {activeTab === "privacy" ? renderDataTab() : null}
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
