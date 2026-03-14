import React, { useEffect, useState } from "react";
import { useApp } from "../context/AppContext";
import { t, LANGUAGES } from "../i18n";
import { downloadExport, importFromFile } from "../services/exportService";
import { clearCache } from "../services/quranAPI";
import audioService from "../services/audioService";
import {
  downloadRecentSurahsForReciter,
  downloadSurahForReciter,
  getCacheSize,
  getOfflineAudioEntries,
  removeSurahCacheForReciter,
} from "../services/downloadService";
import {
  getDefaultReciterId,
  getReciter,
  getRecitersByRiwaya,
} from "../data/reciters";
import SURAHS from "../data/surahs";
import {
  DAY_THEME_IDS as AUTO_DAY_THEME_IDS,
  NIGHT_THEME_IDS as AUTO_NIGHT_THEME_IDS,
  THEMES as UI_THEMES,
} from "../data/themes";
import { ensureFontLoaded } from "../services/fontLoader";
import {
  getLatencyForReciter,
  sortRecitersByPreference,
} from "../utils/reciterRanking";
import PlatformLogo from "./PlatformLogo";
import { cn, toast } from "../lib/utils";
import "../styles/settings-modal.css";

const TABS = [
  {
    id: "apparence",
    icon: "fa-palette",
    fr: "Apparence",
    ar: "المظهر",
    en: "Appearance",
  },
  {
    id: "coran",
    icon: "fa-book-quran",
    fr: "Coran",
    ar: "القرآن",
    en: "Quran",
  },
  { id: "texte", icon: "fa-font", fr: "Texte", ar: "النص", en: "Text" },
  {
    id: "audio",
    icon: "fa-volume-high",
    fr: "Audio",
    ar: "الصوت",
    en: "Audio",
  },
  {
    id: "donnees",
    icon: "fa-database",
    fr: "Données",
    ar: "البيانات",
    en: "Data",
  },
  {
    id: "outils",
    icon: "fa-screwdriver-wrench",
    fr: "Outils",
    ar: "الأدوات",
    en: "Tools",
  },
];

const THEMES = [
  {
    id: "light",
    fr: "Ivoire",
    ar: "فاتح",
    en: "Ivory",
    bg: "#f7f4ea",
    border: "#1f2c3a",
    text: "#199b90",
  },
  {
    id: "sepia",
    fr: "Parchemin",
    ar: "سيبيا",
    en: "Sepia",
    bg: "#efe2c9",
    border: "#4b3420",
    text: "#b4883c",
  },
  {
    id: "dark",
    fr: "Quran Dark",
    ar: "داكن",
    en: "Quran Dark",
    bg: "#111827",
    border: "#e6eaf0",
    text: "#2bb6c7",
  },
  {
    id: "quran-night",
    fr: "Quran Nuit",
    ar: "ليل القرآن",
    en: "Quran Night",
    bg: "#0c1622",
    border: "#e8edf7",
    text: "#3ca675",
  },
];

const DAY_THEME_IDS = ["light", "sepia"];
const NIGHT_THEME_IDS = ["dark", "quran-night"];
const THEME_SWATCH_CLASSES = {
  light: {
    circle: "bg-[#f7f4ea] border-[#1f2c3a]",
    text: "text-[#199b90]",
  },
  sepia: {
    circle: "bg-[#efe2c9] border-[#4b3420]",
    text: "text-[#b4883c]",
  },
  dark: {
    circle: "bg-[#111827] border-[#e6eaf0]",
    text: "text-[#2bb6c7]",
  },
  "quran-night": {
    circle: "bg-[#0c1622] border-[#e8edf7]",
    text: "text-[#3ca675]",
  },
};
const FONT_SIZE_MIN = 32;
const FONT_SIZE_MAX = 64;
const FONT_SIZE_STEP = 2;
const FONT_PROGRESS_WIDTH_CLASSES = [
  "w-0",
  "w-[6.25%]",
  "w-[12.5%]",
  "w-[18.75%]",
  "w-[25%]",
  "w-[31.25%]",
  "w-[37.5%]",
  "w-[43.75%]",
  "w-1/2",
  "w-[56.25%]",
  "w-[62.5%]",
  "w-[68.75%]",
  "w-3/4",
  "w-[81.25%]",
  "w-[87.5%]",
  "w-[93.75%]",
  "w-full",
];
const FONT_PREVIEW_SIZE_CLASSES = [
  "text-[26px]",
  "text-[28px]",
  "text-[29px]",
  "text-[31px]",
  "text-[33px]",
  "text-[34px]",
  "text-[36px]",
  "text-[38px]",
  "text-[39px]",
  "text-[41px]",
  "text-[43px]",
  "text-[44px]",
  "text-[46px]",
  "text-[48px]",
  "text-[49px]",
  "text-[51px]",
  "text-[52px]",
];
const getFontSizeStepIndex = (size) =>
  Math.max(
    0,
    Math.min(
      FONT_PROGRESS_WIDTH_CLASSES.length - 1,
      Math.round((size - FONT_SIZE_MIN) / FONT_SIZE_STEP),
    ),
  );

const TRANSLATION_LANGUAGE_OPTIONS = [
  { code: "fr", fr: "Français", ar: "الفرنسية", en: "French" },
  { code: "en", fr: "Anglais", ar: "الإنجليزية", en: "English" },
  { code: "es", fr: "Espagnol", ar: "الإسبانية", en: "Spanish" },
  { code: "de", fr: "Allemand", ar: "الألمانية", en: "German" },
  { code: "tr", fr: "Turc", ar: "التركية", en: "Turkish" },
  { code: "ur", fr: "Ourdou", ar: "الأردية", en: "Urdu" },
];

const WORD_TRANSLATION_LANGUAGE_OPTIONS = [
  { code: "fr", fr: "Français", ar: "الفرنسية", en: "French" },
  { code: "en", fr: "Anglais", ar: "الإنجليزية", en: "English" },
];

