/**
 * Audio Resume Service
 * Saves and restores audio playback position
 * Similar to Quran.com's resume feature
 */

const STORAGE_KEY = "mushaf-audio-resume";

/**
 * Save audio playback position
 * @param {Object} position - Position to save
 * @param {number} position.surah - Current surah
 * @param {number} position.ayah - Current ayah
 * @param {number} position.currentTime - Playback time in seconds
 * @param {number} position.duration - Total duration in seconds
 * @param {string} position.reciter - Reciter ID
 * @param {string} position.riwaya - Riwaya (hafs/warsh)
 * @param {number} position.timestamp - When position was saved
 */
export function saveAudioPosition(position) {
  try {
    const data = {
      surah: position.surah,
      ayah: position.ayah,
      currentTime: position.currentTime,
      duration: position.duration,
      reciter: position.reciter,
      riwaya: position.riwaya,
      timestamp: Date.now(),
      progress: position.duration > 0 ? position.currentTime / position.duration : 0,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error("[AudioResume] Failed to save position:", error);
    return false;
  }
}

/**
 * Get saved audio position
 * @returns {Object|null} Saved position or null
 */
export function getSavedAudioPosition() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    
    const data = JSON.parse(raw);
    
    // Validate required fields
    if (!data.surah || !data.ayah || !data.reciter) {
      return null;
    }
    
    // Position expires after 7 days
    const maxAge = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - data.timestamp > maxAge) {
      clearAudioPosition();
      return null;
    }
    
    return data;
  } catch (error) {
    console.error("[AudioResume] Failed to read position:", error);
    return null;
  }
}

/**
 * Clear saved audio position
 */
export function clearAudioPosition() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("[AudioResume] Failed to clear position:", error);
  }
}

/**
 * Check if there's a saved position to resume
 * @returns {boolean}
 */
export function hasSavedPosition() {
  return getSavedAudioPosition() !== null;
}

/**
 * Get formatted time remaining from saved position
 * @returns {string|null} Formatted time string (e.g., "12:34") or null
 */
export function getFormattedTimeRemaining() {
  const position = getSavedAudioPosition();
  if (!position || !position.currentTime || !position.duration) {
    return null;
  }
  
  const remaining = position.duration - position.currentTime;
  if (remaining <= 0) return null;
  
  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);
  
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/**
 * Auto-save position periodically (call this in a component)
 * @param {Function} getPositionFn - Function that returns current position
 * @param {number} intervalMs - Save interval in milliseconds (default: 10s)
 * @returns {Function} Cleanup function
 */
export function startAutoSave(getPositionFn, intervalMs = 10000) {
  const intervalId = setInterval(() => {
    const position = getPositionFn();
    if (position && position.surah && position.ayah) {
      saveAudioPosition(position);
    }
  }, intervalMs);
  
  return () => clearInterval(intervalId);
}

export default {
  saveAudioPosition,
  getSavedAudioPosition,
  clearAudioPosition,
  hasSavedPosition,
  getFormattedTimeRemaining,
  startAutoSave,
};
