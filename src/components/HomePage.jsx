/* ══════════════════════════════════════════════════════════════
   HomePage — Design épuré, inspiré de Quran.com
   ══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useApp } from "../context/AppContext";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA } from "../data/juz";
import { getAllBookmarks, getAllNotes } from "../services/storageService";
import { getRecentVisits } from "../services/recentHistoryService";
import { cn } from "../lib/utils";
import audioService from "../services/audioService";
import { getReciter, ensureReciterForRiwaya } from "../data/reciters";
import PlatformLogo from "./PlatformLogo";

/* ─── Sourates d'accès rapide ─── */
const QUICK_ACCESS = [
  { n: 1, icon: "fa-mosque", label_fr: "Al-Fatiha", label_en: "The Opening" },
  { n: 18, icon: "fa-mountain-sun", label_fr: "Al-Kahf", label_en: "The Cave" },
  { n: 36, icon: "fa-star-and-crescent", label_fr: "Ya-Sin", label_en: "Ya-Sin" },
  { n: 55, icon: "fa-leaf", label_fr: "Ar-Rahman", label_en: "The Merciful" },
  { n: 67, icon: "fa-moon", label_fr: "Al-Mulk", label_en: "Sovereignty" },
  { n: 112, icon: "fa-infinity", label_fr: "Al-Ikhlas", label_en: "Sincerity" },
  { n: 113, icon: "fa-sun", label_fr: "Al-Falaq", label_en: "The Dawn" },
  { n: 114, icon: "fa-shield-halved", label_fr: "An-Nas", label_en: "Mankind" },
];

