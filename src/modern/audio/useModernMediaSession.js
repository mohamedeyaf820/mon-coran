import { useEffect } from "react";
import { getSurah } from "../../data/surahs";

export function useModernMediaSession(audio) {
  useEffect(() => {
    if (!("mediaSession" in navigator) || !audio.current) return undefined;
    const surah = getSurah(audio.current.surah);
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${surah?.en || "Recitation"} - verset ${audio.current.ayah || 1}`,
      artist: audio.reciter?.nameFr || audio.reciter?.nameEn || "Mon Coran",
      album: "Mon Coran",
    });
    navigator.mediaSession.playbackState = audio.status === "playing" ? "playing" : "paused";
    const actions = { play: audio.toggle, pause: audio.toggle, nexttrack: audio.next, previoustrack: audio.previous, stop: audio.stop,
      seekto: ({ seekTime }) => audio.duration && Number.isFinite(seekTime) && audio.seekPercent(seekTime / audio.duration) };
    Object.entries(actions).forEach(([action, handler]) => { try { navigator.mediaSession.setActionHandler(action, handler); } catch { /* unsupported */ } });
    return () => Object.keys(actions).forEach((action) => { try { navigator.mediaSession.setActionHandler(action, null); } catch { /* unsupported */ } });
  }, [audio.current, audio.duration, audio.reciter, audio.status]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !audio.duration) return;
    try { navigator.mediaSession.setPositionState({ duration: audio.duration, playbackRate: audio.speed || 1, position: Math.min(audio.currentTime, audio.duration) }); } catch { /* optional */ }
  }, [audio.currentTime, audio.duration, audio.speed]);
}
