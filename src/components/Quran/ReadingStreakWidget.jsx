import React, { useMemo } from "react";
import { Flame, Calendar, Trophy, TrendingUp } from "lucide-react";
import { getStreakData, getReadingHistory, getStreakMessage, getMotivationalMessage } from "../../services/readingStreakService";
import { useAppSelector } from "../../context/AppContext";

function labelFor(lang, fr, en, ar = en) {
  if (lang === "ar") return ar;
  return lang === "fr" ? fr : en;
}

/**
 * ReadingStreakWidget - Shows current reading streak
 * Inspired by Muslim Pro and Quran.com
 */
export default function ReadingStreakWidget({ compact = false }) {
  const lang = useAppSelector((state) => state.lang);
  
  const streakData = useMemo(() => getStreakData(), []);
  const history = useMemo(() => getReadingHistory(7), []);
  
  const { currentStreak, longestStreak, totalDaysRead } = streakData;
  
  // Calculate reading days in last 7 days
  const last7Days = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      days.push({
        date: dateStr,
        dayName: date.toLocaleDateString(lang === "fr" ? "fr-FR" : "en-US", { weekday: "short" }),
        hasReading: !!history[dateStr],
      });
    }
    return days;
  }, [history, lang]);

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)]">
        <Flame size={16} className="text-orange-500" />
        <span className="font-semibold text-sm">{currentStreak}</span>
        <span className="text-xs text-[var(--text-muted)]">
          {labelFor(lang, "jour(s)", "day(s)", "يوم")}
        </span>
      </div>
    );
  }

  return (
    <div className="reading-streak-widget p-4 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
          <Flame size={24} className="text-white" />
        </div>
        <div>
          <h3 className="font-bold text-lg text-orange-900">
            {getStreakMessage(streakData, lang)}
          </h3>
          <p className="text-xs text-orange-700">
            {getMotivationalMessage(currentStreak, lang)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 rounded-lg bg-white/50">
          <div className="text-2xl font-bold text-orange-600">{currentStreak}</div>
          <div className="text-[10px] text-orange-700">
            {labelFor(lang, "Actuelle", "Current", "الحالية")}
          </div>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/50">
          <div className="text-2xl font-bold text-amber-600">{longestStreak}</div>
          <div className="text-[10px] text-amber-700">
            {labelFor(lang, "Record", "Record", "الرقم القياسي")}
          </div>
        </div>
        <div className="text-center p-2 rounded-lg bg-white/50">
          <div className="text-2xl font-bold text-yellow-600">{totalDaysRead}</div>
          <div className="text-[10px] text-yellow-700">
            {labelFor(lang, "Total", "Total", "المجموع")}
          </div>
        </div>
      </div>

      {/* Last 7 days */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={14} className="text-orange-600" />
          <span className="text-xs font-semibold text-orange-800">
            {labelFor(lang, "7 derniers jours", "Last 7 days", "آخر 7 أيام")}
          </span>
        </div>
        <div className="flex gap-1">
          {last7Days.map((day) => (
            <div
              key={day.date}
              className={`flex-1 text-center py-1 rounded ${
                day.hasReading
                  ? "bg-orange-400 text-white"
                  : "bg-white/50 text-orange-300"
              }`}
            >
              <div className="text-[10px] font-medium">{day.dayName}</div>
              <div className="w-2 h-2 mx-auto mt-1 rounded-full bg-current opacity-50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
