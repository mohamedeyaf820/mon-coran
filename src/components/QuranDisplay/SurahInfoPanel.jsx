import React from "react";
import { BookOpen, Clock3, Hash, Layers3, MapPin, Sparkles } from "lucide-react";
import { getJuzForAyah } from "../../data/juz";
import { getSurah } from "../../data/surahs";

function labelFor(lang, fr, en) {
  return lang === "fr" ? fr : en;
}

function StatCard({ icon: Icon, label, value, tone = "primary" }) {
  return (
    <div className={`surah-info-card surah-info-card--${tone}`}>
      <span className="surah-info-card__icon" aria-hidden="true">
        <Icon size={16} />
      </span>
      <span className="surah-info-card__value">{value}</span>
      <span className="surah-info-card__label">{label}</span>
    </div>
  );
}

export default function SurahInfoPanel({ surahNum, lang }) {
  const s = getSurah(surahNum);
  if (!s) return null;

  const revelation =
    s.type === "Meccan"
      ? labelFor(lang, "Mecquoise", "Meccan")
      : labelFor(lang, "Medinoise", "Medinan");
  const juzStart = getJuzForAyah(surahNum, 1);
  const readingMinutes = Math.max(1, Math.ceil(s.ayahs / 18));
  const sizeLabel =
    s.ayahs <= 20
      ? labelFor(lang, "Courte", "Short")
      : s.ayahs <= 90
        ? labelFor(lang, "Moyenne", "Medium")
        : labelFor(lang, "Longue", "Long");
  const displayName = lang === "en" ? s.en : s.fr || s.en;

  return (
    <section
      className="surah-info-inline"
      aria-label={labelFor(lang, "Informations sur la sourate", "Surah information")}
    >
      <div className="surah-info-inline__intro">
        <span className="surah-info-inline__mark" aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <div>
          <strong>{displayName}</strong>
          <span>
            {labelFor(
              lang,
              "Fiche rapide pour situer la sourate avant la lecture.",
              "Quick reference before reading this surah.",
            )}
          </span>
        </div>
      </div>

      <div className="surah-info-inline__grid">
        <StatCard icon={Hash} label={labelFor(lang, "Sourate", "Surah")} value={surahNum} />
        <StatCard icon={BookOpen} label={labelFor(lang, "Versets", "Verses")} value={s.ayahs} />
        <StatCard
          icon={MapPin}
          label={labelFor(lang, "Revelation", "Revelation")}
          value={revelation}
          tone={s.type === "Meccan" ? "gold" : "primary"}
        />
        <StatCard icon={Layers3} label={labelFor(lang, "Juz debut", "Start juz")} value={juzStart} />
        <StatCard icon={BookOpen} label={labelFor(lang, "Page", "Page")} value={s.page} />
        <StatCard icon={Clock3} label={sizeLabel} value={`${readingMinutes} min`} tone="soft" />
      </div>
    </section>
  );
}
