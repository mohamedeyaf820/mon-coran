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
import Footer from "./Footer";

/* ─── Sourates d'accès rapide ─── */
const QUICK_ACCESS = [
  { n: 1, icon: "fa-mosque", label_fr: "Al-Fatiha", label_en: "The Opening" },
  { n: 18, icon: "fa-mountain-sun", label_fr: "Al-Kahf", label_en: "The Cave" },
  {
    n: 36,
    icon: "fa-star-and-crescent",
    label_fr: "Ya-Sin",
    label_en: "Ya-Sin",
  },
  { n: 55, icon: "fa-leaf", label_fr: "Ar-Rahman", label_en: "The Merciful" },
  { n: 67, icon: "fa-moon", label_fr: "Al-Mulk", label_en: "Sovereignty" },
  { n: 112, icon: "fa-infinity", label_fr: "Al-Ikhlas", label_en: "Sincerity" },
  { n: 113, icon: "fa-sun", label_fr: "Al-Falaq", label_en: "The Dawn" },
  { n: 114, icon: "fa-shield-halved", label_fr: "An-Nas", label_en: "Mankind" },
];

/* ─── Versets du jour — cycle de 30 jours ─── */
const DAILY_VERSES = [
  {
    text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    ref: "Al-Inshirah · 94:6",
    trans_fr: "Certes, avec la difficulté vient la facilité",
  },
  {
    text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا",
    ref: "At-Talaq · 65:2",
    trans_fr: "Qui craint Allah, Il lui accordera une issue",
  },
  {
    text: "وَاللَّهُ يُحِبُّ الصَّابِرِينَ",
    ref: "Âl-Imrân · 3:146",
    trans_fr: "Allah aime ceux qui font preuve de patience",
  },
  {
    text: "أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ",
    ref: "Ar-Ra'd · 13:28",
    trans_fr: "C'est par le rappel d'Allah que les cœurs trouvent la quiétude",
  },
  {
    text: "وَتَوَكَّلْ عَلَى اللَّهِ ۚ وَكَفَىٰ بِاللَّهِ وَكِيلًا",
    ref: "Al-Ahzab · 33:3",
    trans_fr: "Confie-toi à Allah — Il suffit comme garant",
  },
  {
    text: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    ref: "Ta-Ha · 20:114",
    trans_fr: "Dis : Seigneur, accroîs mes connaissances",
  },
  {
    text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    ref: "Al-Baqara · 2:153",
    trans_fr: "Certes, Allah est avec ceux qui endurent",
  },
  {
    text: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ",
    ref: "Al-Hadid · 57:4",
    trans_fr: "Il est avec vous où que vous soyez",
  },
  {
    text: "وَعَسَىٰ أَن تَكْرَهُوا شَيْئًا وَهُوَ خَيْرٌ لَّكُمْ",
    ref: "Al-Baqara · 2:216",
    trans_fr: "Il se peut que vous détestiez une chose qui est bonne pour vous",
  },
  {
    text: "إِنَّ رَحْمَتَ اللَّهِ قَرِيبٌ مِّنَ الْمُحْسِنِينَ",
    ref: "Al-A'raf · 7:56",
    trans_fr: "La miséricorde d'Allah est proche des bienfaisants",
  },
  {
    text: "وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ",
    ref: "Yusuf · 12:87",
    trans_fr: "Ne désespérez jamais de la grâce d'Allah",
  },
  {
    text: "فَفِرُّوا إِلَى اللَّهِ",
    ref: "Adh-Dhariyat · 51:50",
    trans_fr: "Fuyez donc vers Allah",
  },
  {
    text: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
    ref: "Al-Baqara · 2:201",
    trans_fr:
      "Notre Seigneur, accorde-nous ce qui est bon ici-bas et dans l'au-delà",
  },
  {
    text: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    ref: "At-Talaq · 65:3",
    trans_fr: "Celui qui se confie en Allah, Il lui suffit",
  },
  {
    text: "إِنَّ اللَّهَ لَطِيفٌ بِعِبَادِهِ",
    ref: "Ash-Shura · 42:19",
    trans_fr: "Allah est plein de mansuétude envers Ses serviteurs",
  },
  {
    text: "وَاللَّهُ يَعْلَمُ وَأَنتُمْ لَا تَعْلَمُونَ",
    ref: "Al-Baqara · 2:232",
    trans_fr: "Allah sait et vous ne savez pas",
  },
  {
    text: "وَمَا عِندَ اللَّهِ خَيْرٌ وَأَبْقَىٰ",
    ref: "Ash-Shura · 42:36",
    trans_fr: "Ce qui est auprès d'Allah est meilleur et plus durable",
  },
  {
    text: "رَبِّ إِنِّي لِمَا أَنزَلْتَ إِلَيَّ مِنْ خَيْرٍ فَقِيرٌ",
    ref: "Al-Qasas · 28:24",
    trans_fr:
      "Seigneur, j'ai grand besoin du bien que Tu fais descendre sur moi",
  },
  {
    text: "وَذَكِّرْ فَإِنَّ الذِّكْرَىٰ تَنفَعُ الْمُؤْمِنِينَ",
    ref: "Adh-Dhariyat · 51:55",
    trans_fr: "Rappelle, car le rappel profite aux croyants",
  },
  {
    text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",
    ref: "Al-Inshirah · 94:5",
    trans_fr: "En vérité, avec la difficulté vient la facilité",
  },
  {
    text: "إِن تَنصُرُوا اللَّهَ يَنصُرْكُمْ",
    ref: "Muhammad · 47:7",
    trans_fr:
      "Si vous défendez la cause d'Allah, Il vous accordera Sa victoire",
  },
  {
    text: "وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ",
    ref: "Al-Baqara · 2:197",
    trans_fr: "Prenez des provisions — la meilleure provision est la piété",
  },
  {
    text: "وَاتَّقُوا اللَّهَ وَيُعَلِّمُكُمُ اللَّهُ",
    ref: "Al-Baqara · 2:282",
    trans_fr: "Craignez Allah, et Allah vous enseignera",
  },
  {
    text: "الَّذِينَ يَذْكُرُونَ اللَّهَ قِيَامًا وَقُعُودًا وَعَلَىٰ جُنُوبِهِمْ",
    ref: "Âl-Imrân · 3:191",
    trans_fr: "Ceux qui invoquent Allah debout, assis et couchés sur le côté",
  },
  {
    text: "وَالسَّلَامُ عَلَىٰ مَنِ اتَّبَعَ الْهُدَىٰ",
    ref: "Ta-Ha · 20:47",
    trans_fr: "Et la paix soit sur celui qui suit le droit chemin",
  },
  {
    text: "سَنُرِيهِمْ آيَاتِنَا فِي الْآفَاقِ وَفِي أَنفُسِهِمْ",
    ref: "Fussilat · 41:53",
    trans_fr: "Nous leur montrerons Nos signes dans l'univers et en eux-mêmes",
  },
  {
    text: "وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ",
    ref: "Al-Qamar · 54:17",
    trans_fr:
      "Nous avons facilité le Coran — y a-t-il des gens pour réfléchir ?",
  },
  {
    text: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    ref: "Al-Ikhlas · 112:1",
    trans_fr: "Dis : Il est Allah, Unique",
  },
  {
    text: "وَلَقَدْ كَرَّمْنَا بَنِي آدَمَ",
    ref: "Al-Isra · 17:70",
    trans_fr: "Nous avons certes accordé de la dignité aux fils d'Adam",
  },
  {
    text: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    ref: "Al-Fatiha · 1:1",
    trans_fr: "Au nom d'Allah, le Tout Miséricordieux, le Très Miséricordieux",
  },
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

  if (day === 5)
    return {
      period: {
        fr: "Sunna du vendredi",
        en: "Friday Sunnah",
        ar: "سنة الجمعة",
      },
      icon: "fa-star-and-crescent",
      surahs: [
        {
          n: 18,
          fr: "• Sunna du vendredi",
          en: "• Friday Sunnah",
          ar: "سنة الجمعة",
        },
        { n: 1, fr: "L'Ouverture", en: "The Opening", ar: "الفاتحة" },
        { n: 36, fr: "Cœur du Coran", en: "Heart of Quran", ar: "قلب القرآن" },
        { n: 55, fr: "Ar-Rahman", en: "The Merciful", ar: "الرحمن" },
        { n: 67, fr: "Al-Mulk", en: "Sovereignty", ar: "الملك" },
      ],
    };

  if (h >= 4 && h < 12)
    return {
      period: {
        fr: "Lecture du matin",
        en: "Morning Reading",
        ar: "ورد الصباح",
      },
      icon: "fa-sun",
      surahs: [
        { n: 1, fr: "L'Ouverture", en: "The Opening", ar: "الفاتحة" },
        { n: 112, fr: "Sincérité pure", en: "Pure Sincerity", ar: "الإخلاص" },
        { n: 113, fr: "Protection de l'aube", en: "Dawn Guard", ar: "الفلق" },
        { n: 114, fr: "Protection du mal", en: "Against Evil", ar: "الناس" },
        { n: 36, fr: "Cœur du Coran", en: "Heart of Quran", ar: "قلب القرآن" },
      ],
    };

  if (h >= 12 && h < 17)
    return {
      period: {
        fr: "Lecture du midi",
        en: "Midday Reading",
        ar: "قراءة الظهر",
      },
      icon: "fa-cloud-sun",
      surahs: [
        {
          n: 55,
          fr: "Ar-Rahman — La Grâce",
          en: "Ar-Rahman — Grace",
          ar: "الرحمن",
        },
        { n: 25, fr: "Le Critère", en: "The Criterion", ar: "الفرقان" },
        { n: 18, fr: "Al-Kahf", en: "The Cave", ar: "الكهف" },
        { n: 56, fr: "L'Événement", en: "The Event", ar: "الواقعة" },
        { n: 2, fr: "Al-Baqara", en: "The Cow", ar: "البقرة" },
      ],
    };

  if (h >= 17 && h < 21)
    return {
      period: {
        fr: "Lecture du soir",
        en: "Evening Reading",
        ar: "ورد المساء",
      },
      icon: "fa-cloud-moon",
      surahs: [
        { n: 36, fr: "Cœur du Coran", en: "Heart of Quran", ar: "قلب القرآن" },
        { n: 67, fr: "Rappel du soir", en: "Evening Reminder", ar: "الملك" },
        { n: 55, fr: "Ar-Rahman", en: "The Merciful", ar: "الرحمن" },
        { n: 59, fr: "Al-Hashr", en: "The Gathering", ar: "الحشر" },
        { n: 103, fr: "Le Temps", en: "Time", ar: "العصر" },
      ],
    };

  return {
    period: { fr: "Lecture de nuit", en: "Night Reading", ar: "ورد الليل" },
    icon: "fa-moon",
    surahs: [
      {
        n: 67,
        fr: "Al-Mulk — Avant le sommeil",
        en: "Al-Mulk — Before Sleep",
        ar: "الملك",
      },
      { n: 32, fr: "As-Sajda", en: "The Prostration", ar: "السجدة" },
      { n: 36, fr: "Ya-Sin du soir", en: "Ya-Sin at Night", ar: "يس" },
      { n: 112, fr: "Al-Ikhlas", en: "Sincerity", ar: "الإخلاص" },
      { n: 113, fr: "Al-Falaq", en: "The Dawn", ar: "الفلق" },
    ],
  };
}

