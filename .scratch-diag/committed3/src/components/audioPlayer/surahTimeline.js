import audioService from "../../services/audioService";

/**
 * Elapsed time and total over the whole playlist (the surah), like a single
 * recording, when the audio source provides per-ayah durations. Falls back
 * to the current file otherwise (single ayah, word audio, other sources).
 */
export function getSurahTimeline(currentTime, fileDuration) {
  const index = audioService.playlistIndex;
  const durations = audioService.getPlaylistDurations();
  const known = durations.filter((value) => value !== null);
  if (
    audioService._oneShotMode ||
    index < 0 ||
    durations.length < 2 ||
    known.length < Math.ceil(durations.length / 2)
  ) {
    return { elapsed: currentTime, total: fileDuration || 0, surah: false };
  }
  const average = known.reduce((sum, value) => sum + value, 0) / known.length;
  const filled = durations.map((value, i) =>
    value !== null ? value : i === index && fileDuration ? fileDuration : average,
  );
  const before = filled.slice(0, index).reduce((sum, value) => sum + value, 0);
  const total = filled.reduce((sum, value) => sum + value, 0);
  return { elapsed: before + Math.min(currentTime, filled[index]), total, surah: true, filled };
}

/** Seek on the surah timeline: jumps to the right ayah, then inside it. */
export function seekSurahProgress(pct) {
  const clamped = Math.max(0, Math.min(1, pct));
  const { surah, filled, total } = getSurahTimeline(
    audioService.currentTime || 0,
    audioService.duration || 0,
  );
  if (!surah) {
    audioService.seek(clamped * (audioService.duration || 0));
    return;
  }
  const target = clamped * total;
  let cumulative = 0;
  for (let i = 0; i < filled.length; i += 1) {
    if (target < cumulative + filled[i] || i === filled.length - 1) {
      const offset = Math.max(0, target - cumulative);
      if (i === audioService.playlistIndex) audioService.seek(offset);
      else audioService.playIndexAt(i, offset);
      return;
    }
    cumulative += filled[i];
  }
}
