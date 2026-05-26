import { useEffect, useCallback, useRef } from "react";
import audioService from "../services/audioService";
import { saveAudioPosition, getSavedAudioPosition, clearAudioPosition } from "../services/audioResumeService";
import { logReadingActivity } from "../services/readingStreakService";

/**
 * Hook to handle audio resume and reading streak
 * Integrates with audioService and storage services
 */
export function useAudioResume() {
  const autoSaveRef = useRef(null);
  const lastPositionRef = useRef(null);

  // Save position periodically
  useEffect(() => {
    const getPosition = () => {
      if (!audioService.currentAyah) return null;
      
      return {
        surah: audioService.currentAyah.surah?.number || audioService.currentAyah.surah,
        ayah: audioService.currentAyah.numberInSurah || audioService.currentAyah.ayah,
        currentTime: audioService.currentTime,
        duration: audioService.duration,
        reciter: audioService.currentReciterId,
        riwaya: audioService.riwaya || "hafs",
      };
    };

    // Auto-save every 10 seconds
    autoSaveRef.current = setInterval(() => {
      const position = getPosition();
      if (position && position.surah && position.ayah) {
        saveAudioPosition(position);
        lastPositionRef.current = position;
      }
    }, 10000);

    return () => {
      if (autoSaveRef.current) {
        clearInterval(autoSaveRef.current);
      }
    };
  }, []);

  // Save on ayah change
  useEffect(() => {
    const unsubscribe = audioService.addAyahChangeListener((item) => {
      if (item) {
        const position = {
          surah: item.surah?.number || item.surah,
          ayah: item.numberInSurah || item.ayah,
          currentTime: audioService.currentTime,
          duration: audioService.duration,
          reciter: audioService.currentReciterId,
          riwaya: audioService.riwaya || "hafs",
        };
        saveAudioPosition(position);
        lastPositionRef.current = position;

        // Log reading activity for streak
        logReadingActivity({
          surah: position.surah,
          ayah: position.ayah,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Save on pause/stop
  useEffect(() => {
    const unsubscribePause = audioService.onPause = () => {
      const position = {
        surah: audioService.currentAyah?.surah?.number || audioService.currentAyah?.surah,
        ayah: audioService.currentAyah?.numberInSurah || audioService.currentAyah?.ayah,
        currentTime: audioService.currentTime,
        duration: audioService.duration,
        reciter: audioService.currentReciterId,
        riwaya: audioService.riwaya || "hafs",
      };
      if (position.surah && position.ayah) {
        saveAudioPosition(position);
      }
    };

    return () => {
      audioService.onPause = null;
    };
  }, []);

  /**
   * Resume playback from saved position
   */
  const resumePlayback = useCallback(async () => {
    const saved = getSavedAudioPosition();
    if (!saved) return false;

    try {
      // Load the playlist for the surah
      const { default: quranAPI } = await import("../services/quranAPI");
      const data = await quranAPI.getSurah(saved.surah, saved.riwaya);
      
      if (data?.ayahs) {
        await audioService.loadPlaylist(
          data.ayahs,
          undefined,
          undefined,
          undefined,
          saved.reciter
        );
        
        // Seek to saved position
        if (saved.currentTime > 0) {
          audioService.seek(saved.currentTime);
        }
        
        audioService.play();
        return true;
      }
    } catch (error) {
      console.error("[AudioResume] Failed to resume:", error);
    }
    
    return false;
  }, []);

  /**
   * Clear saved position (after completing a surah)
   */
  const clearPosition = useCallback(() => {
    clearAudioPosition();
    lastPositionRef.current = null;
  }, []);

  /**
   * Get saved position info
   */
  const getSavedPosition = useCallback(() => {
    return getSavedAudioPosition();
  }, []);

  return {
    resumePlayback,
    clearPosition,
    getSavedPosition,
  };
}

export default useAudioResume;
