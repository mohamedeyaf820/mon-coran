import { getAllPlaylists, importPlaylistRecord } from "./playlistService.js";
/**
 * Export / Import service – JSON format.
 * Exports: bookmarks, notes, playlists, settings.
 */

import {
  getAllBookmarks,
  getAllNotes,
  getSettings,
  importBookmarkRecord,
  importNoteRecord,
  saveSettings,
} from './storageService';
import { getErrorReport } from './errorAnalytics.js';
import { getPerformanceReport } from './performanceMetrics.js';
import { getStorageSnapshot } from './storageQuotaService.js';

function downloadBlob(content, mime, filename) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadDiagnostics() {
  const payload = {
    app: 'MushafPlus',
    version: 1,
    type: 'local-diagnostics',
    exportedAt: new Date().toISOString(),
    performance: getPerformanceReport(),
    errors: getErrorReport(),
    storage: await getStorageSnapshot(),
  };
  downloadBlob(
    JSON.stringify(payload, null, 2),
    'application/json',
    `mushafplus-diagnostic-${new Date().toISOString().slice(0, 10)}.json`,
  );
  return payload;
}

/**
 * Export all user data to a JSON string.
 */
export async function exportData() {
  const bookmarks = await getAllBookmarks();
  const notes = await getAllNotes();
  const settings = getSettings();
  const playlists = await getAllPlaylists();

  const payload = {
    app: 'MushafPlus',
    version: 2,
    exportedAt: new Date().toISOString(),
    bookmarks,
    notes,
    playlists,
    settings,
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Download export as .json file.
 */
export async function downloadExport() {
  const json = await exportData();
  downloadBlob(
    json,
    'application/json',
    `mushafplus-backup-${new Date().toISOString().slice(0, 10)}.json`,
  );
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

  // Import bookmarks
  const bookmarks = Array.isArray(data.bookmarks) ? data.bookmarks : [];
  let importedBookmarks = 0;
  for (const bookmark of bookmarks) {
    if (await importBookmarkRecord(bookmark)) importedBookmarks += 1;
  }

  // Import notes
  const notes = Array.isArray(data.notes) ? data.notes : [];
  let importedNotes = 0;
  for (const note of notes) {
    if (await importNoteRecord(note)) importedNotes += 1;
  }

  let importedPlaylists = 0;
  for (const playlist of Array.isArray(data.playlists) ? data.playlists : []) {
    if (await importPlaylistRecord(playlist)) importedPlaylists += 1;
  }

  // Import settings (merge)
  if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
    const current = getSettings();
    if (!saveSettings({ ...current, ...data.settings })) throw new Error("Unable to restore settings");
  }

  return {
    bookmarks: importedBookmarks,
    notes: importedNotes,
    playlists: importedPlaylists,
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
