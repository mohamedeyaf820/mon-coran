import React, { useState } from "react";
import { Check, CircleUserRound, Database, Scale, ShieldCheck } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { t } from "../../i18n";
import { THEMES as UI_THEMES } from "../../data/themes";
import {
  ensureNotificationPermission,
  getNotificationPermission,
} from "../../services/notificationService";
import siteConfig from "../../../site.config.json";
import ThemePreview from "./ThemePreview";
import { Section, SwitchRow, Segmented } from "./controls";
import "../../styles/settings-panels.css";

const INFO_PAGES = [
  { key: "about", Icon: CircleUserRound, label: "footer.legalAbout" },
  { key: "privacy", Icon: ShieldCheck, label: "footer.legalPrivacy" },
  { key: "legal", Icon: Scale, label: "footer.legalNotice" },
  { key: "sources", Icon: Database, label: "footer.legalSources" },
];

function localText(lang, fr, en, ar) {
  if (lang === "ar") return ar || en || fr;
  if (lang === "en") return en || fr;
  return fr;
}

export default function GeneralTab() {
  const { state, set } = useApp();
  const { autoNightMode, dailyVerseNotification, lang, nightEnd, nightStart, theme } = state;
  const [permission, setPermission] = useState(getNotificationPermission);
  const [asked, setAsked] = useState(false);

  const toggleDailyVerse = async (checked) => {
    if (!checked) {
      set({ dailyVerseNotification: false });
      return;
    }
    const result = await ensureNotificationPermission();
    setPermission(result);
    setAsked(true);
    set({ dailyVerseNotification: result === "granted" });
  };

  // The panel closes with the page it opens: the reader lands on the page, not
  // behind a sheet that still covers it.
  const openInfoPage = (page) =>
    set({ settingsOpen: false, legalPage: page, showHome: false, showDuas: false, showPrayers: false });

  return (
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
            const description = localText(lang, item.descriptionFr, item.descriptionEn, item.descriptionAr);
            const isActive = theme === item.id;
            const period = item.period === "night" ? t("settings.periodNight", lang) : t("settings.periodDay", lang);
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
                    <span className="settings-theme-tile__check" aria-hidden="true"><Check size={13} /></span>
                  ) : null}
                </span>
                <span className="settings-theme-tile__copy">
                  <span className="settings-theme-tile__heading">
                    <strong>{label}</strong>
                    <span className="settings-theme-tile__period">{period}</span>
                  </span>
                  <small>{description}</small>
                </span>
              </button>
            );
          })}
        </div>
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
              <input type="time" value={nightStart || "20:00"} onChange={(event) => set({ nightStart: event.target.value })} />
            </label>
            <label>
              <span>{t("settings.end", lang)}</span>
              <input type="time" value={nightEnd || "06:00"} onChange={(event) => set({ nightEnd: event.target.value })} />
            </label>
          </div>
        ) : null}
      </Section>

      <Section title={t("settings.notifications", lang)}>
        {permission === "unsupported" ? (
          <p className="settings-notification-note">{t("settings.notificationsUnsupported", lang)}</p>
        ) : (
          <>
            <SwitchRow
              id="settings-daily-verse-notification"
              checked={dailyVerseNotification}
              onChange={toggleDailyVerse}
              label={t("settings.dailyVerseNotification", lang)}
              description={t("settings.dailyVerseNotificationHint", lang)}
            />
            {permission === "denied" || (asked && permission !== "granted") ? (
              <p className="settings-notification-note is-warning" role="alert">
                {t("settings.notificationsBlocked", lang)}
              </p>
            ) : null}
            <p className="settings-notification-note">{t("settings.prayerSettingsHint", lang)}</p>
          </>
        )}
      </Section>

      <Section title={t("settings.infoTitle", lang)}>
        <p className="sp-hint">{t("settings.infoHint", lang)}</p>
        <div className="sp-links">
          {INFO_PAGES.map(({ key, Icon, label }) => (
            <button type="button" key={key} className="settings-action-button" onClick={() => openInfoPage(key)}>
              <Icon size={16} aria-hidden="true" />
              <span>{t(label, lang)}</span>
            </button>
          ))}
        </div>
        <p className="sp-version">
          {t("settings.versionLabel", lang)} <bdi dir="ltr">{siteConfig.version}</bdi>
        </p>
      </Section>
    </div>
  );
}
