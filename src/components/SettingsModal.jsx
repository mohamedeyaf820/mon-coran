import React, { useCallback, useEffect, useRef, useState } from "react";
import { 
  Palette, 
  Book, 
  Type, 
  Volume2, 
  Database, 
  Wrench,
  X,
  ChevronDown,
  Loader2,
  AlertTriangle,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  Settings2,
  Maximize2,
  Minimize2,
  Volume1,
  VolumeX,
  Mic2,
  Check,
  SlidersHorizontal
} from "lucide-react";

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
  isSurahOnlyReciter,
  RECITER_PHOTOS_MAP,
} from "../data/reciters";
import SURAHS from "../data/surahs";
import {
  DAY_THEME_IDS as AUTO_DAY_THEME_IDS,
  NIGHT_THEME_IDS as AUTO_NIGHT_THEME_IDS,
  THEMES as UI_THEMES,
} from "../data/themes";
import { ensureFontLoaded } from "../services/fontLoader";
import { getSettings, saveSettings } from "../services/storageService";
import {
  clearEncryptionSession,
  configureEncryptionPassphrase,
  hasEncryptionPassphraseConfigured,
  isEncryptionUnlocked,
  removeEncryptionPassphrase,
  unlockEncryptionWithPassphrase,
} from "../services/cryptoUtil";
import {
  getLatencyForReciter,
  getReciterUnavailableRemainingMs,
  sortRecitersByPreference,
} from "../utils/reciterRanking";
import { formatCooldownLabel } from "../utils/formatUtils";
import PlatformLogo from "./PlatformLogo";
import { cn, toast } from "../lib/utils";
import { openExternalUrl } from "../lib/security";


