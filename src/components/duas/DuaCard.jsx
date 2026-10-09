import React from "react";
import { ArrowRight, BookOpen, Copy, ExternalLink, Repeat2, Share2 } from "lucide-react";
import { t } from "../../i18n";
import { hubText } from "../../utils/duasHubText";
import { ARABIC_DUA_SIGN } from "../../utils/arabicDuaText";
import { applyFontSigns } from "../../utils/quranUtils";
import { useAppSelector } from "../../context/AppContext";

/** Punctuation and brackets keep their own face so the Quran font does not draw them too large. */
function ArabicWithPunctuation({ text }) {
  return String(text || "")
    .split(ARABIC_DUA_SIGN)
    .map((part, index) =>
      index % 2 === 1 ? (
        <span key={index} className="dua-arabic-punct">
          {part}
        </span>
      ) : (
        part
      ),
    );
}

/**
 * One invocation: Arabic, optional transliteration and translation, a header
 * (reference, category, repetition) with share/copy/open actions, and a footer.
 * Used for the Quranic supplications and for the Hisn al-Muslim chapters.
 */
export default function DuaCard({
  lang,
  title,
  arabic,
  transliteration,
  translation,
  refLabel,
  categoryLabel,
  repeat,
  onShare,
  onCopy,
  onOpenVerse,
  notice,
  footer,
}) {
  // The Quran face draws some canonical signs (U+06DF, U+06EB) as a large black
  // dot: the card shows them the way the reader's own text does.
  const riwaya = useAppSelector((state) => state.riwaya);
  const shownArabic = applyFontSigns(arabic, riwaya === "warsh" ? "qpc-warsh" : "qpc-hafs");
  return (
    <article className="dua-card-v5">
      <div className="dua-card-inner">
        <div className="dua-card-head">
          <div className="dua-head-main">
            {refLabel && (
              <div className="dua-ref-pill">
                <BookOpen size={12} aria-hidden="true" />
                <span>{refLabel}</span>
              </div>
            )}
            {categoryLabel && <span className="dua-cat-pill">{categoryLabel}</span>}
            {repeat > 1 && (
              <span className="dua-repeat-pill">
                <Repeat2 size={12} aria-hidden="true" />
                {hubText("repeat", lang, repeat)}
              </span>
            )}
          </div>
          <div className="dua-head-actions">
            <button
              className="dua-open-btn-v5"
              onClick={onShare}
              title={t("duas.shareTitle", lang)}
              aria-label={t("duas.shareAria", lang)}
              type="button"
            >
              <Share2 size={14} aria-hidden="true" />
            </button>
            <button
              className="dua-open-btn-v5"
              onClick={onCopy}
              title={t("duas.copyTitle", lang)}
              aria-label={t("duas.copyAria", lang)}
              type="button"
            >
              <Copy size={14} aria-hidden="true" />
            </button>
            {onOpenVerse && (
              <button
                className="dua-open-btn-v5"
                onClick={onOpenVerse}
                title={t("duas.openInQuran", lang)}
                aria-label={t("duas.openInQuran", lang)}
                type="button"
              >
                <ExternalLink size={14} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="dua-content-area">
          {title && <h3 className="dua-item-title">{title}</h3>}
          <p className="dua-arabic" lang="ar" dir="rtl">
            <ArabicWithPunctuation text={shownArabic} />
          </p>
          {transliteration && (
            <p className="dua-translit" dir="ltr">
              {transliteration}
            </p>
          )}
          {/* French or English text is Latin script: left-to-right even on the Arabic page, or its final full stop lands at the wrong end of the line. */}
          {translation && (
            <p className="dua-translation" lang={lang === "fr" ? "fr" : "en"} dir="ltr">
              {translation}
            </p>
          )}
          {notice && <p className="dua-notice">{notice}</p>}
        </div>

        {onOpenVerse ? (
          <div className="dua-card-footer">
            <button
              className="dua-card-footer-link"
              onClick={onOpenVerse}
              type="button"
              aria-label={t("duas.readVerseAria", lang)}
            >
              <ArrowRight size={15} aria-hidden="true" />
              <span>{t("duas.readInQuran", lang)}</span>
            </button>
          </div>
        ) : (
          footer
        )}
      </div>
    </article>
  );
}
