import React from "react";
import RowActions from "./RowActions";

export default function SurahRecitationRow({ surah, lang, onPlay, onOpen, downloadUrl }) {
  const label = lang === "ar" ? surah.ar : lang === "fr" ? surah.fr : surah.en;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2">
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-xs font-bold">{surah.n}</span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{label}</div>
        <div className="text-xs opacity-75">{surah.ar}</div>
      </div>
      <RowActions lang={lang} onPlay={onPlay} onOpen={onOpen} downloadUrl={downloadUrl} />
    </div>
  );
}
