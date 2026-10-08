import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DuasLink from "./DuasLink";
import { hisnChapterRoute } from "./duasRoute";
import { hubText } from "../../utils/duasHubText";

/**
 * A chapter, named in the language the reader chose; the Arabic title follows
 * as a second line. Arabic readers see the Arabic title alone.
 */
export default function HisnChapterRow({ chapter, translation, lang }) {
  const translated = lang === "ar" ? "" : translation?.chapters?.[chapter.id] || "";
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  return (
    <li>
      <DuasLink to={hisnChapterRoute(chapter.id)} className="hisn-row">
        <span className="hisn-row__text">
          {translated ? (
            <>
              <span className="hisn-row__title" lang={lang === "fr" ? "fr" : "en"} dir="ltr">
                {translated}
              </span>
              <span className="hisn-row__ar" lang="ar" dir="rtl">
                {chapter.ar}
              </span>
            </>
          ) : (
            <span className="hisn-row__title hisn-row__title--arabic" lang="ar" dir="rtl">
              {chapter.ar}
            </span>
          )}
        </span>
        <span className="hisn-row__count" aria-hidden="true">
          {chapter.items.length}
        </span>
        <span className="sr-only">{hubText("itemsCount", lang, chapter.items.length)}</span>
        <Chevron size={18} className="hisn-row__chevron" aria-hidden="true" />
      </DuasLink>
    </li>
  );
}
