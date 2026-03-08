/* ══════════════════════════════════════════════════════════════
   HomePage — Design moderne bicolonne
   Gauche : Favoris / Notes / Suggestions
   Droite : Liste Sourates / Juz avec recherche
   ══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useApp } from "../context/AppContext";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA } from "../data/juz";
import { getAllBookmarks, getAllNotes } from "../services/storageService";
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

/* ─── Type badge info ─── */
const TYPE_INFO = {
  Meccan: { fr: "Mecquoise", en: "Meccan", ar: "مكية", cls: "hp-badge--meccan" },
  Medinan: { fr: "Médinoise", en: "Medinan", ar: "مدنية", cls: "hp-badge--medinan" },
};

const DISPLAY_MODE_LABELS = {
  surah: { fr: "Sourate", en: "Surah", ar: "سورة" },
  juz: { fr: "Juz", en: "Juz", ar: "جزء" },
  page: { fr: "Page", en: "Page", ar: "صفحة" },
};

/* ─── Composant carte sourate (Style Quran.com) ─── */
function SurahCard({ surah, onClick, onPlay, isActive, lang, isPlaying }) {
  const typeInfo = TYPE_INFO[surah.type] || {};
  const typeLabel = typeInfo[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"] || surah.type;
  const ayahLabel = lang === "ar" ? "آية" : lang === "fr" ? "versets" : "ayahs";
  const displayName = lang === "fr" ? (surah.fr || surah.en) : surah.en;
  return (
    <button
      className={cn("quran-com-card", "quran-com-card--grid", isActive && "quran-com-card--active")}
      onClick={() => onClick(surah.n)}
    >
      <div className="qc-card-left">
        <div className="qc-num">{surah.n}</div>
        <div className="qc-names">
          <span className="qc-en">{displayName}</span>
          <span className="qc-details">
            <span className={`qc-type-dot qc-type-dot--${surah.type?.toLowerCase()}`} />
            {typeLabel} · {surah.ayahs} {ayahLabel}
          </span>
        </div>
      </div>
      <div className="qc-card-right">
        <span className="qc-ar">{surah.ar}</span>
        <button
          className={cn("qc-play-btn", isPlaying && "qc-play-btn--active")}
          onClick={(e) => { e.stopPropagation(); onPlay(surah.n); }}
          title={lang === "ar" ? "استمع" : lang === "fr" ? "Écouter" : "Listen"}
          aria-label={lang === "ar" ? "استمع" : lang === "fr" ? "Écouter" : "Listen"}
        >
          <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`} />
        </button>
      </div>
    </button>
  );
}

/* ─── Composant carte juz ─── */
function JuzCard({ juzData, onClick, isActive, lang }) {
  const { juz, name } = juzData;
  return (
    <button
      className={cn("quran-com-card", "quran-com-card--juz", isActive && "quran-com-card--active")}
      onClick={() => onClick(juz)}
    >
      <div className="qc-card-left">
        <div className="qc-num">{juz}</div>
        <div className="qc-names">
          <span className="qc-en">Juz {juz}</span>
          <span className="qc-details">{name}</span>
        </div>
      </div>
    </button>
  );
}

/* ─── État vide ─── */
function EmptyState({ icon, text }) {
  return (
    <div className="hp-empty">
      <i className={`fas ${icon}`}></i>
      <p>{text}</p>
    </div>
  );
}

/* ══════════════════════════════════════
   Composant principal HomePage
   ══════════════════════════════════════ */
export default function HomePage() {
  const { state, dispatch, set } = useApp();
  const { lang, currentSurah, currentAyah, currentJuz, displayMode, riwaya } = state;

  const [activeTab, setActiveTab] = useState("surah");
  const [activeInfo, setActiveInfo] = useState("bookmarks");
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    setActiveTab(displayMode === "juz" ? "juz" : "surah");
  }, [displayMode]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    getAllBookmarks().then(bks =>
      setBookmarks((bks || []).sort((a, b) => b.createdAt - a.createdAt))
    );
    getAllNotes().then(ns =>
      setNotes((ns || []).sort((a, b) => b.updatedAt - a.updatedAt))
    );
  }, []);

  /* ── Lecture directe depuis l'accueil ── */
  const playFromHome = useCallback((surahNum) => {
    const safeId = ensureReciterForRiwaya(state.reciter, state.riwaya);
    const rec = getReciter(safeId, state.riwaya);
    if (!rec) return;
    if (
      state.riwaya === "warsh" &&
      state.warshStrictMode &&
      !String(rec.cdn || "").toLowerCase().includes("warsh")
    ) return;
    const surahData = SURAHS[surahNum - 1];
    if (!surahData) return;
    let globalStart = 0;
    for (let i = 0; i < surahNum - 1; i++) globalStart += SURAHS[i].ayahs;
    const items = Array.from({ length: surahData.ayahs }, (_, i) => ({
      surah: surahNum,
      ayah: i + 1,
      number: globalStart + i + 1,
    }));
    // Update state so the player title reflects the right surah
    set({ currentSurah: surahNum });
    audioService.loadPlaylist(items, rec.cdn, rec.cdnType || "islamic");
    audioService.play();
  }, [state.reciter, state.riwaya, state.warshStrictMode, set]);

  const goSurah = n => {
    set({ displayMode: "surah", showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah: n, ayah: 1 } });
  };
  const goJuz = juz => {
    set({ showHome: false, showDuas: false });
    dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
  };
  const continueReading = () => {
    set({ showHome: false, showDuas: false });
    if (displayMode === "juz") {
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz } });
    } else {
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: currentSurah, ayah: currentAyah } });
    }
  };
  const openDuas = () => {
    set({ showHome: false, showDuas: true });
  };

  const filteredSurahs = useMemo(() => {
    const source = !filter.trim()
      ? [...SURAHS]
      : SURAHS.filter(s =>
          s.ar.includes(filter) ||
          s.en.toLowerCase().includes(filter.toLowerCase()) ||
          s.fr.toLowerCase().includes(filter.toLowerCase()) ||
          String(s.n) === filter.trim()
        );
    source.sort((a, b) => (sortDir === "asc" ? a.n - b.n : b.n - a.n));
    return source;
  }, [filter, sortDir]);

  const dailyVerse = useMemo(() => DAILY_VERSES[getDailyVerseIndex(now)], [now]);
  const suggestionSet = useMemo(() => getSuggestedSurahs(now), [now]);

  const surahLabel = SURAHS[currentSurah - 1];
  const currentModeLabel = DISPLAY_MODE_LABELS[displayMode]?.[lang === "fr" ? "fr" : lang === "ar" ? "ar" : "en"]
    || DISPLAY_MODE_LABELS.surah[lang === "fr" ? "fr" : lang === "ar" ? "ar" : "en"];
  const riwayaLabel = riwaya === "warsh"
    ? (lang === "fr" ? "Rasm Warsh · Riwāya Warsh" : "رواية ورش عن نافع")
    : (lang === "fr" ? "Rasm Ḥafs · Riwāya Ḥafs" : "رواية حفص عن عاصم");

  const infoTabs = [
    { id: "bookmarks", fr: "Favoris", en: "Saved", ar: "المفضلة", icon: "fa-bookmark", count: bookmarks.length },
    { id: "notes", fr: "Notes", en: "Notes", ar: "ملاحظات", icon: "fa-pen-line", count: notes.length },
    { id: "suggest", fr: "Suggestions", en: "Suggestions", ar: "اقتراحات", icon: "fa-lightbulb", count: suggestionSet.surahs.length },
  ];

  const listSummary = activeTab === "surah"
    ? {
        count: filteredSurahs.length,
        label: lang === "ar" ? "سورة متاحة" : lang === "fr" ? "sourates disponibles" : "surahs available",
        caption: lang === "ar"
          ? "قائمة أوضح وأخف بصريًا"
          : lang === "fr"
            ? "Parcours plus net, avec des cartes moins lourdes"
            : "Cleaner browsing with lighter cards",
      }
    : {
        count: JUZ_DATA.length,
        label: lang === "ar" ? "جزء" : lang === "fr" ? "juz" : "juz",
        caption: lang === "ar"
          ? "تنقل مباشر بين الأجزاء"
          : lang === "fr"
            ? "Navigation directe entre les sections"
            : "Direct section navigation",
      };

  return (
    <div className="hp-page">

      {/* ══════════════ HERO (Quran.com Style) ══════════════ */}
      <section className="qc-hero">
        <div className="qc-hero-inner">
          <div className="qc-hero-grid">
            <div className="qc-hero-copy">
              <PlatformLogo className="qc-logo-container" imgClassName="qc-logo-image" decorative />

              <h1 className="qc-site-name">MushafPlus</h1>

              <p className="qc-slogan">
                {lang === "ar"
                  ? "اقرأ وتدبَّر واحفظ في مساحة أكثر سكينة"
                  : lang === "fr"
                    ? "Lisez, méditez et mémorisez dans un espace plus apaisé"
                    : "Read, reflect and memorize in a calmer space"}
              </p>

              <div className="qc-hero-meta">
                <span className="qc-hero-pill qc-hero-pill--riwaya">
                  <i className="fas fa-feather-pointed" aria-hidden="true" />
                  <span>{riwayaLabel}</span>
                </span>
                {surahLabel && (
                  <span className="qc-hero-pill">
                    <i className="fas fa-location-dot" aria-hidden="true" />
                    <span>
                      {lang === "ar"
                        ? `${surahLabel.ar} · ${currentModeLabel}`
                        : `${lang === "fr" ? surahLabel.fr : surahLabel.en} · ${currentModeLabel}`}
                    </span>
                  </span>
                )}
              </div>

              <div className="qc-hero-actions">
                {currentSurah > 0 && (
                  <button className="qc-continue-btn" onClick={continueReading}>
                    <i className="fas fa-circle-play" />
                    <span className="qc-continue-label">
                      {lang === "ar" ? "متابعة القراءة" : lang === "fr" ? "Continuer la lecture" : "Continue Reading"}
                    </span>
                    <span className="qc-continue-chip">{SURAHS[currentSurah - 1]?.ar}</span>
                  </button>
                )}

                <button className="qc-secondary-btn" onClick={() => goSurah(1)}>
                  <i className="fas fa-book-open-reader" aria-hidden="true" />
                  <span>{lang === "ar" ? "ابدأ بالفاتحة" : lang === "fr" ? "Commencer par Al-Fatiha" : "Start with Al-Fatihah"}</span>
                </button>

                <button className="qc-secondary-btn qc-secondary-btn--soft" onClick={openDuas}>
                  <i className="fas fa-hands-praying" aria-hidden="true" />
                  <span>{lang === "ar" ? "الأدعية" : lang === "fr" ? "Ouvrir les douas" : "Open duas"}</span>
                </button>
              </div>
            </div>

            <div className="qc-vdj">
              <div className="qc-vdj-header">
                <span className="qc-vdj-badge">
                  <i className="fas fa-star-and-crescent" aria-hidden="true" />
                  {lang === "ar" ? "آية اليوم" : lang === "fr" ? "Verset du jour" : "Verse of the Day"}
                </span>
                <span className="qc-vdj-date">
                  {new Date().toLocaleDateString(
                    lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
                    { weekday: "short", day: "numeric", month: "short" }
                  )}
                </span>
              </div>
              <span className="qc-vdj-text">{dailyVerse.text}</span>
              {dailyVerse.trans_fr && lang === "fr" && (
                <span className="qc-vdj-trans">{dailyVerse.trans_fr}</span>
              )}
              <span className="qc-vdj-ref">{dailyVerse.ref}</span>
            </div>
          </div>

          <div className="qc-hero-suggestions">
            <div className="qc-hero-suggestions__head">
              <span className="qc-hero-suggestions__label">
                <i className={`fas ${suggestionSet.icon}`} aria-hidden="true" />
                {lang === "ar" ? suggestionSet.period.ar : lang === "fr" ? suggestionSet.period.fr : suggestionSet.period.en}
              </span>
              <span className="qc-hero-suggestions__hint">
                {lang === "ar"
                  ? "اقتراحات سريعة بحسب الوقت"
                  : lang === "fr"
                    ? "Suggestions rapides selon le moment"
                    : "Quick picks for the current moment"}
              </span>
            </div>

            <div className="qc-hero-suggestion-grid">
              {suggestionSet.surahs.slice(0, 4).map(({ n, fr, en, ar: arLabel }) => {
                const s = SURAHS[n - 1];
                return (
                  <button
                    key={n}
                    className="qc-hero-suggestion"
                    onClick={() => goSurah(n)}
                  >
                    <span className="qc-hero-suggestion__num">{n}</span>
                    <span className="qc-hero-suggestion__body">
                      <span className="qc-hero-suggestion__ar">{s?.ar}</span>
                      <span className="qc-hero-suggestion__label">
                        {lang === "ar" ? arLabel : lang === "fr" ? fr : en}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ STATS ══════════════ */}
      <div className="hp-stats-bar">
        {[
          {
            icon: "fa-book-open-reader", cls: "--primary",
            label: lang === "fr" ? "Lecture en cours" : lang === "ar" ? "القراءة" : "Reading",
            value: surahLabel?.[lang === "fr" ? "fr" : lang === "ar" ? "ar" : "en"] || "–",
          },
          {
            icon: "fa-bookmark", cls: "--gold",
            label: lang === "fr" ? "Favoris" : lang === "ar" ? "المفضلة" : "Saved",
            value: bookmarks.length,
          },
          {
            icon: "fa-pen-line", cls: "--gold",
            label: lang === "fr" ? "Notes" : lang === "ar" ? "ملاحظات" : "Notes",
            value: notes.length,
          },
          {
            icon: "fa-feather-pointed", cls: "--primary",
            label: lang === "fr" ? "Riwāya" : lang === "ar" ? "الرواية" : "Riwaya",
            value: riwaya === "warsh"
              ? (lang === "fr" ? "Warsh" : lang === "ar" ? "ورش" : "Warsh")
              : (lang === "fr" ? "Hafs" : lang === "ar" ? "حفص" : "Hafs"),
          },
        ].map((s, i) => (
          <div key={i} className="hp-stat-chip" style={{ animationDelay: `${i * 0.07}s` }}>
            <span className={`hp-stat-icon hp-stat-icon${s.cls}`}>
              <i className={`fas ${s.icon}`}></i>
            </span>
            <div className="hp-stat-body">
              <span className="hp-stat-label">{s.label}</span>
              <span className="hp-stat-value">{s.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ══════════════ ACCÈS RAPIDE ══════════════ */}
      <div className="hp-quick-section">
        <h2 className="hp-section-title">
          <i className="fas fa-bolt"></i>
          {lang === "ar" ? "وصول سريع" : lang === "fr" ? "Sourates fréquentes" : "Frequent Surahs"}
        </h2>
        <div className="hp-quick-grid">
          <button className="hp-quick-card hp-quick-card--duas" onClick={openDuas}>
            <span className="hp-quick-icon"><i className="fas fa-hands-praying"></i></span>
            <span className="hp-quick-ar">الدعاء</span>
            <span className="hp-quick-fr">
              {lang === "ar" ? "أدعية" : lang === "fr" ? "Page Douas" : "Duas Page"}
            </span>
          </button>
          {QUICK_ACCESS.map(item => {
            const s = SURAHS[item.n - 1];
            return (
              <button key={item.n} className="hp-quick-card" onClick={() => goSurah(item.n)}>
                <span className="hp-quick-icon"><i className={`fas ${item.icon}`}></i></span>
                <span className="hp-quick-ar">{s?.ar}</span>
                <span className="hp-quick-fr">
                  {lang === "ar" ? "" : lang === "fr" ? item.label_fr : item.label_en}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════ GRILLE PRINCIPALE — 2 colonnes ══════════════ */}
      <div className="hp-main-grid">

        {/* ── Colonne gauche : Favoris / Notes / Suggestions ── */}
        <aside className="hp-left-col">
          <div className="hp-panel">
            <div className="hp-panel-tabs">
              {infoTabs.map(tab => (
                <button
                  key={tab.id}
                  className={cn("hp-panel-tab", activeInfo === tab.id && "hp-panel-tab--on")}
                  onClick={() => setActiveInfo(tab.id)}
                >
                  <span className="hp-panel-tab__label">
                    <i className={`fas ${tab.icon}`}></i>
                    <span>{lang === "ar" ? tab.ar : lang === "fr" ? tab.fr : tab.en}</span>
                  </span>
                  <span className="hp-panel-tab__count">{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="hp-panel-body">
              {activeInfo === "bookmarks" && (
                bookmarks.length === 0
                  ? <EmptyState icon="fa-bookmark"
                    text={lang === "ar"
                      ? "لا توجد إشارات — اضغط ★ على آية"
                      : lang === "fr"
                        ? "Aucun favori — appuyez sur ★ sur un verset"
                        : "No bookmarks yet — tap ★ on any ayah"} />
                  : bookmarks.slice(0, 10).map(bk => {
                    const s = SURAHS[bk.surah - 1];
                    return (
                      <button key={bk.id} className="hp-info-row" onClick={() => goSurah(bk.surah)}>
                        <span className="hp-info-icon"><i className="fas fa-bookmark"></i></span>
                        <div className="hp-info-body">
                          <span className="hp-info-ar">{s?.ar}</span>
                          <span className="hp-info-sub">
                            {lang === "fr" ? s?.fr : s?.en}
                            &nbsp;·&nbsp;
                            {lang === "fr" ? "v." : lang === "ar" ? "آية" : "ayah "}{bk.ayah}
                            {bk.label && <em className="hp-info-label"> · {bk.label}</em>}
                          </span>
                        </div>
                        <i className="fas fa-chevron-left hp-info-caret"></i>
                      </button>
                    );
                  })
              )}

              {activeInfo === "notes" && (
                notes.length === 0
                  ? <EmptyState icon="fa-pen-line"
                    text={lang === "ar"
                      ? "لا توجد ملاحظات"
                      : lang === "fr"
                        ? "Aucune note — appuyez sur le crayon"
                        : "No notes yet — tap the pen on any ayah"} />
                  : notes.slice(0, 10).map(note => {
                    const s = SURAHS[note.surah - 1];
                    return (
                      <button key={note.id} className="hp-info-row" onClick={() => goSurah(note.surah)}>
                        <span className="hp-info-icon"><i className="fas fa-pen-line"></i></span>
                        <div className="hp-info-body">
                          <span className="hp-info-ar">{s?.ar}</span>
                          <span className="hp-info-sub">
                            {lang === "fr" ? s?.fr : s?.en}
                            &nbsp;·&nbsp;
                            {lang === "fr" ? "v." : "ayah "}{note.ayah}
                          </span>
                          {note.text && (
                            <span className="hp-info-excerpt">
                              {note.text.slice(0, 80)}{note.text.length > 80 ? "…" : ""}
                            </span>
                          )}
                        </div>
                        <i className="fas fa-chevron-left hp-info-caret"></i>
                      </button>
                    );
                  })
              )}

              {activeInfo === "suggest" && (
                <>
                  <div className="hp-suggest-period">
                    <i className={`fas ${suggestionSet.icon}`} aria-hidden="true" />
                    <span>{lang === "ar" ? suggestionSet.period.ar : lang === "fr" ? suggestionSet.period.fr : suggestionSet.period.en}</span>
                  </div>
                  {suggestionSet.surahs.map(({ n, fr, en, ar: arLabel }) => {
                    const s = SURAHS[n - 1];
                    return (
                      <button key={n} className="hp-info-row" onClick={() => goSurah(n)}>
                        <span className="hp-info-num">{toAr(n)}</span>
                        <div className="hp-info-body">
                          <span className="hp-info-ar">{s.ar}</span>
                          <span className="hp-info-sub">
                            {lang === "ar" ? arLabel : lang === "fr" ? fr : en}
                          </span>
                        </div>
                        <i className="fas fa-chevron-left hp-info-caret"></i>
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </aside>

        {/* ── Colonne droite : liste sourates / juz ── */}
        <section className="hp-right-col">
          <div className="hp-list-header">
            <div className="hp-seg-ctrl">
              <button
                className={cn("hp-seg-btn", activeTab === "surah" && "hp-seg-btn--on")}
                onClick={() => setActiveTab("surah")}
              >
                <i className="fas fa-align-justify"></i>
                {lang === "ar" ? "السور" : lang === "fr" ? "Sourates" : "Surahs"}
              </button>
              <button
                className={cn("hp-seg-btn", activeTab === "juz" && "hp-seg-btn--on")}
                onClick={() => setActiveTab("juz")}
              >
                <i className="fas fa-book-open"></i>
                {lang === "ar" ? "الأجزاء" : "Juz"}
              </button>
            </div>
            <div className="hp-list-tools">
              {activeTab === "surah" && (
                <div className="hp-search">
                  <i className="fas fa-magnifying-glass hp-search-ico"></i>
                  <input
                    className="hp-search-input"
                    placeholder={
                      lang === "ar" ? "ابحث عن سورة…"
                        : lang === "fr" ? "Rechercher une sourate…"
                          : "Search a surah…"
                    }
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                  />
                  {filter && (
                    <button className="hp-search-clear" onClick={() => setFilter("")} aria-label="Effacer">
                      <i className="fas fa-xmark"></i>
                    </button>
                  )}
                </div>
              )}
              {activeTab === "surah" && (
                <button className="hp-sort-btn" onClick={() => setSortDir(prev => prev === "asc" ? "desc" : "asc") }>
                  <i className={`fas ${sortDir === "asc" ? "fa-arrow-down-1-9" : "fa-arrow-down-9-1"}`}></i>
                  <span>
                    {sortDir === "asc"
                      ? (lang === "fr" ? "Croissant" : lang === "ar" ? "تصاعدي" : "Ascending")
                      : (lang === "fr" ? "Décroissant" : lang === "ar" ? "تنازلي" : "Descending")}
                  </span>
                </button>
              )}
            </div>
          </div>

          <div className="hp-list-meta">
            <div className="hp-list-count">{listSummary.count} {listSummary.label}</div>
            <div className="hp-list-caption">{listSummary.caption}</div>
          </div>

          <div className={cn("hp-list", activeTab === "surah" ? "hp-list--grid" : "hp-list--stack")}>
            {activeTab === "surah" ? (
              filteredSurahs.length === 0
                ? <EmptyState icon="fa-magnifying-glass"
                  text={lang === "ar" ? "لم يتم العثور على سورة" : lang === "fr" ? "Aucune sourate trouvée" : "No surah found"} />
                : filteredSurahs.map(s => (
                  <SurahCard
                    key={s.n} surah={s} lang={lang}
                    onClick={goSurah}
                    onPlay={playFromHome}
                    isActive={s.n === currentSurah && displayMode === "surah"}
                    isPlaying={state.isPlaying && state.currentPlayingAyah?.surah === s.n}
                  />
                ))
            ) : (
              JUZ_DATA.map(j => (
                <JuzCard
                  key={j.juz} juzData={j} lang={lang}
                  onClick={goJuz}
                  isActive={j.juz === currentJuz && displayMode === "juz"}
                />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

