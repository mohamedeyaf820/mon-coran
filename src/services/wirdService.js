/**
 * Wird (Daily Goals) Service
 * Tracks daily reading objectives and progress using IndexedDB.
 */

import { getDB } from './dbService';

const STORE = 'wird';

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Get today's wird record (or create a blank one) */
export async function getTodayWird() {
  const db = await getDB();
  const date = todayKey();
  let record = await db.get(STORE, date);
  if (!record) {
    record = {
      date,
      pagesRead: 0,
      ayahsRead: 0,
      sessionsCount: 0,
      entries: [],         // { surah, fromAyah, toAyah, pages, timestamp }
      completed: false,
    };
  }
  return record;
}

/** Log reading progress for today */
export async function logWirdProgress({ surah, fromAyah, toAyah, pagesCount = 0 }) {
  const db = await getDB();
  const date = todayKey();
  let record = await db.get(STORE, date);
  if (!record) {
    record = {
      date,
      pagesRead: 0,
      ayahsRead: 0,
      sessionsCount: 0,
      entries: [],
      completed: false,
    };
  }

  const ayahCount = Math.max(0, (toAyah || fromAyah) - fromAyah + 1);
  record.entries.push({
    surah,
    fromAyah,
    toAyah: toAyah || fromAyah,
    pages: pagesCount,
    timestamp: Date.now(),
  });
  record.pagesRead += pagesCount;
  record.ayahsRead += ayahCount;
  record.sessionsCount += 1;

  await db.put(STORE, record);
  return record;
}

/** Mark today as completed */
export async function markWirdCompleted(completed = true) {
  const db = await getDB();
  const date = todayKey();
  let record = await db.get(STORE, date);
  if (!record) {
    record = { date, pagesRead: 0, ayahsRead: 0, sessionsCount: 0, entries: [], completed };
  }
  record.completed = completed;
  await db.put(STORE, record);
  return record;
}

/** Get wird records for the last N days */
export async function getWirdHistory(days = 30) {
  const db = await getDB();
  const all = await db.getAll(STORE);
  // Sort by date descending, limit
  return all
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);
}

/** Get wird record for a specific date (YYYY-MM-DD) */
export async function getWirdForDate(date) {
  const db = await getDB();
  return db.get(STORE, date);
}

/** Reset today's wird */
export async function resetTodayWird() {
  const db = await getDB();
  const date = todayKey();
  await db.put(STORE, {
    date,
    pagesRead: 0,
    ayahsRead: 0,
    sessionsCount: 0,
    entries: [],
    completed: false,
  });
}
