import React, { useMemo, useRef, useState } from "react";
import { hubText } from "../../utils/duasHubText";
import { searchHisnIndex } from "../../utils/hisnSearch";
import DuasHeader from "./DuasHeader";
import DuasSearchBox from "./DuasSearchBox";
import HisnChapterRow from "./HisnChapterRow";
import HisnSearchResults from "./HisnSearchResults";
import { DUAS_ROUTES } from "./duasRoute";

export default function HisnChapterList({ lang, hisn, headingRef }) {
  const [query, setQuery] = useState("");
  const searchRef = useRef(null);
  const searching = query.trim().length > 0;

  const result = useMemo(
    () => (hisn.index && searching ? searchHisnIndex(hisn.index, query) : null),
    [hisn.index, query, searching],
  );

  const reset = () => {
    setQuery("");
    searchRef.current?.focus();
  };

  const chapters = hisn.data?.chapters || [];

  return (
    <>
      <DuasHeader
        lang={lang}
        headingRef={headingRef}
        title={hubText("hisnTitle", lang)}
        subtitle={hubText("hisnSubtitle", lang)}
        back={{ to: DUAS_ROUTES.hub, label: hubText("backToHub", lang) }}
      >
        <DuasSearchBox lang={lang} value={query} onChange={setQuery} inputRef={searchRef} />
      </DuasHeader>

      <section className="duas-results">
        {hisn.status === "error" && !hisn.data ? (
          <div className="duas-empty" role="alert">
            <p>{hubText("loadError", lang)}</p>
            <p className="duas-empty__hint">{hubText("loadErrorHint", lang)}</p>
            <button className="duas-empty-reset" onClick={hisn.retry} type="button">
              {hubText("retry", lang)}
            </button>
          </div>
        ) : !hisn.data ? (
          <p className="duas-status" role="status">
            {hubText("loading", lang)}
          </p>
        ) : result ? (
          <HisnSearchResults
            result={result}
            lang={lang}
            translation={hisn.translation}
            translationFailed={hisn.translationStatus === "error"}
            onReset={reset}
          />
        ) : (
          <section className="duas-block" aria-labelledby="hisn-chapters">
            <div className="duas-results-head">
              <h2 id="hisn-chapters" className="duas-section-title">
                {hubText("chaptersTitle", lang)}
              </h2>
              <div className="duas-results-badge">
                <strong>{hubText("chaptersCount", lang, chapters.length)}</strong>
              </div>
            </div>
            <ul className="hisn-rows">
              {chapters.map((chapter) => (
                <HisnChapterRow key={chapter.id} chapter={chapter} translation={hisn.translation} lang={lang} />
              ))}
            </ul>
          </section>
        )}
      </section>
    </>
  );
}