/* ─── Versets du jour — cycle de 30 jours ─── */
const DAILY_VERSES = [
  { text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", ref: "Al-Inshirah · 94:6", trans_fr: "Certes, avec la difficulté vient la facilité" },
  { text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا", ref: "At-Talaq · 65:2", trans_fr: "Qui craint Allah, Il lui accordera une issue" },
  { text: "وَاللَّهُ يُحِبُّ الصَّابِرِينَ", ref: "Âl-Imrân · 3:146", trans_fr: "Allah aime ceux qui font preuve de patience" },
  { text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ", ref: "Ar-Ra'd · 13:28", trans_fr: "C'est par le rappel d'Allah que les cœurs trouvent la quiétude" },
  { text: "وَتَوَكَّلْ عَلَى اللَّهِ ۚ وَكَفَىٰ بِاللَّهِ وَكِيلًا", ref: "Al-Ahzab · 33:3", trans_fr: "Confie-toi à Allah — Il suffit comme garant" },
  { text: "وَقُل رَّبِّ زِدْنِي عِلْمًا", ref: "Ta-Ha · 20:114", trans_fr: "Dis : Seigneur, accroîs mes connaissances" },
  { text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", ref: "Al-Baqara · 2:153", trans_fr: "Certes, Allah est avec ceux qui endurent" },
  { text: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ", ref: "Al-Hadid · 57:4", trans_fr: "Il est avec vous où que vous soyez" },
  { text: "وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ", ref: "Al-Baqara · 2:216", trans_fr: "Il se peut que vous détestiez une chose qui est bonne pour vous" },
  { text: "إِنَّ رَحْمَتَ اللَّهِ قَرِيبٌ مِّنَ الْمُحْسِنِينَ", ref: "Al-A'raf · 7:56", trans_fr: "La miséricorde d'Allah est proche des bienfaisants" },
  { text: "وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ", ref: "Yusuf · 12:87", trans_fr: "Ne désespérez jamais de la grâce d'Allah" },
  { text: "فَفِرُّوا إِلَى اللَّهِ", ref: "Adh-Dhariyat · 51:50", trans_fr: "Fuyez donc vers Allah" },
  { text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً", ref: "Al-Baqara · 2:201", trans_fr: "Notre Seigneur, accorde-nous ce qui est bon ici-bas et dans l'au-delà" },
  { text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ", ref: "At-Talaq · 65:3", trans_fr: "Celui qui se confie en Allah, Il lui suffit" },
  { text: "إِنَّ اللَّهَ لَطِيفٌ بِعِبَادِهِ", ref: "Ash-Shura · 42:19", trans_fr: "Allah est plein de mansuétude envers Ses serviteurs" },
  { text: "وَاللَّهُ يَعْلَمُ وَأَنتُمْ لَا تَعْلَمُونَ", ref: "Al-Baqara · 2:232", trans_fr: "Allah sait et vous ne savez pas" },
  { text: "وَمَا عِندَ اللَّهِ خَيْرٌ وَأَبْقَىٰ", ref: "Ash-Shura · 42:36", trans_fr: "Ce qui est auprès d'Allah est meilleur et plus durable" },
  { text: "رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ", ref: "Al-Qasas · 28:24", trans_fr: "Seigneur, j'ai grand besoin du bien que Tu fais descendre sur moi" },
  { text: "وَذَكِّرْ فَإِنَّ الذِّكْرَىٰ تَنفَعُ الْمُؤْمِنِينَ", ref: "Adh-Dhariyat · 51:55", trans_fr: "Rappelle, car le rappel profite aux croyants" },
  { text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", ref: "Al-Inshirah · 94:5", trans_fr: "En vérité, avec la difficulté vient la facilité" },
  { text: "إِن تَنصُرُوا اللَّهَ يَنصُرْكُمْ", ref: "Muhammad · 47:7", trans_fr: "Si vous défendez la cause d'Allah, Il vous accordera Sa victoire" },
  { text: "وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ", ref: "Al-Baqara · 2:197", trans_fr: "Prenez des provisions — la meilleure provision est la piété" },
  { text: "وَاتَّقُوا اللَّهَ وَيُعَلِّمُكُمُ اللَّهُ", ref: "Al-Baqara · 2:282", trans_fr: "Craignez Allah, et Allah vous enseignera" },
  { text: "الَّذِينَ يَذْكُرُونَ اللَّهَ قِيَامًا وَقُعُودًا وَعَلَىٰ جُنُوبِهِمْ", ref: "Âl-Imrân · 3:191", trans_fr: "Ceux qui invoquent Allah debout, assis et couchés sur le côté" },
  { text: "وَالسَّلَامُ عَلَىٰ مَنِ اتَّبَعَ الْهُدَىٰ", ref: "Ta-Ha · 20:47", trans_fr: "Et la paix soit sur celui qui suit le droit chemin" },
  { text: "سَنُرِيهِمْ آيَاتِنَا فِي الْآفَاقِ وَفِي أَنفُسِهِمْ", ref: "Fussilat · 41:53", trans_fr: "Nous leur montrerons Nos signes dans l'univers et en eux-mêmes" },
  { text: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ", ref: "Al-Qamar · 54:17", trans_fr: "Nous avons facilité le Coran — y a-t-il des gens pour réfléchir ?" },
  { text: "قُلْ هُوَ اللَّهُ أَحَدٌ", ref: "Al-Ikhlas · 112:1", trans_fr: "Dis : Il est Allah, Unique" },
  { text: "وَلَقَدْ كَرَّمْنَا بَنِي آدَمَ", ref: "Al-Isra · 17:70", trans_fr: "Nous avons certes accordé de la dignité aux fils d'Adam" },
  { text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ", ref: "Al-Fatiha · 1:1", trans_fr: "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux" },
];

/* Retourne l'index du verset selon le jour de l'année (change à minuit) */
function getDailyVerseIndex(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date - start) / 86400000);
  return dayOfYear % DAILY_VERSES.length;
}

/* ─── Suggestions contextuelles selon heure / jour de la semaine ─── */
function getSuggestedSurahs(date = new Date()) {
  const h = date.getHours();
  const day = date.getDay(); // 0=Dim, 5=Ven

  if (day === 5) return {
    period: { fr: "Sunna du vendredi", en: "Friday Sunnah", ar: "سنة الجمعة" },
    icon: "fa-star-and-crescent",
    surahs: [
      { n: 18, fr: "• Sunna du vendredi", en: "• Friday Sunnah", ar: "سنة الجمعة" },
      { n: 1,  fr: "L'Ouverture",         en: "The Opening",     ar: "الفاتحة"   },
      { n: 36, fr: "Cœur du Coran",        en: "Heart of Quran",  ar: "قلب القرآن" },
      { n: 55, fr: "Ar-Rahman",            en: "The Merciful",    ar: "الرحمن"    },
      { n: 67, fr: "Al-Mulk",              en: "Sovereignty",     ar: "الملك"     },
    ],
  };

  if (h >= 4 && h < 12) return {
    period: { fr: "Lecture du matin", en: "Morning Reading", ar: "ورد الصباح" },
    icon: "fa-sun",
    surahs: [
      { n: 1,   fr: "L'Ouverture",          en: "The Opening",       ar: "الفاتحة"    },
      { n: 112, fr: "Sincérité pure",        en: "Pure Sincerity",    ar: "الإخلاص"    },
      { n: 113, fr: "Protection de l'aube", en: "Dawn Guard",        ar: "الفلق"      },
      { n: 114, fr: "Protection du mal",    en: "Against Evil",      ar: "الناس"      },
      { n: 36,  fr: "Cœur du Coran",        en: "Heart of Quran",    ar: "قلب القرآن" },
    ],
  };

  if (h >= 12 && h < 17) return {
    period: { fr: "Lecture du midi", en: "Midday Reading", ar: "قراءة الظهر" },
    icon: "fa-cloud-sun",
    surahs: [
      { n: 55, fr: "Ar-Rahman — La Grâce", en: "Ar-Rahman — Grace", ar: "الرحمن"   },
      { n: 25, fr: "Le Critère",            en: "The Criterion",     ar: "الفرقان"  },
      { n: 18, fr: "Al-Kahf",               en: "The Cave",          ar: "الكهف"    },
      { n: 56, fr: "L'Événement",           en: "The Event",         ar: "الواقعة"  },
      { n: 2,  fr: "Al-Baqara",             en: "The Cow",           ar: "البقرة"   },
    ],
  };

  if (h >= 17 && h < 21) return {
    period: { fr: "Lecture du soir", en: "Evening Reading", ar: "ورد المساء" },
    icon: "fa-cloud-moon",
    surahs: [
      { n: 36,  fr: "Cœur du Coran", en: "Heart of Quran",      ar: "قلب القرآن" },
      { n: 67,  fr: "Rappel du soir", en: "Evening Reminder",    ar: "الملك"      },
      { n: 55,  fr: "Ar-Rahman",      en: "The Merciful",        ar: "الرحمن"     },
      { n: 59,  fr: "Al-Hashr",       en: "The Gathering",       ar: "الحشر"      },
      { n: 103, fr: "Le Temps",       en: "Time",                ar: "العصر"      },
    ],
  };

  return {
    period: { fr: "Lecture de nuit", en: "Night Reading", ar: "ورد الليل" },
    icon: "fa-moon",
    surahs: [
      { n: 67,  fr: "Al-Mulk — Avant le sommeil", en: "Al-Mulk — Before Sleep", ar: "الملك"   },
      { n: 32,  fr: "As-Sajda",                    en: "The Prostration",        ar: "السجدة"  },
      { n: 36,  fr: "Ya-Sin du soir",               en: "Ya-Sin at Night",        ar: "يس"      },
      { n: 112, fr: "Al-Ikhlas",                    en: "Sincerity",             ar: "الإخلاص" },
      { n: 113, fr: "Al-Falaq",                     en: "The Dawn",              ar: "الفلق"   },
    ],
  };
}

/*  Type info  */
const TYPE_INFO = {
  Meccan:  { fr: "Mecquoise", en: "Meccan",  ar: "مكية"  },
  Medinan: { fr: "Médinoise", en: "Medinan", ar: "مدنية" },
};

/*  Carte sourate (grille)  */
function SurahCard({ surah, onClick, onPlay, isActive, lang, isPlaying, viewMode }) {
  const typeInfo = TYPE_INFO[surah.type] || {};
  const typeLabel = typeInfo[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"] || surah.type;
  const ayahLabel = lang === "ar" ? "آية" : lang === "fr" ? "v." : "v.";
  const displayName = lang === "fr" ? (surah.fr || surah.en) : lang === "ar" ? surah.ar : surah.en;

  if (viewMode === "list") {
    return (
      <button
        className={cn("hpl-row", isActive && "hpl-row--active")}
        data-stype={surah.type?.toLowerCase()}
        onClick={() => onClick(surah.n)}
      >
        <span className={cn("hpl-row__num", isActive && "hpl-row__num--on")}>{surah.n}</span>
        <div className="hpl-row__body">
          <span className="hpl-row__name">{displayName}</span>
          <span className="hpl-row__meta">
            <span className={`hpl-dot hpl-dot--${surah.type?.toLowerCase()}`} />
            {typeLabel}  {surah.ayahs} {ayahLabel}
          </span>
        </div>
        <span className="hpl-row__ar">{surah.ar}</span>
        <button
          className={cn("hpl-row__play", isPlaying && "hpl-row__play--on")}
          onClick={e => { e.stopPropagation(); onPlay(surah.n); }}
          aria-label="Écouter"
        >
          <i className={`fas fa-${isPlaying ? "pause" : "play"}`} />
        </button>
      </button>
    );
  }

  return (
    <button
      className={cn("hpq-card", isActive && "hpq-card--active")}
      data-stype={surah.type?.toLowerCase()}
      onClick={() => onClick(surah.n)}
    >
      <span className={cn("hpq-card__num", isActive && "hpq-card__num--on")}>{surah.n}</span>
      <div className="hpq-card__info">
        <span className="hpq-card__name">
          {surah.en}
          <i className={cn("hpq-card__type-ico", `fas fa-${surah.type === "Meccan" ? "sun" : "mosque"}`)} />
        </span>
        {lang !== "en" && <span className="hpq-card__trans">{lang === "ar" ? surah.fr : (surah.fr || surah.en)}</span>}
        <span className="hpq-card__meta">{surah.ayahs} {lang === "ar" ? "آية" : lang === "fr" ? "Versets" : "Ayat"}</span>
      </div>
      <span className="hpq-card__ar">{surah.ar}</span>
      <button
        className={cn("hpq-card__play", isPlaying && "hpq-card__play--on")}
        onClick={e => { e.stopPropagation(); onPlay(surah.n); }}
        aria-label="Écouter"
      >
        <i className={`fas fa-${isPlaying ? "pause" : "play"}`} />
      </button>
    </button>
  );
}

/* ─── Carte juz ─── */
function JuzCard({ juzData, onClick, isActive, lang, viewMode }) {
  const { juz, name } = juzData;
  if (viewMode === "list") {
    return (
      <button
        className={cn("hpl-row", isActive && "hpl-row--active")}
        onClick={() => onClick(juz)}
      >
        <span className={cn("hpl-row__num", isActive && "hpl-row__num--on")}>{juz}</span>
        <div className="hpl-row__body">
          <span className="hpl-row__name">Juz {juz}</span>
          <span className="hpl-row__meta">{name}</span>
        </div>
      </button>
    );
  }
  return (
    <button
      className={cn("hpq-card hpq-card--juz", isActive && "hpq-card--active")}
      onClick={() => onClick(juz)}
    >
      <span className={cn("hpq-card__num", isActive && "hpq-card__num--on")}>{juz}</span>
      <div className="hpq-card__info">
        <span className="hpq-card__name">Juz {juz}</span>
        <span className="hpq-card__meta">{name}</span>
      </div>
    </button>
  );
}

/* ─── État vide ─── */
function EmptyState({ icon, text }) {
  return (
    <div className="hp2-empty">
      <i className={`fas ${icon}`} />
      <p>{text}</p>
    </div>
  );
}

/* ══════════════════════════════════════
   HomePage principale
   ══════════════════════════════════════ */
export default function HomePage() {
  const { state, dispatch, set } = useApp();
  const { lang, currentSurah, currentAyah, currentJuz, displayMode, riwaya } = state;

  const [activeTab, setActiveTab]   = useState("surah");
  const [activeInfo, setActiveInfo] = useState("bookmarks");
  const [bookmarks, setBookmarks]   = useState([]);
  const [notes, setNotes]           = useState([]);
  const [filter, setFilter]         = useState("");
  const [sortDir, setSortDir]       = useState("asc");
  const [viewMode, setViewMode]     = useState("grid"); // "grid" | "list"
  const [now, setNow]               = useState(() => new Date());
  const [recentVisits, setRecentVisits] = useState(() => getRecentVisits());

  // Historique réel = l'utilisateur a déjà navigué au-delà de Al-Fatiha v.1
  const hasReadingHistory = currentSurah > 1 || (currentSurah === 1 && currentAyah > 1);

  useEffect(() => { setActiveTab(displayMode === "juz" ? "juz" : "surah"); }, [displayMode]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    getAllBookmarks().then(bks => setBookmarks((bks || []).sort((a, b) => b.createdAt - a.createdAt)));
    getAllNotes().then(ns => setNotes((ns || []).sort((a, b) => b.updatedAt - a.updatedAt)));
  }, []);

  const playFromHome = useCallback((surahNum) => {
    const safeId = ensureReciterForRiwaya(state.reciter, state.riwaya);
    const rec = getReciter(safeId, state.riwaya);
    if (!rec) return;
    if (state.riwaya === "warsh" && state.warshStrictMode && !String(rec.cdn || "").toLowerCase().includes("warsh")) return;
    const surahData = SURAHS[surahNum - 1];
    if (!surahData) return;
    let globalStart = 0;
    for (let i = 0; i < surahNum - 1; i++) globalStart += SURAHS[i].ayahs;
    const items = Array.from({ length: surahData.ayahs }, (_, i) => ({
      surah: surahNum, ayah: i + 1, number: globalStart + i + 1,
    }));
    set({ currentSurah: surahNum });
    audioService.loadPlaylist(items, rec.cdn, rec.cdnType || "islamic");
    audioService.play();
  }, [state.reciter, state.riwaya, state.warshStrictMode, set]);

  const goSurah = useCallback(n => {
    set({ displayMode: "surah", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah: n, ayah: 1 } });
  }, [set, dispatch]);

  const goSurahAyah = useCallback((surah, ayah) => {
    set({ displayMode: "surah", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah: ayah || 1 } });
  }, [set, dispatch]);

  const goJuz = useCallback(juz => {
    set({ showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
  }, [set, dispatch]);

  const continueReading = useCallback(() => {
    set({ showHome: false, showDuas: false });
    if (displayMode === "juz") dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz } });
    else dispatch({ type: "NAVIGATE_SURAH", payload: { surah: currentSurah, ayah: currentAyah } });
  }, [set, dispatch, displayMode, currentJuz, currentSurah, currentAyah]);

  const openDuas = useCallback(() => set({ showHome: false, showDuas: true }), [set]);

  const filteredSurahs = useMemo(() => {
    const source = !filter.trim()
      ? [...SURAHS]
      : SURAHS.filter(s =>
          s.ar.includes(filter) ||
          s.en.toLowerCase().includes(filter.toLowerCase()) ||
          s.fr.toLowerCase().includes(filter.toLowerCase()) ||
          String(s.n) === filter.trim()
        );
    source.sort((a, b) => sortDir === "asc" ? a.n - b.n : b.n - a.n);
    return source;
  }, [filter, sortDir]);

  const dailyVerse   = useMemo(() => DAILY_VERSES[getDailyVerseIndex(now)], [now]);
  const suggestionSet = useMemo(() => getSuggestedSurahs(now), [now]);
  const surahLabel   = SURAHS[currentSurah - 1];

  const riwayaLabel = riwaya === "warsh"
    ? (lang === "fr" ? "Riwāya Warsh" : lang === "ar" ? "رواية ورش" : "Warsh")
    : (lang === "fr" ? "Riwāya Ḥafs"  : lang === "ar" ? "رواية حفص"  : "Hafs");

  const readingModeLabel = displayMode === "juz"
    ? (lang === "fr" ? "Mode Juz" : lang === "ar" ? "وضع الجزء" : "Juz mode")
    : displayMode === "page"
      ? (lang === "fr" ? "Mode Page" : lang === "ar" ? "وضع الصفحة" : "Page mode")
      : (lang === "fr" ? "Mode Sourate" : lang === "ar" ? "وضع السورة" : "Surah mode");

  const readingTarget = displayMode === "juz"
    ? (lang === "ar" ? `الجزء ${toAr(currentJuz)}` : `Juz ${currentJuz}`)
    : displayMode === "page"
      ? (lang === "ar" ? `صفحة ${toAr(state.currentPage || 1)}` : `${lang === "fr" ? "Page" : "Page"} ${state.currentPage || 1}`)
      : (lang === "ar"
          ? `${surahLabel?.ar || "الفاتحة"} · ${toAr(currentAyah)}`
          : `${lang === "fr" ? surahLabel?.fr : surahLabel?.en} · v.${currentAyah}`);

  const quickResumeLabel = hasReadingHistory
    ? (lang === "fr" ? "Reprendre la session" : lang === "ar" ? "متابعة الجلسة" : "Resume session")
    : (lang === "fr" ? "Démarrer une lecture" : lang === "ar" ? "ابدأ القراءة" : "Start reading");

  const currentYear = now.getFullYear();

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h >= 4 && h < 12) return { fr: "Bonjour", en: "Good morning", ar: "صباح الخير" };
    if (h >= 12 && h < 17) return { fr: "Bon après-midi", en: "Good afternoon", ar: "مساء النهار" };
    if (h >= 17 && h < 22) return { fr: "Bonsoir", en: "Good evening", ar: "مساء الخير" };
    return { fr: "Bonne nuit", en: "Good night", ar: "طاب ليلكم" };
  }, [now]);

  const currentPrayer = useMemo(() => {
    const h = now.getHours();
    if (h >= 4  && h < 7)  return { icon: "fa-star",      fr: "Fajr",    ar: "الفجر",  en: "Fajr"    };
    if (h >= 7  && h < 12) return { icon: "fa-sun",        fr: "Duhā",    ar: "الضحى",  en: "Duhā"    };
    if (h >= 12 && h < 15) return { icon: "fa-sun",        fr: "Dhuhr",   ar: "الظهر",  en: "Dhuhr"   };
    if (h >= 15 && h < 18) return { icon: "fa-cloud-sun",  fr: "Asr",     ar: "العصر",  en: "Asr"     };
    if (h >= 18 && h < 20) return { icon: "fa-cloud-moon", fr: "Maghrib", ar: "المغرب", en: "Maghrib" };
    return                        { icon: "fa-moon",        fr: "Ishā",    ar: "العشاء",  en: "Ishā"    };
  }, [now]);

  const vodSurahNum = useMemo(() => {
    const match = dailyVerse.ref.match(/(\d+):\d+/);
    return match ? parseInt(match[1]) : null;
  }, [dailyVerse]);

  const T = {
    continueReading: { fr: "Continuer", en: "Continue", ar: "متابعة القراءة" },
    startFatiha:     { fr: "Al-Fatiha", en: "Al-Fatihah", ar: "البداية" },
    duas:            { fr: "Douas", en: "Duas", ar: "الأدعية" },
    surahs:          { fr: "Sourates", en: "Surahs", ar: "السور" },
    juz:             { fr: "Juz", en: "Juz", ar: "الأجزاء" },
    search:          { fr: "Rechercher une sourate…", en: "Search a surah…", ar: "ابحث عن سورة…" },
    verseOfDay:      { fr: "Verset du jour", en: "Verse of the Day", ar: "آية اليوم" },
    quickAccess:     { fr: "Accès rapide", en: "Quick Access", ar: "وصول سريع" },
    noBookmarks:     { fr: "Aucun favori — appuyez ★", en: "No bookmarks yet", ar: "لا توجد إشارات" },
    noNotes:         { fr: "Aucune note encore", en: "No notes yet", ar: "لا توجد ملاحظات" },
    noResults:       { fr: "Aucune sourate trouvée", en: "No surah found", ar: "لم يتم العثور" },
    bookmarks:       { fr: "Favoris", en: "Saved", ar: "المفضلة" },
    notes:           { fr: "Notes", en: "Notes", ar: "ملاحظات" },
    suggest:         { fr: "Suggestions", en: "Suggest", ar: "اقتراحات" },
  };
  const t = k => T[k]?.[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"] ?? k;

  const infoTabs = [
    { id: "bookmarks", icon: "fa-bookmark",  label: t("bookmarks"), count: bookmarks.length },
    { id: "notes",     icon: "fa-pen-line",  label: t("notes"),     count: notes.length     },
    { id: "suggest",   icon: "fa-lightbulb", label: t("suggest"),   count: suggestionSet.surahs.length },
  ];

  return (
    <div className="hp2">

      {/* ════ HERO ════ */}
      <section className="hp2-hero">
        <div className="hp2-hero__inner">

          {/* Bismallah décorative — pleine largeur, centrée avant le split */}
          <div className="hp2-hero__bismallah" aria-hidden="true">﷽</div>

          {/* Gauche */}
          <div className="hp2-hero__left">
            {/* Salutation */}
            <div className="hp2-hero__greeting">
              <i className="fas fa-hand-peace" />
              <span>{greeting[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}</span>
            </div>

            <div className="hp2-hero__brand">
              <PlatformLogo
                className="hp2-hero__logo"
                imgClassName="hp2-hero__logo-img"
                decorative
              />
              <div>
                <h1 className="hp2-hero__title">MushafPlus</h1>
                <span className="hp2-hero__badge">
                  <i className="fas fa-feather-pointed" />
                  {riwayaLabel}
                </span>
              </div>
            </div>

            <p className="hp2-hero__tagline">
              {lang === "ar"
                ? "اقرأ القرآن الكريم وتدبَّر معانيه في مساحة أكثر سكينة"
                : lang === "fr"
                  ? "Lisez, méditez et mémorisez le Saint Coran"
                  : "Read, reflect and memorize the Holy Quran"}
            </p>

            <div className="hp2-hero__meta-rail">
              <span className="hp2-now-pill hp2-now-pill--prayer">
                <i className={`fas ${currentPrayer.icon}`} />
                {currentPrayer[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}
              </span>
              <span className="hp2-now-pill hp2-now-pill--accent">
                <i className="fas fa-location-dot" />
                {readingTarget}
              </span>
              <span className="hp2-now-pill">
                {now.toLocaleDateString(
                  lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
                  { weekday: "short", day: "numeric", month: "short" }
                )}
              </span>
            </div>

            <div className="hp2-hero__ctas">
              {hasReadingHistory ? (
                <button className="hp2-btn hp2-btn--primary" onClick={continueReading}>
                  <i className="fas fa-circle-play" />
                  <span>{t("continueReading")}</span>
                  {surahLabel && (
                    <span className="hp2-btn__chip">{surahLabel.ar}</span>
                  )}
                </button>
              ) : (
                <button className="hp2-btn hp2-btn--primary" onClick={() => goSurah(1)}>
                  <i className="fas fa-book-open" />
                  <span>{lang === "ar" ? "ابدأ القراءة" : lang === "fr" ? "Commencer" : "Start reading"}</span>
                  <span className="hp2-btn__chip">الْفَاتِحَة</span>
                </button>
              )}
              {hasReadingHistory && (
                <button className="hp2-btn hp2-btn--outline" onClick={() => goSurah(1)}>
                  <i className="fas fa-book-open-reader" />
                  <span>{t("startFatiha")}</span>
                </button>
              )}
              <button className="hp2-btn hp2-btn--soft" onClick={openDuas}>
                <i className="fas fa-hands-praying" />
                <span>{t("duas")}</span>
              </button>
            </div>

            {/* Recent history — reprendre */}
            {recentVisits.length > 0 && (
              <div className="hp2-recent-history">
                <div className="hp2-recent-title">
                  <i className="fas fa-history" />
                  {lang === 'ar' ? 'استكمال' : lang === 'fr' ? 'Reprendre' : 'Continue'}
                </div>
                <div className="hp2-recent-items">
                  {recentVisits.map(v => (
                    <button key={v.surah} className="hp2-recent-item" onClick={() => goSurahAyah(v.surah, v.ayah)}>
                      <span className="hp2-recent-num">{v.surah}</span>
                      <span className="hp2-recent-name">{v.surahName}</span>
                      {v.ayah > 1 && <span className="hp2-recent-ayah">v.{v.ayah}</span>}
                      <i className="fas fa-play-circle hp2-recent-play" />
                    </button>
                  ))}
                </div>
              </div>
            )}


          </div>

          {/* Droite */}
          <div className="hp2-hero__right">
            <div className="hp2-focus-card">
              <div className="hp2-focus-card__head">
                <span className="hp2-focus-card__eyebrow">
                  <i className="fas fa-sparkles" />
                  {lang === "fr" ? "Session active" : lang === "ar" ? "الجلسة الحالية" : "Active session"}
                </span>
                <span className="hp2-focus-card__riwaya">{riwayaLabel}</span>
              </div>

              <div className="hp2-focus-card__body">
                <h2 className="hp2-focus-card__title">{readingTarget}</h2>
                {surahLabel && displayMode !== "juz" && (
                  <div className="hp2-focus-card__surah-ar">{surahLabel.ar}</div>
                )}
                <p className="hp2-focus-card__copy">{quickResumeLabel}</p>
              </div>

              <div className="hp2-focus-card__stats">
                <span className="hp2-focus-card__stat">
                  <strong>{bookmarks.length}</strong>
                  <span>{t("bookmarks")}</span>
                </span>
                <span className="hp2-focus-card__stat">
                  <strong>{notes.length}</strong>
                  <span>{t("notes")}</span>
                </span>
                <span className="hp2-focus-card__stat">
                  <strong>{displayMode === "juz" ? currentJuz : currentSurah}</strong>
                  <span>{displayMode === "juz" ? "Juz" : lang === "fr" ? "Sourate" : lang === "ar" ? "سورة" : "Surah"}</span>
                </span>
              </div>

              {/* Progress bar */}
              <div className="hp2-focus-card__progress">
                <div className="hp2-focus-card__progress-label">
                  <span>{lang === "fr" ? "Progression" : lang === "ar" ? "التقدم" : "Progress"}</span>
                  <span>{Math.round(((currentSurah || 1) / 114) * 100)}%</span>
                </div>
                <div className="hp2-focus-card__progress-bar">
                  <div className="hp2-focus-card__progress-fill" style={{ width: `${Math.round(((currentSurah || 1) / 114) * 100)}%` }} />
                </div>
              </div>


            </div>

            {/* Prières indicatives */}
            <div className="hp2-prayers">
              <div className="hp2-prayers__head">
                <i className="fas fa-moon" />
                <span>{lang === "fr" ? "Période de prière" : lang === "ar" ? "وقت الصلاة" : "Prayer period"}</span>
              </div>
              <div className="hp2-prayers__list">
                {[
                  { key: "fajr",    icon: "fa-star",      fr: "Fajr",    ar: "الفجر",  en: "Fajr",    r: [4,  7]  },
                  { key: "dhuhr",   icon: "fa-sun",        fr: "Dhuhr",   ar: "الظهر",  en: "Dhuhr",   r: [12, 15] },
                  { key: "asr",     icon: "fa-cloud-sun",  fr: "Asr",     ar: "العصر",  en: "Asr",     r: [15, 18] },
                  { key: "maghrib", icon: "fa-cloud-moon", fr: "Maghrib", ar: "المغرب", en: "Maghrib", r: [18, 20] },
                  { key: "isha",    icon: "fa-moon",       fr: "Ish\u0101",    ar: "العشاء",  en: "Ish\u0101",    r: [20, 4]  },
                ].map(p => {
                  const h = now.getHours();
                  const on = p.r[0] < p.r[1] ? h >= p.r[0] && h < p.r[1] : h >= p.r[0] || h < p.r[1];
                  return (
                    <div key={p.key} className={cn("hp2-prayer-row", on && "hp2-prayer-row--on")}>
                      <i className={`fas ${p.icon}`} />
                      <span className="hp2-prayer-row__name">{p[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}</span>
                      {on && <span className="hp2-prayer-row__badge">{lang === "fr" ? "Maintenant" : lang === "ar" ? "الآن" : "Now"}</span>}
                    </div>
                  );
                })}
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* Verset du jour — bannière pleine largeur */}
      <div className="hp2-vod-banner">
        <div className="hp2-vod-banner__inner">
          <div className="hp2-vod-banner__head">
            <div className="hp2-vod-banner__icon"><i className="fas fa-star-and-crescent" /></div>
            <span className="hp2-vod-banner__label">{t("verseOfDay")}</span>
          </div>
          <div className="hp2-vod-banner__body">
            <p className="hp2-vod-banner__text">{dailyVerse.text}</p>
            {lang === "fr" && dailyVerse.trans_fr && (
              <p className="hp2-vod-banner__trans">{dailyVerse.trans_fr}</p>
            )}
            <span className="hp2-vod-banner__ref">{dailyVerse.ref}</span>
          </div>
          <div className="hp2-vod-banner__cta">
            <span className="hp2-vod-banner__date">
              {now.toLocaleDateString(
                lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
                { weekday: "long", day: "numeric", month: "long" }
              )}
            </span>
            {vodSurahNum && (
              <button className="hp2-vod-banner__go" onClick={() => goSurah(vodSurahNum)}>
                <i className="fas fa-book-open" />
                {lang === "fr" ? "Lire la sourate" : lang === "ar" ? "اقرأ السورة" : "Read surah"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ════ BANDE STATS ════ */}
      <div className="hp2-stats-strip">
        <div className="hp2-stats-strip__item">
          <span className="hp2-stats-strip__num">114</span>
          <span className="hp2-stats-strip__label">{lang === "ar" ? "سور" : lang === "fr" ? "Sourates" : "Surahs"}</span>
        </div>
        <span className="hp2-stats-strip__sep" />
        <div className="hp2-stats-strip__item">
          <span className="hp2-stats-strip__num">30</span>
          <span className="hp2-stats-strip__label">{lang === "ar" ? "جزء" : lang === "fr" ? "Juz'" : "Juz"}</span>
        </div>
        <span className="hp2-stats-strip__sep" />
        <div className="hp2-stats-strip__item">
          <span className="hp2-stats-strip__num">6 236</span>
          <span className="hp2-stats-strip__label">{lang === "ar" ? "آية" : lang === "fr" ? "Versets" : "Ayahs"}</span>
        </div>
        <span className="hp2-stats-strip__sep" />
        <div className="hp2-stats-strip__item">
          <span className="hp2-stats-strip__num">77 430</span>
          <span className="hp2-stats-strip__label">{lang === "ar" ? "كلمة" : lang === "fr" ? "Mots" : "Words"}</span>
        </div>
      </div>

      {/*  GRILLE PRINCIPALE  */}
      <div className="hp2-layout">

        {/* Panneau latéral */}
        <aside className="hp2-aside">
          <div className="hp2-panel">
            <div className="hp2-panel__tabs">
              {infoTabs.map(tab => (
                <button
                  key={tab.id}
                  className={cn("hp2-panel__tab", activeInfo === tab.id && "hp2-panel__tab--on")}
                  onClick={() => setActiveInfo(tab.id)}
                >
                  <i className={`fas ${tab.icon}`} />
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="hp2-panel__count">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="hp2-panel__body">
              {activeInfo === "bookmarks" && (
                bookmarks.length === 0
                  ? <EmptyState icon="fa-bookmark" text={t("noBookmarks")} />
                  : bookmarks.slice(0, 10).map(bk => {
                      const s = SURAHS[bk.surah - 1];
                      return (
                        <button key={bk.id} className="hp2-item" onClick={() => goSurah(bk.surah)}>
                          <span className="hp2-item__icon"><i className="fas fa-bookmark" /></span>
                          <div className="hp2-item__body">
                            <span className="hp2-item__ar">{s?.ar}</span>
                            <span className="hp2-item__sub">
                              {lang === "fr" ? s?.fr : s?.en}  v.{bk.ayah}
                              {bk.label && <em>  {bk.label}</em>}
                            </span>
                          </div>
                          <i className="fas fa-chevron-left hp2-item__caret" />
                        </button>
                      );
                    })
              )}

              {activeInfo === "notes" && (
                notes.length === 0
                  ? <EmptyState icon="fa-pen-line" text={t("noNotes")} />
                  : notes.slice(0, 10).map(note => {
                      const s = SURAHS[note.surah - 1];
                      return (
                        <button key={note.id} className="hp2-item" onClick={() => goSurah(note.surah)}>
                          <span className="hp2-item__icon"><i className="fas fa-pen-line" /></span>
                          <div className="hp2-item__body">
                            <span className="hp2-item__ar">{s?.ar}</span>
                            <span className="hp2-item__sub">{lang === "fr" ? s?.fr : s?.en}  v.{note.ayah}</span>
                            {note.text && (
                              <span className="hp2-item__excerpt">
                                {note.text.slice(0, 70)}{note.text.length > 70 ? "" : ""}
                              </span>
                            )}
                          </div>
                          <i className="fas fa-chevron-left hp2-item__caret" />
                        </button>
                      );
                    })
              )}

              {activeInfo === "suggest" && (
                <>
                  <div className="hp2-suggest-period">
                    <i className={`fas ${suggestionSet.icon}`} />
                    <span>
                      {lang === "ar"
                        ? suggestionSet.period.ar
                        : lang === "fr"
                          ? suggestionSet.period.fr
                          : suggestionSet.period.en}
                    </span>
                  </div>
                  {suggestionSet.surahs.map(({ n, fr, en, ar: arLabel }) => {
                    const s = SURAHS[n - 1];
                    return (
                      <button key={n} className="hp2-item" onClick={() => goSurah(n)}>
                        <span className="hp2-item__num">{n}</span>
                        <div className="hp2-item__body">
                          <span className="hp2-item__ar">{s.ar}</span>
                          <span className="hp2-item__sub">
                            {lang === "ar" ? arLabel : lang === "fr" ? fr : en}
                          </span>
                        </div>
                        <i className="fas fa-chevron-left hp2-item__caret" />
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Colonne sourates */}
        <section className="hp2-content">
          <div className="hp2-toolbar">
            {/* Onglets Sourates / Juz */}
            <div className="hp2-segs">
              <button
                className={cn("hp2-seg", activeTab === "surah" && "hp2-seg--on")}
                onClick={() => setActiveTab("surah")}
              >
                <i className="fas fa-align-justify" />
                {t("surahs")}
              </button>
              <button
                className={cn("hp2-seg", activeTab === "juz" && "hp2-seg--on")}
                onClick={() => setActiveTab("juz")}
              >
                <i className="fas fa-book-open" />
                {t("juz")}
              </button>
            </div>

            {/* Recherche */}
            {activeTab === "surah" && (
              <div className="hp2-search">
                <i className="fas fa-magnifying-glass hp2-search__ico" />
                <input
                  className="hp2-search__input"
                  placeholder={t("search")}
                  value={filter}
                  onChange={e => setFilter(e.target.value)}
                />
                {filter && (
                  <button className="hp2-search__clear" onClick={() => setFilter("")}>
                    <i className="fas fa-xmark" />
                  </button>
                )}
              </div>
            )}

            {/* Tri + vue */}
            <div className="hp2-toolbar__end">
              <span className="hp2-toolbar__count">
                {activeTab === "surah" ? filteredSurahs.length : JUZ_DATA.length}
                <span>
                  {activeTab === "surah"
                    ? t("surahs")
                    : t("juz")}
                </span>
              </span>
              {activeTab === "surah" && (
                <button
                  className="hp2-icon-btn"
                  onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
                  title={sortDir === "asc" ? "Décroissant" : "Croissant"}
                >
                  <i className={`fas fa-sort-${sortDir === "asc" ? "down" : "up"}`} />
                </button>
              )}
              <button
                className={cn("hp2-icon-btn", viewMode === "grid" && "hp2-icon-btn--on")}
                onClick={() => setViewMode("grid")}
                title="Grille"
              >
                <i className="fas fa-grip" />
              </button>
              <button
                className={cn("hp2-icon-btn", viewMode === "list" && "hp2-icon-btn--on")}
                onClick={() => setViewMode("list")}
                title="Liste"
              >
                <i className="fas fa-list" />
              </button>
            </div>
          </div>

          <div className={cn("hp2-items", viewMode === "grid" ? "hp2-items--grid" : "hp2-items--list")}>
            {activeTab === "surah"
              ? filteredSurahs.length === 0
                  ? <EmptyState icon="fa-magnifying-glass" text={t("noResults")} />
                  : filteredSurahs.map(s => (
                      <SurahCard
                        key={s.n}
                        surah={s}
                        lang={lang}
                        viewMode={viewMode}
                        onClick={goSurah}
                        onPlay={playFromHome}
                        isActive={s.n === currentSurah && displayMode === "surah"}
                        isPlaying={state.isPlaying && state.currentPlayingAyah?.surah === s.n}
                      />
                    ))
              : JUZ_DATA.map(j => (
                  <JuzCard
                    key={j.juz}
                    juzData={j}
                    lang={lang}
                    viewMode={viewMode}
                    onClick={goJuz}
                    isActive={j.juz === currentJuz && displayMode === "juz"}
                  />
                ))
            }
          </div>
        </section>
      </div>

      {/* ════ FOOTER ════ */}
      <footer className="hp2-footer">
        <div className="hp2-footer__inner">

          {/* Colonne marque */}
          <div className="hp2-footer__brand">
            <div className="hp2-footer__logo-row">
              <div className="hp2-footer__logo">
                <PlatformLogo className="hp2-footer__logo" imgClassName="hp2-footer__logo-img" decorative />
              </div>
              <span className="hp2-footer__site-name">MushafPlus</span>
            </div>
            <p className="hp2-footer__desc">
              {lang === "ar"
                ? "تطبيق لقراءة القرآن الكريم بروايتَي حفص وورش مع التجويد والكلمة بالكلمة والأدعية"
                : lang === "fr"
                  ? "Application de lecture du Saint Coran avec tajwîd, mot à mot, douas et signets — riwâyas Hafs & Warsh."
                  : "Holy Quran reader with tajweed, word-by-word, duas, bookmarks — Hafs & Warsh."}
            </p>
            <div className="hp2-footer__badges">
              <span className="hp2-footer__badge"><i className="fas fa-moon" />{lang === "fr" ? "Mode nuit" : lang === "ar" ? "وضع ليلي" : "Dark mode"}</span>
              <span className="hp2-footer__badge"><i className="fas fa-language" />AR · FR · EN</span>
              <span className="hp2-footer__badge"><i className="fas fa-wifi-slash" />{lang === "fr" ? "Hors-ligne" : lang === "ar" ? "دون اتصال" : "Offline"}</span>
              <span className="hp2-footer__badge"><i className="fas fa-headphones" />{lang === "fr" ? "Audio" : "Audio"}</span>
            </div>
          </div>

          {/* Colonne navigation */}
          <div className="hp2-footer__col">
            <p className="hp2-footer__col-title">{lang === "ar" ? "تصفح" : lang === "fr" ? "Navigation" : "Navigate"}</p>
            <ul className="hp2-footer__links">
              {[
                { n: 1,  ar: "الفاتحة",  fr: "Al-Fatiha",   en: "Al-Fatihah" },
                { n: 18, ar: "الكهف",    fr: "Al-Kahf",     en: "Al-Kahf"   },
                { n: 36, ar: "يس",        fr: "Yâ-Sîn",      en: "Ya-Sin"    },
                { n: 55, ar: "الرحمن",   fr: "Ar-Rahmân",   en: "Ar-Rahman" },
                { n: 67, ar: "الملك",    fr: "Al-Mulk",     en: "Al-Mulk"   },
                { n: 112,ar: "الإخلاص",  fr: "Al-Ikhlâs",   en: "Al-Ikhlas" },
              ].map(s => (
                <li key={s.n}>
                  <button className="hp2-footer__link" onClick={() => goSurah(s.n)}>
                    <span className="hp2-footer__link-num">{s.n}</span>
                    <span className="hp2-footer__link-label">
                      <span className="hp2-footer__link-name">{lang === "ar" ? s.ar : lang === "fr" ? s.fr : s.en}</span>
                      {lang !== "ar" && <span className="hp2-footer__link-ar">{s.ar}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Colonne accès rapide */}
          <div className="hp2-footer__col">
            <p className="hp2-footer__col-title">{lang === "ar" ? "وصول سريع" : lang === "fr" ? "Accès rapide" : "Popular"}</p>
            <ul className="hp2-footer__links hp2-footer__links--grid">
              {[
                { n: 2,  ar: "البقرة",   fr: "Al-Baqara",  en: "Al-Baqarah" },
                { n: 3,  ar: "آل عمران", fr: "Âl-Imrân",   en: "Ali Imran"  },
                { n: 19, ar: "مريم",     fr: "Maryam",     en: "Maryam"     },
                { n: 56, ar: "الواقعة", fr: "Al-Wâqi'a",  en: "Al-Waqi'ah" },
                { n: 78, ar: "النبأ",    fr: "An-Naba'",   en: "An-Naba"    },
                { n: 114,ar: "الناس",   fr: "An-Nâs",     en: "An-Nas"     },
              ].map(s => (
                <li key={s.n}>
                  <button className="hp2-footer__link" onClick={() => goSurah(s.n)}>
                    <span className="hp2-footer__link-num">{s.n}</span>
                    <span className="hp2-footer__link-label">
                      <span className="hp2-footer__link-name">{lang === "ar" ? s.ar : lang === "fr" ? s.fr : s.en}</span>
                      {lang !== "ar" && <span className="hp2-footer__link-ar">{s.ar}</span>}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Ornamental Ayah strip */}
        <div className="hp2-footer__ayah-strip">
          <p className="hp2-footer__ayah-ar">وَمَا خَلَقْتُ الْجِنَّ وَالْإِنسَ إِلَّا لِيَعْبُدُونِ</p>
          <span className="hp2-footer__ayah-ref">
            {lang === "ar" ? "سورة الذاريات · ٥١:٥٦" : lang === "fr" ? "Sūrat Ad-Dhāriyāt · 51:56" : "Sūrat Adh-Dhāriyāt · 51:56"}
          </span>
        </div>

        {/* Bas de footer */}
        <div className="hp2-footer__bottom">
          <span className="hp2-footer__copy">
            {lang === "fr" ? `© ${currentYear} MushafPlus — Lecture du Coran` : lang === "ar" ? `© ${currentYear} مصحف بلس` : `© ${currentYear} MushafPlus`}
          </span>
          <span className="hp2-footer__bismallah" aria-hidden="true">﷽</span>
        </div>
      </footer>

    </div>
  );
}
