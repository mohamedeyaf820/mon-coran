/**
 * Export / Import service – JSON format.
 * Exports: bookmarks, notes, settings.
 */

import { getAllBookmarks, getAllNotes, getSettings, saveSettings } from './storageService';
import { getDB } from './dbService';

/**
 * Export all user data to a JSON string.
 */
export async function exportData() {
  const bookmarks = await getAllBookmarks();
  const notes = await getAllNotes();
  const settings = getSettings();

  const payload = {
    app: 'MushafPlus',
    version: 1,
    exportedAt: new Date().toISOString(),
    bookmarks,
    notes,
    settings,
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Download export as .json file.
 */
export async function downloadExport() {
  const json = await exportData();
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mushafplus-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import data from a JSON string.
 * Merges with existing data (new entries overwrite old on same key).
 */
export async function importData(jsonString) {
  let data;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON backup file');
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('Invalid backup format');
  }

  if (data.app !== 'MushafPlus') {
    throw new Error('Invalid MushafPlus backup file');
  }

  const db = await getDB();

  // Import bookmarks
  const bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
  if (bookmarks.length) {
    const tx = db.transaction('bookmarks', 'readwrite');
    for (const bm of bookmarks) {
      if (bm && typeof bm === 'object' && typeof bm.id === 'string') {
        await tx.store.put(bm);
      }
    }
    await tx.done;
  }

  // Import notes
  const notes = Array.isArray(data.notes) ? data.notes : [];
  if (notes.length) {
    const tx = db.transaction('notes', 'readwrite');
    for (const note of notes) {
      if (note && typeof note === 'object' && typeof note.id === 'string') {
        await tx.store.put(note);
      }
    }
    await tx.done;
  }

  // Import settings (merge)
  if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
    const current = getSettings();
    saveSettings({ ...current, ...data.settings });
  }

  return {
    bookmarks: bookmarks.length,
    notes: notes.length,
    settingsRestored: !!(data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)),
  };
}

/**
 * Import from a File object (from <input type="file">).
 */
export async function importFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const result = await importData(e.target.result);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
