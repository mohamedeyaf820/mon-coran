/**
 * Reading Streak Service
 * Tracks consecutive days of Quran reading
 * Similar to Muslim Pro and other apps
 */

const STREAK_KEY = "mushaf-reading-streak";
const HISTORY_KEY = "mushaf-reading-history";

/**
 * Get current streak data
 * @returns {Object} Streak data
 */
export function getStreakData() {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastReadDate: null,
        totalDaysRead: 0,
        startDate: null,
      };
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error("[Streak] Failed to read streak:", error);
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastReadDate: null,
      totalDaysRead: 0,
      startDate: null,
    };
  }
}

/**
 * Save streak data
 * @param {Object} data - Streak data to save
 */
function saveStreakData(data) {
  try {
    localStorage.setItem(STREAK_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("[Streak] Failed to save streak:", error);
  }
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayString() {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get yesterday's date as YYYY-MM-DD string
 */
function getYesterdayString() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split("T")[0];
}

/**
 * Check if two dates are consecutive days
 * @param {string} date1 - YYYY-MM-DD
 * @param {string} date2 - YYYY-MM-DD
 * @returns {boolean}
 */
function areConsecutiveDays(date1, date2) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays === 1;
}

/**
 * Log reading activity for today
 * @param {Object} metadata - Optional metadata (surah, ayah, time)
 * @returns {Object} Updated streak data
 */
export function logReadingActivity(metadata = {}) {
  const today = getTodayString();
  const streak = getStreakData();
  
  // Check if already logged today
  if (streak.lastReadDate === today) {
    // Update history with more detail
    addToHistory(today, metadata);
    return streak;
  }
  
  let newCurrentStreak = 1;
  let newLongestStreak = streak.longestStreak;
  let newStartDate = streak.startDate;
  
  // Check if streak continues from yesterday
  if (streak.lastReadDate === getYesterdayString()) {
    newCurrentStreak = (streak.currentStreak || 0) + 1;
  } else if (streak.lastReadDate !== today) {
    // Streak broken
    newStartDate = today;
  }
  
  // Update longest streak
  if (newCurrentStreak > newLongestStreak) {
    newLongestStreak = newCurrentStreak;
  }
  
  // First time reading
  if (!streak.startDate) {
    newStartDate = today;
  }
  
  const updatedStreak = {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    lastReadDate: today,
    totalDaysRead: (streak.totalDaysRead || 0) + 1,
    startDate: newStartDate,
  };
  
  saveStreakData(updatedStreak);
  addToHistory(today, metadata);
  
  return updatedStreak;
}

/**
 * Add entry to reading history
 * @param {string} date - Date string (YYYY-MM-DD)
 * @param {Object} metadata - Reading metadata
 */
function addToHistory(date, metadata) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const history = raw ? JSON.parse(raw) : {};
    
    if (!history[date]) {
      history[date] = [];
    }
    
    history[date].push({
      timestamp: Date.now(),
      surah: metadata.surah,
      ayah: metadata.ayah,
      duration: metadata.duration || 0,
      ...metadata,
    });
    
    // Keep only last 30 days of history
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString().split("T")[0];
    
    for (const key of Object.keys(history)) {
      if (key < cutoffDate) {
        delete history[key];
      }
    }
    
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error("[Streak] Failed to update history:", error);
  }
}

/**
 * Get reading history
 * @param {number} days - Number of days to retrieve (default: 7)
 * @returns {Object} History data
 */
export function getReadingHistory(days = 7) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return {};
    
    const history = JSON.parse(raw);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoff = cutoffDate.toISOString().split("T")[0];
    
    const filtered = {};
    for (const [date, entries] of Object.entries(history)) {
      if (date >= cutoff) {
        filtered[date] = entries;
      }
    }
    
    return filtered;
  } catch (error) {
    console.error("[Streak] Failed to read history:", error);
    return {};
  }
}

/**
 * Get streak message for display
 * @param {Object} streakData - Streak data
 * @param {string} lang - Language code
 * @returns {string} Formatted message
 */
export function getStreakMessage(streakData, lang = "fr") {
  const { currentStreak } = streakData;
  
  if (currentStreak === 0) {
    return lang === "fr" 
      ? "Commencez votre série aujourd'hui !" 
      : lang === "ar" 
        ? "ابدأ سلسلتك اليوم!"
        : "Start your streak today!";
  }
  
  if (currentStreak === 1) {
    return lang === "fr" 
      ? "1 jour de lecture consécutive !" 
      : lang === "ar" 
        ? "يوم واحد من القراءة المتتالية!"
        : "1 day streak!";
  }
  
  return lang === "fr" 
    ? `${currentStreak} jours consécutifs !` 
    : lang === "ar" 
      ? `${currentStreak} أيام متتالية!`
      : `${currentStreak} day streak!`;
}

/**
 * Get motivational message based on streak
 * @param {number} streak - Current streak
 * @param {string} lang - Language code
 * @returns {string}
 */
export function getMotivationalMessage(streak, lang = "fr") {
  if (streak < 3) {
    return lang === "fr" 
      ? "Continuez, vous êtes sur la bonne voie !" 
      : lang === "ar" 
        ? "استمر، أنت في الطريق الصحيح!"
        : "Keep going, you're on the right track!";
  }
  
  if (streak < 7) {
    return lang === "fr" 
      ? "Excellent ! Une semaine approche !" 
      : lang === "ar" 
        ? "ممتاز! الأسبوع يقترب!"
        : "Excellent! A week is approaching!";
  }
  
  if (streak < 30) {
    return lang === "fr" 
      ? "Incroyable ! Vous êtes inarrêtable !" 
      : lang === "ar" 
        ? "لا يُصدق! أنت لا يمكن إيقافك!"
        : "Incredible! You're unstoppable!";
  }
  
  return lang === "fr" 
    ? "Légendaire ! Un mois complet !" 
    : lang === "ar" 
      ? "أسطوري! شهر كامل!"
      : "Legendary! A full month!";
}

export default {
  getStreakData,
  logReadingActivity,
  getReadingHistory,
  getStreakMessage,
  getMotivationalMessage,
};
