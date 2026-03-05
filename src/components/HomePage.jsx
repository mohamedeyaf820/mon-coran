import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "../context/AppContext";
import SURAHS, { toAr } from "../data/surahs";
import { JUZ_DATA } from "../data/juz";
import { getAllBookmarks, getAllNotes } from "../services/storageService";
import { cn } from "../lib/utils";

/* ─── Sourates d'accès rapide ─── */
const QUICK_ACCESS = [
  { n: 1,   icon: "fa-mosque",        label_fr: "Al-Fatiha",  label_en: "The Opening"  },
  { n: 18,  icon: "fa-mountain-sun",  label_fr: "Al-Kahf",    label_en: "The Cave"     },
  { n: 36,  icon: "fa-star-and-crescent", label_fr: "Ya-Sin", label_en: "Ya-Sin"       },
  { n: 55,  icon: "fa-leaf",          label_fr: "Ar-Rahman",  label_en: "The Merciful" },
  { n: 67,  icon: "fa-moon",          label_fr: "Al-Mulk",    label_en: "Sovereignty"  },
  { n: 112, icon: "fa-infinity",      label_fr: "Al-Ikhlas",  label_en: "Sincerity"    },
  { n: 113, icon: "fa-sun",           label_fr: "Al-Falaq",   label_en: "The Dawn"     },
  { n: 114, icon: "fa-shield-halved", label_fr: "An-Nas",     label_en: "Mankind"      },
];