export default function SettingsModal() {
  const { state, dispatch, set } = useApp();
  const {
    lang,
    theme,
    riwaya,
    reciter,
    quranFontSize,
    showTranslation,
    showTajwid,
    showWordByWord,
    showTransliteration,
    showWordTranslation,
    translationLang,
    wordTranslationLang,
    displayMode,
    currentSurah,
    fontFamily,
    warshStrictMode,
    syncOffsetsMs,
    favoriteReciters,
    autoSelectFastestReciter,
    reciterLatencyByKey,
    autoNightMode,
    nightStart,
    nightEnd,
    nightTheme,
    dayTheme,
  } = state;
  const syncKey = `${riwaya}:${reciter}`;
  const syncOffsetMs = Number(syncOffsetsMs?.[syncKey] ?? 0);
  const reciterObj = getReciter(reciter, riwaya);
  const [fontFilter, setFontFilter] = useState("");
  const [activeTab, setActiveTab] = useState("apparence");
  const [offlineBusy, setOfflineBusy] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState(null);
  const [offlineCacheSizeMb, setOfflineCacheSizeMb] = useState(0);
  const [offlineEntries, setOfflineEntries] = useState([]);

  const close = () => dispatch({ type: "TOGGLE_SETTINGS" });
  const tabLabel = (tab) =>
    lang === "ar" ? tab.ar : lang === "fr" ? tab.fr : tab.en;
  const translationLanguageHint =
    lang === "fr"
      ? "Choisissez la langue affichée sous chaque verset."
      : lang === "ar"
        ? "اختر لغة الترجمة المعروضة تحت كل آية."
        : "Choose the language shown below each verse.";
  const wordTranslationLanguageHint =
    lang === "fr"
      ? "Cette langue ne s’applique qu’au mot-à-mot."
      : lang === "ar"
        ? "هذه اللغة خاصة بترجمة الكلمات فقط."
        : "This language only applies to word-by-word translation.";
  const getOptionLabel = (option) =>
    lang === "ar" ? option.ar : lang === "fr" ? option.fr : option.en;
  const rankedReciters = sortRecitersByPreference(getRecitersByRiwaya(riwaya), {
    currentReciterId: reciter,
    favoriteReciters,
    latencyByKey: reciterLatencyByKey,
  });
  const currentReciterLatency = getLatencyForReciter(
    reciterObj,
    reciterLatencyByKey,
  );
  const currentSurahMeta =
    SURAHS.find((surahItem) => surahItem.n === currentSurah) || SURAHS[0];
  const favoriteReciterSet = new Set(favoriteReciters || []);
  const currentOfflineEntry =
    offlineEntries.find(
      (entry) =>
        entry?.surahNum === currentSurah &&
        entry?.reciterId === reciter &&
        entry?.riwaya === riwaya,
    ) || null;
  const offlineEntryCount = offlineEntries.filter(
    (entry) => entry?.reciterId === reciter && entry?.riwaya === riwaya,
  ).length;
  const formatLatency = (latencySec) =>
    Number.isFinite(latencySec) ? `${Math.round(latencySec * 1000)} ms` : null;
  const refreshOfflineMetrics = async () => {
    const [sizeMb, entries] = await Promise.all([
      getCacheSize(),
      Promise.resolve(getOfflineAudioEntries()),
    ]);
    setOfflineCacheSizeMb(sizeMb);
    setOfflineEntries(entries);
  };
  const toggleFavoriteReciter = (reciterId) => {
    const nextFavorites = favoriteReciterSet.has(reciterId)
      ? (favoriteReciters || []).filter((id) => id !== reciterId)
      : [...(favoriteReciters || []), reciterId];
    set({ favoriteReciters: nextFavorites });
  };
  const handleDownloadCurrentSurah = async () => {
    if (!currentSurahMeta || !reciterObj) return;
    setOfflineBusy(true);
    setOfflineProgress({
      mode: "current",
      label:
        lang === "fr"
          ? `Téléchargement de ${currentSurahMeta.fr || currentSurahMeta.en}`
          : lang === "ar"
            ? `تنزيل ${currentSurahMeta.ar}`
            : `Downloading ${currentSurahMeta.en}`,
      done: 0,
      total: currentSurahMeta.ayahs || 0,
    });
    const status = await downloadSurahForReciter(
      { surahMeta: currentSurahMeta, reciter: reciterObj, riwaya },
      (done, total) =>
        setOfflineProgress((prev) => ({
          ...(prev || {}),
          done,
          total,
        })),
    );
    setOfflineBusy(false);
    await refreshOfflineMetrics();
    toast(
      status === "done"
        ? lang === "fr"
          ? "Sourate audio disponible hors ligne."
          : lang === "ar"
            ? "السورة متاحة الآن دون اتصال."
            : "Surah available offline."
        : lang === "fr"
          ? "Le téléchargement audio a échoué."
          : lang === "ar"
            ? "فشل تنزيل الصوت."
            : "Audio download failed.",
      status === "done" ? "success" : "error",
    );
  };
  const handleDownloadRecentPack = async () => {
    if (!reciterObj) return;
    setOfflineBusy(true);
    setOfflineProgress({
      mode: "recent",
      label:
        lang === "fr"
          ? "Pack des dernières lectures"
          : lang === "ar"
            ? "حزمة آخر السور المقروءة"
            : "Recent readings pack",
      done: 0,
      total: 1,
      currentIndex: 0,
      totalSurahs: 0,
    });
    const results = await downloadRecentSurahsForReciter(
      {
        reciter: reciterObj,
        riwaya,
        resolveSurahMeta: (surahNum) =>
          SURAHS.find((surahItem) => surahItem.n === surahNum) || null,
      },
      (progress) =>
        setOfflineProgress({
          ...progress,
          label:
            lang === "fr"
              ? "Pack des dernières lectures"
              : lang === "ar"
                ? "حزمة آخر السور المقروءة"
                : "Recent readings pack",
        }),
    );
    setOfflineBusy(false);
    await refreshOfflineMetrics();
    const successCount = results.filter((item) => item.status === "done").length;
    toast(
      lang === "fr"
        ? `${successCount} sourate(s) récentes prêtes hors ligne.`
        : lang === "ar"
          ? `${successCount} سورة حديثة متاحة دون اتصال.`
          : `${successCount} recent surah(s) available offline.`,
      successCount > 0 ? "success" : "warning",
    );
  };
  const handleRemoveCurrentOffline = async () => {
    if (!currentSurahMeta || !reciterObj) return;
    await removeSurahCacheForReciter({
      surahMeta: currentSurahMeta,
      reciter: reciterObj,
      riwaya,
    });
    await refreshOfflineMetrics();
    toast(
      lang === "fr"
        ? "Le cache audio de la sourate a été supprimé."
        : lang === "ar"
          ? "تم حذف الصوت المخزن لهذه السورة."
          : "Surah audio cache removed.",
      "info",
    );
  };
  useEffect(() => {
    if (activeTab !== "audio") return;
    refreshOfflineMetrics().catch(() => {});
  }, [activeTab, reciter, riwaya]);

  useEffect(() => {
    ensureFontLoaded(fontFamily).catch(() => {});
  }, [fontFamily]);
  const getThemeLabel = (themeOption) => getOptionLabel(themeOption);
  const getThemeDescription = (themeOption) =>
    lang === "ar"
      ? themeOption.descriptionAr
      : lang === "fr"
        ? themeOption.descriptionFr
        : themeOption.descriptionEn;
  const dayThemes = UI_THEMES.filter((themeOption) =>
    AUTO_DAY_THEME_IDS.includes(themeOption.id),
  );
  const nightThemes = UI_THEMES.filter((themeOption) =>
    AUTO_NIGHT_THEME_IDS.includes(themeOption.id),
  );

  // Font options — extended library inspired by arabic-calligraphy-generator.com
  const FONT_CATEGORIES = [
    {
      label:
        lang === "fr"
          ? "Recommandée (sans artefacts visuels)"
          : "Recommended (no rendering artifacts)",
      fonts: [
        {
          id: "scheherazade-new",
          label: "Scheherazade New",
          hint:
            lang === "fr"
              ? "Rendu optimal — aucun artefact visuel"
              : "Best rendering — no visual artifacts",
          css: "'Scheherazade New','Amiri Quran','Noto Naskh Arabic',serif",
        },
        {
          id: "amiri-quran",
          label: "Amiri Quran",
          hint:
            lang === "fr" ? "Police Naskh classique" : "Classic Naskh typeface",
          css: "'Amiri Quran','Scheherazade New','Noto Naskh Arabic',serif",
        },
        {
          id: "noto-naskh-arabic",
          label: "Noto Naskh Arabic",
          hint:
            lang === "fr"
              ? "Très lisible pour interface et texte"
              : "Highly readable for text & UI",
          css: "'Noto Naskh Arabic','Scheherazade New','Amiri Quran',serif",
        },
        {
          id: "markazi-text",
          label: "Markazi Text",
          hint:
            lang === "fr"
              ? "Naskh classique, lecture continue"
              : "Classic Naskh for long reading",
          css: "'Markazi Text','Amiri Quran','Scheherazade New',serif",
        },
        {
          id: "el-messiri",
          label: "El Messiri",
          hint:
            lang === "fr"
              ? "Style Naskh moderne pour titres/sous-titres"
              : "Modern Naskh-inspired style",
          css: "'El Messiri','Noto Naskh Arabic','Scheherazade New',serif",
        },
      ],
    },
    {
      label:
        lang === "fr" ? "Écriture Ottomane (Uthmanique)" : "Uthmanic Script",
      fonts: [
        {
          id: "mushaf-1441h",
          label: "Mushaf 1441H",
          hint:
            lang === "fr"
              ? "Police officielle du Complexe du Roi Fahd"
              : "Official King Fahd Complex font",
          css: "'KFGQPC Uthmanic Script HAFS','ME Quran','Amiri Quran','Scheherazade New',serif",
        },
        {
          id: "mushaf-tajweed",
          label: "Mushaf Tajweed 1441H",
          hint:
            lang === "fr" ? "Avec coloration Tajwid" : "With Tajweed coloring",
          css: "'KFGQPC Uthmanic Script HAFS','ME Quran','Amiri Quran','Scheherazade New',serif",
        },
        {
          id: "uthmanic-digital",
          label:
            lang === "fr" ? "Police Numérique (Digital Font)" : "Digital Font",
          hint: "ME Quran V2 · quranwbw.com",
          css: "'ME Quran','KFGQPC Uthmanic Script HAFS','Amiri Quran','Scheherazade New',serif",
        },
        {
          id: "uthmanic-bold",
          label:
            lang === "fr"
              ? "Police Numérique Gras (Digital Bold)"
              : "Digital Bold Font",
          hint: "ME Quran Bold V2 · quranwbw.com",
          css: "'ME Quran Bold','ME Quran','KFGQPC Uthmanic Script HAFS','Amiri Quran',serif",
          bold: true,
        },
      ],
    },
    {
      label:
        lang === "fr" ? "Style Indopak / Nastaleeq" : "Indopak / Nastaleeq",
      fonts: [
        {
          id: "qalam-madinah",
          label:
            lang === "fr"
              ? "Qalam – Édition Madinah"
              : "Qalam Digital (Madinah Edition)",
          hint: "Qalam Digital Font · Madinah Edition",
          css: "'Qalam Madinah','Scheherazade New','Noto Naskh Arabic',serif",
        },
        {
          id: "qalam-hanafi",
          label:
            lang === "fr"
              ? "Qalam – Édition Hanafi"
              : "Qalam Digital (Hanafi Edition)",
          hint: "Qalam Digital Font · Hanafi Edition",
          css: "'Qalam Hanafi','Scheherazade New','Noto Naskh Arabic',serif",
        },
        {
          id: "uthman-taha",
          label:
            lang === "fr"
              ? "Uthman Taha (Numérique)"
              : "Uthman Taha Digital Font",
          hint: "KFGQPC Uthman Taha",
          css: "'Uthman Taha Hafs','KFGQPC Uthmanic Script HAFS','ME Quran',serif",
        },
        {
          id: "kfgqpc-uthman-taha-naskh",
          label: "KFGQPC Uthman Taha Naskh",
          hint:
            lang === "fr"
              ? "Variante Uthman Taha Naskh demandée"
              : "Requested Uthman Taha Naskh variant",
          css: "'KFGQPC Uthman Taha Naskh','Uthman Taha Hafs','ME Quran',serif",
        },
      ],
    },
    {
      label: lang === "fr" ? "Kufi & Diwani" : "Kufi & Diwani",
      fonts: [
        {
          id: "reem-kufi",
          label: "Reem Kufi",
          hint:
            lang === "fr"
              ? "Kufi géométrique moderne"
              : "Geometric modern Kufi",
          css: "'Reem Kufi','Cairo','Noto Naskh Arabic',sans-serif",
        },
        {
          id: "aref-ruqaa",
          label: "Aref Ruqaa",
          hint:
            lang === "fr"
              ? "Style calligraphique décoratif"
              : "Decorative calligraphic style",
          css: "'Aref Ruqaa','Scheherazade New','Amiri Quran',serif",
        },
      ],
    },
    {
      label:
        lang === "fr" ? "Modernes UI / Sans-serif" : "Modern UI / Sans-serif",
      fonts: [
        {
          id: "cairo",
          label: "Cairo",
          hint: "Modern UI",
          css: "'Cairo','Noto Naskh Arabic',sans-serif",
        },
        {
          id: "harmattan",
          label: "Harmattan",
          hint: "Clean digital",
          css: "'Harmattan','Cairo',sans-serif",
        },
        {
          id: "mada",
          label: "Mada",
          hint: "Geometric minimal",
          css: "'Mada','Cairo',sans-serif",
        },
        {
          id: "tajawal",
          label: "Tajawal",
          hint: "Versatile UI font",
          css: "'Tajawal','Cairo',sans-serif",
        },
        {
          id: "lemonada",
          label: "Lemonada",
          hint: "Rounded friendly",
          css: "'Lemonada','Cairo',sans-serif",
        },
      ],
    },
    {
      label: lang === "fr" ? "Display / Titres" : "Display / Headlines",
      fonts: [
        {
          id: "jomhuria",
          label: "Jomhuria",
          hint: "Bold display",
          css: "'Jomhuria','Cairo',sans-serif",
        },
        {
          id: "rakkas",
          label: "Rakkas",
          hint: "Decorative display",
          css: "'Rakkas','Cairo',sans-serif",
        },
        {
          id: "marhey",
          label: "Marhey",
          hint: "Playful display",
          css: "'Marhey','Cairo',sans-serif",
        },
      ],
    },
    {
      label: lang === "fr" ? "Nastaliq / Littéraire" : "Nastaliq / Literary",
      fonts: [
        {
          id: "lateef",
          label: "Lateef",
          hint: "Flowing literary",
          css: "'Lateef','Scheherazade New','Amiri',serif",
        },
        {
          id: "mirza",
          label: "Mirza",
          hint: "Persian-influenced",
          css: "'Mirza','Lateef',serif",
        },
      ],
    },
  ];
  const FONT_OPTIONS = FONT_CATEGORIES.flatMap((c) => c.fonts);
  const normalizedFontFilter = fontFilter.trim().toLowerCase();
  const FILTERED_FONT_CATEGORIES = !normalizedFontFilter
    ? FONT_CATEGORIES
    : FONT_CATEGORIES.map((cat) => ({
        ...cat,
        fonts: cat.fonts.filter((font) =>
          `${font.label} ${font.hint || ""} ${font.id}`
            .toLowerCase()
            .includes(normalizedFontFilter),
        ),
      })).filter((cat) => cat.fonts.length > 0);
  const fontStepIndex = getFontSizeStepIndex(quranFontSize);
  const fontProgressWidthClass =
    FONT_PROGRESS_WIDTH_CLASSES[fontStepIndex] || "w-1/2";
  const fontPreviewSizeClass =
    FONT_PREVIEW_SIZE_CLASSES[fontStepIndex] || "text-[39px]";
  const activeTabConfig = TABS.find((tab) => tab.id === activeTab) || TABS[0];
  const currentThemeOption = UI_THEMES.find((themeOption) => themeOption.id === theme);
  const currentLanguageLabel =
    LANGUAGES.find((languageOption) => languageOption.code === lang)?.label ||
    lang.toUpperCase();
  const currentFontOption =
    FONT_OPTIONS.find((fontOption) => fontOption.id === fontFamily) || FONT_OPTIONS[0];
  const currentTranslationOption = TRANSLATION_LANGUAGE_OPTIONS.find(
    (option) => option.code === translationLang,
  );
  const currentWordTranslationOption = WORD_TRANSLATION_LANGUAGE_OPTIONS.find(
    (option) => option.code === wordTranslationLang,
  );
  const displayModeLabel =
    displayMode === "page"
      ? lang === "fr"
        ? "Page"
        : lang === "ar"
          ? "صفحة"
          : "Page"
      : displayMode === "juz"
        ? lang === "fr"
          ? "Juz"
          : lang === "ar"
            ? "جزء"
            : "Juz"
        : lang === "fr"
          ? "Sourate"
          : lang === "ar"
            ? "سورة"
            : "Surah";
  const activeStateLabel =
    lang === "fr" ? "Actif" : lang === "ar" ? "مفعّل" : "Active";
  const disabledStateLabel =
    lang === "fr" ? "Désactivé" : lang === "ar" ? "متوقف" : "Off";
  const settingsHero = (() => {
    const pill = (label, value) => ({ label, value });

    switch (activeTab) {
      case "apparence":
        return {
          title:
            lang === "fr"
              ? "Un espace de lecture plus calme et plus noble"
              : lang === "ar"
                ? "مساحة قراءة أكثر هدوءًا وأناقة"
                : "A calmer, more refined reading space",
          copy:
            lang === "fr"
              ? "Réglez la langue, le thème et le cycle jour/nuit pour garder une ambiance cohérente sur toute la plateforme."
              : lang === "ar"
                ? "اضبط اللغة والثيم ودورة الليل والنهار للحفاظ على تجربة متناسقة في كل المنصة."
                : "Tune language, theme, and day-night behavior to keep the whole platform visually consistent.",
          pills: [
            pill(
              lang === "fr" ? "Thème actif" : lang === "ar" ? "الثيم الحالي" : "Active theme",
              currentThemeOption ? getThemeLabel(currentThemeOption) : theme,
            ),
            pill(
              lang === "fr" ? "Langue" : lang === "ar" ? "اللغة" : "Language",
              currentLanguageLabel,
            ),
            pill(
              lang === "fr" ? "Mode auto" : lang === "ar" ? "الوضع التلقائي" : "Auto mode",
              autoNightMode
                ? `${nightStart} → ${nightEnd}`
                : lang === "fr"
                  ? "Manuel"
                  : lang === "ar"
                    ? "يدوي"
                    : "Manual",
            ),
          ],
        };
      case "coran":
        return {
          title:
            lang === "fr"
              ? "Votre mushaf, votre cadence de lecture"
              : lang === "ar"
                ? "مصحفك بإيقاع القراءة الذي يناسبك"
                : "Your mushaf, tuned to your reading rhythm",
          copy:
            lang === "fr"
              ? "Choisissez la riwaya, le mode d’affichage et les aides de compréhension selon votre usage."
              : lang === "ar"
                ? "اختر الرواية ووضع العرض ووسائل الفهم بحسب أسلوب قراءتك."
                : "Set the riwaya, reading layout, and comprehension aids around the way you read.",
          pills: [
            pill(lang === "fr" ? "Riwaya" : lang === "ar" ? "الرواية" : "Riwaya", riwaya.toUpperCase()),
            pill(lang === "fr" ? "Affichage" : lang === "ar" ? "العرض" : "Layout", displayModeLabel),
            pill(
              lang === "fr" ? "Traduction" : lang === "ar" ? "الترجمة" : "Translation",
              showTranslation
                ? currentTranslationOption
                  ? getOptionLabel(currentTranslationOption)
                  : translationLang.toUpperCase()
                : disabledStateLabel,
            ),
          ],
        };
      case "texte":
        return {
          title:
            lang === "fr"
              ? "Un confort typographique ajusté à votre regard"
              : lang === "ar"
                ? "راحة بصرية مضبوطة على أسلوب قراءتك"
                : "Typography tailored to your reading comfort",
          copy:
            lang === "fr"
              ? "Ajustez la police, la taille et les aides de lecture pour un affichage plus apaisé et plus lisible."
              : lang === "ar"
                ? "اضبط الخط والحجم ومساعدات القراءة لعرض أكثر وضوحًا وراحة."
                : "Dial in font, size, and reading helpers for a calmer, clearer presentation.",
          pills: [
            pill(lang === "fr" ? "Police" : lang === "ar" ? "الخط" : "Font", currentFontOption?.label || fontFamily),
            pill(lang === "fr" ? "Taille" : lang === "ar" ? "الحجم" : "Size", `${quranFontSize}px`),
            pill(
              lang === "fr" ? "Mot à mot" : lang === "ar" ? "كلمة بكلمة" : "Word by word",
              showWordByWord
                ? currentWordTranslationOption
                  ? getOptionLabel(currentWordTranslationOption)
                  : activeStateLabel
                : disabledStateLabel,
            ),
          ],
        };
      case "audio":
        return {
          title:
            lang === "fr"
              ? "Une écoute plus stable, plus fluide, plus personnelle"
              : lang === "ar"
                ? "استماع أكثر سلاسة وثباتًا وخصوصية"
                : "A steadier, smoother, more personal listening setup",
          copy:
            lang === "fr"
              ? "Gardez vos récitateurs favoris et ajustez la synchro pour que chaque sourate démarre proprement."
              : lang === "ar"
                ? "احتفظ بقرائك المفضلين واضبط المزامنة حتى تبدأ كل سورة بسلاسة."
                : "Keep your preferred reciters close and fine-tune sync so every surah starts cleanly.",
          pills: [
            pill(
              lang === "fr" ? "Récitateur" : lang === "ar" ? "القارئ" : "Reciter",
              reciterObj?.nameFr || reciterObj?.nameEn || reciterObj?.name || reciter,
            ),
            pill(lang === "fr" ? "Style" : lang === "ar" ? "النمط" : "Style", reciterObj?.style || "murattal"),
            pill(lang === "fr" ? "Synchro" : lang === "ar" ? "المزامنة" : "Sync", `${syncOffsetMs} ms`),
          ],
        };
      case "donnees":
        return {
          title:
            lang === "fr"
              ? "Vos données restent portables et sous contrôle"
              : lang === "ar"
                ? "بياناتك قابلة للنقل وتحت سيطرتك"
                : "Your data stays portable and under your control",
          copy:
            lang === "fr"
              ? "Exportez, importez et gardez une base saine pour vos favoris, notes et préférences."
              : lang === "ar"
                ? "قم بالتصدير والاستيراد وحافظ على قاعدة نظيفة للمفضلة والملاحظات والتفضيلات."
                : "Export, import, and keep a clean base for bookmarks, notes, and preferences.",
          pills: [
            pill(lang === "fr" ? "Format" : lang === "ar" ? "الصيغة" : "Format", "JSON"),
            pill(
              lang === "fr" ? "Stockage" : lang === "ar" ? "التخزين" : "Storage",
              lang === "fr" ? "Local" : lang === "ar" ? "محلي" : "Local",
            ),
            pill(
              lang === "fr" ? "Sauvegarde" : lang === "ar" ? "النسخة" : "Backup",
              lang === "fr" ? "À la demande" : lang === "ar" ? "عند الطلب" : "On demand",
            ),
          ],
        };
      default:
        return {
          title:
            lang === "fr"
              ? "Des outils pensés pour l’apprentissage au quotidien"
              : lang === "ar"
                ? "أدوات مصممة للتعلّم اليومي"
                : "Tools designed for everyday learning",
          copy:
            lang === "fr"
              ? "Accédez plus vite aux modules qui prolongent la lecture: mémorisation, quiz et comparaison."
              : lang === "ar"
                ? "الوصول السريع إلى الوحدات التي توسع القراءة: الحفظ والاختبارات والمقارنة."
                : "Reach memorization, quiz, and comparison tools faster from one coherent place.",
          pills: [
            pill(
              lang === "fr" ? "Tajwid" : lang === "ar" ? "التجويد" : "Tajweed",
              showTajwid ? activeStateLabel : disabledStateLabel,
            ),
            pill(
              lang === "fr" ? "Translit." : lang === "ar" ? "اللفظ" : "Translit.",
              showTransliteration ? activeStateLabel : disabledStateLabel,
            ),
            pill(
              lang === "fr" ? "Mot à mot" : lang === "ar" ? "كلمة بكلمة" : "Word by word",
              showWordByWord ? activeStateLabel : disabledStateLabel,
            ),
          ],
        };
    }
  })();

  const handleImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const result = await importFromFile(file);
          toast(
            `${t("export.importSuccess", lang)}: ${result.bookmarks} bookmarks, ${result.notes} notes`,
            "success",
          );
          window.setTimeout(() => window.location.reload(), 700);
        } catch {
          toast(t("errors.generic", lang), "error");
        }
      }
    };
    input.click();
  };

  const applyRiwaya = (nextRiwaya) => {
    if (nextRiwaya === riwaya) return;
    const fallbackReciter = getDefaultReciterId(nextRiwaya);
    audioService.stop();
    clearCache();
    const patch = {
      riwaya: nextRiwaya,
      reciter: fallbackReciter,
      isPlaying: false,
      currentPlayingAyah: null,
      currentAyah: 1,
    };
    // Warsh doesn't support page mode
    if (nextRiwaya === "warsh" && displayMode === "page") {
      patch.displayMode = "surah";
    }
    set(patch);
  };

  const overlayClass =
    "settings-overlay !bg-[radial-gradient(circle_at_12%_8%,rgba(59,130,246,0.2)_0%,transparent_34%),radial-gradient(circle_at_88%_18%,rgba(16,185,129,0.14)_0%,transparent_28%),rgba(2,6,23,0.74)] !backdrop-blur-[8px]";
  const dialogClass =
    "settings-dialog !overflow-hidden !rounded-[28px] !border !border-white/15 !bg-[linear-gradient(160deg,rgba(13,25,52,0.96),rgba(9,17,35,0.96))] !shadow-[0_26px_64px_rgba(1,8,24,0.58)]";
  const headerClass =
    "settings-header !border-b !border-white/10 !bg-[linear-gradient(135deg,rgba(34,93,214,0.25),rgba(17,44,102,0.2))] !backdrop-blur-md";
  const bodyLayoutClass = "settings-body-layout !min-h-[560px]";
  const navClass =
    "settings-nav !border-r !border-white/10 !bg-[linear-gradient(180deg,rgba(10,22,47,0.8),rgba(8,17,36,0.85))]";
  const contentClass =
    "settings-content !bg-[linear-gradient(180deg,rgba(11,22,46,0.74),rgba(8,16,33,0.8))]";
  const paneClass = "settings-pane !space-y-4 !animate-[fadeInUp_0.24s_ease]";
  const paneTitleClass =
    "settings-pane-title !rounded-xl !border !border-white/10 !bg-white/[0.04] !px-3 !py-2 !text-blue-100";
  const cardClass =
    "settings-card !rounded-2xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(14,28,57,0.82),rgba(9,18,38,0.86))] !shadow-[0_10px_24px_rgba(3,10,27,0.36)] !backdrop-blur-md";
  const navItemClass = (active) =>
    cn(
      "settings-nav-item !transition-all !duration-200 hover:!bg-white/10 hover:!text-white",
      active &&
        "!bg-[linear-gradient(135deg,rgba(59,130,246,0.28),rgba(37,99,235,0.16))] !border !border-blue-200/28 !text-white !shadow-[0_8px_18px_rgba(30,64,175,0.3)]",
    );
  const chipClass = (active) =>
    cn(
      "settings-chip !transition-all !duration-200 hover:!bg-white/14 hover:!text-white",
      active &&
        "!border-blue-200/36 !bg-[linear-gradient(135deg,rgba(59,130,246,0.28),rgba(37,99,235,0.18))] !text-white !shadow-[0_8px_18px_rgba(30,64,175,0.28)]",
    );

  return (
    <div
      className={overlayClass}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label={t("settings.title", lang)}
    >
      <div className={dialogClass} onClick={(e) => e.stopPropagation()}>
        {/* ── Header ── */}
        <div className={headerClass}>
          <div className="settings-header-left">
            <i className="fas fa-sliders" aria-hidden="true"></i>
            <h2 className="settings-title">{t("settings.title", lang)}</h2>
          </div>
          <button
            className="settings-close-btn"
            onClick={close}
            aria-label={lang === "ar" ? "إغلاق" : "Fermer"}
          >
            <i className="fas fa-times" aria-hidden="true"></i>
          </button>
        </div>

        {/* ── Body: nav + content ── */}
        <div className={bodyLayoutClass}>
          {/* Left navigation */}
          <nav className={navClass} aria-label="Navigation paramètres">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                className={navItemClass(activeTab === tab.id)}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
              >
                <i className={`fas ${tab.icon}`} aria-hidden="true"></i>
                <span className="settings-nav-label">{tabLabel(tab)}</span>
              </button>
            ))}
          </nav>

          {/* Right content panel */}
          <div className={contentClass}>
            <div className="settings-hero-card">
              <div className="settings-hero-copywrap">
                <span className="settings-hero-eyebrow">
                  <i className={`fas ${activeTabConfig.icon}`} aria-hidden="true"></i>
                  {tabLabel(activeTabConfig)}
                </span>
                <h3 className="settings-hero-title">{settingsHero.title}</h3>
                <p className="settings-hero-copy">{settingsHero.copy}</p>
              </div>
              <div className="settings-hero-pills">
                {settingsHero.pills.map((pill) => (
                  <div
                    key={`${activeTab}-${pill.label}`}
                    className="settings-hero-pill"
                  >
                    <span className="settings-hero-pill__label">{pill.label}</span>
                    <strong className="settings-hero-pill__value">
                      {pill.value}
                    </strong>
                  </div>
                ))}
              </div>
            </div>
            {/* ════════════════════════════════
                TAB: Apparence
            ════════════════════════════════ */}
            {activeTab === "apparence" && (
              <div className={paneClass}>
                <div className={paneTitleClass}>
                  {lang === "ar"
                    ? "المظهر"
                    : lang === "fr"
                      ? "Apparence"
                      : "Appearance"}
                </div>

                {/* Language */}
                <div className={cardClass}>
                  <div className="settings-card-label">
                    <i className="fas fa-globe" aria-hidden="true"></i>
                    {t("settings.language", lang)}
                  </div>
                  <div className="settings-chips">
                    {LANGUAGES.map((l) => (
                      <button
                        key={l.code}
                        className={chipClass(lang === l.code)}
                        onClick={() =>
                          dispatch({ type: "SET_LANG", payload: l.code })
                        }
                        aria-pressed={lang === l.code}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Theme swatches */}
                <div className={cardClass}>
                  <div className="settings-card-label">
                    <i
                      className="fas fa-circle-half-stroke"
                      aria-hidden="true"
                    ></i>
                    {t("settings.darkMode", lang)}
                  </div>
                  <div className="theme-swatch-grid">
                    {UI_THEMES.map((th) => {
                      const active = theme === th.id;
                      return (
                        <button
                          key={th.id}
                          className={`theme-swatch-btn ${active ? "active" : ""}`}
                          onClick={() =>
                            dispatch({ type: "SET_THEME", payload: th.id })
                          }
                          aria-pressed={active}
                          title={getThemeLabel(th)}
                        >
                          <span
                            className={cn(
                              "swatch-circle !border-[3px]",
                              active &&
                                "!border-[var(--primary)] shadow-[0_0_0_1px_rgba(255,255,255,0.18)]",
                            )}
                            style={{
                              background: th.palette.bg,
                              borderColor: th.palette.ink,
                              color: th.palette.accent,
                            }}
                          >
                            <span
                              className="swatch-text-ar"
                            >
                              أ
                            </span>
                            {active && (
                              <i
                                className="fas fa-check swatch-check"
                                aria-hidden="true"
                              ></i>
                            )}
                          </span>
                          <span className="swatch-label">{getThemeLabel(th)}</span>
                          <span className="swatch-description">
                            {getThemeDescription(th)}
                          </span>
                          <span className="swatch-badge">
                            {th.period === "day"
                              ? lang === "fr"
                                ? "Jour"
                                : lang === "ar"
                                  ? "نهاري"
                                  : "Day"
                              : lang === "fr"
                                ? "Nuit"
                                : lang === "ar"
                                  ? "ليلي"
                                  : "Night"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Auto Night Mode */}
                <div className={cardClass}>
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <i className="fas fa-cloud-moon" aria-hidden="true"></i>
                      <div>
                        <div className="settings-toggle-title">
                          {t("autoNight.title", lang)}
                        </div>
                        <div className="settings-toggle-hint">
                          {t("autoNight.hint", lang)}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`toggle-switch ${autoNightMode ? "on" : ""}`}
                      onClick={() => set({ autoNightMode: !autoNightMode })}
                      aria-pressed={autoNightMode}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                  </div>
                  {autoNightMode && (
                    <div className="auto-night-options">
                      <div className="auto-night-row">
                        <label className="auto-night-label">
                          <i className="fas fa-moon" aria-hidden="true"></i>
                          {t("autoNight.nightStart", lang)}
                        </label>
                        <input
                          type="time"
                          value={nightStart}
                          onChange={(e) => set({ nightStart: e.target.value })}
                          className="auto-night-time"
                        />
                      </div>
                      <div className="auto-night-row">
                        <label className="auto-night-label">
                          <i className="fas fa-sun" aria-hidden="true"></i>
                          {t("autoNight.nightEnd", lang)}
                        </label>
                        <input
                          type="time"
                          value={nightEnd}
                          onChange={(e) => set({ nightEnd: e.target.value })}
                          className="auto-night-time"
                        />
                      </div>
                      <div className="auto-night-row">
                        <label className="auto-night-label">
                          {t("autoNight.dayTheme", lang)}
                        </label>
                        <select
                          value={dayTheme}
                          onChange={(e) => set({ dayTheme: e.target.value })}
                          className="auto-night-select"
                        >
                          {dayThemes.map((themeOption) => (
                            <option key={themeOption.id} value={themeOption.id}>
                              {getThemeLabel(themeOption)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="auto-night-row">
                        <label className="auto-night-label">
                          {t("autoNight.nightTheme", lang)}
                        </label>
                        <select
                          value={nightTheme}
                          onChange={(e) => set({ nightTheme: e.target.value })}
                          className="auto-night-select"
                        >
                          {nightThemes.map((themeOption) => (
                            <option key={themeOption.id} value={themeOption.id}>
                              {getThemeLabel(themeOption)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                TAB: Coran
            ════════════════════════════════ */}
            {activeTab === "coran" && (
              <div className={paneClass}>
                <div className={paneTitleClass}>
                  {lang === "ar" ? "القرآن" : lang === "fr" ? "Coran" : "Quran"}
                </div>

                {/* Riwaya */}
                <div className={cardClass}>
                  <div className="settings-card-label">
                    <i className="fas fa-book-quran" aria-hidden="true"></i>
                    {t("settings.riwaya", lang)}
                  </div>
                  <div className="settings-chips">
                    <button
                      className={chipClass(riwaya === "hafs")}
                      onClick={() => applyRiwaya("hafs")}
                      aria-pressed={riwaya === "hafs"}
                    >
                      {t("settings.hafs", lang)}
                    </button>
                    <button
                      className={chipClass(riwaya === "warsh")}
                      onClick={() => applyRiwaya("warsh")}
                      aria-pressed={riwaya === "warsh"}
                    >
                      {t("settings.warsh", lang)}
                    </button>
                  </div>
                  <p className="settings-hint">
                    {t("settings.riwayaHint", lang)}
                  </p>
                  {riwaya === "warsh" && (
                    <div className="settings-info-note">
                      <i className="fas fa-check-circle" aria-hidden="true"></i>
                      <span>{t("settings.warshTextNote", lang)}</span>
                    </div>
                  )}
                </div>

                {/* Warsh strict mode */}
                {riwaya === "warsh" && (
                  <div className={cardClass}>
                    <div className="settings-toggle-row">
                      <div className="settings-toggle-info">
                        <i
                          className="fas fa-shield-halved"
                          aria-hidden="true"
                        ></i>
                        <div>
                          <div className="settings-toggle-title">
                            {lang === "fr"
                              ? "Mode Warsh strict"
                              : lang === "ar"
                                ? "وضع ورش الصارم"
                                : "Warsh strict mode"}
                          </div>
                          <div className="settings-toggle-hint">
                            {lang === "fr"
                              ? "Refuse tout fallback Hafs quand Warsh est sélectionné."
                              : lang === "ar"
                                ? "يرفض أي بديل حفص عند اختيار ورش."
                                : "Rejects any Hafs fallback when Warsh is selected."}
                          </div>
                        </div>
                      </div>
                      <button
                        className={`toggle-switch ${warshStrictMode ? "on" : ""}`}
                        onClick={() =>
                          set({ warshStrictMode: !warshStrictMode })
                        }
                        aria-pressed={warshStrictMode}
                      >
                        <span className="toggle-knob"></span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Display mode */}
                <div className={cardClass}>
                  <div className="settings-card-label">
                    <i className="fas fa-layer-group" aria-hidden="true"></i>
                    {t("settings.displayMode", lang)}
                  </div>
                  <p className="settings-hint">
                    {riwaya === "warsh"
                      ? lang === "fr"
                        ? "Mode page indisponible pour Warsh (QCF4 par sourate)"
                        : lang === "ar"
                          ? "وضع الصفحة غير متاح لورش"
                          : "Page mode unavailable for Warsh"
                      : lang === "fr"
                        ? "Choisissez comment le Coran est affiché"
                        : lang === "ar"
                          ? "اختر طريقة عرض القرآن"
                          : "Choose how the Quran is displayed"}
                  </p>
                  <div className="display-mode-cards">
                    {[
                      {
                        id: "surah",
                        icon: "fa-list-ul",
                        fr: "Par sourate",
                        ar: "سورة",
                        en: "By surah",
                      },
                      {
                        id: "page",
                        icon: "fa-file-alt",
                        fr: "Mushaf",
                        ar: "مصحف",
                        en: "Mushaf page",
                        disabled: riwaya === "warsh",
                      },
                      {
                        id: "juz",
                        icon: "fa-book-open",
                        fr: "Par juz",
                        ar: "جزء",
                        en: "By juz",
                      },
                    ].map((m) => (
                      <button
                        key={m.id}
                        className={`display-mode-card ${displayMode === m.id ? "active" : ""} ${m.disabled ? "disabled" : ""}`}
                        onClick={() =>
                          !m.disabled && set({ displayMode: m.id })
                        }
                        disabled={m.disabled}
                        aria-pressed={displayMode === m.id}
                        title={
                          m.disabled
                            ? lang === "fr"
                              ? "Non disponible en Warsh"
                              : "Not available for Warsh"
                            : undefined
                        }
                      >
                        <i className={`fas ${m.icon}`} aria-hidden="true"></i>
                        <span>
                          {lang === "fr" ? m.fr : lang === "ar" ? m.ar : m.en}
                        </span>
                        {m.disabled && <span className="mode-badge">⚠</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continuous play */}
                <div className={cardClass}>
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <i className="fas fa-circle-play" aria-hidden="true"></i>
                      <div>
                        <div className="settings-toggle-title">
                          {t("settings.continuousPlay", lang)}
                        </div>
                        <div className="settings-toggle-hint">
                          {t("settings.continuousPlayHint", lang)}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`toggle-switch ${state.continuousPlay ? "on" : ""}`}
                      onClick={() =>
                        set({ continuousPlay: !state.continuousPlay })
                      }
                      aria-pressed={state.continuousPlay}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                  </div>
                </div>

                {/* Focus reading */}
                <div className="settings-card">
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <i className="fas fa-expand" aria-hidden="true"></i>
                      <div>
                        <div className="settings-toggle-title">
                          {lang === "fr"
                            ? "Mode lecture zen"
                            : lang === "ar"
                              ? "وضع القراءة الهادئة"
                              : "Zen reading mode"}
                        </div>
                        <div className="settings-toggle-hint">
                          {lang === "fr"
                            ? "Allège l’interface sur desktop: moins de panneaux, moins de bordures, plus d’air."
                            : lang === "ar"
                              ? "واجهة أخف على سطح المكتب: لوحات أقل وحدود أخف ومساحة أوسع."
                              : "Lighter desktop reading with fewer panels, borders, and visual noise."}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`toggle-switch ${state.focusReading ? "on" : ""}`}
                      onClick={() => set({ focusReading: !state.focusReading })}
                      aria-pressed={state.focusReading}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                TAB: Texte
            ════════════════════════════════ */}
            {activeTab === "texte" && (
              <div className={paneClass}>
                <div className={paneTitleClass}>
                  {lang === "ar"
                    ? "النص والعرض"
                    : lang === "fr"
                      ? "Texte & Affichage"
                      : "Text & Display"}
                </div>

                {/* Tajweed */}
                <div className={cardClass}>
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <i
                        className="fas fa-paint-brush text-[#e74c3c]"
                        aria-hidden="true"
                      ></i>
                      <div>
                        <div className="settings-toggle-title">
                          {t("settings.showTajwid", lang)}
                        </div>
                        <div className="settings-toggle-hint">
                          {lang === "fr"
                            ? "Colorie chaque règle de tajwid dans le texte"
                            : lang === "ar"
                              ? "يلوّن قواعد التجويد في النص"
                              : "Colors each tajweed rule in the text"}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`toggle-switch ${showTajwid ? "on" : ""}`}
                      onClick={() => set({ showTajwid: !showTajwid })}
                      aria-pressed={showTajwid}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                  </div>
                </div>

                {/* Word by word */}
                <div className={cardClass}>
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <i className="fas fa-layer-group" aria-hidden="true"></i>
                      <div>
                        <div className="settings-toggle-title">
                          {lang === "fr"
                            ? "Mode mot à mot"
                            : lang === "ar"
                              ? "وضع كلمة بكلمة"
                              : "Word-by-word mode"}
                        </div>
                        <div className="settings-toggle-hint">
                          {lang === "fr"
                            ? "Affiche chaque mot avec sa traduction et translittération"
                            : lang === "ar"
                              ? "يعرض كل كلمة مع ترجمتها ونطقها"
                              : "Shows each word with its translation and transliteration"}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`toggle-switch ${showWordByWord ? "on" : ""}`}
                      onClick={() => set({ showWordByWord: !showWordByWord })}
                      aria-pressed={showWordByWord}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                  </div>
                  {showWordByWord && (
                    <div className="sub-toggles">
                      <div className="settings-toggle-row sub">
                        <span>
                          {lang === "fr"
                            ? "Translittération"
                            : lang === "ar"
                              ? "النطق اللاتيني"
                              : "Transliteration"}
                        </span>
                        <button
                          className={`toggle-switch ${showTransliteration ? "on" : ""}`}
                          onClick={() =>
                            set({ showTransliteration: !showTransliteration })
                          }
                          aria-pressed={showTransliteration}
                        >
                          <span className="toggle-knob"></span>
                        </button>
                      </div>
                      <div className="settings-toggle-row sub">
                        <span>
                          {lang === "fr"
                            ? "Traduction par mot"
                            : lang === "ar"
                              ? "ترجمة كل كلمة"
                              : "Word translation"}
                        </span>
                        <button
                          className={`toggle-switch ${showWordTranslation ? "on" : ""}`}
                          onClick={() =>
                            set({ showWordTranslation: !showWordTranslation })
                          }
                          aria-pressed={showWordTranslation}
                        >
                          <span className="toggle-knob"></span>
                        </button>
                      </div>
                      {showWordTranslation && (
                        <>
                          <div className="settings-card-label mt-[0.6rem]">
                            <i
                              className="fas fa-language"
                              aria-hidden="true"
                            ></i>
                            {lang === "fr"
                              ? "Langue mot-à-mot"
                              : lang === "ar"
                                ? "لغة الترجمة كلمة بكلمة"
                                : "Word-by-word language"}
                          </div>
                          <p className="settings-hint">
                            {wordTranslationLanguageHint}
                          </p>
                          <div className="settings-chips mt-[0.55rem]">
                            {WORD_TRANSLATION_LANGUAGE_OPTIONS.map((option) => (
                              <button
                                key={option.code}
                                className={chipClass(wordTranslationLang === option.code)}
                                onClick={() =>
                                  set({ wordTranslationLang: option.code })
                                }
                                aria-pressed={
                                  wordTranslationLang === option.code
                                }
                              >
                                {getOptionLabel(option)}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Translation */}
                <div className={cardClass}>
                  <div className="settings-toggle-row">
                    <div className="settings-toggle-info">
                      <i className="fas fa-language" aria-hidden="true"></i>
                      <div>
                        <div className="settings-toggle-title">
                          {t("settings.showTranslation", lang)}
                        </div>
                        <div className="settings-toggle-hint">
                          {lang === "fr"
                            ? "Affiche la traduction sous chaque verset"
                            : lang === "ar"
                              ? "يعرض الترجمة تحت كل آية"
                              : "Shows translation below each verse"}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`toggle-switch ${showTranslation ? "on" : ""}`}
                      onClick={() => set({ showTranslation: !showTranslation })}
                      aria-pressed={showTranslation}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                  </div>
                  {showTranslation && (
                    <>
                      <div className="settings-card-label mt-[0.85rem]">
                        <i className="fas fa-globe" aria-hidden="true"></i>
                        {t("settings.translationLang", lang)}
                      </div>
                      <p className="settings-hint">{translationLanguageHint}</p>
                      <div className="settings-chips mt-[0.75rem]">
                        {TRANSLATION_LANGUAGE_OPTIONS.map((option) => (
                          <button
                            key={option.code}
                            className={chipClass(translationLang === option.code)}
                            onClick={() =>
                              set({ translationLang: option.code })
                            }
                            aria-pressed={translationLang === option.code}
                          >
                            {getOptionLabel(option)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Font size */}
                <div className={cardClass}>
                  <div className="settings-card-label">
                    <i className="fas fa-text-height" aria-hidden="true"></i>
                    {t("settings.fontSize", lang)}
                    <span className="settings-value-pill">
                      {quranFontSize}px
                    </span>
                  </div>
                  <div className="settings-card-hint">
                    {lang === "fr"
                      ? "Ajuste uniquement la taille du texte coranique arabe."
                      : lang === "ar"
                        ? "هذا الخيار يغيّر حجم النص القرآني العربي فقط."
                        : "This control changes only the Quranic Arabic text size."}
                  </div>
                  <div className="font-size-stepper">
                    <button
                      className="fss-btn"
                      onClick={() =>
                        dispatch({
                          type: "SET_QURAN_FONT_SIZE",
                          payload: Math.max(FONT_SIZE_MIN, quranFontSize - 2),
                        })
                      }
                      disabled={quranFontSize <= FONT_SIZE_MIN}
                      aria-label={
                        lang === "fr"
                          ? "Réduire la taille"
                          : lang === "ar"
                            ? "تصغير الخط"
                            : "Decrease size"
                      }
                    >
                      <span className="text-[0.72rem] font-extrabold leading-none [font-family:var(--font-ui)]">
                        A
                      </span>
                    </button>
                    <div className="fss-track" role="presentation">
                      <div className={cn("fss-bar", fontProgressWidthClass)} />
                    </div>
                    <button
                      className="fss-btn"
                      onClick={() =>
                        dispatch({
                          type: "SET_QURAN_FONT_SIZE",
                          payload: Math.min(FONT_SIZE_MAX, quranFontSize + 2),
                        })
                      }
                      disabled={quranFontSize >= FONT_SIZE_MAX}
                      aria-label={
                        lang === "fr"
                          ? "Augmenter la taille"
                          : lang === "ar"
                            ? "تكبير الخط"
                            : "Increase size"
                      }
                    >
                      <span className="text-[1.15rem] font-extrabold leading-none [font-family:var(--font-ui)]">
                        A
                      </span>
                    </button>
                  </div>
                  <div
                    className={cn(
                      "font-size-preview-ar mt-2 min-h-10 text-center leading-[2.2] opacity-90 text-[var(--text-quran)] [font-family:var(--font-quran,serif)]",
                      fontPreviewSizeClass,
                    )}
                    dir="rtl"
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </div>
                </div>

                {/* Font family */}
                <div className={cardClass}>
                  <div className="settings-card-label">
                    <i className="fas fa-font" aria-hidden="true"></i>
                    {t("settings.fontFamily", lang)}
                  </div>
                  <div className="font-search-wrap">
                    <input
                      type="text"
                      className="font-search-input"
                      value={fontFilter}
                      onChange={(e) => setFontFilter(e.target.value)}
                      placeholder={
                        lang === "fr"
                          ? "Rechercher une police…"
                          : lang === "ar"
                            ? "ابحث عن خط…"
                            : "Search a font…"
                      }
                      aria-label={
                        lang === "fr"
                          ? "Rechercher une police"
                          : lang === "ar"
                            ? "البحث عن خط"
                            : "Search font"
                      }
                    />
                  </div>
                  {FILTERED_FONT_CATEGORIES.map((cat) => (
                    <div key={cat.label} className="font-category">
                      <div className="font-category-label">{cat.label}</div>
                      <div className="setting-options font-options">
                        {cat.fonts.map((f) => (
                          <button
                            key={f.id}
                            className={cn(
                              "chip font-chip",
                              fontFamily === f.id && "active",
                              f.bold && "font-semibold",
                            )}
                            onClick={async () => {
                              await ensureFontLoaded(f.id);
                              dispatch({
                                type: "SET_FONT_FAMILY",
                                payload: f.id,
                              });
                            }}
                            title={f.hint}
                            aria-pressed={fontFamily === f.id}
                          >
                            <span className="font-chip-name">
                              بِسْمِ ٱللَّهِ
                            </span>
                            <span className="font-chip-label">{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {FILTERED_FONT_CATEGORIES.length === 0 && (
                    <div className="font-empty-state">
                      {lang === "fr"
                        ? "Aucune police trouvée pour cette recherche."
                        : lang === "ar"
                          ? "لا توجد خطوط مطابقة للبحث."
                          : "No matching fonts found."}
                    </div>
                  )}
                  <div
                    className={cn(
                      "font-preview mt-2 text-center text-[1.4rem] leading-[2] text-[var(--text-quran)] [font-family:var(--font-quran,serif)]",
                      FONT_OPTIONS.find((f) => f.id === fontFamily)?.bold &&
                        "font-semibold",
                    )}
                    dir="rtl"
                    aria-label="Aperçu de la police"
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                TAB: Audio
            ════════════════════════════════ */}
            {activeTab === "audio" && (
              <div className={paneClass}>
                <div className={paneTitleClass}>
                  {lang === "ar" ? "الصوت" : lang === "fr" ? "Audio" : "Audio"}
                </div>

                {/* Current reciter info */}
                <div className={cn(cardClass, "settings-reciter-card")}>
                  <div className="reciter-info-row">
                    <span className="reciter-avatar">
                      <i
                        className="fas fa-microphone-lines"
                        aria-hidden="true"
                      ></i>
                    </span>
                    <div className="reciter-info-text">
                      <div className="reciter-name">
                        {reciterObj?.nameFr ||
                          reciterObj?.nameEn ||
                          reciterObj?.name ||
                          reciter}
                      </div>
                      <div className="reciter-meta">
                        {riwaya.toUpperCase()} ·{" "}
                        {reciterObj?.style || "murattal"}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => toggleFavoriteReciter(reciter)}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-xs font-semibold transition-all duration-200",
                        favoriteReciterSet.has(reciter)
                          ? "border-amber-300/35 bg-amber-300/12 text-amber-200"
                          : "border-white/10 bg-white/[0.05] text-[var(--text-secondary)] hover:bg-white/[0.08]",
                      )}
                    >
                      <i
                        className={`fas ${favoriteReciterSet.has(reciter) ? "fa-star" : "fa-star-half-stroke"} mr-2`}
                        aria-hidden="true"
                      />
                      {favoriteReciterSet.has(reciter)
                        ? lang === "fr"
                          ? "Dans les favoris"
                          : lang === "ar"
                            ? "ضمن المفضلة"
                            : "In favorites"
                        : lang === "fr"
                          ? "Ajouter aux favoris"
                          : lang === "ar"
                            ? "إضافة إلى المفضلة"
                            : "Add to favorites"}
                    </button>
                    <span className="settings-value-pill">
                      {autoSelectFastestReciter
                        ? lang === "fr"
                          ? "Mode source rapide"
                          : lang === "ar"
                            ? "وضع المصدر الأسرع"
                            : "Fast source mode"
                        : lang === "fr"
                          ? "Sélection manuelle"
                          : lang === "ar"
                            ? "اختيار يدوي"
                            : "Manual selection"}
                    </span>
                    {formatLatency(currentReciterLatency) && (
                      <span className="settings-value-pill">
                        {formatLatency(currentReciterLatency)}
                      </span>
                    )}
                  </div>
                </div>

                <div className={cn(cardClass, "space-y-3")}>
                  <div className="settings-card-label">
                    <i className="fas fa-gauge-high" aria-hidden="true"></i>
                    {lang === "fr"
                      ? "Stratégie audio"
                      : lang === "ar"
                        ? "استراتيجية الصوت"
                        : "Audio strategy"}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      set({
                        autoSelectFastestReciter: !autoSelectFastestReciter,
                      })
                    }
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition-all duration-200",
                      autoSelectFastestReciter
                        ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-50"
                        : "border-white/10 bg-white/[0.04] text-[var(--text-secondary)]",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-[var(--text-primary)]">
                          {lang === "fr"
                            ? "Privilégier automatiquement le récitateur le plus rapide"
                            : lang === "ar"
                              ? "تفضيل المصدر الأسرع تلقائيًا"
                              : "Automatically prefer the fastest reciter"}
                        </div>
                        <div className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                          {lang === "fr"
                            ? "Les favoris restent prioritaires, puis la latence CDN mesurée."
                            : lang === "ar"
                              ? "تبقى المفضلة أولًا ثم يتم الاعتماد على أقل قيمة كمون مقاسة."
                              : "Favorites stay first, then measured CDN latency takes over."}
                        </div>
                      </div>
                      <span className="settings-value-pill">
                        {autoSelectFastestReciter ? "ON" : "OFF"}
                      </span>
                    </div>
                  </button>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
                    <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                      <span>
                        {lang === "fr"
                          ? "Hors ligne"
                          : lang === "ar"
                            ? "دون اتصال"
                            : "Offline"}
                      </span>
                      <span>{offlineCacheSizeMb} MB</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleDownloadCurrentSurah}
                        disabled={offlineBusy}
                        className="rounded-xl border border-emerald-300/25 bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-50 transition hover:bg-emerald-400/18 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {lang === "fr"
                          ? "Télécharger la sourate en cours"
                          : lang === "ar"
                            ? "تنزيل السورة الحالية"
                            : "Download current surah"}
                      </button>
                      <button
                        type="button"
                        onClick={handleDownloadRecentPack}
                        disabled={offlineBusy}
                        className="rounded-xl border border-sky-300/25 bg-sky-400/10 px-3 py-2 text-xs font-semibold text-sky-50 transition hover:bg-sky-400/18 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {lang === "fr"
                          ? "Pack des dernières lectures"
                          : lang === "ar"
                            ? "حزمة آخر القراءات"
                            : "Recent readings pack"}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveCurrentOffline}
                        disabled={offlineBusy || !currentOfflineEntry}
                        className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {lang === "fr"
                          ? "Supprimer la sourate courante"
                          : lang === "ar"
                            ? "حذف السورة الحالية"
                            : "Remove current surah"}
                      </button>
                    </div>
                    {offlineProgress && (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-black/10 p-3">
                        <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-secondary)]">
                          <span>{offlineProgress.label}</span>
                          <span>
                            {offlineProgress.currentIndex && offlineProgress.totalSurahs
                              ? `${offlineProgress.currentIndex}/${offlineProgress.totalSurahs}`
                              : `${offlineProgress.done || 0}/${offlineProgress.total || 0}`}
                          </span>
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
                          <div
                            className="h-full rounded-full bg-[linear-gradient(90deg,rgba(68,211,183,0.92),rgba(79,172,254,0.88))]"
                            style={{
                              width: `${Math.max(
                                6,
                                Math.min(
                                  100,
                                  ((offlineProgress.done || 0) /
                                    Math.max(offlineProgress.total || 1, 1)) *
                                    100,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reciter selector */}
                <div className={cardClass}>
                  <div className="settings-card-label">
                    <i
                      className="fas fa-microphone-lines"
                      aria-hidden="true"
                    ></i>
                    {lang === "fr"
                      ? "Choisir le récitateur"
                      : lang === "ar"
                        ? "اختر القارئ"
                        : "Choose Reciter"}
                  </div>
                  <div className="settings-reciters-list">
                    {rankedReciters.map((r, index) => {
                      const active = reciter === r.id;
                      const latency = getLatencyForReciter(r, reciterLatencyByKey);
                      return (
                        <button
                          key={r.id}
                          className={`settings-reciter-item${active ? " active" : ""}`}
                          onClick={() => set({ reciter: r.id })}
                          aria-pressed={active}
                        >
                          <span className="settings-reciter-avatar">
                            <i
                              className="fas fa-microphone"
                              aria-hidden="true"
                            />
                          </span>
                          <span className="settings-reciter-info">
                            <span className="settings-reciter-name">
                              {lang === "ar"
                                ? r.name
                                : lang === "fr"
                                  ? r.nameFr
                                  : r.nameEn}
                            </span>
                            <span className="settings-reciter-style">
                              {r.style || "murattal"}
                              {index === 0
                                ? lang === "fr"
                                  ? " · rapide"
                                  : lang === "ar"
                                    ? " · سريع"
                                    : " · fast"
                                : ""}
                              {latency ? ` · ${formatLatency(latency)}` : ""}
                            </span>
                          </span>
                          {active && (
                            <i
                              className="fas fa-check settings-reciter-check"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sync offset */}
                <div className={cardClass}>
                  <div className="settings-card-label">
                    <i className="fas fa-sliders" aria-hidden="true"></i>
                    {lang === "fr"
                      ? "Décalage synchro audio"
                      : lang === "ar"
                        ? "إزاحة مزامنة الصوت"
                        : "Audio sync offset"}
                    <span className="settings-value-pill">
                      {syncOffsetMs} ms
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-500}
                    max={500}
                    step={10}
                    value={syncOffsetMs}
                    onChange={(e) => {
                      const value = Math.max(
                        -500,
                        Math.min(500, parseInt(e.target.value, 10) || 0),
                      );
                      set({
                        syncOffsetsMs: {
                          ...(syncOffsetsMs || {}),
                          [syncKey]: value,
                        },
                      });
                    }}
                    className="setting-slider"
                    aria-label={`${lang === "fr" ? "Décalage synchro" : "Sync offset"}: ${syncOffsetMs} ms`}
                  />
                  <p className="settings-hint">
                    {reciterObj?.nameFr ||
                      reciterObj?.nameEn ||
                      reciterObj?.name ||
                      reciter}{" "}
                    · {riwaya.toUpperCase()} · [-500 / +500]ms
                  </p>
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                TAB: Données
            ════════════════════════════════ */}
            {activeTab === "donnees" && (
              <div className={paneClass}>
                <div className={paneTitleClass}>
                  {lang === "ar"
                    ? "البيانات"
                    : lang === "fr"
                      ? "Données"
                      : "Data"}
                </div>

                {/* Export / Import */}
                <div className={cardClass}>
                  <div className="settings-card-label">
                    <i className="fas fa-hard-drive" aria-hidden="true"></i>
                    {t("export.title", lang)}
                  </div>
                  <div className="data-action-btns">
                    <button
                      className="data-action-btn"
                      onClick={downloadExport}
                    >
                      <i className="fas fa-download" aria-hidden="true"></i>
                      <span>{t("export.export", lang)}</span>
                    </button>
                    <button className="data-action-btn" onClick={handleImport}>
                      <i className="fas fa-upload" aria-hidden="true"></i>
                      <span>{t("export.import", lang)}</span>
                    </button>
                  </div>
                </div>

                {/* Keyboard shortcuts */}
                <div className={cardClass}>
                  <div className="settings-card-label">
                    <i className="fas fa-keyboard" aria-hidden="true"></i>
                    {lang === "ar"
                      ? "اختصارات لوحة المفاتيح"
                      : lang === "fr"
                        ? "Raccourcis clavier"
                        : "Keyboard shortcuts"}
                  </div>
                  <div className="shortcuts-grid">
                    <div className="shortcut-item">
                      <kbd>←</kbd> <kbd>→</kbd>
                      <span>
                        {lang === "ar"
                          ? "التنقل (سورة/صفحة/جزء)"
                          : lang === "fr"
                            ? "Naviguer (sourate/page/juz)"
                            : "Navigate (surah/page/juz)"}
                      </span>
                    </div>
                    <div className="shortcut-item">
                      <kbd>
                        {lang === "fr"
                          ? "Espace"
                          : lang === "ar"
                            ? "مسافة"
                            : "Space"}
                      </kbd>
                      <span>
                        {lang === "ar"
                          ? "تشغيل / إيقاف الصوت"
                          : lang === "fr"
                            ? "Lecture / Pause audio"
                            : "Play / Pause audio"}
                      </span>
                    </div>
                    <div className="shortcut-item">
                      <kbd>Ctrl</kbd>+<kbd>K</kbd>
                      <span>
                        {lang === "ar"
                          ? "فتح البحث"
                          : lang === "fr"
                            ? "Ouvrir la recherche"
                            : "Open search"}
                      </span>
                    </div>
                    <div className="shortcut-item">
                      <kbd>{lang === "fr" ? "Échap" : "Esc"}</kbd>
                      <span>
                        {lang === "ar"
                          ? "إغلاق النافذة"
                          : lang === "fr"
                            ? "Fermer le modal"
                            : "Close modal"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* About */}
                <div className={cn(cardClass, "about-card")}>
                  <div className="about-brand">
                    <PlatformLogo
                      className="about-logo"
                      imgClassName="about-logo-img"
                      decorative
                    />
                    <div>
                      <strong>MushafPlus</strong>
                      <span className="about-version">v1.1.0</span>
                    </div>
                  </div>
                  <p className="about-desc">
                    {lang === "ar"
                      ? "تطبيق لقراءة القرآن الكريم مع دعم حفص وورش، تجويد ملوّن، صوت متزامن والمزيد."
                      : lang === "fr"
                        ? "Application de lecture du Saint Coran avec support Hafs & Warsh, tajweed coloré, audio synchronisé, et bien plus."
                        : "Holy Quran reader with Hafs & Warsh support, colored tajweed, synchronized audio, and more."}
                  </p>
                  <div className="about-links">
                    <a
                      href="https://alquran.cloud/api"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="about-link"
                    >
                      <i className="fas fa-cloud" aria-hidden="true"></i> Al
                      Quran Cloud API
                    </a>
                    <a
                      href="https://fonts.qurancomplex.gov.sa/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="about-link"
                    >
                      <i className="fas fa-font" aria-hidden="true"></i>
                      {lang === "fr"
                        ? "Polices QCF4 (Complexe Roi Fahd)"
                        : lang === "ar"
                          ? "خطوط QCF4 (مجمع الملك فهد)"
                          : "QCF4 Fonts (King Fahd Complex)"}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ════════════════════════════════
                TAB: Outils
            ════════════════════════════════ */}
            {activeTab === "outils" && (
              <div className={paneClass}>
                <div className={paneTitleClass}>
                  {lang === "ar"
                    ? "الأدوات"
                    : lang === "fr"
                      ? "Outils"
                      : "Tools"}
                </div>
                <p className="settings-hint mb-4">
                  {lang === "fr"
                    ? "Accédez rapidement aux outils d'apprentissage et de mémorisation."
                    : lang === "ar"
                      ? "الوصول السريع لأدوات التعلم والحفظ."
                      : "Quick access to learning and memorization tools."}
                </p>

                <div className="settings-tools-grid">
                  {[
                    {
                      icon: "fa-layer-group",
                      fr: "Flashcards",
                      ar: "بطاقات التعلم",
                      en: "Flashcards",
                      desc_fr: "Mémorisez les versets",
                      desc_ar: "احفظ الآيات",
                      desc_en: "Memorize verses",
                      action: "flashcardsOpen",
                      iconClass: "text-emerald-400",
                    },
                    {
                      icon: "fa-spell-check",
                      fr: "Quiz Tajweed",
                      ar: "اختبار التجويد",
                      en: "Tajweed Quiz",
                      desc_fr: "Testez vos règles",
                      desc_ar: "اختبر معلوماتك",
                      desc_en: "Test your rules",
                      action: "tajweedQuizOpen",
                      iconClass: "text-sky-400",
                    },
                    {
                      icon: "fa-book-open-reader",
                      fr: "Khatma",
                      ar: "الختمة",
                      en: "Khatma",
                      desc_fr: "Objectif de lecture",
                      desc_ar: "هدف القراءة",
                      desc_en: "Reading goal",
                      action: "khatmaOpen",
                      iconClass: "text-amber-400",
                    },
                    {
                      icon: "fa-users",
                      fr: "Comparateur",
                      ar: "مقارنة الرواية",
                      en: "Comparator",
                      desc_fr: "Comparer Hafs & Warsh",
                      desc_ar: "قارن حفص وورش",
                      desc_en: "Compare Hafs & Warsh",
                      action: "comparatorOpen",
                      iconClass: "text-violet-400",
                    },
                    {
                      icon: "fa-image",
                      fr: "Partager image",
                      ar: "مشاركة صورة",
                      en: "Share Image",
                      desc_fr: "Créer une belle image",
                      desc_ar: "أنشئ صورة جميلة",
                      desc_en: "Create a beautiful image",
                      action: "shareImageOpen",
                      iconClass: "text-pink-400",
                    },
                    {
                      icon: "fa-chart-bar",
                      fr: "Stats Hebdo",
                      ar: "الإحصاء الأسبوعي",
                      en: "Weekly Stats",
                      desc_fr: "Votre progression",
                      desc_ar: "تقدمك الأسبوعي",
                      desc_en: "Your progress",
                      action: "weeklyStatsOpen",
                      iconClass: "text-teal-400",
                    },
                  ].map(
                    ({
                      icon,
                      fr,
                      ar,
                      en,
                      desc_fr,
                      desc_ar,
                      desc_en,
                      action,
                      iconClass,
                    }) => (
                      <button
                        key={action}
                        className="settings-tool-card"
                        onClick={() => {
                          set({ [action]: true });
                          close();
                        }}
                        aria-label={
                          lang === "ar" ? ar : lang === "fr" ? fr : en
                        }
                      >
                        <span className={cn("settings-tool-icon", iconClass)}>
                          <i className={`fas ${icon}`} aria-hidden="true" />
                        </span>
                        <span className="settings-tool-name">
                          {lang === "ar" ? ar : lang === "fr" ? fr : en}
                        </span>
                        <span className="settings-tool-desc">
                          {lang === "ar"
                            ? desc_ar
                            : lang === "fr"
                              ? desc_fr
                              : desc_en}
                        </span>
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </div>
          {/* end settings-content */}
        </div>
        {/* end settings-body-layout */}
      </div>
      {/* end settings-dialog */}
    </div>
  );
}
