import { getDB } from "./dbService.js";

function parseVerseKey(verseKey) {
  const [surah, ayah] = String(verseKey || "").split(":").map(Number);
  return { surah, ayah };
}

function validateVerseIdentity(verse, expectedChapter = null, expectedKey = null) {
  if (!verse || typeof verse !== "object") return false;
  const { surah, ayah } = parseVerseKey(verse.verse_key);
  const chapterId = Number(verse.chapter_id || surah);
  const verseNumber = Number(verse.verse_number || ayah);
  return (
    Number.isInteger(chapterId) &&
    chapterId >= 1 &&
    chapterId <= 114 &&
    Number.isInteger(verseNumber) &&
    verseNumber >= 1 &&
    verseNumber <= 286 &&
    (!surah || surah === chapterId) &&
    (!ayah || ayah === verseNumber) &&
    (!expectedChapter || chapterId === expectedChapter) &&
    (!expectedKey || `${chapterId}:${verseNumber}` === expectedKey)
  );
}

export function validateQuranComPayload(url, json) {
  if (!json || typeof json !== "object" || Array.isArray(json)) {
    throw new Error("Malformed Quran.com API response");
  }
  const chapterMatch = /\/verses\/by_chapter\/(\d+)/.exec(url);
  const keyMatch = /\/verses\/by_key\/(\d+):(\d+)/.exec(url);
  const expectedChapter = chapterMatch ? Number(chapterMatch[1]) : null;
  const expectedKey = keyMatch ? `${Number(keyMatch[1])}:${Number(keyMatch[2])}` : null;
  const verses = Array.isArray(json.verses) ? json.verses : json.verse ? [json.verse] : [];
  const seen = new Set();
  for (const verse of verses) {
    if (!validateVerseIdentity(verse, expectedChapter, expectedKey)) {
      throw new Error("Quran.com verse identity mismatch");
    }
    const key = verse.verse_key || `${verse.chapter_id}:${verse.verse_number}`;
    if (seen.has(key)) throw new Error("Duplicate Quran.com verse identity");
    seen.add(key);
  }
  return json;
}

export async function clearQuranComPersistentCache(prefixes) {
  try {
    const db = await getDB();
    const tx = db.transaction("cache", "readwrite");
    const store = tx.objectStore("cache");
    let cursor = await store.openCursor();
    while (cursor) {
      if (
        typeof cursor.key === "string" &&
        prefixes.some((prefix) => cursor.key.startsWith(prefix))
      ) {
        await cursor.delete();
      }
      cursor = await cursor.continue();
    }
  } catch {
    // Versioned keys isolate legacy data if cleanup is unavailable.
  }
}
