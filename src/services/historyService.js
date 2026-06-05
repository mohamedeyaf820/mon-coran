/**
 * Reading History Service
 * Tracks reading sessions with timestamps and duration.
 */

import { getDB } from './dbService';

const STORE = 'history';

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Log a reading session */
export async function logSession({ surah, ayahFrom, ayahTo, page, durationMs }) {
  const db = await getDB();
  const entry = {
    date: todayStr(),
    surah,
    ayahFrom: ayahFrom || 1,
    ayahTo: ayahTo || ayahFrom || 1,
    page: page || null,
    timestamp: Date.now(),
    durationMs: durationMs || 0,
  };
  await db.add(STORE, entry);
  return entry;
}

/** Get all sessions for a specific date */
export async function getSessionsByDate(date) {
  const db = await getDB();
  const index = db.transaction(STORE).objectStore(STORE).index('date');
  return index.getAll(date);
}

/** Get all sessions for today */
export async function getTodaySessions() {
  return getSessionsByDate(todayStr());
}

/** Get all sessions (limited for performance) */
export async function getAllSessions(limit = 500) {
  const db = await getDB();
  const all = await db.getAll(STORE);
  return all
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

/** Get unique reading dates (for calendar view) */
export async function getReadingDates(days = 90) {
  const db = await getDB();
  const all = await db.getAll(STORE);
  const dateMap = {};
  for (const entry of all) {
    if (!dateMap[entry.date]) {
      dateMap[entry.date] = { date: entry.date, sessions: 0, totalDurationMs: 0, ayahsRead: 0 };
    }
    dateMap[entry.date].sessions += 1;
    dateMap[entry.date].totalDurationMs += entry.durationMs || 0;
    dateMap[entry.date].ayahsRead += Math.max(0, (entry.ayahTo || entry.ayahFrom) - entry.ayahFrom + 1);
  }
  return Object.values(dateMap)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);
}

/** Clear all history */
export async function clearHistory() {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readwrite');
  await tx.objectStore(STORE).clear();
}
