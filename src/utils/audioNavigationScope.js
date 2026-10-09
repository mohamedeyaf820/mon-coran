export function getReadingAudioScopeKey({
  currentJuz,
  currentPage,
  currentSurah,
  displayMode,
}) {
  if (displayMode === "page") return `page:${currentPage}`;
  if (displayMode === "juz") return `juz:${currentJuz}`;
  return `surah:${currentSurah}`;
}

export function isPlaylistEndForActiveScope(
  playlistScopeKey,
  activeScopeKey,
) {
  return Boolean(
    playlistScopeKey &&
      activeScopeKey &&
      playlistScopeKey === activeScopeKey,
  );
}
