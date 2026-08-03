import { useEffect, useState } from "react";
import { BookOpen, Hash, Layers, MapPin } from "lucide-react";
import { getJuzForAyah } from "../../data/juz";
import { getSurah } from "../../data/surahs";
import { useApp } from "../../context/AppContext";
import { fetchQuranComSurahInfo } from "../../services/quranComAPI";

function lbl(lang, fr, en, ar = en) {
  return lang === "ar" ? ar : lang === "fr" ? fr : en;
}

function StatTile({ icon: Icon, label, value, tone = "" }) {
  return (
    <div className={`sip-tile${tone ? ` sip-tile--${tone}` : ""}`}>
      <span className="sip-tile__icon" aria-hidden="true"><Icon size={15} /></span>
      <span className="sip-tile__body">
        <strong className="sip-tile__value">{value}</strong>
        <span className="sip-tile__label">{label}</span>
      </span>
    </div>
  );
}

export default function SurahInfoPanel({ surahNum, lang: langProp }) {
  const { state } = useApp();
  const lang = langProp || state?.lang || "fr";
  const s = getSurah(surahNum);
  const detailsId = `surah-dossier-${surahNum}`;
  const [editorialInfo, setEditorialInfo] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setEditorialInfo(null);
    fetchQuranComSurahInfo(surahNum, controller.signal)
      .then(setEditorialInfo)
      .catch((error) => error?.name !== "AbortError" && setEditorialInfo(false));
    return () => controller.abort();
  }, [surahNum]);

  if (!s) return null;

  const isMeccan = /makk|mecc/i.test(editorialInfo?.revelationPlace || s.type);
  const revelation = isMeccan
    ? lbl(lang, "Mecquoise", "Meccan", "مكية")
    : lbl(lang, "Médinoise", "Medinan", "مدنية");
  const displayName = lang === "ar" ? s.ar : lang === "fr" ? s.fr || s.en : s.en;
  const pageRange = editorialInfo?.pages?.length > 1
    ? `${editorialInfo.pages[0]}–${editorialInfo.pages.at(-1)}`
    : s.page;
  const dossierBlocks = editorialInfo?.text?.split("\n\n").filter(Boolean) || [];
  const stats = [
    [Hash, lbl(lang, "Sourate", "Surah", "سورة"), `#${surahNum}`],
    [BookOpen, lbl(lang, "Versets", "Verses", "آيات"), s.ayahs],
    [MapPin, lbl(lang, "Révélation", "Revelation", "النزول"), revelation, isMeccan ? "gold" : "accent"],
    [Hash, lbl(lang, "Ordre révélé", "Revelation order", "ترتيب النزول"), editorialInfo?.revelationOrder ? `#${editorialInfo.revelationOrder}` : "—"],
    [Layers, lbl(lang, "Juz de départ", "Starting juz", "بداية الجزء"), `${lbl(lang, "Juz", "Juz", "الجزء")} ${getJuzForAyah(surahNum, 1)}`],
    [BookOpen, lbl(lang, "Pages du Mushaf", "Mushaf pages", "صفحات المصحف"), pageRange],
  ];

  return (
    <section className="sip-root" aria-label={lbl(lang, "Informations sur la sourate", "Surah information", "معلومات السورة")}>
      <header className="sip-header">
        <span className="sip-header__ornament font-surah-names" aria-hidden="true">{String(surahNum).padStart(3, "0")}</span>
        <span className="sip-header__text">
          <span className="sip-eyebrow">{lbl(lang, "Découvrir la sourate", "Discover the surah", "التعريف بالسورة")}</span>
          <strong className="sip-header__name">{displayName}</strong>
          <span className="sip-header__desc">{s.en}</span>
        </span>
        <span className="sip-header__arabic" dir="rtl" lang="ar" translate="no">{s.ar}</span>
      </header>

      <div className="sip-section-heading"><span>{lbl(lang, "Repères essentiels", "Essential facts", "معلومات أساسية")}</span><span className="sip-section-heading__line" /></div>
      <div className="sip-grid">
        {stats.map(([Icon, label, value, tone]) => <StatTile key={label} icon={Icon} label={label} value={value} tone={tone} />)}
      </div>

      <article className={`sip-overview${expanded ? " sip-overview--expanded" : ""}`} aria-live="polite">
        <div className="sip-overview__head">
          <div><span className="sip-overview__kicker">{expanded ? lbl(lang, "Dossier éditorial", "Editorial dossier", "الملف التحريري") : lbl(lang, "À propos", "About", "نبذة")}</span><h3>{lbl(lang, "Contexte et présentation", "Context and overview", "السياق والتعريف")}</h3></div>
          <span className="sip-language">{lbl(lang, "Source en anglais", "English source", "المصدر بالإنجليزية")}</span>
        </div>

        {editorialInfo === null && <div className="sip-overview__loading" role="status"><span className="sip-skeleton sip-skeleton--long" /><span className="sip-skeleton" /><span className="sr-only">{lbl(lang, "Chargement…", "Loading…", "جار التحميل…")}</span></div>}
        {editorialInfo?.shortText && !expanded && <p className="sip-overview__text">{editorialInfo.shortText}</p>}
        {editorialInfo === false && <p className="sip-overview__fallback">{lbl(lang, "Présentation indisponible hors connexion.", "Overview unavailable offline.", "التعريف غير متاح دون اتصال.")}</p>}

        {expanded && editorialInfo && (
          <div className="sip-dossier" id={detailsId}>
            <div className="sip-timeline" role="note">
              <strong>{revelation}</strong>
              <span>{editorialInfo.revelationOrder ? lbl(lang, `${editorialInfo.revelationOrder}e dans l’ordre de révélation`, `${editorialInfo.revelationOrder} in revelation order`, `ترتيبها ${editorialInfo.revelationOrder} في النزول`) : ""}</span>
              <span>{lbl(lang, `${surahNum}e dans le Mushaf`, `${surahNum} in Mushaf order`, `ترتيبها ${surahNum} في المصحف`)}</span>
            </div>
            <div className="sip-dossier__copy">
              {dossierBlocks.map((block) =>
                block.length < 72 && !/[.!?]$/.test(block)
                  ? <h4 key={block}>{block}</h4>
                  : <p key={block}>{block}</p>
              )}
            </div>
          </div>
        )}

        <footer className="sip-overview__footer">
          <span className="sip-source">{editorialInfo?.source ? `${lbl(lang, "Source", "Source", "المصدر")} : ${editorialInfo.source}` : "Quran.com"}</span>
          {editorialInfo && <button type="button" className="sip-source-link" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls={detailsId}>{expanded ? lbl(lang, "Réduire", "Show less", "عرض أقل") : lbl(lang, "Dossier complet", "Full dossier", "الملف الكامل")}<span aria-hidden="true">{expanded ? "↑" : "↓"}</span></button>}
        </footer>
      </article>
    </section>
  );
}
