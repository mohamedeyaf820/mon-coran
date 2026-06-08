import React from "react";
import { BookOpen, Clock, Hash, Layers, MapPin, Sparkles } from "lucide-react";
import { getJuzForAyah } from "../../data/juz";
import { getSurah } from "../../data/surahs";
import { useApp } from "../../context/AppContext";

function lbl(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

function StatTile({ icon: Icon, label, value, accent = false, gold = false }) {
  return (
    <div
      className={[
        "sip-tile",
        accent ? "sip-tile--accent" : "",
        gold ? "sip-tile--gold" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="sip-tile__icon" aria-hidden="true">
        <Icon size={14} />
      </div>
      <div className="sip-tile__body">
        <span className="sip-tile__value">{value}</span>
        <span className="sip-tile__label">{label}</span>
      </div>
    </div>
  );
}

export default function SurahInfoPanel({ surahNum, lang: langProp }) {
  const { state } = useApp();
  const lang = langProp || state?.lang || "fr";
  const s = getSurah(surahNum);
  if (!s) return null;

  const isMeccan = s.type === "Meccan";
  const revelation = isMeccan
    ? lbl(lang, "Mecquoise", "Meccan", "مكية")
    : lbl(lang, "Médinoise", "Medinan", "مدنية");
  const juzStart = getJuzForAyah(surahNum, 1);
  const readingMinutes = Math.max(1, Math.ceil(s.ayahs / 18));
  const sizeLabel =
    s.ayahs <= 20
      ? lbl(lang, "Courte", "Short", "قصيرة")
      : s.ayahs <= 90
        ? lbl(lang, "Moyenne", "Medium", "متوسطة")
        : lbl(lang, "Longue", "Long", "طويلة");
  const displayName =
    lang === "ar" ? s.ar : lang === "fr" ? s.fr || s.en : s.en;

  return (
    <section
      className="sip-root"
      aria-label={lbl(
        lang,
        "Informations sur la sourate",
        "Surah information",
        "معلومات السورة",
      )}
    >
      {/* Header */}
      <div className="sip-header">
        <div className="sip-header__icon" aria-hidden="true">
          <Sparkles size={16} />
        </div>
        <div className="sip-header__text">
          <strong className="sip-header__name">{displayName}</strong>
          <span className="sip-header__desc">
            {lbl(
              lang,
              "Fiche rapide pour situer la sourate avant la lecture.",
              "Quick reference before reading this surah.",
              "معلومات سريعة عن السورة.",
            )}
          </span>
        </div>
        {/* Arabic name badge */}
        <div
          className="sip-header__arabic"
          dir="rtl"
          lang="ar"
          aria-hidden="true"
        >
          {s.ar}
        </div>
      </div>

      {/* Stats grid */}
      <div className="sip-grid">
        <StatTile
          icon={Hash}
          label={lbl(lang, "Sourate", "Surah", "سورة")}
          value={`#${surahNum}`}
        />
        <StatTile
          icon={BookOpen}
          label={lbl(lang, "Versets", "Verses", "آيات")}
          value={s.ayahs}
        />
        <StatTile
          icon={MapPin}
          label={lbl(lang, "Révélation", "Revelation", "النزول")}
          value={revelation}
          gold={isMeccan}
          accent={!isMeccan}
        />
        <StatTile
          icon={Layers}
          label={lbl(lang, "Juz début", "Start juz", "الجزء")}
          value={`Juz ${juzStart}`}
        />
        <StatTile
          icon={BookOpen}
          label={lbl(lang, "Page", "Page", "الصفحة")}
          value={`P. ${s.page}`}
        />
        <StatTile
          icon={Clock}
          label={sizeLabel}
          value={`~${readingMinutes} min`}
        />
      </div>
    </section>
  );
}
