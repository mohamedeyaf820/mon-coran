import React from "react";
import DuaCard from "./DuaCard";
import HisnSources from "./HisnSources";
import { hisnSourceLines } from "./hisnText";
import { useDuaActions } from "./useDuaActions";
import { hubText } from "../../utils/duasHubText";
import { cleanDuaArabic, plainDuaArabic } from "../../utils/arabicDuaText";

/** One invocation of Hisn al-Muslim, with its repetition count and its sources. */
export default function HisnItemCard({
  item,
  lang,
  chapterTitle,
  showChapter = false,
  translationText,
  translationFailed = false,
}) {
  const { copyDua, shareDua, goToVerse } = useDuaActions(lang);
  const sources = hisnSourceLines(item, lang);
  const book = hubText("hisnTitle", lang);

  const handleCopy = () => {
    const parts = [plainDuaArabic(item.ar)];
    if (translationText) parts.push(translationText);
    parts.push(`— ${[chapterTitle, ...sources, book].filter(Boolean).join(" · ")}`);
    copyDua(parts.join("\n\n"));
  };

  const handleShare = () => {
    // The card's header names one verse only when the text is that single verse; a sura or several suras are named by the source line instead.
    const [surah = 0, from = 0, to = 0] = item.k === "quran" && item.q?.length === 1 ? item.q[0] : [];
    const singleVerse = from > 0 && from === to;
    shareDua({
      surah: singleVerse ? surah : 0,
      ayah: singleVerse ? from : 0,
      arabicText: plainDuaArabic(item.ar),
      translationText: translationText || "",
      occasion: chapterTitle,
      // Several sources do not fit the card's header: it names the book, the copied text carries them all.
      source: (sources.length > 1 ? [book] : [book, ...sources]).join(" · "),
    });
  };

  return (
    <DuaCard
      lang={lang}
      arabic={cleanDuaArabic(item.ar)}
      translation={translationText}
      refLabel={showChapter ? chapterTitle : null}
      repeat={item.n}
      onShare={handleShare}
      onCopy={handleCopy}
      notice={translationFailed ? hubText("translationUnavailable", lang) : null}
      footer={<HisnSources item={item} lang={lang} onOpenVerse={goToVerse} />}
    />
  );
}
