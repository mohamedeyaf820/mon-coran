/* ══════════════════════════════════════════════════════════════
   HomePage — Design moderne bicolonne
   Gauche : Favoris / Notes / Suggestions
   Droite : Liste Sourates / Juz avec recherche
   ══════════════════════════════════════════════════════════════ */
import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA } from "../data/juz";
import { getAllBookmarks, getAllNotes } from "../services/storageService";
import { cn } from "../lib/utils";

/* ─── Sourates d'accès rapide ─── */
const QUICK_ACCESS = [
  { n: 1,   icon: "fa-mosque",            label_fr: "Al-Fatiha",  label_en: "The Opening"  },
  { n: 18,  icon: "fa-mountain-sun",      label_fr: "Al-Kahf",    label_en: "The Cave"     },
  { n: 36,  icon: "fa-star-and-crescent", label_fr: "Ya-Sin",     label_en: "Ya-Sin"       },
  { n: 55,  icon: "fa-leaf",              label_fr: "Ar-Rahman",  label_en: "The Merciful" },
  { n: 67,  icon: "fa-moon",              label_fr: "Al-Mulk",    label_en: "Sovereignty"  },
  { n: 112, icon: "fa-infinity",          label_fr: "Al-Ikhlas",  label_en: "Sincerity"    },
  { n: 113, icon: "fa-sun",               label_fr: "Al-Falaq",   label_en: "The Dawn"     },
  { n: 114, icon: "fa-shield-halved",     label_fr: "An-Nas",     label_en: "Mankind"      },
];