/*  Type info  */
const TYPE_INFO = {
  Meccan: { fr: "Mecquoise", en: "Meccan", ar: "مكية" },
  Medinan: { fr: "Médinoise", en: "Medinan", ar: "مدنية" },
};

function PercentBar({ value }) {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <svg viewBox="0 0 100 8" preserveAspectRatio="none" className="block h-full w-full">
      <defs>
        <linearGradient id="home-progress-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--gold)" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width="100" height="8" rx="4" className="fill-black/5 dark:fill-white/10" />
      <rect x="0" y="0" width={pct} height="8" rx="4" fill="url(#home-progress-gradient)" />
    </svg>
  );
}

/*  Carte sourate (grille)  */
function SurahCard({
  surah,
  onClick,
  onPlay,
  isActive,
  lang,
  isPlaying,
  viewMode,
  animIndex = 0,
}) {
  const typeInfo = TYPE_INFO[surah.type] || {};
  const typeLabel =
    typeInfo[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"] || surah.type;
  const displayName = surah.en || surah.fr || surah.ar;
  const subLabel =
    lang === "fr"
      ? surah.fr || typeLabel
      : lang === "ar"
        ? typeLabel
        : surah.fr || typeLabel;
  const ayahLabel = `${surah.ayahs} ${lang === "ar" ? "آية" : "Ayat"}`;
  const pageLabel =
    surah.page &&
    (lang === "ar"
      ? `صفحة ${surah.page}`
      : lang === "fr"
        ? `Page ${surah.page}`
        : `Page ${surah.page}`);

  /* ── LIST ROW (unchanged) ── */
  if (viewMode === "list") {
    return (
      <button
        className={cn(
          "hpl-row !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.003]",
          isActive && "hpl-row--active",
        )}
        data-stype={surah.type?.toLowerCase()}
        onClick={() => onClick(surah.n)}
      >
        <span className={cn("hpl-row__num", isActive && "hpl-row__num--on")}>
          {surah.n}
        </span>
        <div className="hpl-row__body">
          <span className="hpl-row__name">{displayName}</span>
          <span className="hpl-row__sub">{subLabel}</span>
          <span className="hpl-row__meta">
            <span className={`hpl-dot hpl-dot--${surah.type?.toLowerCase()}`} />
            {typeLabel} · {ayahLabel}
            {pageLabel ? ` · ${pageLabel}` : ""}
          </span>
        </div>
        <span className="hpl-row__ar" dir="rtl" lang="ar">
          {surah.ar}
        </span>
        <button
          className={cn(
            "hpl-row__play !transition-all !duration-300 hover:!scale-110",
            isPlaying && "hpl-row__play--on motion-safe:animate-pulse",
          )}
          onClick={(e) => {
            e.stopPropagation();
            onPlay(surah.n);
          }}
          aria-label="Écouter"
        >
          <i className={`fas fa-${isPlaying ? "pause" : "play"}`} />
        </button>
      </button>
    );
  }

  /* ── GRID CARD — reference-style layout ── */
  return (
    <button
      className={cn(
        "scard !relative !overflow-hidden !transition-all !duration-300 hover:!-translate-y-1 hover:!scale-[1.01] hover:!shadow-[0_18px_34px_rgba(8,20,52,0.35)]",
        isActive && "scard--active",
        isPlaying && "scard--playing",
      )}
      data-stype={surah.type?.toLowerCase()}
      onClick={() => onClick(surah.n)}
    >
      {/* Left: number badge */}
      <span className={cn("scard__num", isActive && "scard__num--on")}>
        {surah.n}
      </span>

      {/* Centre: transliteration + meaning + ayat */}
      <div className="scard__body">
        <span className="scard__name">{displayName}</span>
        <span className="scard__trans">{subLabel}</span>
        <span className="scard__meta">
          <span
            className={`scard__dot scard__dot--${surah.type?.toLowerCase()}`}
            aria-hidden="true"
          >
            {surah.type === "Meccan" ? "▲" : "■"}
          </span>
          {typeLabel} · {ayahLabel}
        </span>
      </div>

      {/* Right: Arabic calligraphy */}
      <span className="scard__ar" dir="rtl" lang="ar">
        {surah.ar}
      </span>

      {/* Play button (absolute bottom-right) */}
      <button
        className={cn(
          "scard__play !transition-all !duration-300 hover:!scale-110",
          isPlaying && "scard__play--on motion-safe:animate-pulse",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onPlay(surah.n);
        }}
        aria-label="Écouter"
      >
        <i className={`fas fa-${isPlaying ? "pause" : "play"}`} />
      </button>
    </button>
  );
}

/* ─── Carte juz ─── */
function JuzCard({
  juzData,
  onClick,
  isActive,
  lang,
  viewMode,
  animIndex = 0,
}) {
  const { juz, name } = juzData;
  if (viewMode === "list") {
    return (
      <button
        className={cn(
          "hpl-row !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.003]",
          isActive && "hpl-row--active",
        )}
        onClick={() => onClick(juz)}
      >
        <span className={cn("hpl-row__num", isActive && "hpl-row__num--on")}>
          {juz}
        </span>
        <div className="hpl-row__body">
          <span className="hpl-row__name">Juz {juz}</span>
          <span className="hpl-row__meta">{name}</span>
        </div>
      </button>
    );
  }
  return (
      <button
        className={cn(
          "hpq-card hpq-card--juz !transition-all !duration-300 hover:!-translate-y-1 hover:!scale-[1.01] hover:!shadow-[0_16px_32px_rgba(8,20,52,0.34)]",
          isActive && "hpq-card--active",
        )}
        onClick={() => onClick(juz)}
      >
      <span className={cn("hpq-card__num", isActive && "hpq-card__num--on")}>
        {juz}
      </span>
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
  const {
    lang,
    currentSurah,
    currentAyah,
    currentJuz,
    displayMode,
    riwaya,
    theme,
  } = state;
  const isRtl = lang === "ar";

  const [activeTab, setActiveTab] = useState("surah");
  const [activeInfo, setActiveInfo] = useState("bookmarks");
  const [bookmarks, setBookmarks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [filter, setFilter] = useState("");
  const [sortDir, setSortDir] = useState("asc");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [now, setNow] = useState(() => new Date());
  const [recentVisits, setRecentVisits] = useState(() => getRecentVisits());

  // Historique réel = l'utilisateur a déjà navigué au-delà de Al-Fatiha v.1
  const hasReadingHistory =
    currentSurah > 1 || (currentSurah === 1 && currentAyah > 1);

  useEffect(() => {
    setActiveTab(displayMode === "juz" ? "juz" : "surah");
  }, [displayMode]);
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => {
    getAllBookmarks().then((bks) =>
      setBookmarks((bks || []).sort((a, b) => b.createdAt - a.createdAt)),
    );
    getAllNotes().then((ns) =>
      setNotes((ns || []).sort((a, b) => b.updatedAt - a.updatedAt)),
    );
  }, []);

  const playFromHome = useCallback(
    (surahNum) => {
      const safeId = ensureReciterForRiwaya(state.reciter, state.riwaya);
      const rec = getReciter(safeId, state.riwaya);
      if (!rec) return;
      if (
        state.riwaya === "warsh" &&
        state.warshStrictMode &&
        !String(rec.cdn || "")
          .toLowerCase()
          .includes("warsh")
      )
        return;
      const surahData = SURAHS[surahNum - 1];
      if (!surahData) return;
      let globalStart = 0;
      for (let i = 0; i < surahNum - 1; i++) globalStart += SURAHS[i].ayahs;
      const items = Array.from({ length: surahData.ayahs }, (_, i) => ({
        surah: surahNum,
        ayah: i + 1,
        number: globalStart + i + 1,
      }));
      set({ currentSurah: surahNum });
      audioService.loadPlaylist(items, rec.cdn, rec.cdnType || "islamic");
      audioService.play();
    },
    [state.reciter, state.riwaya, state.warshStrictMode, set],
  );

  const goSurah = useCallback(
    (n) => {
      set({ displayMode: "surah", showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: n, ayah: 1 } });
    },
    [set, dispatch],
  );

  const goSurahAyah = useCallback(
    (surah, ayah) => {
      set({ displayMode: "surah", showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah, ayah: ayah || 1 } });
    },
    [set, dispatch],
  );

  const enableQuranNight = useCallback(() => {
    dispatch({ type: "SET_THEME", payload: "quran-night" });
  }, [dispatch]);

  const goJuz = useCallback(
    (juz) => {
      set({ showHome: false, showDuas: false });
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
    },
    [set, dispatch],
  );

  const continueReading = useCallback(() => {
    set({ showHome: false, showDuas: false });
    if (displayMode === "juz")
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz } });
    else
      dispatch({
        type: "NAVIGATE_SURAH",
        payload: { surah: currentSurah, ayah: currentAyah },
      });
  }, [set, dispatch, displayMode, currentJuz, currentSurah, currentAyah]);

  const openDuas = useCallback(
    () => set({ showHome: false, showDuas: true }),
    [set],
  );

  const filteredSurahs = useMemo(() => {
    const source = !filter.trim()
      ? [...SURAHS]
      : SURAHS.filter(
          (s) =>
            s.ar.includes(filter) ||
            s.en.toLowerCase().includes(filter.toLowerCase()) ||
            s.fr.toLowerCase().includes(filter.toLowerCase()) ||
            String(s.n) === filter.trim(),
        );
    source.sort((a, b) => (sortDir === "asc" ? a.n - b.n : b.n - a.n));
    return source;
  }, [filter, sortDir]);

  const dailyVerse = useMemo(
    () => DAILY_VERSES[getDailyVerseIndex(now)],
    [now],
  );
  const suggestionSet = useMemo(() => getSuggestedSurahs(now), [now]);
  const surahLabel = SURAHS[currentSurah - 1];
  const progressPct = Math.round(((Math.max(1, currentSurah) - 1) / 113) * 100);

  const riwayaLabel =
    riwaya === "warsh"
      ? lang === "fr"
        ? "Riwāya Warsh"
        : lang === "ar"
          ? "رواية ورش"
          : "Warsh"
      : lang === "fr"
        ? "Riwāya Ḥafs"
        : lang === "ar"
          ? "رواية حفص"
          : "Hafs";

  const readingModeLabel =
    displayMode === "juz"
      ? lang === "fr"
        ? "Mode Juz"
        : lang === "ar"
          ? "وضع الجزء"
          : "Juz mode"
      : displayMode === "page"
        ? lang === "fr"
          ? "Mode Page"
          : lang === "ar"
            ? "وضع الصفحة"
            : "Page mode"
        : lang === "fr"
          ? "Mode Sourate"
          : lang === "ar"
            ? "وضع السورة"
            : "Surah mode";

  const readingTarget =
    displayMode === "juz"
      ? lang === "ar"
        ? `الجزء ${toAr(currentJuz)}`
        : `Juz ${currentJuz}`
      : displayMode === "page"
        ? lang === "ar"
          ? `صفحة ${toAr(state.currentPage || 1)}`
          : `${lang === "fr" ? "Page" : "Page"} ${state.currentPage || 1}`
        : lang === "ar"
          ? `${surahLabel?.ar || "الفاتحة"} · ${toAr(currentAyah)}`
          : `${lang === "fr" ? surahLabel?.fr : surahLabel?.en} · v.${currentAyah}`;

  const quickResumeLabel = hasReadingHistory
    ? lang === "fr"
      ? "Reprendre la session"
      : lang === "ar"
        ? "متابعة الجلسة"
        : "Resume session"
    : lang === "fr"
      ? "Démarrer une lecture"
      : lang === "ar"
        ? "ابدأ القراءة"
        : "Start reading";

  const currentYear = now.getFullYear();

  const greeting = useMemo(() => {
    const h = now.getHours();
    if (h >= 4 && h < 12)
      return { fr: "Bonjour", en: "Good morning", ar: "صباح الخير" };
    if (h >= 12 && h < 17)
      return { fr: "Bon après-midi", en: "Good afternoon", ar: "مساء النهار" };
    if (h >= 17 && h < 22)
      return { fr: "Bonsoir", en: "Good evening", ar: "مساء الخير" };
    return { fr: "Bonne nuit", en: "Good night", ar: "طاب ليلكم" };
  }, [now]);

  const currentPrayer = useMemo(() => {
    const h = now.getHours();
    if (h >= 4 && h < 7)
      return { icon: "fa-star", fr: "Fajr", ar: "الفجر", en: "Fajr" };
    if (h >= 7 && h < 12)
      return { icon: "fa-sun", fr: "Duhā", ar: "الضحى", en: "Duhā" };
    if (h >= 12 && h < 15)
      return { icon: "fa-sun", fr: "Dhuhr", ar: "الظهر", en: "Dhuhr" };
    if (h >= 15 && h < 18)
      return { icon: "fa-cloud-sun", fr: "Asr", ar: "العصر", en: "Asr" };
    if (h >= 18 && h < 20)
      return {
        icon: "fa-cloud-moon",
        fr: "Maghrib",
        ar: "المغرب",
        en: "Maghrib",
      };
    return { icon: "fa-moon", fr: "Ishā", ar: "العشاء", en: "Ishā" };
  }, [now]);

  const vodSurahNum = useMemo(() => {
    // Handles formats: "2:255", "Al-Baqarah 2:255", "البقرة — 2:255", "49:13"
    const match = dailyVerse.ref.match(/(\d{1,3}):\d+/);
    return match ? parseInt(match[1], 10) : null;
  }, [dailyVerse]);

  const T = {
    continueReading: { fr: "Continuer", en: "Continue", ar: "متابعة القراءة" },
    startFatiha: { fr: "Al-Fatiha", en: "Al-Fatihah", ar: "البداية" },
    duas: { fr: "Douas", en: "Duas", ar: "الأدعية" },
    surahs: { fr: "Sourates", en: "Surahs", ar: "السور" },
    juz: { fr: "Juz", en: "Juz", ar: "الأجزاء" },
    search: {
      fr: "Rechercher une sourate…",
      en: "Search a surah…",
      ar: "ابحث عن سورة…",
    },
    verseOfDay: {
      fr: "Verset du jour",
      en: "Verse of the Day",
      ar: "آية اليوم",
    },
    quickAccess: { fr: "Accès rapide", en: "Quick Access", ar: "وصول سريع" },
    noBookmarks: {
      fr: "Aucun favori — appuyez ★",
      en: "No bookmarks yet",
      ar: "لا توجد إشارات",
    },
    noNotes: {
      fr: "Aucune note encore",
      en: "No notes yet",
      ar: "لا توجد ملاحظات",
    },
    noResults: {
      fr: "Aucune sourate trouvée",
      en: "No surah found",
      ar: "لم يتم العثور",
    },
    bookmarks: { fr: "Favoris", en: "Saved", ar: "المفضلة" },
    notes: { fr: "Notes", en: "Notes", ar: "ملاحظات" },
    suggest: { fr: "Suggestions", en: "Suggest", ar: "اقتراحات" },
  };
  const t = (k) =>
    T[k]?.[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"] ?? k;

  const infoTabs = [
    {
      id: "bookmarks",
      icon: "fa-bookmark",
      label: t("bookmarks"),
      count: bookmarks.length,
    },
    {
      id: "notes",
      icon: "fa-pen-line",
      label: t("notes"),
      count: notes.length,
    },
    {
      id: "suggest",
      icon: "fa-lightbulb",
      label: t("suggest"),
      count: suggestionSet.surahs.length,
    },
  ];

  return (
    <div className="hp2 hp2--platform !relative !overflow-hidden">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-28 left-[6%] h-72 w-72 rounded-full bg-blue-500/24 blur-[110px] motion-safe:animate-pulse [animation-duration:8s]" />
        <div className="absolute top-[18%] -right-28 h-80 w-80 rounded-full bg-cyan-400/16 blur-[120px] motion-safe:animate-pulse [animation-duration:11s]" />
        <div className="absolute -bottom-32 left-[30%] h-96 w-96 rounded-full bg-emerald-400/14 blur-[130px] motion-safe:animate-pulse [animation-duration:9s]" />
        <div className="absolute inset-0 opacity-[0.16] [background-image:linear-gradient(to_right,rgba(148,163,184,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.17)_1px,transparent_1px)] [background-size:64px_64px]" />
      </div>
      {/* ════ HERO ════ */}
      <section className="hp2-hero !relative !z-10 !overflow-hidden !rounded-[28px] !border !border-white/12 !bg-[radial-gradient(circle_at_18%_0%,rgba(56,122,255,0.24)_0%,transparent_44%),linear-gradient(140deg,rgba(8,18,42,0.96)_0%,rgba(9,25,58,0.94)_52%,rgba(10,33,70,0.92)_100%)] !shadow-[0_24px_64px_rgba(1,8,26,0.55)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_14%,rgba(16,185,129,0.14)_0%,transparent_28%),radial-gradient(circle_at_22%_88%,rgba(251,191,36,0.12)_0%,transparent_34%)]" />
        <div className="pointer-events-none absolute -top-12 right-[14%] h-28 w-28 rounded-full border border-white/15 opacity-35 motion-safe:animate-spin [animation-duration:16s]" />
        <div className="pointer-events-none absolute -bottom-14 left-[44%] h-36 w-36 rounded-full border border-blue-200/20 opacity-30 motion-safe:animate-spin [animation-direction:reverse] [animation-duration:22s]" />
        {/* Orbs décoratifs */}
        <div className="hp2-hero__orb hp2-hero__orb--1 !opacity-65 motion-safe:animate-pulse [animation-duration:9s]" aria-hidden="true" />
        <div className="hp2-hero__orb hp2-hero__orb--2 !opacity-60 motion-safe:animate-pulse [animation-duration:12s]" aria-hidden="true" />
        <div className="hp2-hero__orb hp2-hero__orb--3 !opacity-55 motion-safe:animate-pulse [animation-duration:10s]" aria-hidden="true" />

        <div className="hp2-hero__inner !relative !z-10">
          {/* ── Gauche ── */}
          <div className="hp2-hero__left">
            {/* Salutation + date */}
            <div className="hp2-hero__top-row !items-center !gap-3">
              <div className="hp2-hero__greeting !inline-flex !items-center !gap-2 !rounded-full !border !border-blue-200/20 !bg-blue-500/10 !px-3 !py-1.5 !text-[0.71rem] !font-semibold !uppercase !tracking-[0.12em] !text-blue-100/95 !shadow-[0_8px_18px_rgba(25,82,180,0.2)]">
                <i className={`fas ${currentPrayer.icon}`} />
                <span>
                  {greeting[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}
                </span>
              </div>
              <span className="hp2-hero__date-pill !rounded-full !border !border-white/12 !bg-white/5 !px-3 !py-1.5 !text-[0.72rem] !font-medium !text-blue-100/80 !backdrop-blur-sm">
                {now.toLocaleDateString(
                  lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
                  { weekday: "short", day: "numeric", month: "short" },
                )}
              </span>
            </div>

            {/* Titre principal avec bismallah intégrée */}
            <div className="hp2-hero__headline">
              <div className="hp2-hero__bismallah" aria-hidden="true" dir="rtl">
                ﷽
              </div>
              <div className="hp2-hero__brand !items-center !gap-4">
                <PlatformLogo
                  className="hp2-hero__logo !h-[84px] !w-[84px] !rounded-3xl !border !border-white/15 !bg-slate-900/55 !shadow-[0_10px_30px_rgba(10,24,58,0.45)]"
                  imgClassName="hp2-hero__logo-img !h-[62px] !w-[62px]"
                  decorative
                />
                <div className="hp2-hero__brand-text">
                  <h1 className="hp2-hero__title !text-[clamp(1.95rem,3vw,2.5rem)] !font-black !tracking-tight !text-white !drop-shadow-[0_6px_22px_rgba(37,99,235,0.33)]">
                    MushafPlus
                  </h1>
                  <div className="hp2-hero__badges-row !mt-2 !flex !flex-wrap !gap-2">
                    <span className="hp2-hero__badge hp2-hero__badge--riwaya !rounded-full !border !border-blue-200/20 !bg-blue-500/15 !px-3 !py-1 !text-[0.74rem] !font-semibold !text-blue-100 !backdrop-blur-sm">
                      <i className="fas fa-feather-pointed" />
                      {riwayaLabel}
                    </span>
                    <span className="hp2-hero__badge hp2-hero__badge--prayer !rounded-full !border !border-amber-200/25 !bg-amber-400/12 !px-3 !py-1 !text-[0.74rem] !font-semibold !text-amber-100 !backdrop-blur-sm">
                      <i className={`fas ${currentPrayer.icon}`} />
                      {
                        currentPrayer[
                          lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"
                        ]
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="hp2-hero__tagline !mt-3 !max-w-[62ch] !text-[0.98rem] !leading-relaxed !text-blue-100/80">
              {lang === "ar"
                ? "اقرأ القرآن الكريم وتدبَّر معانيه في مساحة أكثر سكينة"
                : lang === "fr"
                  ? "Lisez, méditez, mémorisez — La Parole d'Allah dans toute sa beauté"
                  : "Read, reflect and memorize the Holy Quran in beauty"}
            </p>

            {/* CTAs */}
            <div className="hp2-hero__ctas !mt-5 !flex !flex-wrap !gap-3">
              {hasReadingHistory ? (
                <button
                  className="hp2-btn hp2-btn--primary !h-12 !rounded-2xl !border !border-blue-200/30 !bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_62%,#1d4ed8_100%)] !px-5 !text-white !shadow-[0_14px_30px_rgba(37,99,235,0.34)] !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.01] hover:!shadow-[0_18px_38px_rgba(37,99,235,0.44)]"
                  onClick={continueReading}
                >
                  <i className="fas fa-circle-play" />
                  <span>{t("continueReading")}</span>
                  {surahLabel && (
                    <span className="hp2-btn__chip">{surahLabel.ar}</span>
                  )}
                </button>
              ) : (
                <button
                  className="hp2-btn hp2-btn--primary !h-12 !rounded-2xl !border !border-blue-200/30 !bg-[linear-gradient(135deg,#3b82f6_0%,#2563eb_62%,#1d4ed8_100%)] !px-5 !text-white !shadow-[0_14px_30px_rgba(37,99,235,0.34)] !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.01] hover:!shadow-[0_18px_38px_rgba(37,99,235,0.44)]"
                  onClick={() => goSurah(1)}
                >
                  <i className="fas fa-book-open" />
                  <span>
                    {lang === "ar"
                      ? "ابدأ القراءة"
                      : lang === "fr"
                        ? "Commencer la lecture"
                        : "Start reading"}
                  </span>
                  <span className="hp2-btn__chip">الْفَاتِحَة</span>
                </button>
              )}
              {hasReadingHistory && (
                <button
                  className="hp2-btn hp2-btn--outline !h-12 !rounded-2xl !border !border-blue-200/30 !bg-blue-400/10 !px-5 !text-blue-50 !transition-all !duration-300 hover:!-translate-y-0.5 hover:!bg-blue-400/18"
                  onClick={() => goSurah(1)}
                >
                  <i className="fas fa-book-open-reader" />
                  <span>{t("startFatiha")}</span>
                </button>
              )}
              {theme !== "quran-night" && (
                <button
                  className="hp2-btn hp2-btn--soft !h-12 !rounded-2xl !border !border-blue-200/20 !bg-blue-500/12 !px-5 !text-blue-50/95 !transition-all !duration-300 hover:!-translate-y-0.5 hover:!bg-blue-500/20"
                  onClick={enableQuranNight}
                >
                  <i className="fas fa-swatchbook" />
                  <span>
                    {lang === "ar"
                      ? "سمة ليل القرآن"
                      : lang === "fr"
                        ? "Theme Quran Nuit"
                        : "Quran night theme"}
                  </span>
                </button>
              )}
              <button
                className="hp2-btn hp2-btn--soft !h-12 !rounded-2xl !border !border-blue-200/20 !bg-blue-500/12 !px-5 !text-blue-50/95 !transition-all !duration-300 hover:!-translate-y-0.5 hover:!bg-blue-500/20"
                onClick={openDuas}
              >
                <i className="fas fa-hands-praying" />
                <span>{t("duas")}</span>
              </button>
            </div>

            {/* Lectures récentes */}
            {recentVisits.length > 0 && (
              <div className="hp2-recent-history !mt-6 !rounded-2xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(9,20,48,0.9),rgba(8,16,38,0.92))] !p-4 !shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] !backdrop-blur-md">
                <div className="hp2-recent-title !mb-3 !text-[0.69rem] !font-semibold !uppercase !tracking-[0.18em] !text-blue-200/65">
                  <i className="fas fa-clock-rotate-left" />
                  {lang === "ar"
                    ? "استكمال"
                    : lang === "fr"
                      ? "Reprendre"
                      : "Continue"}
                </div>
                <div className="hp2-recent-items !grid !gap-2.5">
                  {recentVisits.map((v) => (
                    <button
                      key={v.surah}
                      className="hp2-recent-item group !grid !grid-cols-[auto_1fr_auto] !items-center !gap-3 !rounded-xl !border !border-white/10 !bg-[linear-gradient(135deg,rgba(62,132,245,0.8)_0%,rgba(42,95,194,0.76)_100%)] !px-4 !py-3 !text-left !shadow-[0_10px_22px_rgba(12,35,96,0.32)] !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.005] hover:!shadow-[0_16px_34px_rgba(12,35,96,0.42)]"
                      onClick={() => goSurahAyah(v.surah, v.ayah)}
                    >
                      <span className="hp2-recent-num !flex !h-9 !w-9 !items-center !justify-center !rounded-full !border !border-white/30 !bg-white/10 !text-sm !font-bold !text-white">
                        {v.surah}
                      </span>
                      <div className="hp2-recent-info !min-w-0">
                        <span className="hp2-recent-name !block !truncate !text-[0.95rem] !font-semibold !text-white">
                          {v.surahName}
                        </span>
                        {v.ayah > 1 && (
                          <span className="hp2-recent-ayah !mt-0.5 !block !text-[0.72rem] !font-medium !text-blue-100/75">
                            v.{v.ayah}
                          </span>
                        )}
                      </div>
                      <span className="hp2-recent-play !flex !h-8 !w-8 !items-center !justify-center !rounded-full !bg-white/12 !text-blue-50/90 !transition-transform !duration-300 group-hover:!scale-110">
                        <i className="fas fa-play text-[0.78rem]" />
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Features mini grid */}
            <div className="hp2-features !mt-5 !grid !grid-cols-1 !gap-2 sm:!grid-cols-2">
              {[
                {
                  icon: "fa-palette",
                  fr: "Tajwîd coloré",
                  en: "Color tajweed",
                  ar: "تجويد ملون",
                },
                {
                  icon: "fa-language",
                  fr: "Mot à mot",
                  en: "Word by word",
                  ar: "كلمة بكلمة",
                },
                {
                  icon: "fa-headphones",
                  fr: "18+ récitateurs",
                  en: "18+ reciters",
                  ar: "١٨+ قارئ",
                },
                {
                  icon: "fa-moon",
                  fr: "4 themes harmonises",
                  en: "4 harmonized themes",
                  ar: "٤ سمات منسجمة",
                },
              ].map((f) => (
                <div
                  key={f.icon}
                  className="hp2-feature !flex !items-center !gap-2.5 !rounded-xl !border !border-white/12 !bg-white/5 !px-3 !py-2.5 !backdrop-blur-md !transition-all !duration-300 hover:!bg-white/10 hover:!-translate-y-0.5"
                >
                  <span className="hp2-feature__icon !text-blue-200 !drop-shadow-[0_0_12px_rgba(59,130,246,0.45)]">
                    <i className={`fas ${f.icon}`} />
                  </span>
                  <span className="hp2-feature__text !text-blue-100/90">
                    {lang === "ar" ? f.ar : lang === "fr" ? f.fr : f.en}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Droite ── */}
          <div className="hp2-hero__right !relative !z-10 !space-y-3">
            {/* Verset du jour — carte principale droite */}
            <div className="hp2-vod !relative !overflow-hidden !rounded-2xl !border !border-emerald-200/25 !bg-[linear-gradient(155deg,rgba(13,95,57,0.9)_0%,rgba(7,71,45,0.9)_58%,rgba(4,50,33,0.92)_100%)] !p-4 !shadow-[0_16px_34px_rgba(6,54,36,0.35)] !transition-all !duration-300 hover:!scale-[1.01]">
              <div className="pointer-events-none absolute -top-8 right-4 h-24 w-24 rounded-full bg-emerald-300/20 blur-2xl motion-safe:animate-pulse [animation-duration:8s]" />
              <div className="hp2-vod__head !relative !z-10">
                <span className="hp2-vod__label !rounded-full !border !border-emerald-200/30 !bg-emerald-300/10 !px-2.5 !py-1 !text-emerald-50">
                  <i className="fas fa-star-and-crescent" />
                  {t("verseOfDay")}
                </span>
                <span className="hp2-vod__date !text-emerald-100/80">
                  {now.toLocaleDateString(
                    lang === "ar" ? "ar-SA" : lang === "fr" ? "fr-FR" : "en-GB",
                    { day: "numeric", month: "short" },
                  )}
                </span>
              </div>
              <p className="hp2-vod__text !relative !z-10 !text-[1.45rem] !leading-[1.95] !text-emerald-50" dir="rtl">
                {dailyVerse.text}
              </p>
              {lang === "fr" && dailyVerse.trans_fr && (
                <p className="hp2-vod__trans !relative !z-10 !text-emerald-100/82">{dailyVerse.trans_fr}</p>
              )}
              <span className="hp2-vod__ref !relative !z-10 !text-emerald-100/80">{dailyVerse.ref}</span>
              {vodSurahNum && (
                <button
                  className="hp2-vod__btn !relative !z-10 !rounded-xl !border !border-emerald-200/30 !bg-emerald-400/14 !px-3.5 !py-2 !transition-all !duration-300 hover:!bg-emerald-400/22 hover:!-translate-y-0.5"
                  onClick={() => goSurah(vodSurahNum)}
                >
                  <i className="fas fa-book-open" />
                  {lang === "fr"
                    ? "Lire la sourate"
                    : lang === "ar"
                      ? "اقرأ السورة"
                      : "Read surah"}
                  <i className={`fas fa-arrow-${isRtl ? "left" : "right"}`} />
                </button>
              )}
            </div>

            {/* Carte session active */}
            <div className="hp2-focus-card !rounded-2xl !border !border-blue-200/20 !bg-[linear-gradient(150deg,rgba(18,38,84,0.9)_0%,rgba(12,27,62,0.92)_100%)] !shadow-[0_14px_30px_rgba(8,20,52,0.34)] !backdrop-blur-md !transition-all !duration-300 hover:!shadow-[0_20px_40px_rgba(8,20,52,0.44)]">
              <div className="hp2-focus-card__head">
                <span className="hp2-focus-card__eyebrow">
                  <i className="fas fa-bolt" />
                  {lang === "fr"
                    ? "Session"
                    : lang === "ar"
                      ? "الجلسة"
                      : "Session"}
                </span>
                <span className="hp2-focus-card__riwaya">{riwayaLabel}</span>
              </div>
              <div className="hp2-focus-card__body">
                <h2 className="hp2-focus-card__title">{readingTarget}</h2>
                {surahLabel && displayMode !== "juz" && (
                  <div className="hp2-focus-card__surah-ar" dir="rtl">
                    {surahLabel.ar}
                  </div>
                )}
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
                  <strong>{progressPct}%</strong>
                  <span>
                    {lang === "fr"
                      ? "Avancement"
                      : lang === "ar"
                        ? "التقدم"
                        : "Progress"}
                  </span>
                </span>
              </div>
              <div className="hp2-focus-card__progress">
                <div className="hp2-focus-card__progress-bar">
                  <div className="hp2-focus-card__progress-fill h-full w-full">
                    <PercentBar value={progressPct} />
                  </div>
                </div>
              </div>
              <button className="hp2-focus-card__cta !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.01]" onClick={continueReading}>
                <i className="fas fa-circle-play" />
                {hasReadingHistory
                  ? lang === "fr"
                    ? "Continuer"
                    : lang === "ar"
                      ? "متابعة"
                      : "Continue"
                  : lang === "fr"
                    ? "Commencer"
                    : lang === "ar"
                      ? "ابدأ"
                      : "Start"}
              </button>
            </div>

            {/* Prières */}
            <div className="hp2-prayers !rounded-2xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(8,20,46,0.88),rgba(8,16,34,0.9))] !p-3.5 !shadow-[0_10px_24px_rgba(5,13,34,0.34)] !backdrop-blur-sm">
              <div className="hp2-prayers__head !mb-2.5 !text-blue-100/88">
                <i className="fas fa-mosque" />
                <span>
                  {lang === "fr"
                    ? "Prières"
                    : lang === "ar"
                      ? "الصلوات"
                      : "Prayers"}
                </span>
              </div>
              <div className="hp2-prayers__list">
                {[
                  {
                    key: "fajr",
                    icon: "fa-star",
                    fr: "Fajr",
                    ar: "الفجر",
                    en: "Fajr",
                    r: [4, 7],
                  },
                  {
                    key: "dhuhr",
                    icon: "fa-sun",
                    fr: "Dhuhr",
                    ar: "الظهر",
                    en: "Dhuhr",
                    r: [12, 15],
                  },
                  {
                    key: "asr",
                    icon: "fa-cloud-sun",
                    fr: "Asr",
                    ar: "العصر",
                    en: "Asr",
                    r: [15, 18],
                  },
                  {
                    key: "maghrib",
                    icon: "fa-cloud-moon",
                    fr: "Maghrib",
                    ar: "المغرب",
                    en: "Maghrib",
                    r: [18, 20],
                  },
                  {
                    key: "isha",
                    icon: "fa-moon",
                    fr: "Ishā",
                    ar: "العشاء",
                    en: "Ishā",
                    r: [20, 4],
                  },
                ].map((p) => {
                  const h = now.getHours();
                  const on =
                    p.r[0] < p.r[1]
                      ? h >= p.r[0] && h < p.r[1]
                      : h >= p.r[0] || h < p.r[1];
                  return (
                    <div
                      key={p.key}
                      className={cn(
                        "hp2-prayer-row",
                        "!transition-all !duration-300 hover:!bg-white/10",
                        on && "hp2-prayer-row--on",
                      )}
                    >
                      <i className={`fas ${p.icon}`} />
                      <span className="hp2-prayer-row__name">
                        {p[lang === "ar" ? "ar" : lang === "fr" ? "fr" : "en"]}
                      </span>
                      {on && (
                        <span className="hp2-prayer-row__badge">
                          {lang === "fr"
                            ? "Maintenant"
                            : lang === "ar"
                              ? "الآن"
                              : "Now"}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════ ACCÈS RAPIDE ════ */}
      <nav className="hp2-quickbar !relative !z-10 !rounded-2xl !border !border-white/12 !bg-[linear-gradient(140deg,rgba(11,23,52,0.88),rgba(8,17,38,0.9))] !px-4 !py-3 !shadow-[0_12px_26px_rgba(5,14,34,0.35)] !backdrop-blur-md" aria-label={t("quickAccess")}>
        <span className="hp2-quickbar__title !text-blue-100/85">
          <i className="fas fa-bolt" />
          {t("quickAccess")}
        </span>
        <div className="hp2-quickbar__track !mt-2">
          <button className="hp2-qchip hp2-qchip--special !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.02]" onClick={openDuas}>
            <i className="fas fa-hands-praying" />
            {lang === "ar" ? "أدعية" : lang === "fr" ? "Douas" : "Duas"}
          </button>
          {QUICK_ACCESS.map(({ n, label_fr, label_en }) => {
            const s = SURAHS[n - 1];
            return (
              <button key={n} className="hp2-qchip !transition-all !duration-300 hover:!-translate-y-0.5 hover:!scale-[1.02]" onClick={() => goSurah(n)}>
                <span className="hp2-qchip__ar">{s?.ar}</span>
                <span className="hp2-qchip__sub">
                  {lang === "fr" ? label_fr : lang === "ar" ? s?.ar : label_en}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ════ BANDE STATS ════ */}
      <div className="hp2-stats-strip !relative !z-10 !rounded-2xl !border !border-white/12 !bg-[linear-gradient(145deg,rgba(8,20,46,0.9),rgba(7,16,34,0.94))] !p-3 !shadow-[0_10px_24px_rgba(6,14,34,0.32)]">
        {[
          {
            num: "114",
            icon: "fa-quran",
            labelFr: "Sourates",
            labelEn: "Surahs",
            labelAr: "سور",
          },
          {
            num: "30",
            icon: "fa-layer-group",
            labelFr: "Juz'",
            labelEn: "Juz",
            labelAr: "جزء",
          },
          {
            num: "6 236",
            icon: "fa-star",
            labelFr: "Versets",
            labelEn: "Ayahs",
            labelAr: "آية",
          },
          {
            num: "77 430",
            icon: "fa-font",
            labelFr: "Mots",
            labelEn: "Words",
            labelAr: "كلمة",
          },
        ].map((s, i) => (
          <div key={i} className="hp2-stats-strip__item !rounded-xl !border !border-white/10 !bg-white/[0.03] !transition-all !duration-300 hover:!bg-white/[0.08] hover:!-translate-y-0.5">
            <i className={`fas ${s.icon} hp2-stats-strip__icon`} />
            <span className="hp2-stats-strip__num">{s.num}</span>
            <span className="hp2-stats-strip__label">
              {lang === "ar"
                ? s.labelAr
                : lang === "fr"
                  ? s.labelFr
                  : s.labelEn}
            </span>
          </div>
        ))}
      </div>

      {/*  GRILLE PRINCIPALE  */}
      <div className="hp2-layout !relative !z-10">
        {/* Panneau latéral */}
        <aside className="hp2-aside">
          <div className="hp2-panel !rounded-2xl !border !border-white/12 !bg-[linear-gradient(160deg,rgba(9,20,48,0.9),rgba(7,16,35,0.92))] !backdrop-blur-md !shadow-[0_12px_26px_rgba(5,14,34,0.34)]">
            <div className="hp2-panel__tabs">
              {infoTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={cn(
                    "hp2-panel__tab",
                    activeInfo === tab.id && "hp2-panel__tab--on",
                  )}
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
              {activeInfo === "bookmarks" &&
                (bookmarks.length === 0 ? (
                  <EmptyState icon="fa-bookmark" text={t("noBookmarks")} />
                ) : (
                  bookmarks.slice(0, 10).map((bk) => {
                    const s = SURAHS[bk.surah - 1];
                    return (
                      <button
                        key={bk.id}
                        className="hp2-item"
                        onClick={() => goSurahAyah(bk.surah, bk.ayah)}
                      >
                        <span className="hp2-item__icon">
                          <i className="fas fa-bookmark" />
                        </span>
                        <div className="hp2-item__body">
                          <span className="hp2-item__ar">{s?.ar}</span>
                          <span className="hp2-item__sub">
                            {lang === "fr" ? s?.fr : s?.en} · v.{bk.ayah}
                            {bk.label && <em> — {bk.label}</em>}
                          </span>
                        </div>
                        <i
                          className={`fas fa-chevron-${isRtl ? "left" : "right"} hp2-item__caret`}
                        />
                      </button>
                    );
                  })
                ))}

              {activeInfo === "notes" &&
                (notes.length === 0 ? (
                  <EmptyState icon="fa-pen-line" text={t("noNotes")} />
                ) : (
                  notes.slice(0, 10).map((note) => {
                    const s = SURAHS[note.surah - 1];
                    return (
                      <button
                        key={note.id}
                        className="hp2-item"
                        onClick={() => goSurahAyah(note.surah, note.ayah)}
                      >
                        <span className="hp2-item__icon">
                          <i className="fas fa-pen-line" />
                        </span>
                        <div className="hp2-item__body">
                          <span className="hp2-item__ar">{s?.ar}</span>
                          <span className="hp2-item__sub">
                            {lang === "fr" ? s?.fr : s?.en} · v.{note.ayah}
                          </span>
                          {note.text && (
                            <span className="hp2-item__excerpt">
                              {note.text.slice(0, 70)}
                              {note.text.length > 70 ? "…" : ""}
                            </span>
                          )}
                        </div>
                        <i
                          className={`fas fa-chevron-${isRtl ? "left" : "right"} hp2-item__caret`}
                        />
                      </button>
                    );
                  })
                ))}

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
                      <button
                        key={n}
                        className="hp2-item"
                        onClick={() => goSurah(n)}
                      >
                        <span className="hp2-item__num">{n}</span>
                        <div className="hp2-item__body">
                          <span className="hp2-item__ar">{s.ar}</span>
                          <span className="hp2-item__sub">
                            {lang === "ar" ? arLabel : lang === "fr" ? fr : en}
                          </span>
                        </div>
                        <i
                          className={`fas fa-chevron-${isRtl ? "left" : "right"} hp2-item__caret`}
                        />
                      </button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        </aside>

        {/* Colonne sourates */}
        <section className="hp2-content !rounded-2xl !border !border-white/10 !bg-[linear-gradient(160deg,rgba(8,18,40,0.84),rgba(7,14,31,0.88))] !p-3.5 !backdrop-blur-md !shadow-[0_12px_28px_rgba(4,12,28,0.34)]">
          <div className="hp2-toolbar !rounded-xl !border !border-white/10 !bg-white/[0.03] !px-3 !py-2.5">
            {/* Onglets Sourates / Juz */}
            <div className="hp2-segs !rounded-xl !border !border-white/10 !bg-white/[0.03] !p-1">
              <button
                className={cn(
                  "hp2-seg !transition-all !duration-300 hover:!bg-white/10",
                  activeTab === "surah" && "hp2-seg--on",
                )}
                onClick={() => setActiveTab("surah")}
              >
                <i className="fas fa-align-justify" />
                {t("surahs")}
              </button>
              <button
                className={cn(
                  "hp2-seg !transition-all !duration-300 hover:!bg-white/10",
                  activeTab === "juz" && "hp2-seg--on",
                )}
                onClick={() => setActiveTab("juz")}
              >
                <i className="fas fa-book-open" />
                {t("juz")}
              </button>
            </div>

            {/* Recherche */}
            {activeTab === "surah" && (
              <div className="hp2-search !rounded-xl !border !border-white/12 !bg-white/[0.04] !backdrop-blur-sm">
                <i className="fas fa-magnifying-glass hp2-search__ico" />
                <input
                  className="hp2-search__input"
                  placeholder={t("search")}
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                {filter && (
                  <button
                    className="hp2-search__clear"
                    onClick={() => setFilter("")}
                  >
                    <i className="fas fa-xmark" />
                  </button>
                )}
              </div>
            )}

            {/* Tri + vue */}
            <div className="hp2-toolbar__end">
              <span className="hp2-toolbar__count">
                {activeTab === "surah"
                  ? filteredSurahs.length
                  : JUZ_DATA.length}
                <span>{activeTab === "surah" ? t("surahs") : t("juz")}</span>
              </span>
              {activeTab === "surah" && (
                <button
                  className="hp2-icon-btn !transition-all !duration-300 hover:!scale-110"
                  onClick={() =>
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                  }
                  title={sortDir === "asc" ? "Décroissant" : "Croissant"}
                >
                  <i
                    className={`fas fa-sort-${sortDir === "asc" ? "down" : "up"}`}
                  />
                </button>
              )}
              <button
                className={cn(
                  "hp2-icon-btn !transition-all !duration-300 hover:!scale-110",
                  viewMode === "grid" && "hp2-icon-btn--on",
                )}
                onClick={() => setViewMode("grid")}
                title="Grille"
              >
                <i className="fas fa-grip" />
              </button>
              <button
                className={cn(
                  "hp2-icon-btn !transition-all !duration-300 hover:!scale-110",
                  viewMode === "list" && "hp2-icon-btn--on",
                )}
                onClick={() => setViewMode("list")}
                title="Liste"
              >
                <i className="fas fa-list" />
              </button>
            </div>
          </div>

          <div
            className={cn(
              "hp2-items !mt-3",
              viewMode === "grid" ? "hp2-items--grid" : "hp2-items--list",
            )}
          >
            {activeTab === "surah" ? (
              filteredSurahs.length === 0 ? (
                <EmptyState icon="fa-magnifying-glass" text={t("noResults")} />
              ) : (
                filteredSurahs.map((s, idx) => (
                  <SurahCard
                    key={s.n}
                    surah={s}
                    lang={lang}
                    viewMode={viewMode}
                    onClick={goSurah}
                    onPlay={playFromHome}
                    isActive={s.n === currentSurah && displayMode === "surah"}
                    isPlaying={
                      state.isPlaying && state.currentPlayingAyah?.surah === s.n
                    }
                    animIndex={idx}
                  />
                ))
              )
            ) : (
              JUZ_DATA.map((j, idx) => (
                <JuzCard
                  key={j.juz}
                  juzData={j}
                  lang={lang}
                  viewMode={viewMode}
                  onClick={goJuz}
                  isActive={j.juz === currentJuz && displayMode === "juz"}
                  animIndex={idx}
                />
              ))
            )}
          </div>
        </section>
      </div>

      {/* ════ FOOTER ════ */}
      <div className="relative z-10">
        <Footer goSurah={goSurah} />
      </div>
    </div>
  );
}
