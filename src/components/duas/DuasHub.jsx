import React, { useMemo, useRef, useState } from "react";
import { BookCheck, BookOpen, ChevronLeft, ChevronRight, Library, Moon, ScrollText, Sun, Sunrise, HandHeart } from "lucide-react";
import { hubText } from "../../utils/duasHubText";
import { searchHisnIndex } from "../../utils/hisnSearch";
import DuasHeader from "./DuasHeader";
import DuasLink from "./DuasLink";
import DuasSearchBox from "./DuasSearchBox";
import HisnSearchResults from "./HisnSearchResults";
import { DUAS_ROUTES, hisnChapterRoute } from "./duasRoute";
import RABBANA_DUAS from "../../data/rabbanaDuas";
import { QURAN_SUPPLICATIONS, searchQuranSupplications } from "./quranDuas";

/** The four moments people come back to every day, each opening its Hisn chapter. */
const QUICK_CHAPTERS = [
  { id: 27, label: "quickMorningEvening", Icon: Sunrise },
  { id: 28, label: "quickSleep", Icon: Moon },
  { id: 1, label: "quickWake", Icon: Sun },
  { id: 25, label: "quickAfterPrayer", Icon: HandHeart },
];

function LoadFailure({ lang, onRetry }) {
  return (
    <div className="duas-empty" role="alert">
      <p>{hubText("loadError", lang)}</p>
      <p className="duas-empty__hint">{hubText("loadErrorHint", lang)}</p>
      <button className="duas-empty-reset" onClick={onRetry} type="button">
        {hubText("retry", lang)}
      </button>
    </div>
  );
}

export default function DuasHub({ lang, hisn, headingRef }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const Chevron = lang === "ar" ? ChevronLeft : ChevronRight;
  const searching = query.trim().length > 0;

  const hisnResult = useMemo(
    () => (hisn.index && searching ? searchHisnIndex(hisn.index, query) : null),
    [hisn.index, query, searching],
  );
  const quranResults = useMemo(
    () => (searching ? searchQuranSupplications(query) : []),
    [query, searching],
  );

  const reset = () => {
    setQuery("");
    searchRef.current?.focus();
  };

  const library = hisn.data;
  const hisnMeta = library
    ? hubText("hisnMeta", lang, undefined, { chapters: library.chapters.length, items: library.itemCount })
    : "";
  const translationFailed = hisn.translationStatus === "error";

  return (
    <>
      <DuasHeader
        lang={lang}
        headingRef={headingRef}
        title={hubText("title", lang)}
        subtitle={hubText("subtitle", lang)}
      >
        <DuasSearchBox lang={lang} value={query} onChange={setQuery} inputRef={searchRef} />
      </DuasHeader>

      {searching ? (
        <section className="duas-results">
          {hisn.status === "error" && !hisn.data ? (
            <LoadFailure lang={lang} onRetry={hisn.retry} />
          ) : hisnResult ? (
            <HisnSearchResults
              result={hisnResult}
              quranResults={quranResults}
              lang={lang}
              translation={hisn.translation}
              translationFailed={translationFailed}
              onReset={reset}
            />
          ) : (
            <p className="duas-status" role="status">
              {hubText("loading", lang)}
            </p>
          )}
        </section>
      ) : (
        <>
          <section className="duas-block" aria-labelledby="duas-today">
            <h2 id="duas-today" className="duas-section-title">
              {hubText("todayTitle", lang)}
            </h2>
            <ul className="duas-quick">
              {QUICK_CHAPTERS.map(({ id, label, Icon }) => (
                <li key={id}>
                  <DuasLink to={hisnChapterRoute(id)} className="duas-quick__item">
                    <Icon size={22} aria-hidden="true" />
                    <span>{hubText(label, lang)}</span>
                  </DuasLink>
                </li>
              ))}
            </ul>
          </section>

          <section className="duas-block" aria-labelledby="duas-browse">
            <h2 id="duas-browse" className="duas-section-title">
              {hubText("browseTitle", lang)}
            </h2>
            <ul className="duas-tiles">
              <li>
                <DuasLink to={DUAS_ROUTES.hisn} className="duas-tile">
                  <span className="duas-tile__icon" aria-hidden="true">
                    <Library size={24} />
                  </span>
                  <span className="duas-tile__title">{hubText("hisnTitle", lang)}</span>
                  <span className="duas-tile__meta">{hisnMeta || " "}</span>
                  <Chevron size={18} className="duas-tile__chevron" aria-hidden="true" />
                </DuasLink>
              </li>
              <li>
                <DuasLink to={DUAS_ROUTES.quran} className="duas-tile">
                  <span className="duas-tile__icon duas-tile__icon--quran" aria-hidden="true">
                    <BookOpen size={24} />
                  </span>
                  <span className="duas-tile__title">{hubText("quranTitle", lang)}</span>
                  <span className="duas-tile__meta">
                    {hubText("quranMeta", lang, QURAN_SUPPLICATIONS.length)}
                  </span>
                  <Chevron size={18} className="duas-tile__chevron" aria-hidden="true" />
                </DuasLink>
              </li>
              <li>
                <DuasLink to={DUAS_ROUTES.rabbana} className="duas-tile">
                  <span className="duas-tile__icon duas-tile__icon--quran" aria-hidden="true">
                    <ScrollText size={24} />
                  </span>
                  <span className="duas-tile__title">{hubText("rabbanaTitle", lang)}</span>
                  <span className="duas-tile__meta">{hubText("rabbanaMeta", lang, RABBANA_DUAS.length)}</span>
                  <Chevron size={18} className="duas-tile__chevron" aria-hidden="true" />
                </DuasLink>
              </li>
              <li>
                <DuasLink to={DUAS_ROUTES.khatm} className="duas-tile">
                  <span className="duas-tile__icon" aria-hidden="true">
                    <BookCheck size={24} />
                  </span>
                  <span className="duas-tile__title">{hubText("khatmTitle", lang)}</span>
                  <span className="duas-tile__meta">{hubText("khatmMeta", lang)}</span>
                  <Chevron size={18} className="duas-tile__chevron" aria-hidden="true" />
                </DuasLink>
              </li>
            </ul>
            {hisn.status === "error" && !hisn.data && <LoadFailure lang={lang} onRetry={hisn.retry} />}
          </section>
        </>
      )}
    </>
  );
}