/* ─── Versets du jour ─── */
const DAILY_VERSES = [
  { text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",               ref: "Al-Inshirah · 94:6" },
  { text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا", ref: "At-Talaq · 65:2"    },
  { text: "وَاللَّهُ يُحِبُّ الصَّابِرِينَ",            ref: "Âl-Imrân · 3:146"   },
  { text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا",              ref: "Al-Inshirah · 94:5" },
  { text: "وَتَوَكَّلْ عَلَى اللَّهِ",                   ref: "Al-Ahzab · 33:3"    },
  { text: "وَقُل رَّبِّ زِدْنِي عِلْمًا",                ref: "Ta-Ha · 20:114"     },
  { text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",            ref: "Al-Baqara · 2:153"  },
];

/* ─── Type badge info ─── */
const TYPE_INFO = {
  Meccan:  { fr: "Mecquoise", en: "Meccan",  ar: "مكية",  cls: "hp-badge--meccan"  },
  Medinan: { fr: "Médinoise", en: "Medinan", ar: "مدنية", cls: "hp-badge--medinan" },
};

/* ─── Composant carte sourate (grille) ─── */
function SurahCard({ surah, onClick, isActive, lang }) {
  const ti = TYPE_INFO[surah.type] || TYPE_INFO.Meccan;
  return (
    <button
      className={cn("hp-surah-row", isActive && "hp-surah-row--active")}
      onClick={() => onClick(surah.n)}
    >
      <div className="hp-card-top">
        <span className={cn("hp-num", isActive && "hp-num--active")}>
          {lang === "ar" ? toAr(surah.n) : surah.n}
        </span>
        <span className={cn("hp-type-badge", ti.cls)}>
          {lang === "ar" ? ti.ar : lang === "fr" ? ti.fr : ti.en}
        </span>
      </div>
      <span className="hp-card-ar">{surah.ar}</span>
      <div className="hp-card-names">
        <span className="hp-card-en">{surah.en}</span>
        <span className="hp-card-fr">({surah.fr})</span>
      </div>
      <span className="hp-card-sub">
        {surah.ayahs}&nbsp;{lang === "fr" ? "versets" : lang === "ar" ? "آية" : "ayahs"}
      </span>
    </button>
  );
}

/* ─── Composant carte juz ─── */
function JuzCard({ juzData, onClick, isActive, lang }) {
  const { juz, name } = juzData;
  const startSurah = SURAHS[juzData.start.s - 1];
  return (
    <button
      className={cn("hp-surah-row", isActive && "hp-surah-row--active")}
      onClick={() => onClick(juz)}
    >
      <div className="hp-card-top">
        <span className={cn("hp-num hp-num--juz", isActive && "hp-num--active")}>
          {lang === "ar" ? toAr(juz) : juz}
        </span>
      </div>
      <span className="hp-card-ar">{name}</span>
      <div className="hp-card-names">
        <span className="hp-card-en">Juz {juz}</span>
        <span className="hp-card-fr">
          {lang === "fr" ? "Début" : "Starts"}&nbsp;:&nbsp;{startSurah?.fr || startSurah?.en}
        </span>
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

  const [activeTab,  setActiveTab]  = useState("surah");
  const [activeInfo, setActiveInfo] = useState("bookmarks");
  const [bookmarks,  setBookmarks]  = useState([]);
  const [notes,      setNotes]      = useState([]);
  const [filter,     setFilter]     = useState("");

  useEffect(() => {
    getAllBookmarks().then(bks =>
      setBookmarks((bks || []).sort((a, b) => b.createdAt - a.createdAt))
    );
    getAllNotes().then(ns =>
      setNotes((ns || []).sort((a, b) => b.updatedAt - a.updatedAt))
    );
  }, []);

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
    if (!filter.trim()) return SURAHS;
    const q = filter.toLowerCase();
    return SURAHS.filter(s =>
      s.ar.includes(filter) ||
      s.en.toLowerCase().includes(q) ||
      s.fr.toLowerCase().includes(q) ||
      String(s.n) === filter.trim()
    );
  }, [filter]);

  const dailyVerse = useMemo(() =>
    DAILY_VERSES[Math.floor(Date.now() / 86400000) % DAILY_VERSES.length],
  []);

  const surahLabel   = SURAHS[currentSurah - 1];
  const riwayaLabel  = riwaya === "warsh"
    ? (lang === "fr" ? "Rasm Warsh · Riwāya Warsh" : "رواية ورش عن نافع")
    : (lang === "fr" ? "Rasm Ḥafs · Riwāya Ḥafs"  : "رواية حفص عن عاصم");

  const infoTabs = [
    { id: "bookmarks", fr: `Favoris (${bookmarks.length})`, en: `Saved (${bookmarks.length})`,  ar: `المفضلة`, icon: "fa-bookmark"  },
    { id: "notes",     fr: `Notes (${notes.length})`,       en: `Notes (${notes.length})`,       ar: `ملاحظات`, icon: "fa-pen-line"  },
    { id: "suggest",   fr: "Suggestions",                    en: "Suggestions",                   ar: "اقتراحات", icon: "fa-lightbulb" },
  ];

  return (
    <div className="hp-page">

      {/* ══════════════ HERO ══════════════ */}
      <section className="hp-hero">
        {/* Orbes décoratifs flottants */}
        <div className="hp-orb hp-orb--1" aria-hidden="true" />
        <div className="hp-orb hp-orb--2" aria-hidden="true" />
        <div className="hp-orb hp-orb--3" aria-hidden="true" />
        {/* Motif arabesque SVG */}
        <svg className="hp-hero-svg" viewBox="0 0 600 220" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="hpG" cx="80%" cy="50%" r="55%">
              <stop offset="0%"   stopColor="rgba(212,175,55,0.2)"/>
              <stop offset="100%" stopColor="rgba(212,175,55,0)"/>
            </radialGradient>
          </defs>
          <rect width="600" height="220" fill="url(#hpG)"/>
          <g stroke="rgba(255,255,255,0.08)" fill="none">
            <circle cx="530" cy="110" r="140" strokeWidth="0.9"/>
            <circle cx="530" cy="110" r="100" strokeWidth="0.7"/>
            <circle cx="530" cy="110" r="65"  strokeWidth="0.5"/>
            <line x1="390" y1="110" x2="670" y2="110" strokeWidth="0.5"/>
            <line x1="530" y1="-30" x2="530" y2="250" strokeWidth="0.5"/>
            <polygon points="530,45 586,152 474,152" strokeWidth="0.7" opacity="0.45"/>
          </g>
        </svg>

        <div className="hp-hero-inner">
          {/* Texte gauche */}
          <div className="hp-hero-left">
            <div className="hp-riwaya-chip">
              <i className="fas fa-book-quran"></i>
              <span>{riwayaLabel}</span>
            </div>
            <h1 className="hp-hero-title">القرآن الكريم</h1>
            <p className="hp-hero-sub">
              {lang === "ar"
                ? "رفيقك في تلاوة القرآن الكريم وحفظه والتدبر فيه"
                : lang === "fr"
                ? "Votre compagnon pour lire, écouter et mémoriser le Saint Coran"
                : "Your companion for reading, listening to & memorizing the Holy Quran"}
            </p>
            <button className="hp-continue-btn" onClick={continueReading}>
              <span className="hp-continue-icon"><i className="fas fa-book-open-reader"></i></span>
              <div className="hp-continue-text">
                <span className="hp-continue-label">
                  {lang === "ar" ? "متابعة القراءة" : lang === "fr" ? "Continuer la lecture" : "Continue reading"}
                </span>
                <span className="hp-continue-pos">
                  <span style={{ fontFamily: "'Scheherazade New','Amiri Quran',serif", fontSize: "1rem" }}>
                    {surahLabel?.ar}
                  </span>
                  <span className="hp-dot">·</span>
                  {lang === "fr" ? "Verset" : lang === "ar" ? "آية" : "Ayah"}&nbsp;{toAr(currentAyah)}
                </span>
              </div>
              <i className="fas fa-arrow-left hp-continue-arrow"></i>
            </button>
            <button className="hp-duas-btn" onClick={openDuas}>
              <i className="fas fa-hands-praying" aria-hidden="true"></i>
              <span>{lang === "ar" ? "صفحة الأدعية" : lang === "fr" ? "Ouvrir la page Douas" : "Open Duas page"}</span>
            </button>
          </div>

          {/* Verset du jour */}
          <div className="hp-verse-card">
            <div className="hp-verse-badge">
              <i className="fas fa-sparkles"></i>
              {lang === "ar" ? "آية اليوم" : lang === "fr" ? "Verset du jour" : "Verse of the day"}
            </div>
            <p className="hp-verse-text">{dailyVerse.text}</p>
            <span className="hp-verse-ref">{dailyVerse.ref}</span>
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
            icon: "fa-layer-group", cls: "--primary",
            label: lang === "fr" ? "Juz actuel" : lang === "ar" ? "الجزء" : "Current Juz",
            value: currentJuz,
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
                  <i className={`fas ${tab.icon}`}></i>
                  <span>{lang === "ar" ? tab.ar : lang === "fr" ? tab.fr : tab.en}</span>
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

              {activeInfo === "suggest" && [
                { n: 18,  fr: "Sourate du vendredi",      en: "Friday Surah"      },
                { n: 36,  fr: "Cœur du Coran",            en: "Heart of Quran"    },
                { n: 55,  fr: "Ar-Rahmân — La Grâce",     en: "Ar-Rahman — Grace" },
                { n: 67,  fr: "Rappel du soir",            en: "Night Reminder"    },
                { n: 112, fr: "Le Monothéisme pur",        en: "Pure Tawhid"       },
                { n: 113, fr: "Protection matinale",       en: "Morning Guard"     },
                { n: 114, fr: "Protection contre le mal",  en: "Against Evil"      },
              ].map(({ n, fr, en }) => {
                const s = SURAHS[n - 1];
                return (
                  <button key={n} className="hp-info-row" onClick={() => goSurah(n)}>
                    <span className="hp-info-num">{toAr(n)}</span>
                    <div className="hp-info-body">
                      <span className="hp-info-ar">{s.ar}</span>
                      <span className="hp-info-sub">{lang === "fr" ? fr : en}</span>
                    </div>
                    <i className="fas fa-chevron-left hp-info-caret"></i>
                  </button>
                );
              })}
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
          </div>

          <div className="hp-list">
            {activeTab === "surah" ? (
              filteredSurahs.length === 0
                ? <EmptyState icon="fa-magnifying-glass"
                    text={lang === "ar" ? "لم يتم العثور على سورة" : lang === "fr" ? "Aucune sourate trouvée" : "No surah found"} />
                : filteredSurahs.map(s => (
                    <SurahCard
                      key={s.n} surah={s} lang={lang}
                      onClick={goSurah}
                      isActive={s.n === currentSurah && displayMode === "surah"}
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

