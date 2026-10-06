import React, { useEffect } from "react";
import { useApp } from "../../context/AppContext";
import { t } from "../../i18n";
import {
  getFontOptionsForRiwaya,
  getAyahMarkerFontFamily,
  getNativeAyahMarker,
  normalizeFontId,
  resolveFontFamily,
} from "../../data/fonts";
import { ensureFontLoaded } from "../../services/fontLoader";
import { TRANSLATION_CHOICES } from "../../services/quranAPI";
import {
  ARABIC_FONT_SIZE_MAX,
  ARABIC_FONT_SIZE_MIN,
  clampArabicFontSize,
} from "../../utils/arabicTypography";
import { Section, SwitchRow, SliderRow, Segmented } from "./controls";
import "../../styles/settings-panels.css";

// The basmala is the same text in Hafs and Warsh, so one sample serves both.
const PREVIEW_TEXT = "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ";

export default function ReadingTab() {
  const { state, set } = useApp();
  const {
    fontFamily,
    fontFamilyByRiwaya,
    lang,
    quranFontSize,
    quranTranslationFontSize = 18,
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
    translationLangs = ["fr"],
  } = state;
  const activeRiwaya = riwaya || "hafs";

  const fontOptions = getFontOptionsForRiwaya(activeRiwaya);
  const selectedFont = fontOptions.some((font) => font.id === fontFamily)
    ? fontFamily
    : fontOptions[0]?.id || "qpc-hafs";
  const selectedOption = fontOptions.find((font) => font.id === selectedFont);
  const markerFamily = getAyahMarkerFontFamily(selectedFont, activeRiwaya);
  const marker = getNativeAyahMarker(1, selectedFont, activeRiwaya);

  useEffect(() => {
    ensureFontLoaded(selectedFont).catch(() => {});
  }, [selectedFont]);

  const handleRiwayaChange = async (nextRiwaya) => {
    const target = nextRiwaya === "warsh" ? "warsh" : "hafs";
    if (target === activeRiwaya) return;
    const targetFont = normalizeFontId(fontFamilyByRiwaya?.[target] || fontFamily, target);
    const tasks = [ensureFontLoaded(targetFont).catch(() => null)];
    if (!showHome && !showDuas && !legalPage) {
      tasks.push(
        import("../QuranDisplay/useQuranDisplayData")
          .then(({ preloadQuranDisplayData }) =>
            preloadQuranDisplayData({
              currentJuz,
              currentPage,
              currentSurah,
              displayMode,
              lang,
              riwaya: target,
              warshStrictMode,
            }),
          )
          .catch(() => null),
      );
    }
    await Promise.allSettled(tasks);
    set({ riwaya: target });
  };

  const toggleTranslation = (id) => {
    const current = Array.isArray(translationLangs) ? translationLangs : ["fr"];
    const next = current.includes(id)
      ? current.filter((item) => item !== id)
      : [...current, id].slice(0, 3);
    set({ translationLangs: next.length ? next : ["fr"] });
  };

  const previewSize = clampArabicFontSize(quranFontSize);

  return (
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

      <Section title={t("settings.arabicText", lang)}>
        <figure className="sp-preview" aria-label={t("settings.previewLabel", lang)}>
          <p
            className="sp-preview__arabic"
            dir="rtl"
            lang="ar"
            style={{ fontFamily: resolveFontFamily(selectedFont, activeRiwaya), fontSize: `${previewSize}px` }}
          >
            {PREVIEW_TEXT}
          </p>
          {showTranslation ? (
            <p className="sp-preview__translation" style={{ fontSize: `${quranTranslationFontSize}px` }}>
              {t("settings.previewTranslation", lang)}
            </p>
          ) : null}
        </figure>

        <div className="settings-font-picker">
          <label className="sr-only" htmlFor="settings-font-family">
            {t("settings.arabicFontFamily", lang)}
          </label>
          <span
            className="settings-font-marker-preview native-ayah-marker"
            dir="rtl"
            aria-hidden="true"
            style={{ fontFamily: markerFamily }}
          >
            {marker}
          </span>
          <select
            id="settings-font-family"
            value={selectedFont}
            onChange={(event) => set({ fontFamily: event.target.value })}
            className="settings-select"
          >
            {fontOptions.map((font) => (
              <option key={font.id} value={font.id}>{font.label}</option>
            ))}
          </select>
        </div>
        {selectedOption ? <p className="sp-hint">{t(selectedOption.hintKey, lang)}</p> : null}

        <SliderRow
          id="settings-font-size-quran"
          label={t("settings.arabicFontSize", lang)}
          min={ARABIC_FONT_SIZE_MIN}
          max={ARABIC_FONT_SIZE_MAX}
          value={quranFontSize}
          suffix="px"
          onChange={(value) => set({ quranFontSize: value })}
        />
      </Section>

      <Section title={t("settings.translationsGroup", lang)}>
        <SwitchRow
          id="settings-show-translation"
          checked={showTranslation}
          onChange={(checked) => set({ showTranslation: checked })}
          label={t("settings.showTranslationsDetail", lang)}
          description={t("settings.showTranslationsDesc", lang)}
        />
        <div className="settings-chip-grid" role="group" aria-label={t("settings.translationLang", lang)}>
          {TRANSLATION_CHOICES.map((item) => {
            const isActive = translationLangs.includes(item.id);
            return (
              <button
                type="button"
                key={item.id}
                className="settings-chip"
                data-active={isActive}
                onClick={() => toggleTranslation(item.id)}
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
          <p className="sp-hint">{t("settings.translationWarshHint", lang)}</p>
        )}
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

      <Section title={t("settings.readingHelpers", lang)}>
        <SwitchRow
          id="settings-show-tajwid"
          checked={showTajwid}
          onChange={(checked) => set({ showTajwid: checked })}
          label={t("settings.tajweedColors", lang)}
          description={t("settings.tajweedDesc", lang)}
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
}