/* ─── Versets du jour ─── */
const DAILY_VERSES = [
  { text: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", ref: "Al-Inshirah • 94:6" },
  { text: "وَمَن يَتَّقِ اللَّهَ يَجْعَل لَّهُ مَخْرَجًا", ref: "At-Talaq • 65:2" },
  { text: "وَاللَّهُ يُحِبُّ الصَّابِرِينَ", ref: "Al-Imran • 3:146" },
  { text: "فَإِنَّ مَعَ الْعُسْرِ يُسْرًا", ref: "Al-Inshirah • 94:5" },
  { text: "وَتَوَكَّلْ عَلَى اللَّهِ", ref: "Al-Ahzab • 33:3" },
  { text: "وَقُل رَّبِّ زِدْنِي عِلْمًا", ref: "Ta-Ha • 20:114" },
  { text: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", ref: "Al-Baqara • 2:153" },
];

/* ─── Type badge ─── */
const TYPE_INFO = {
  Meccan:  { fr: "Mecquoise", en: "Meccan",  cls: "hm-badge--meccan"  },
  Medinan: { fr: "Médinoise", en: "Medinan", cls: "hm-badge--medinan" },
};

/* ─────────────────────────────── */
/* Surah row (like QWB)            */
/* ─────────────────────────────── */
function SurahRow({ surah, onClick, isActive, lang }) {
  const ti = TYPE_INFO[surah.type] || TYPE_INFO.Meccan;
  return (
    <button
      className={cn("hm-surah-row", isActive && "hm-surah-row--active")}
      onClick={() => onClick(surah.n)}
    >
      <div className="hm-row-num-badge">{toAr(surah.n)}</div>
      <div className="hm-row-meta">
        <span className="hm-row-name-en">{surah.fr}</span>
        <span className="hm-row-ayah-count">
          {toAr(surah.ayahs)} {lang === "fr" ? "versets" : "ayat"}
          <span className={cn("hm-mini-badge", ti.cls)}>
            {lang === "fr" ? ti.fr : ti.en}
          </span>
        </span>
      </div>
      <div className="hm-row-name-ar">{surah.ar}</div>
    </button>
  );
}

/* ─── Juz row ─── */
function JuzRow({ juzData, onClick, isActive, lang }) {
  const { juz, name } = juzData;
  const startSurah = SURAHS[juzData.start.s - 1];
  return (
    <button
      className={cn("hm-surah-row", isActive && "hm-surah-row--active")}
      onClick={() => onClick(juz)}
    >
      <div className="hm-row-num-badge hm-row-num-badge--juz">{toAr(juz)}</div>
      <div className="hm-row-meta">
        <span className="hm-row-name-en">Juz {juz}</span>
        <span className="hm-row-ayah-count">
          {lang === "fr" ? "Début" : "Starts"}: {startSurah?.fr || startSurah?.en}
        </span>
      </div>
      <div className="hm-row-name-ar">{name}</div>
    </button>
  );
}

/* ─── Quick pill ─── */
function QuickPill({ item, lang, onClick }) {
  const s = SURAHS[item.n - 1];
  return (
    <button className="hm-quick-pill" onClick={() => onClick(item.n)}>
      <span className="hm-quick-icon">
        <i className={`fas ${item.icon}`}></i>
      </span>
      <span className="hm-quick-ar">{s?.ar}</span>
      <span className="hm-quick-en">{lang === "fr" ? item.label_fr : item.label_en}</span>
    </button>
  );
}

/* ─────────────────────────────── */
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
    set({ displayMode: "surah", showHome: false });
    dispatch({ type: "NAVIGATE_SURAH", payload: { surah: n, ayah: 1 } });
  };

  const goJuz = juz => {
    set({ showHome: false });
    dispatch({ type: "NAVIGATE_JUZ", payload: { juz } });
  };

  const continueReading = () => {
    set({ showHome: false });
    if (displayMode === "juz") {
      dispatch({ type: "NAVIGATE_JUZ", payload: { juz: currentJuz } });
    } else {
      dispatch({ type: "NAVIGATE_SURAH", payload: { surah: currentSurah, ayah: currentAyah } });
    }
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

  const dailyVerse = useMemo(() => {
    return DAILY_VERSES[Math.floor(Date.now() / 86400000) % DAILY_VERSES.length];
  }, []);

  const surahLabel = SURAHS[currentSurah - 1];
  const riwayaLabel = riwaya === "warsh"
    ? "رواية ورش عن نافع"
    : "رواية حفص عن عاصم";

  return (
    <div className="hm-page">

      {/* ═══════════════ HERO ═══════════════ */}
      <section className="hm-hero">
        {/* Geometric SVG background decoration */}
        <svg className="hm-hero-geom" viewBox="0 0 500 300" aria-hidden="true">
          <g stroke="currentColor" fill="none" opacity="0.12">
            <circle cx="420" cy="60"  r="110" strokeWidth="0.8"/>
            <circle cx="420" cy="60"  r="75"  strokeWidth="0.6"/>
            <circle cx="420" cy="60"  r="45"  strokeWidth="0.5"/>
            <line x1="420" y1="-50" x2="420" y2="170" strokeWidth="0.5"/>
            <line x1="310" y1="60"  x2="530" y2="60"  strokeWidth="0.5"/>
            <line x1="342" y1="-18" x2="498" y2="138" strokeWidth="0.4"/>
            <line x1="342" y1="138" x2="498" y2="-18" strokeWidth="0.4"/>
            <polygon points="420,5 465,82 375,82" strokeWidth="0.7" opacity="0.6"/>
          </g>
        </svg>

        <div className="hm-hero-body">
          <div className="hm-hero-left">
            <span className="hm-riwaya-chip">
              <i className="fas fa-book-quran"></i>
              {riwayaLabel}
            </span>
            <h1 className="hm-hero-title">
              القرآن الكريم
            </h1>
            <p className="hm-hero-sub">
              {lang === "fr"
                ? "Votre compagnon pour lire, écouter et mémoriser le Saint Coran"
                : "Your companion for reading, listening to, and memorizing the Holy Quran"}
            </p>
          </div>

          <div className="hm-hero-verse">
            <span className="hm-verse-label">
              <i className="fas fa-sparkles"></i>
              {lang === "fr" ? "Verset du jour" : "Verse of the day"}
            </span>
            <p className="hm-verse-text">{dailyVerse.text}</p>
            <span className="hm-verse-ref">{dailyVerse.ref}</span>
          </div>
        </div>
      </section>

      {/* ═══════════════ CONTINUER LA LECTURE ═══════════════ */}
      <div className="hm-section">
        <button className="hm-continue" onClick={continueReading}>
          <div className="hm-continue-icon">
            <i className="fas fa-book-open-reader"></i>
          </div>
          <div className="hm-continue-body">
            <span className="hm-continue-label">
              {lang === "fr" ? "Continuer la lecture" : "Continue Reading"}
            </span>
            <span className="hm-continue-pos">
              {surahLabel?.ar}
              <span className="hm-continue-dot">·</span>
              {lang === "fr" ? "Verset" : "Ayah"} {toAr(currentAyah)}
            </span>
          </div>
          <i className="fas fa-chevron-left hm-continue-arrow"></i>
        </button>
      </div>

      {/* ═══════════════ ACCèS RAPIDE ═══════════════ */}
      <div className="hm-section">
        <h2 className="hm-sec-title">
          {lang === "fr" ? "Sourates fréquentes" : "Frequent Surahs"}
        </h2>
        <div className="hm-quick-strip">
          {QUICK_ACCESS.map(item => (
            <QuickPill key={item.n} item={item} lang={lang} onClick={goSurah} />
          ))}
        </div>
      </div>

      {/* ═══════════════ FAVORIS / NOTES / SUGGESTIONS ═══════════════ */}
      <div className="hm-section">
        <div className="hm-tabs">
          {[
            { id: "bookmarks", fr: `Favoris (${bookmarks.length})`,  en: `Saved (${bookmarks.length})`,  icon: "fa-bookmark" },
            { id: "notes",     fr: `Notes (${notes.length})`,         en: `Notes (${notes.length})`,       icon: "fa-pen-line" },
            { id: "suggest",   fr: "Suggestions",                      en: "Suggestions",                  icon: "fa-lightbulb" },
          ].map(tab => (
            <button
              key={tab.id}
              className={cn("hm-tab", activeInfo === tab.id && "hm-tab--on")}
              onClick={() => setActiveInfo(tab.id)}
            >
              <i className={`fas ${tab.icon}`}></i>
              {lang === "fr" ? tab.fr : tab.en}
            </button>
          ))}
        </div>

        <div className="hm-tab-pane">
          {activeInfo === "bookmarks" && (
            bookmarks.length === 0
              ? <EmptyState icon="fa-bookmark"
                  text={lang === "fr"
                    ? "Aucun favori — appuyez sur ★ sur un verset"
                    : "No bookmarks yet — tap ★ on any ayah"} />
              : bookmarks.slice(0, 8).map(bk => {
                  const s = SURAHS[bk.surah - 1];
                  return (
                    <button key={bk.id} className="hm-list-row" onClick={() => goSurah(bk.surah)}>
                      <span className="hm-list-icon"><i className="fas fa-bookmark"></i></span>
                      <div className="hm-list-info">
                        <span className="hm-list-ar">{s?.ar}</span>
                        <span className="hm-list-sub">
                          {s?.fr} · {lang === "fr" ? "v." : "ayah "}{bk.ayah}
                          {bk.label && <em className="hm-list-note"> · {bk.label}</em>}
                        </span>
                      </div>
                      <i className="fas fa-chevron-left hm-list-caret"></i>
                    </button>
                  );
                })
          )}

          {activeInfo === "notes" && (
            notes.length === 0
              ? <EmptyState icon="fa-pen-line"
                  text={lang === "fr"
                    ? "Aucune note — appuyez sur le crayon sur un verset"
                    : "No notes yet — tap the pen on any ayah"} />
              : notes.slice(0, 8).map(note => {
                  const s = SURAHS[note.surah - 1];
                  return (
                    <button key={note.id} className="hm-list-row" onClick={() => goSurah(note.surah)}>
                      <span className="hm-list-icon"><i className="fas fa-pen-line"></i></span>
                      <div className="hm-list-info">
                        <span className="hm-list-ar">{s?.ar}</span>
                        <span className="hm-list-sub">{s?.fr} · {lang === "fr" ? "v." : "ayah "}{note.ayah}</span>
                        {note.text && (
                          <span className="hm-list-excerpt">
                            {note.text.slice(0, 90)}{note.text.length > 90 ? "…" : ""}
                          </span>
                        )}
                      </div>
                      <i className="fas fa-chevron-left hm-list-caret"></i>
                    </button>
                  );
                })
          )}

          {activeInfo === "suggest" && [
            { n: 18,  fr: "Sourate du vendredi",     en: "Friday Surah"        },
            { n: 36,  fr: "Cœur du Coran",      en: "Heart of Quran"      },
            { n: 55,  fr: "Ar-Rahmân — La Grâce", en: "Ar-Rahman — Grace" },
            { n: 67,  fr: "Rappel du soir",           en: "Night Reminder"      },
            { n: 112, fr: "Le Mono-théisme pur", en: "Pure Tawhid"         },
            { n: 113, fr: "Protection matinale",      en: "Morning Guard"       },
            { n: 114, fr: "Protection contre le mal", en: "Against Evil"        },
          ].map(({ n, fr, en }) => {
            const s = SURAHS[n - 1];
            return (
              <button key={n} className="hm-list-row" onClick={() => goSurah(n)}>
                <span className="hm-list-num">{toAr(n)}</span>
                <div className="hm-list-info">
                  <span className="hm-list-ar">{s.ar}</span>
                  <span className="hm-list-sub">{lang === "fr" ? fr : en}</span>
                </div>
                <i className="fas fa-chevron-left hm-list-caret"></i>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════ SURAH / JUZ LIST ═══════════════ */}
      <div className="hm-section hm-section--list">

        {/* Controls row */}
        <div className="hm-list-controls">
          <div className="hm-seg">
            <button
              className={cn("hm-seg-btn", activeTab === "surah" && "hm-seg-btn--on")}
              onClick={() => setActiveTab("surah")}
            >
              {lang === "fr" ? "Sourates" : "Surahs"}
            </button>
            <button
              className={cn("hm-seg-btn", activeTab === "juz" && "hm-seg-btn--on")}
              onClick={() => setActiveTab("juz")}
            >
              Juz
            </button>
          </div>

          <div className="hm-search-box">
            <i className="fas fa-magnifying-glass hm-search-ico"></i>
            <input
              className="hm-search-input"
              placeholder={lang === "fr" ? "Rechercher…" : "Search…"}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            {filter && (
              <button className="hm-search-clear" onClick={() => setFilter("")}>
                <i className="fas fa-xmark"></i>
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="hm-list">
          {activeTab === "surah" ? (
            filteredSurahs.length === 0
              ? <EmptyState icon="fa-magnifying-glass"
                  text={lang === "fr" ? "Aucune sourate trouvée" : "No surah found"} />
              : filteredSurahs.map(s => (
                  <SurahRow
                    key={s.n} surah={s} lang={lang}
                    onClick={goSurah}
                    isActive={s.n === currentSurah && displayMode === "surah"}
                  />
                ))
          ) : (
            JUZ_DATA.map(j => (
              <JuzRow
                key={j.juz} juzData={j} lang={lang}
                onClick={goJuz}
                isActive={j.juz === currentJuz && displayMode === "juz"}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
}

/* ─── Helper: empty state ─── */
function EmptyState({ icon, text }) {
  return (
    <div className="hm-empty">
      <i className={`fas ${icon} hm-empty-ico`}></i>
      <p className="hm-empty-txt">{text}</p>
    </div>
  );
}
