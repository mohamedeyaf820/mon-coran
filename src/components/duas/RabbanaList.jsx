import React from "react";
import { hubText } from "../../utils/duasHubText";
import RABBANA_DUAS from "../../data/rabbanaDuas";
import DuasHeader from "./DuasHeader";
import QuranDuaCard from "./QuranDuaCard";
import { DUAS_ROUTES } from "./duasRoute";

/** The forty supplications that begin with « Rabbana », in Quran order. */
export default function RabbanaList({ lang, headingRef }) {
  return (
    <>
      <DuasHeader
        lang={lang}
        headingRef={headingRef}
        title={hubText("rabbanaTitle", lang)}
        subtitle={hubText("rabbanaSubtitle", lang)}
        back={{ to: DUAS_ROUTES.hub, label: hubText("backToHub", lang) }}
      />

      <section className="duas-results">
        <div className="duas-results-head">
          <p className="duas-results-copy">{hubText("rabbanaNote", lang)}</p>
          <div className="duas-results-badge">
            <strong>{hubText("itemsCount", lang, RABBANA_DUAS.length)}</strong>
          </div>
        </div>
        <div className="gallery-grid">
          {RABBANA_DUAS.map((dua) => (
            <QuranDuaCard key={dua.id} dua={dua} lang={lang} badge={hubText("rabbanaNumber", lang, undefined, { n: dua.n })} />
          ))}
        </div>
      </section>
    </>
  );
}
