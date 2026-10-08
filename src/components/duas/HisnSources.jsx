import React from "react";
import { ArrowRight, ExternalLink } from "lucide-react";
import { hadithCollectionName, hadithUrl } from "../../data/hadithCollections";
import { matchNote, quranRangeLabel } from "./hisnText";
import { hubText } from "../../utils/duasHubText";

/**
 * Where an invocation comes from. Quranic quotations open the verse in the
 * reader; hadith references open the hadith on sunnah.com, and say so when the
 * wording found there is only close to, or part of, the invocation.
 */
export default function HisnSources({ item, lang, onOpenVerse }) {
  const quran = item.q || [];
  const hadith = item.h || [];

  return (
    <div className="dua-card-footer dua-card-footer--sources">
      <div className="dua-sources" role="group" aria-label={hubText("sourcesTitle", lang)}>
        <p className="dua-sources__title">{hubText("sourcesTitle", lang)}</p>

        {quran.length > 0 && (
          <div className="dua-sources__group">
            <span className="dua-sources__label">{hubText("quranRefLabel", lang)}</span>
            <ul className="dua-sources__list">
              {quran.map((range) => (
                <li key={range.join(":")}>
                  <button type="button" className="dua-source-link" onClick={() => onOpenVerse(range[0], range[1])}>
                    <bdi>{quranRangeLabel(range, lang)}</bdi>
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {hadith.length > 0 && (
          <div className="dua-sources__group">
            <span className="dua-sources__label">{hubText("foundIn", lang)}</span>
            <ul className="dua-sources__list">
              {hadith.map((ref) => {
                const name = hadithCollectionName(ref.c, lang);
                const href = hadithUrl(ref.c, ref.n);
                const note = matchNote(ref.m, lang);
                const grade = ref.g ? hubText("gradeLine", lang, undefined, { grade: ref.g, by: ref.b }) : null;
                const meta = [note, grade].filter(Boolean).join(" · ");
                return (
                  <li key={`${ref.c}:${ref.n}`}>
                    {href ? (
                      <a
                        className="dua-source-link"
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={hubText("openHadith", lang, undefined, { name, number: ref.n })}
                      >
                        <bdi>
                          {name} {ref.n}
                        </bdi>
                        <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    ) : (
                      <span className="dua-source-link dua-source-link--static">
                        <bdi>
                          {name} {ref.n}
                        </bdi>
                      </span>
                    )}
                    {meta && <span className="dua-source-meta">{meta}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {quran.length === 0 && hadith.length === 0 && (
          <p className="dua-sources__none">{hubText("noHadithRef", lang)}</p>
        )}
      </div>
    </div>
  );
}
