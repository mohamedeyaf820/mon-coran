import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { hubText } from "../../utils/duasHubText";
import DuasHeader from "./DuasHeader";
import DuasLink from "./DuasLink";
import HisnItemCard from "./HisnItemCard";
import { chapterTitleFor } from "./hisnText";
import { DUAS_ROUTES, hisnChapterRoute } from "./duasRoute";

function ChapterStatus({ lang, hisn, children }) {
  if (hisn.status === "error" && !hisn.data) {
    return (
      <div className="duas-empty" role="alert">
        <p>{hubText("loadError", lang)}</p>
        <p className="duas-empty__hint">{hubText("loadErrorHint", lang)}</p>
        <button className="duas-empty-reset" onClick={hisn.retry} type="button">
          {hubText("retry", lang)}
        </button>
      </div>
    );
  }
  if (!hisn.data) {
    return (
      <p className="duas-status" role="status">
        {hubText("loading", lang)}
      </p>
    );
  }
  return children;
}

export default function HisnChapter({ lang, hisn, chapterId, headingRef }) {
  const library = hisn.data;
  const chapter = library?.chapterById.get(chapterId);
  const position = library && chapter ? library.chapters.indexOf(chapter) : -1;
  const previous = position > 0 ? library.chapters[position - 1] : null;
  const next = position >= 0 && position < library.chapters.length - 1 ? library.chapters[position + 1] : null;
  const PreviousIcon = lang === "ar" ? ChevronRight : ChevronLeft;
  const NextIcon = lang === "ar" ? ChevronLeft : ChevronRight;
  const translationFailed = hisn.translationStatus === "error";

  const title = chapter ? chapterTitleFor(chapter, hisn.translation, lang) : hubText("hisnTitle", lang);
  const subtitle =
    chapter && lang !== "ar" && title !== chapter.ar ? (
      <span lang="ar" dir="rtl" className="duas-subtitle__arabic">
        {chapter.ar}
      </span>
    ) : null;

  return (
    <>
      <DuasHeader
        lang={lang}
        headingRef={headingRef}
        title={title}
        subtitle={subtitle}
        back={{ to: DUAS_ROUTES.hisn, label: hubText("backToChapters", lang) }}
      />

      <section className="duas-results">
        <ChapterStatus lang={lang} hisn={hisn}>
          {!chapter ? (
            <div className="duas-empty">
              <p>{hubText("chapterNotFound", lang)}</p>
              <DuasLink to={DUAS_ROUTES.hisn} className="duas-empty-reset">
                {hubText("backToChapters", lang)}
              </DuasLink>
            </div>
          ) : (
            <>
              <div className="duas-results-head">
                <div>
                  <p className="duas-results-copy">{hubText("bookSource", lang)}</p>
                  {hisn.translationStatus === "ready" && (
                    <p className="duas-results-copy duas-results-copy--note">{hubText("translationNote", lang)}</p>
                  )}
                </div>
                <div className="duas-results-badge">
                  <strong>{hubText("itemsCount", lang, chapter.items.length)}</strong>
                </div>
              </div>

              <div className="gallery-grid">
                {chapter.items.map((item) => (
                  <HisnItemCard
                    key={item.id}
                    item={item}
                    lang={lang}
                    chapterTitle={title}
                    translationText={hisn.translation.items[item.id]}
                    translationFailed={translationFailed}
                  />
                ))}
              </div>

              <nav className="hisn-pager" aria-label={hubText("chaptersTitle", lang)}>
                {previous ? (
                  <DuasLink to={hisnChapterRoute(previous.id)} className="hisn-pager__link">
                    <PreviousIcon size={18} aria-hidden="true" />
                    <span>{chapterTitleFor(previous, hisn.translation, lang)}</span>
                  </DuasLink>
                ) : (
                  <span />
                )}
                {next ? (
                  <DuasLink to={hisnChapterRoute(next.id)} className="hisn-pager__link hisn-pager__link--next">
                    <span>{chapterTitleFor(next, hisn.translation, lang)}</span>
                    <NextIcon size={18} aria-hidden="true" />
                  </DuasLink>
                ) : (
                  <span />
                )}
              </nav>
            </>
          )}
        </ChapterStatus>
      </section>
    </>
  );
}
