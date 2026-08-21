import { useEffect, useState } from "react";
import { getSurah } from "../../data/surahs";
import { useApp } from "../../context/AppContext";
import { fetchQuranComSurahInfo } from "../../services/quranComAPI";

function lbl(lang, fr, en, ar = en) {
  return lang === "ar" ? ar : lang === "fr" ? fr : en;
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

  const displayName = lang === "ar" ? s.ar : lang === "fr" ? s.fr || s.en : s.en;
  const dossierBlocks = editorialInfo?.text?.split("\n\n").filter(Boolean) || [];

  return (
    <section className="sip-root" aria-label={lbl(lang, "Informations sur la sourate", "Surah information", "معلومات السورة")}>
      <header className="sip-header">
        <span className="sip-header__text">
          <span className="sip-eyebrow">
            <span className="sip-eyebrow__number">{String(surahNum).padStart(3, "0")}</span>
            {lbl(lang, "Découvrir la sourate", "Discover the surah", "التعريف بالسورة")}
          </span>
          <strong className="sip-header__name">{displayName}</strong>
          <span className="sip-header__desc">{s.en}</span>
        </span>
        <span className="sip-header__arabic" dir="rtl" lang="ar" translate="no">{s.ar}</span>
      </header>

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