const TABS = [
  {
    id: "apparence",
    icon: <Palette size={18} />,
    fr: "Apparence",
    ar: "المظهر",
    en: "Appearance",
  },
  {
    id: "coran",
    icon: <Book size={18} />,
    fr: "Coran",
    ar: "القرآن",
    en: "Quran",
  },
  { id: "texte", icon: <Type size={18} />, fr: "Texte", ar: "النص", en: "Text" },
  {
    id: "audio",
    icon: <Volume2 size={18} />,
    fr: "Audio",
    ar: "الصوت",
    en: "Audio",
  },
  {
    id: "donnees",
    icon: <Database size={18} />,
    fr: "Données",
    ar: "البيانات",
    en: "Data",
  },
  {
    id: "outils",
    icon: <Wrench size={18} />,
    fr: "Outils",
    ar: "الأدوات",
    en: "Tools",
  },
];

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
    translationLangs = [],
    wordTranslationLang,
    displayMode,
    currentSurah,
    fontFamily,
    warshStrictMode,
    syncOffsetsMs,
    favoriteReciters,
    autoSelectFastestReciter,
    reciterLatencyByKey,
    reciterAvailabilityById,
    autoNightMode,
    nightStart,
    nightEnd,
    nightTheme,
    dayTheme,
  } = state;
  const syncKey = `${riwaya}:${reciter}`;
  const syncOffsetMs = Number(syncOffsetsMs?.[syncKey] ?? 0);
  const reciterObj = getReciter(reciter, riwaya);
  const isSurahStreamReciter = isSurahOnlyReciter(reciterObj);
  const [fontFilter, setFontFilter] = useState("");
  const [activeTab, setActiveTab] = useState("apparence");
  const [offlineBusy, setOfflineBusy] = useState(false);
  const [offlineProgress, setOfflineProgress] = useState(null);
  const [offlineCacheSizeMb, setOfflineCacheSizeMb] = useState(0);
  const [offlineEntries, setOfflineEntries] = useState([]);
  const [securityPassphrase, setSecurityPassphrase] = useState("");
  const [securityUnlockPassphrase, setSecurityUnlockPassphrase] = useState("");
  const [securityConfigured, setSecurityConfigured] = useState(false);
  const [securityUnlocked, setSecurityUnlocked] = useState(false);
  const [isCompactDevice, setIsCompactDevice] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 900px)").matches
      : false,
  );
  const [isTouchDevice, setIsTouchDevice] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(hover: none), (pointer: coarse)").matches
      : false,
  );
  const closeButtonRef = useRef(null);

  const close = () => dispatch({ type: "TOGGLE_SETTINGS" });
  const handleTabKeyNavigation = useCallback(
    (event, currentIndex) => {
      const key = event.key;
      if (!["ArrowUp", "ArrowDown", "Home", "End"].includes(key)) return;
      event.preventDefault();

      let nextIndex = currentIndex;
      if (key === "ArrowDown") {
        nextIndex = (currentIndex + 1) % TABS.length;
      } else if (key === "ArrowUp") {
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      } else if (key === "Home") {
        nextIndex = 0;
      } else if (key === "End") {
        nextIndex = TABS.length - 1;
      }

      const nextTab = TABS[nextIndex];
      if (!nextTab) return;
      setActiveTab(nextTab.id);

      window.requestAnimationFrame(() => {
        const nextButton = document.getElementById(`settings-tab-${nextTab.id}`);
        nextButton?.focus();
      });
    },
    [],
  );
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
    availabilityById: reciterAvailabilityById,
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

  useEffect(() => {
    setSecurityConfigured(hasEncryptionPassphraseConfigured());
    setSecurityUnlocked(isEncryptionUnlocked());
  }, []);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const compactMedia = window.matchMedia("(max-width: 900px)");
    const touchMedia = window.matchMedia("(hover: none), (pointer: coarse)");

    const updateCompact = (event) => setIsCompactDevice(event.matches);
    const updateTouch = (event) => setIsTouchDevice(event.matches);

    setIsCompactDevice(compactMedia.matches);
    setIsTouchDevice(touchMedia.matches);

    compactMedia.addEventListener("change", updateCompact);
    touchMedia.addEventListener("change", updateTouch);

    return () => {
      compactMedia.removeEventListener("change", updateCompact);
      touchMedia.removeEventListener("change", updateTouch);
    };
  }, []);

  const handleConfigurePassphrase = useCallback(() => {
    const result = configureEncryptionPassphrase(securityPassphrase);
    if (!result.ok) {
      toast.error(
        lang === "fr"
          ? "Mot de passe trop court (6 caractères min)."
          : lang === "ar"
            ? "كلمة المرور قصيرة جدا (6 أحرف على الأقل)."
            : "Passphrase is too short (min 6 chars).",
      );
      return;
    }

    // Re-encrypt current settings with the new active key.
    saveSettings(getSettings());
    setSecurityPassphrase("");
    setSecurityConfigured(true);
    setSecurityUnlocked(true);
    toast.success(
      lang === "fr"
        ? "Chiffrement renforcé activé."
        : lang === "ar"
          ? "تم تفعيل تشفير أقوى."
          : "Stronger encryption enabled.",
    );
  }, [lang, securityPassphrase]);

  const handleUnlockPassphrase = useCallback(() => {
    const ok = unlockEncryptionWithPassphrase(securityUnlockPassphrase);
    if (!ok) {
      toast.error(
        lang === "fr"
          ? "Mot de passe invalide."
          : lang === "ar"
            ? "كلمة المرور غير صحيحة."
            : "Invalid passphrase.",
      );
      return;
    }

    setSecurityUnlockPassphrase("");
    setSecurityUnlocked(true);
    toast.success(
      lang === "fr"
        ? "Coffre déverrouillé."
        : lang === "ar"
          ? "تم فتح القفل."
          : "Secure vault unlocked.",
    );
  }, [lang, securityUnlockPassphrase]);

  const handleLockPassphrase = useCallback(() => {
    clearEncryptionSession();
    setSecurityUnlocked(false);
  }, []);

  const handleRemovePassphrase = useCallback(() => {
    removeEncryptionPassphrase();
    setSecurityConfigured(false);
    setSecurityUnlocked(false);
    setSecurityPassphrase("");
    setSecurityUnlockPassphrase("");
    toast.success(
      lang === "fr"
        ? "Protection passphrase supprimée."
        : lang === "ar"
          ? "تمت إزالة حماية كلمة المرور."
          : "Passphrase protection removed.",
    );
  }, [lang]);
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
  const activePanelId = `settings-panel-${activeTab}`;
  const currentThemeOption = UI_THEMES.find((themeOption) => themeOption.id === theme);
  const currentLanguageLabel =
    LANGUAGES.find((languageOption) => languageOption.code === lang)?.label ||
    (lang ? lang.toUpperCase() : "FR");
  const currentFontOption =
    FONT_OPTIONS.find((fontOption) => fontOption.id === fontFamily) || FONT_OPTIONS[0];
  const currentTranslationOption = TRANSLATION_LANGUAGE_OPTIONS.find(
    (option) => (translationLangs || []).includes(option.code),
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
  const deviceLabel = isCompactDevice
    ? lang === "fr"
      ? "Mobile"
      : lang === "ar"
        ? "جوال"
        : "Mobile"
    : isTouchDevice
      ? lang === "fr"
        ? "Tablette"
        : lang === "ar"
          ? "لوحي"
          : "Tablet"
      : lang === "fr"
        ? "Ordinateur"
        : lang === "ar"
          ? "سطح المكتب"
          : "Desktop";
  const connectionLabel =
    lang === "fr"
      ? "Appareil détecté"
      : lang === "ar"
        ? "الجهاز المتصل"
        : "Detected device";
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
            pill(connectionLabel, deviceLabel),
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
            pill(connectionLabel, deviceLabel),
            pill(lang === "fr" ? "Riwaya" : lang === "ar" ? "الرواية" : "Riwaya", (riwaya || "hafs").toUpperCase()),
            pill(lang === "fr" ? "Affichage" : lang === "ar" ? "العرض" : "Layout", displayModeLabel),
            pill(
              lang === "fr" ? "Traduction" : lang === "ar" ? "الترجمة" : "Translation",
              showTranslation
                ? currentTranslationOption
                  ? getOptionLabel(currentTranslationOption)
                  : (translationLangs[0] || "FR").toUpperCase()
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
            pill(connectionLabel, deviceLabel),
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
            pill(connectionLabel, deviceLabel),
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
            pill(connectionLabel, deviceLabel),
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
            pill(connectionLabel, deviceLabel),
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
    set(patch);
  };

  const settingsSuggestions = (() => {
    const suggestion = (icon, title, copy, action) => ({ icon, title, copy, action });

    switch (activeTab) {
      case "apparence":
        return [
          suggestion(
            <Palette size={18} />,
            lang === "fr" ? "Lecture claire" : lang === "ar" ? "قراءة نهارية" : "Clear reading",
            lang === "fr"
              ? "Fond clair, vert profond, sans mode nuit automatique."
              : lang === "ar"
                ? "خلفية فاتحة مع لون أخضر واضح وبدون تبديل تلقائي."
                : "Light surface, deep green actions, no automatic night switch.",
            () => set({ theme: "light", dayTheme: "light", autoNightMode: false }),
          ),
          suggestion(
            <SlidersHorizontal size={18} />,
            lang === "fr" ? "Nuit automatique" : lang === "ar" ? "ليل تلقائي" : "Auto night",
            lang === "fr"
              ? "Passe au sombre le soir et revient au clair le matin."
              : lang === "ar"
                ? "ينتقل إلى الوضع الداكن ليلا ويعود صباحا."
                : "Switches dark at night and back to light in the morning.",
            () => set({ autoNightMode: true, dayTheme: "light", nightTheme: "dark" }),
          ),
        ];
      case "coran":
        return [
          suggestion(
            <Book size={18} />,
            lang === "fr" ? "Lecture continue" : lang === "ar" ? "قراءة مستمرة" : "Continuous reading",
            lang === "fr"
              ? "Mode sourate avec lecture audio qui enchaine."
              : lang === "ar"
                ? "وضع السورة مع تشغيل متتابع."
                : "Surah mode with audio continuity.",
            () => set({ displayMode: "surah", continuousPlay: true, focusReading: false }),
          ),
          suggestion(
            <Maximize2 size={18} />,
            lang === "fr" ? "Mode mushaf" : lang === "ar" ? "وضع المصحف" : "Mushaf mode",
            lang === "fr"
              ? "Affichage par page pour une lecture plus traditionnelle."
              : lang === "ar"
                ? "عرض الصفحات لتجربة أقرب إلى المصحف."
                : "Page layout for a more traditional reading flow.",
            () => set({ displayMode: "page", showHome: false }),
          ),
        ];
      case "texte":
        return [
          suggestion(
            <Type size={18} />,
            lang === "fr" ? "Grand confort" : lang === "ar" ? "راحة أكبر" : "Comfort text",
            lang === "fr"
              ? "Texte arabe plus grand avec traduction visible."
              : lang === "ar"
                ? "نص عربي أكبر مع الترجمة."
                : "Larger Arabic text with translation visible.",
            () => set({ quranFontSize: Math.max(quranFontSize, 48), showTranslation: true }),
          ),
          suggestion(
            <Minimize2 size={18} />,
            lang === "fr" ? "Memorisation" : lang === "ar" ? "حفظ" : "Memorization",
            lang === "fr"
              ? "Masque les aides pour se concentrer sur le verset."
              : lang === "ar"
                ? "إخفاء المساعدات للتركيز على الآية."
                : "Hides helpers so the verse stays central.",
            () =>
              set({
                showTranslation: false,
                showWordByWord: false,
                showTransliteration: false,
                showWordTranslation: false,
              }),
          ),
        ];
      case "audio":
        return [
          suggestion(
            <Volume1 size={18} />,
            lang === "fr" ? "Audio stable" : lang === "ar" ? "صوت ثابت" : "Stable audio",
            lang === "fr"
              ? "Vitesse normale et recitateur le plus fiable automatiquement."
              : lang === "ar"
                ? "سرعة عادية مع اختيار القارئ الأكثر استقرارا."
                : "Normal speed with the most reliable reciter selected automatically.",
            () => set({ audioSpeed: 1, autoSelectFastestReciter: true }),
          ),
          suggestion(
            <SkipBack size={18} />,
            lang === "fr" ? "Sync a zero" : lang === "ar" ? "مزامنة صفر" : "Zero sync",
            lang === "fr"
              ? "Reinitialise le decalage audio du recitateur courant."
              : lang === "ar"
                ? "إعادة ضبط تأخير صوت القارئ الحالي."
                : "Resets the current reciter audio offset.",
            () =>
              set({
                syncOffsetsMs: {
                  ...(syncOffsetsMs || {}),
                  [syncKey]: 0,
                },
              }),
          ),
        ];
      case "donnees":
        return [
          suggestion(
            <Database size={18} />,
            lang === "fr" ? "Exporter" : lang === "ar" ? "تصدير" : "Export",
            lang === "fr"
              ? "Sauvegarde favoris, notes et preferences en JSON."
              : lang === "ar"
                ? "حفظ المفضلة والملاحظات والإعدادات كملف JSON."
                : "Backs up bookmarks, notes, and preferences as JSON.",
            downloadExport,
          ),
          suggestion(
            <Loader2 size={18} />,
            lang === "fr" ? "Importer" : lang === "ar" ? "استيراد" : "Import",
            lang === "fr"
              ? "Restaure une sauvegarde depuis un fichier local."
              : lang === "ar"
                ? "استعادة نسخة احتياطية من ملف محلي."
                : "Restores a backup from a local file.",
            handleImport,
          ),
        ];
      default:
        return [
          suggestion(
            <Check size={18} />,
            lang === "fr" ? "Tajwid visible" : lang === "ar" ? "إظهار التجويد" : "Show tajweed",
            lang === "fr"
              ? "Active les couleurs utiles pour l'apprentissage."
              : lang === "ar"
                ? "تشغيل ألوان التجويد للمراجعة."
                : "Turns on helpful color cues for learning.",
            () => set({ showTajwid: true }),
          ),
          suggestion(
            <Minimize2 size={18} />,
            lang === "fr" ? "Mode zen" : lang === "ar" ? "وضع هادئ" : "Zen mode",
            lang === "fr"
              ? "Garde la lecture plus calme et moins distraite."
              : lang === "ar"
                ? "تجربة قراءة أهدأ وأقل تشتيتا."
                : "Keeps the reading view calmer and less distracting.",
            () => set({ focusReading: true }),
          ),
        ];
    }
  })();

  // ── Nouvelles classes propres (système sm-*) ──
  const overlayClass = "sm-overlay";
  const dialogClass = "sm-dialog";
  const headerClass = "sm-header";
  const bodyLayoutClass = "sm-body";
  const navClass = "sm-nav";
  const contentClass = "sm-content";
  const paneClass = "sm-pane";
  const paneTitleClass = "sm-pane-title";
  const cardClass = "sm-card";
  const navItemClass = (active) => cn("sm-nav-item", active && "sm-nav-item--active");
  const chipClass = (active) => cn("sm-chip", active && "sm-chip--active");

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
          <div className="sm-header__left">
            <span className="sm-header__icon" aria-hidden="true">
              <Settings2 size={20} />
            </span>
            <h2 className="sm-header__title">{t("settings.title", lang)}</h2>
          </div>
          <button
            className="sm-close-btn"
            onClick={close}
            aria-label={lang === "ar" ? "إغلاق" : "Fermer"}
            ref={closeButtonRef}
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body: nav + content ── */}
        <div className={bodyLayoutClass}>
          {/* Left navigation */}
          <nav className={navClass} aria-label="Navigation paramètres" role="tablist" aria-orientation="vertical">
            {TABS.map((tab, index) => (
              <button
                key={tab.id}
                className={navItemClass(activeTab === tab.id)}
                onClick={() => setActiveTab(tab.id)}
                aria-pressed={activeTab === tab.id}
                role="tab"
                id={`settings-tab-${tab.id}`}
                aria-selected={activeTab === tab.id}
                aria-controls={`settings-panel-${tab.id}`}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onKeyDown={(event) => handleTabKeyNavigation(event, index)}
              >
                {tab.icon}
                <span className="settings-nav-label">{tabLabel(tab)}</span>
              </button>
            ))}
          </nav>

          {/* Right content panel */}
          <div className={contentClass} role="tabpanel" id={activePanelId} aria-labelledby={`settings-tab-${activeTab}`}>
            <div className="sm-hero">
              <div className="sm-hero__eyebrow">
                {activeTabConfig.icon}
                {tabLabel(activeTabConfig)}
              </div>
              <h3 className="sm-hero__title">{settingsHero.title}</h3>
              <p className={cn("sm-hero__copy", isCompactDevice && "hidden")}>{settingsHero.copy}</p>
              <div className="sm-hero__pills">
                {(isCompactDevice ? settingsHero.pills.slice(0, 2) : settingsHero.pills).map((pill) => (
                  <div key={`${activeTab}-${pill.label}`} className="sm-hero__pill">
                    <span className="sm-hero__pill-label">{pill.label}</span>
                    <strong className="sm-hero__pill-value">{pill.value}</strong>
                  </div>
                ))}
              </div>
            </div>
            {/* ════════════════════════════════
                TAB: Apparence
            ════════════════════════════════ */}
            <div className="settings-suggestion-strip" aria-label="Suggestions rapides">
              <div className="settings-suggestion-strip__head">
                <span>
                  {lang === "fr"
                    ? "Suggestions rapides"
                    : lang === "ar"
                      ? "اقتراحات سريعة"
                      : "Quick suggestions"}
                </span>
                <small>
                  {lang === "fr"
                    ? "Presets utiles pour corriger vite l'experience."
                    : lang === "ar"
                      ? "إعدادات جاهزة لتحسين التجربة بسرعة."
                      : "Useful presets to improve the experience fast."}
                </small>
              </div>
              <div className="settings-suggestion-grid">
                {settingsSuggestions.map((item) => (
                  <button
                    key={`${activeTab}-${item.title}`}
                    type="button"
                    className="settings-suggestion-card"
                    onClick={item.action}
                  >
                    <span className="settings-suggestion-card__icon">{item.icon}</span>
                    <span className="settings-suggestion-card__body">
                      <strong>{item.title}</strong>
                      <small>{item.copy}</small>
                    </span>
                  </button>
                ))}
              </div>
            </div>
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
                  <div className="sm-swatch-grid">
                    {UI_THEMES.map((th) => {
                      const active = theme === th.id;
                      return (
                        <button
                          key={th.id}
                          className={`sm-swatch-btn ${active ? "sm-swatch-btn--active" : ""}`}
                          onClick={() =>
                            dispatch({ type: "SET_THEME", payload: th.id })
                          }
                          aria-pressed={active}
                          title={getThemeLabel(th)}
                        >
                          <span
                            className={cn(
                              "sm-swatch-circle !border-[2.5px]",
                              active && "sm-swatch-btn--active"
                            )}
                            style={{
                              background: th.palette.bg,
                              borderColor: th.palette.ink,
                              color: th.palette.accent,
                            }}
                          >
                            <span
                              className="sm-swatch-ar"
                            >
                              أ
                            </span>
                            {active && (
                              <i
                                className="fas fa-check sm-swatch-check"
                                aria-hidden="true"
                              ></i>
                            )}
                          </span>
                          <span className="sm-swatch-label">{getThemeLabel(th)}</span>
                          <span className="sm-swatch-desc">
                            {getThemeDescription(th)}
                          </span>
                          <span className="sm-swatch-badge">
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
                    <div className="sm-night-opts">
                      <div className="auto-night-row">
                        <label className="auto-night-label">
                          <i className="fas fa-moon" aria-hidden="true"></i>
                          {t("autoNight.nightStart", lang)}
                        </label>
                        <input
                          type="time"
                          value={nightStart}
                          onChange={(e) => set({ nightStart: e.target.value })}
                          className="sm-night-input"
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
                          className="sm-night-input"
                        />
                      </div>
                      <div className="sm-night-row">
                        <label className="sm-night-label">
                          {t("autoNight.dayTheme", lang)}
                        </label>
                        <select
                          value={dayTheme}
                          onChange={(e) => set({ dayTheme: e.target.value })}
                          className="sm-night-select"
                        >
                          {dayThemes.map((themeOption) => (
                            <option key={themeOption.id} value={themeOption.id}>
                              {getThemeLabel(themeOption)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm-night-row">
                        <label className="sm-night-label">
                          {t("autoNight.nightTheme", lang)}
                        </label>
                        <select
                          value={nightTheme}
                          onChange={(e) => set({ nightTheme: e.target.value })}
                          className="sm-night-select"
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
                  <div className="sm-card-label">
                    <i className="fas fa-book-quran" aria-hidden="true"></i>
                    {t("settings.riwaya", lang)}
                  </div>
                  <div className="sm-chips">
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
                  <p className="sm-hint">
                    {t("settings.riwayaHint", lang)}
                  </p>
                  {riwaya === "warsh" && (
                    <div className="sm-info-note">
                      <i className="fas fa-check-circle" aria-hidden="true"></i>
                      <span>{t("settings.warshTextNote", lang)}</span>
                    </div>
                  )}
                </div>

                {/* Warsh strict mode */}
                {riwaya === "warsh" && (
                  <div className={cardClass}>
                    <div className="sm-toggle-row">
                      <div className="sm-toggle-info">
                        <i
                          className="fas fa-shield-halved"
                          aria-hidden="true"
                        ></i>
                        <div>
                          <div className="sm-toggle-title">
                            {lang === "fr"
                              ? "Mode Warsh strict"
                              : lang === "ar"
                                ? "وضع ورش الصارم"
                                : "Warsh strict mode"}
                          </div>
                          <div className="sm-toggle-hint">
                            {lang === "fr"
                              ? "Refuse tout fallback Hafs quand Warsh est sélectionné."
                              : lang === "ar"
                                ? "يرفض أي بديل حفص عند اختيار ورش."
                                : "Rejects any Hafs fallback when Warsh is selected."}
                          </div>
                        </div>
                      </div>
                      <button
                        className={`sm-switch ${warshStrictMode ? "on" : ""}`}
                        onClick={() =>
                          set({ warshStrictMode: !warshStrictMode })
                        }
                        aria-pressed={warshStrictMode}
                      >
                        <span className="sm-switch-knob"></span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Display mode */}
                <div className={cardClass}>
                  <div className="sm-card-label">
                    <i className="fas fa-layer-group" aria-hidden="true"></i>
                    {t("settings.displayMode", lang)}
                  </div>
                  <p className="sm-hint">
                    {riwaya === "warsh"
                      ? lang === "fr"
                        ? "Les modes sourate, page Mushaf et juz utilisent les donnees Warsh synchronisees."
                        : lang === "ar"
                          ? "وضع الصفحة غير متاح لورش"
                          : "Surah, Mushaf page, and juz modes use synchronized Warsh data."
                      : lang === "fr"
                        ? "Choisissez comment le Coran est affiché"
                        : lang === "ar"
                          ? "اختر طريقة عرض القرآن"
                          : "Choose how the Quran is displayed"}
                  </p>
                  <div className="sm-mode-grid">
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
                        className={`sm-mode-card ${displayMode === m.id ? "sm-mode-card--active" : ""} ${m.disabled ? "sm-mode-card--disabled" : ""}`}
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
                        {m.disabled && <span className="sm-mode-badge">⚠</span>}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Continuous play */}
                <div className={cardClass}>
                  <div className="sm-toggle-row">
                    <div className="sm-toggle-info">
                      <i className="fas fa-circle-play" aria-hidden="true"></i>
                      <div>
                        <div className="sm-toggle-title">
                          {t("settings.continuousPlay", lang)}
                        </div>
                        <div className="sm-toggle-hint">
                          {t("settings.continuousPlayHint", lang)}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`sm-switch ${state.continuousPlay ? "on" : ""}`}
                      onClick={() =>
                        set({ continuousPlay: !state.continuousPlay })
                      }
                      aria-pressed={state.continuousPlay}
                    >
                      <span className="sm-switch-knob"></span>
                    </button>
                  </div>
                </div>

                {/* Focus reading */}
                <div className="settings-card">
                  <div className="sm-toggle-row">
                    <div className="sm-toggle-info">
                      <i className="fas fa-expand" aria-hidden="true"></i>
                      <div>
                        <div className="sm-toggle-title">
                          {lang === "fr"
                            ? "Mode lecture zen"
                            : lang === "ar"
                              ? "وضع القراءة الهادئة"
                              : "Zen reading mode"}
                        </div>
                        <div className="sm-toggle-hint">
                          {lang === "fr"
                            ? "Allège l’interface sur desktop: moins de panneaux, moins de bordures, plus d’air."
                            : lang === "ar"
                              ? "واجهة أخف على سطح المكتب: لوحات أقل وحدود أخف ومساحة أوسع."
                              : "Lighter desktop reading with fewer panels, borders, and visual noise."}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`sm-switch ${state.focusReading ? "on" : ""}`}
                      onClick={() => set({ focusReading: !state.focusReading })}
                      aria-pressed={state.focusReading}
                    >
                      <span className="sm-switch-knob"></span>
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
                  <div className="sm-toggle-row">
                    <div className="sm-toggle-info">
                      <i
                        className="fas fa-paint-brush text-[#e74c3c]"
                        aria-hidden="true"
                      ></i>
                      <div>
                        <div className="sm-toggle-title">
                          {t("settings.showTajwid", lang)}
                        </div>
                        <div className="sm-toggle-hint">
                          {lang === "fr"
                            ? "Colorie chaque règle de tajwid dans le texte"
                            : lang === "ar"
                              ? "يلوّن قواعد التجويد في النص"
                              : "Colors each tajweed rule in the text"}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`sm-switch ${showTajwid ? "on" : ""}`}
                      onClick={() => set({ showTajwid: !showTajwid })}
                      aria-pressed={showTajwid}
                    >
                      <span className="sm-switch-knob"></span>
                    </button>
                  </div>
                </div>

                {/* Word by word */}
                <div className={cardClass}>
                  <div className="sm-toggle-row">
                    <div className="sm-toggle-info">
                      <i className="fas fa-layer-group" aria-hidden="true"></i>
                      <div>
                        <div className="sm-toggle-title">
                          {lang === "fr"
                            ? "Mode mot à mot"
                            : lang === "ar"
                              ? "وضع كلمة بكلمة"
                              : "Word-by-word mode"}
                        </div>
                        <div className="sm-toggle-hint">
                          {lang === "fr"
                            ? "Affiche chaque mot avec sa traduction et translittération"
                            : lang === "ar"
                              ? "يعرض كل كلمة مع ترجمتها ونطقها"
                              : "Shows each word with its translation and transliteration"}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`sm-switch ${showWordByWord ? "on" : ""}`}
                      onClick={() => set({ showWordByWord: !showWordByWord })}
                      aria-pressed={showWordByWord}
                    >
                      <span className="sm-switch-knob"></span>
                    </button>
                  </div>
                  {showWordByWord && (
                    <div className="sm-sub-toggles">
                      <div className="sm-toggle-row sm-toggle-row--sub">
                        <span>
                          {lang === "fr"
                            ? "Translittération"
                            : lang === "ar"
                              ? "النطق اللاتيني"
                              : "Transliteration"}
                        </span>
                        <button
                          className={`sm-switch ${showTransliteration ? "on" : ""}`}
                          onClick={() =>
                            set({ showTransliteration: !showTransliteration })
                          }
                          aria-pressed={showTransliteration}
                        >
                          <span className="sm-switch-knob"></span>
                        </button>
                      </div>
                      <div className="sm-toggle-row sm-toggle-row--sub">
                        <span>
                          {lang === "fr"
                            ? "Traduction par mot"
                            : lang === "ar"
                              ? "ترجمة كل كلمة"
                              : "Word translation"}
                        </span>
                        <button
                          className={`sm-switch ${showWordTranslation ? "on" : ""}`}
                          onClick={() =>
                            set({ showWordTranslation: !showWordTranslation })
                          }
                          aria-pressed={showWordTranslation}
                        >
                          <span className="sm-switch-knob"></span>
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
                          <p className="sm-hint">
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
                  <div className="sm-toggle-row">
                    <div className="sm-toggle-info">
                      <i className="fas fa-language" aria-hidden="true"></i>
                      <div>
                        <div className="sm-toggle-title">
                          {t("settings.showTranslation", lang)}
                        </div>
                        <div className="sm-toggle-hint">
                          {lang === "fr"
                            ? "Affiche la traduction sous chaque verset"
                            : lang === "ar"
                              ? "يعرض الترجمة تحت كل آية"
                              : "Shows translation below each verse"}
                        </div>
                      </div>
                    </div>
                    <button
                      className={`sm-switch ${showTranslation ? "on" : ""}`}
                      onClick={() => set({ showTranslation: !showTranslation })}
                      aria-pressed={showTranslation}
                    >
                      <span className="sm-switch-knob"></span>
                    </button>
                  </div>
                  {showTranslation && (
                    <>
                      <div className="settings-card-label mt-[0.85rem]">
                        <i className="fas fa-globe" aria-hidden="true"></i>
                        {t("settings.translationLang", lang)}
                      </div>
                      <p className="sm-hint">{translationLanguageHint}</p>
                      <div className="settings-chips mt-[0.75rem]">
                        {TRANSLATION_LANGUAGE_OPTIONS.map((option) => (
                          <button
                            key={option.code}
                            className={chipClass(translationLangs.includes(option.code))}
                            onClick={() =>
                              dispatch({ type: "TOGGLE_TRANSLATION", payload: option.code })
                            }
                            aria-pressed={translationLangs.includes(option.code)}
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
                  <div className="sm-card-label">
                    <i className="fas fa-text-height" aria-hidden="true"></i>
                    {t("settings.fontSize", lang)}
                    <span className="sm-value-pill">
                      {quranFontSize}px
                    </span>
                  </div>
                  <div className="sm-card-hint">
                    {lang === "fr"
                      ? "Ajuste uniquement la taille du texte coranique arabe."
                      : lang === "ar"
                        ? "هذا الخيار يغيّر حجم النص القرآني العربي فقط."
                        : "This control changes only the Quranic Arabic text size."}
                  </div>
                  <div className="sm-font-stepper">
                    <button
                      className="sm-fss-btn"
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
                    <div className="sm-fss-track" role="presentation">
                      <div className={cn("sm-fss-bar", fontProgressWidthClass)} />
                    </div>
                    <button
                      className="sm-fss-btn"
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
                  <div className="sm-card-label">
                    <i className="fas fa-font" aria-hidden="true"></i>
                    {t("settings.fontFamily", lang)}
                  </div>
                  <div className="sm-font-search">
                    <input
                      type="text"
                      className="sm-font-search-input"
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
                    <div key={cat.label} className="sm-font-category">
                      <div className="sm-font-category-label">{cat.label}</div>
                      <div className="sm-font-options">
                        {cat.fonts.map((f) => (
                          <button
                            key={f.id}
                            className={cn("sm-font-chip", fontFamily === f.id && "sm-font-chip--active", f.bold && "font-semibold")}
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
                            <span className="sm-font-chip-preview">
                              بِسْمِ ٱللَّهِ
                            </span>
                            <span className="sm-font-chip-name">{f.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  {FILTERED_FONT_CATEGORIES.length === 0 && (
                    <div className="sm-font-empty">
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
                      <Mic2 size={24} />
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
                        {isSurahStreamReciter
                          ? lang === "fr"
                            ? " · sourate complete"
                            : lang === "ar"
                              ? " · سورة كاملة"
                              : " · full surah"
                          : ""}
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
                    <span className="sm-value-pill">
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
                      <span className="sm-value-pill">
                        {formatLatency(currentReciterLatency)}
                      </span>
                    )}
                    {isSurahStreamReciter && (
                      <span className="sm-value-pill">
                        MP3Quran ·
                        {lang === "fr"
                          ? " sourate"
                          : lang === "ar"
                            ? " سورة"
                            : " surah"}
                      </span>
                    )}
                  </div>
                </div>

                {isSurahStreamReciter && (
                  <div className={cn(cardClass, "space-y-2")}>
                    <div className="sm-card-label">
                      <i className="fas fa-wave-square" aria-hidden="true"></i>
                      {lang === "fr"
                        ? "Mode Warsh etendu"
                        : lang === "ar"
                          ? "وضع ورش الممتد"
                          : "Extended Warsh mode"}
                    </div>
                    <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                      {lang === "fr"
                        ? "Ce recitateur Warsh est verifie via MP3Quran en lecture sourate complete. La lecture verset par verset reste assuree par les sources EveryAyah."
                        : lang === "ar"
                          ? "هذا القارئ في ورش موثق عبر MP3Quran بصيغة السورة كاملة. أما القراءة آية بآية فما زالت معتمدة على EveryAyah."
                          : "This Warsh reciter is verified through MP3Quran as a full-surah stream. Verse-by-verse playback still relies on EveryAyah sources."}
                    </div>
                  </div>
                )}

                <div className={cn(cardClass, "space-y-3")}>
                  <div className="sm-card-label">
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
                      <span className="sm-value-pill">
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
                    {isSurahStreamReciter && (
                      <div className="mt-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs leading-relaxed text-[var(--text-secondary)]">
                        {lang === "fr"
                          ? "Le hors ligne met en cache le flux complet de la sourate pour ce recitateur."
                          : lang === "ar"
                            ? "سيحفظ وضع دون اتصال تدفق السورة الكامل لهذا القارئ."
                            : "Offline mode caches the full-surah stream for this reciter."}
                      </div>
                    )}
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
                  <div className="sm-card-label">
                    <Mic2 size={16} className="text-amber-400" />
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
                      const unavailableMs = getReciterUnavailableRemainingMs(
                        r.id,
                        reciterAvailabilityById,
                      );
                      const isUnavailable = unavailableMs > 0;
                      
                      // Using the same URL mapping logic as AudioPlayer
                      const reciterPhoto = RECITER_PHOTOS_MAP[r.id] || `https://ui-avatars.com/api/?name=${r.nameEn || r.id}&background=105a30&color=fff&size=256`;
                      
                      return (
                        <button
                          key={r.id}
                          className={cn(
                            "group relative flex flex-col p-3 rounded-2xl border transition-all duration-300",
                            active 
                              ? "bg-amber-400/15 border-amber-400/40 shadow-lg shadow-amber-900/20" 
                              : "bg-white/[0.04] border-white/10 hover:bg-white/[0.08] hover:border-white/20",
                            isUnavailable && !active && "opacity-50 cursor-not-allowed"
                          )}
                          onClick={() => {
                            if (isUnavailable && !active) return;
                            set({ reciter: r.id });
                          }}
                          aria-pressed={active}
                          disabled={isUnavailable && !active}
                          title={
                            isUnavailable && !active
                              ? lang === "fr"
                                ? `Indisponible encore ${formatCooldownLabel(unavailableMs, lang)}`
                                : lang === "ar"
                                  ? `غير متاح ${formatCooldownLabel(unavailableMs, lang)}`
                                  : `Unavailable for ${formatCooldownLabel(unavailableMs, lang)}`
                              : undefined
                          }
                        >
                          <div className="relative mb-3 flex justify-center">
                            <div className={cn(
                              "relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-transform duration-300 group-hover:scale-105",
                              active ? "border-amber-400" : "border-white/10"
                            )}>
                              <img 
                                src={reciterPhoto} 
                                alt="" 
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${r.nameEn || r.id}&background=105a30&color=fff&size=256`;
                                }}
                              />
                              {active && (
                                <div className="absolute inset-0 bg-amber-400/20 flex items-center justify-center">
                                  <div className="bg-amber-400 text-black rounded-full p-1 shadow-lg">
                                    <Check size={14} strokeWidth={4} />
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-center text-center gap-1">
                            <span className="text-sm font-bold text-[var(--text-primary)] line-clamp-1">
                              {lang === "ar"
                                ? r.name
                                : lang === "fr"
                                  ? r.nameFr
                                  : r.nameEn}
                            </span>
                            <span className="text-[0.68rem] text-[var(--text-secondary)] font-medium uppercase tracking-wider opacity-60">
                              {r.style || "murattal"}
                            </span>
                            
                            {(latency || r.audioMode === "surah" || index === 0) && (
                              <div className="mt-1 flex flex-wrap justify-center gap-1">
                                {index === 0 && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[0.6rem] font-bold border border-emerald-500/20">
                                    {lang === "fr" ? "RAPIDE" : lang === "ar" ? "سريع" : "FAST"}
                                  </span>
                                )}
                                {r.audioMode === "surah" && (
                                  <span className="px-1.5 py-0.5 rounded-md bg-sky-500/10 text-sky-400 text-[0.6rem] font-bold border border-sky-500/20">
                                    {lang === "fr" ? "SOURATE" : lang === "ar" ? "سورة" : "SURAH"}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Sync offset */}
                <div className={cardClass}>
                  <div className="sm-card-label">
                    <SlidersHorizontal size={16} className="text-sky-400" />
                    {lang === "fr"
                      ? "Décalage synchro audio"
                      : lang === "ar"
                        ? "إزاحة مزامنة الصوت"
                        : "Audio sync offset"}
                    <span className="sm-value-pill">
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
                  <p className="sm-hint">
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
                  <div className="sm-card-label">
                    <i className="fas fa-hard-drive" aria-hidden="true"></i>
                    {t("export.title", lang)}
                  </div>
                  <div className="sm-btn-row">
                    <button
                      className="sm-btn sm-btn--secondary"
                      onClick={downloadExport}
                    >
                      <i className="fas fa-download" aria-hidden="true"></i>
                      <span>{t("export.export", lang)}</span>
                    </button>
                    <button className="sm-btn sm-btn--secondary" onClick={handleImport}>
                      <i className="fas fa-upload" aria-hidden="true"></i>
                      <span>{t("export.import", lang)}</span>
                    </button>
                  </div>
                </div>

                <div className={cn(cardClass, "space-y-3")}>
                  <div className="sm-card-label">
                    <i className="fas fa-shield-halved" aria-hidden="true"></i>
                    {lang === "fr"
                      ? "Sécurité des données locales"
                      : lang === "ar"
                        ? "أمان البيانات المحلية"
                        : "Local data security"}
                  </div>
                  <p className="sm-hint">
                    {lang === "fr"
                      ? "Ajoutez une passphrase pour dériver une clé de chiffrement plus robuste."
                      : lang === "ar"
                        ? "أضف كلمة مرور لإنشاء مفتاح تشفير أقوى."
                        : "Add a passphrase to derive a stronger encryption key."}
                  </p>

                  {!securityConfigured ? (
                    <div className="space-y-2">
                      <input
                        type="password"
                        value={securityPassphrase}
                        onChange={(event) => setSecurityPassphrase(event.target.value)}
                        className="sm-passphrase-input"
                        placeholder={
                          lang === "fr"
                            ? "Passphrase (6 caractères minimum)"
                            : lang === "ar"
                              ? "كلمة المرور (6 أحرف على الأقل)"
                              : "Passphrase (minimum 6 characters)"
                        }
                      />
                      <button className="sm-btn sm-btn--secondary" onClick={handleConfigurePassphrase}>
                        <i className="fas fa-key" aria-hidden="true"></i>
                        <span>
                          {lang === "fr"
                            ? "Activer la protection"
                            : lang === "ar"
                              ? "تفعيل الحماية"
                              : "Enable protection"}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className={`sm-security-badge ${securityUnlocked ? "sm-security-badge--ok" : "sm-security-badge--warn"}`}>
                        <i className={`fas ${securityUnlocked ? "fa-lock-open" : "fa-lock"}`} aria-hidden="true"></i>
                        <span>
                          {securityUnlocked
                            ? lang === "fr"
                              ? "Protection active (déverrouillée)"
                              : lang === "ar"
                                ? "الحماية مفعلة (مفتوحة)"
                                : "Protection enabled (unlocked)"
                            : lang === "fr"
                              ? "Protection active (verrouillée)"
                              : lang === "ar"
                                ? "الحماية مفعلة (مغلقة)"
                                : "Protection enabled (locked)"}
                        </span>
                      </div>

                      {!securityUnlocked && (
                        <div className="space-y-2">
                          <input
                            type="password"
                            value={securityUnlockPassphrase}
                            onChange={(event) => setSecurityUnlockPassphrase(event.target.value)}
                            className="sm-passphrase-input"
                            placeholder={
                              lang === "fr"
                                ? "Entrer la passphrase"
                                : lang === "ar"
                                  ? "أدخل كلمة المرور"
                                  : "Enter passphrase"
                            }
                          />
                          <button className="sm-btn sm-btn--secondary" onClick={handleUnlockPassphrase}>
                            <i className="fas fa-unlock" aria-hidden="true"></i>
                            <span>
                              {lang === "fr"
                                ? "Déverrouiller"
                                : lang === "ar"
                                  ? "فتح القفل"
                                  : "Unlock"}
                            </span>
                          </button>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {securityUnlocked && (
                          <button className="sm-btn sm-btn--secondary" onClick={handleLockPassphrase}>
                            <i className="fas fa-lock" aria-hidden="true"></i>
                            <span>
                              {lang === "fr" ? "Verrouiller" : lang === "ar" ? "قفل" : "Lock"}
                            </span>
                          </button>
                        )}
                        <button className="sm-btn sm-btn--secondary" onClick={handleRemovePassphrase}>
                          <i className="fas fa-trash" aria-hidden="true"></i>
                          <span>
                            {lang === "fr"
                              ? "Supprimer la protection"
                              : lang === "ar"
                                ? "إزالة الحماية"
                                : "Remove protection"}
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Keyboard shortcuts */}
                <div className={cardClass}>
                  <div className="sm-card-label">
                    <i className="fas fa-keyboard" aria-hidden="true"></i>
                    {lang === "ar"
                      ? "اختصارات لوحة المفاتيح"
                      : lang === "fr"
                        ? "Raccourcis clavier"
                        : "Keyboard shortcuts"}
                  </div>
                  <div className="sm-shortcuts-grid">
                    <div className="sm-shortcut-item">
                      <kbd>←</kbd> <kbd>→</kbd>
                      <span>
                        {lang === "ar"
                          ? "التنقل (سورة/صفحة/جزء)"
                          : lang === "fr"
                            ? "Naviguer (sourate/page/juz)"
                            : "Navigate (surah/page/juz)"}
                      </span>
                    </div>
                    <div className="sm-shortcut-item">
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
                    <div className="sm-shortcut-item">
                      <kbd>Ctrl</kbd>+<kbd>K</kbd>
                      <span>
                        {lang === "ar"
                          ? "فتح البحث"
                          : lang === "fr"
                            ? "Ouvrir la recherche"
                            : "Open search"}
                      </span>
                    </div>
                    <div className="sm-shortcut-item">
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
                <div className={cn(cardClass, "sm-about-card")}>
                  <div className="sm-about-brand">
                    <PlatformLogo
                      className="sm-about-logo"
                      imgClassName="sm-about-logo-img"
                      decorative
                    />
                    <div>
                      <strong>MushafPlus</strong>
                      <span className="sm-about-version">v1.1.0</span>
                    </div>
                  </div>
                  <p className="sm-about-desc">
                    {lang === "ar"
                      ? "تطبيق لقراءة القرآن الكريم مع دعم حفص وورش، تجويد ملوّن، صوت متزامن والمزيد."
                      : lang === "fr"
                        ? "Application de lecture du Saint Coran avec support Hafs & Warsh, tajweed coloré, audio synchronisé, et bien plus."
                        : "Holy Quran reader with Hafs & Warsh support, colored tajweed, synchronized audio, and more."}
                  </p>
                  <div className="sm-about-links">
                    <button
                      type="button"
                      onClick={() => openExternalUrl("https://alquran.cloud/api")}
                      className="sm-about-link"
                    >
                      <i className="fas fa-cloud" aria-hidden="true"></i> Al
                      Quran Cloud API
                    </button>
                    <button
                      type="button"
                      onClick={() => openExternalUrl("https://fonts.qurancomplex.gov.sa/")}
                      className="sm-about-link"
                    >
                      <i className="fas fa-font" aria-hidden="true"></i>
                      {lang === "fr"
                        ? "Polices QCF4 (Complexe Roi Fahd)"
                        : lang === "ar"
                          ? "خطوط QCF4 (مجمع الملك فهد)"
                          : "QCF4 Fonts (King Fahd Complex)"}
                    </button>
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

                <div className="sm-tools-grid">
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
                        className="sm-tool-card"
                        onClick={() => {
                          set({ [action]: true });
                          close();
                        }}
                        aria-label={
                          lang === "ar" ? ar : lang === "fr" ? fr : en
                        }
                      >
                        <span className={cn("sm-tool-icon", iconClass)}>
                          <i className={`fas ${icon}`} aria-hidden="true" />
                        </span>
                        <span className="sm-tool-name">
                          {lang === "ar" ? ar : lang === "fr" ? fr : en}
                        </span>
                        <span className="sm-tool-desc">
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
