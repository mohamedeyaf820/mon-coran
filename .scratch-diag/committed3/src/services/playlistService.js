/**
 * Playlist Service
 * CRUD for custom ayah playlists, stored in IndexedDB.
 */

import { getDB } from './dbService.js';

const STORE = 'playlists';

function generateId() {
  return 'pl-' + crypto.randomUUID();
}

/** Create a new playlist */
export async function createPlaylist(name) {
  const db = await getDB();
  const playlist = {
    id: generateId(),
    name: name || 'Ma playlist',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ayahs: [],  // [{ surah, ayah, text? }]
  };
  await db.put(STORE, playlist);
  return playlist;
}

/** Get a playlist by ID */
export async function getPlaylist(id) {
  const db = await getDB();
  return db.get(STORE, id);
}

/** Get all playlists */
export async function getAllPlaylists() {
  const db = await getDB();
  const all = await db.getAll(STORE);
  return all.sort((a, b) => b.updatedAt - a.updatedAt);
}

// Keep the read and write in one transaction so concurrent tabs cannot lose updates.
async function updatePlaylist(id, update) {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readwrite');
  try {
    const playlist = await tx.store.get(id);
    if (!playlist) { await tx.done; return null; }
    update(playlist);
    playlist.updatedAt = Date.now();
    await tx.store.put(playlist);
    await tx.done;
    return playlist;
  } catch (error) {
    try { tx.abort(); } catch { /* The transaction may already have aborted. */ }
    await tx.done.catch(() => {});
    throw error;
  }
}

export function renamePlaylist(id, newName) {
  return updatePlaylist(id, (playlist) => { playlist.name = newName; });
}

export function addAyahToPlaylist(playlistId, surah, ayah, text = '') {
  return updatePlaylist(playlistId, (playlist) => {
    if (!playlist.ayahs.some((entry) => entry.surah === surah && entry.ayah === ayah)) {
      playlist.ayahs.push({ surah, ayah, text });
    }
  });
}

export function removeAyahFromPlaylist(playlistId, surah, ayah) {
  return updatePlaylist(playlistId, (playlist) => {
    playlist.ayahs = playlist.ayahs.filter((entry) => !(entry.surah === surah && entry.ayah === ayah));
  });
}

/** Validate an imported playlist before merging it into the local collection. */
export async function importPlaylistRecord(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (typeof value.id !== 'string' || !/^pl-[a-zA-Z0-9-]{1,100}$/.test(value.id)) return false;
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 50) return false;
  if (![value.createdAt, value.updatedAt].every((time) => Number.isSafeInteger(time) && time >= 0)) return false;
  if (!Array.isArray(value.ayahs) || value.ayahs.length > 6236) return false;
  const seen = new Set();
  const ayahs = [];
  for (const item of value.ayahs) {
    if (!item || !Number.isInteger(item.surah) || item.surah < 1 || item.surah > 114 ||
      !Number.isInteger(item.ayah) || item.ayah < 1 || item.ayah > 286 ||
      (item.text !== undefined && (typeof item.text !== 'string' || item.text.length > 8000))) return false;
    const key = item.surah + ':' + item.ayah;
    if (!seen.has(key)) ayahs.push({ surah: item.surah, ayah: item.ayah, text: item.text || '' });
    seen.add(key);
  }
  const db = await getDB();
  await db.put(STORE, { id: value.id, name: value.name, createdAt: value.createdAt, updatedAt: value.updatedAt, ayahs });
  return true;
}

/** Delete a playlist */
export async function deletePlaylist(id) {
  const db = await getDB();
  await db.delete(STORE, id);
}

/** Clear all playlists */
export async function clearAllPlaylists() {
  const db = await getDB();
  const tx = db.transaction(STORE, 'readwrite');
  await tx.objectStore(STORE).clear();
  await tx.done;
}
