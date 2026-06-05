/**
 * Playlist Service
 * CRUD for custom ayah playlists, stored in IndexedDB.
 */

import { getDB } from './dbService';

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

/** Update a playlist name */
export async function renamePlaylist(id, newName) {
  const db = await getDB();
  const pl = await db.get(STORE, id);
  if (!pl) return null;
  pl.name = newName;
  pl.updatedAt = Date.now();
  await db.put(STORE, pl);
  return pl;
}

/** Add an ayah to a playlist */
export async function addAyahToPlaylist(playlistId, surah, ayah, text = '') {
  const db = await getDB();
  const pl = await db.get(STORE, playlistId);
  if (!pl) return null;
  // Avoid duplicates
  const exists = pl.ayahs.some(a => a.surah === surah && a.ayah === ayah);
  if (exists) return pl;
  pl.ayahs.push({ surah, ayah, text });
  pl.updatedAt = Date.now();
  await db.put(STORE, pl);
  return pl;
}

/** Remove an ayah from a playlist */
export async function removeAyahFromPlaylist(playlistId, surah, ayah) {
  const db = await getDB();
  const pl = await db.get(STORE, playlistId);
  if (!pl) return null;
  pl.ayahs = pl.ayahs.filter(a => !(a.surah === surah && a.ayah === ayah));
  pl.updatedAt = Date.now();
  await db.put(STORE, pl);
  return pl;
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
}
