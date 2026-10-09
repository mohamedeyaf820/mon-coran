import React from "react";
import { ExternalLink } from "lucide-react";
import { hubText } from "../../utils/duasHubText";
import QURAN_DUAS from "../../data/duas";
import { KHATM_HISN_ITEM_IDS, KHATM_IRHAMNI, KHATM_LINKS, KHATM_QURAN_IDS } from "../../data/khatmDuas";
import DuaCard from "./DuaCard";
import DuasHeader from "./DuasHeader";
import HisnItemCard from "./HisnItemCard";
import QuranDuaCard from "./QuranDuaCard";
import { chapterTitleFor } from "./hisnText";
import { useDuaActions } from "./useDuaActions";
import { DUAS_ROUTES } from "./duasRoute";

function ExternalSourceLink({ href, children }) {
  return (
    <a className="dua-source-link" href={href} target="_blank" rel="noopener noreferrer">
      <span>{children}</span>
      <ExternalLink size={13} aria-hidden="true" />
    </a>
  );
}

/** A common end-of-mushaf text, shown with what is known of its source. */
function IrhamniCard({ lang }) {
  const { copyDua, shareDua } = useDuaActions(lang);
  const translation = lang === "fr" ? KHATM_IRHAMNI.fr : KHATM_IRHAMNI.en;
  const title = hubText("khatmTitle", lang);
  return (
    <DuaCard
      lang={lang}
      arabic={KHATM_IRHAMNI.arabic}
      translation={translation}
      refLabel={title}
      onShare={() =>
        shareDua({ arabicText: KHATM_IRHAMNI.arabic, translationText: translation, occasion: title, source: title })
      }
      onCopy={() => copyDua(`${KHATM_IRHAMNI.arabic}\n\n${translation}\n— ${title}`)}
      footer={
        <div className="dua-card-footer dua-card-footer--sources">
          <div className="dua-sources">
            <p className="dua-sources__title">{hubText("sourcesTitle", lang)}</p>
            <p className="dua-sources__none">{hubText("khatmIrhamniNote", lang)}</p>
            <ExternalSourceLink href={KHATM_LINKS.dorar}>{hubText("khatmIrhamniLink", lang)}</ExternalSourceLink>
          </div>
        </div>
      }
    />
  );
}

export default function KhatmView({ lang, hisn, headingRef }) {
  const quranDuas = KHATM_QURAN_IDS.map((id) => QURAN_DUAS.find((dua) => dua.id === id)).filter(Boolean);
  const hisnItems = hisn.data
    ? KHATM_HISN_ITEM_IDS.map((id) => {
        const chapter = hisn.data.chapters.find((candidate) => candidate.items.some((item) => item.id === id));
        const item = chapter?.items.find((candidate) => candidate.id === id);
        return chapter && item ? { chapter, item } : null;
      }).filter(Boolean)
    : [];

  return (
    <>
      <DuasHeader
        lang={lang}
        headingRef={headingRef}
        title={hubText("khatmTitle", lang)}
        subtitle={hubText("khatmSubtitle", lang)}
        back={{ to: DUAS_ROUTES.hub, label: hubText("backToHub", lang) }}
      />

      <section className="duas-results">
        <article className="dua-card-v5 dua-info-card">
          <div className="dua-card-inner">
            <h2 className="dua-item-title">{hubText("khatmInfoTitle", lang)}</h2>
            <p className="dua-translation">{hubText("khatmInfoBody", lang)}</p>
            <div className="dua-card-footer dua-card-footer--sources">
              <div className="dua-sources">
                <p className="dua-sources__title">{hubText("sourcesTitle", lang)}</p>
                <p className="dua-sources__none">{hubText("khatmInfoSource", lang)}</p>
                <ExternalSourceLink href={KHATM_LINKS.fatwa}>{hubText("khatmFatwaLink", lang)}</ExternalSourceLink>
              </div>
            </div>
          </div>
        </article>

        <h2 className="duas-section-title">{hubText("khatmSuggested", lang)}</h2>
        <div className="gallery-grid">
          {quranDuas.map((dua) => (
            <QuranDuaCard key={dua.id} dua={dua} lang={lang} />
          ))}
          {hisnItems.map(({ chapter, item }) => (
            <HisnItemCard
              key={item.id}
              item={item}
              lang={lang}
              chapterTitle={chapterTitleFor(chapter, hisn.translation, lang)}
              showChapter
              translationText={hisn.translation.items[item.id]}
              translationFailed={hisn.translationStatus === "error"}
            />
          ))}
          <IrhamniCard lang={lang} />
        </div>
      </section>
    </>
  );
}
