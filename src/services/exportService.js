/**
 * Export / Import service – JSON format.
 * Exports: bookmarks, notes, settings.
 */

import {
  getAllBookmarks,
  getAllNotes,
  getSettings,
  importBookmarkRecord,
  importNoteRecord,
  saveSettings,
} from './storageService';
import { getSurah } from '../data/surahs';

const COLLECTION_FORMATS = new Set(['json', 'markdown', 'csv']);

function referenceLabel(surah, ayah) {
  const meta = getSurah(Number(surah));
  return `${surah}:${ayah}${meta ? ` - ${meta.en}` : ''}`;
}

function safeSpreadsheetCell(value) {
  const text = String(value ?? '').replace(/\r?\n/g, ' ');
  const protectedText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${protectedText.replace(/"/g, '""')}"`;
}

function buildCollectionsPayload(bookmarks, notes) {
  return {
    app: 'MushafPlus',
    version: 2,
    type: 'collections',
    exportedAt: new Date().toISOString(),
    bookmarks,
    notes,
  };
}

function collectionsAsMarkdown(payload, lang = 'fr') {
  const title = lang === 'en' ? 'My Quran notes and bookmarks' : 'Mes notes et favoris du Coran';
  const notesTitle = lang === 'en' ? 'Notes' : 'Notes';
  const bookmarksTitle = lang === 'en' ? 'Bookmarks' : 'Favoris';
  const empty = lang === 'en' ? '_None_' : '_Aucun_';
  const lines = [`# ${title}`, '', `${payload.exportedAt}`, '', `## ${notesTitle}`, ''];

  if (!payload.notes.length) lines.push(empty, '');
  payload.notes.forEach((note) => {
    lines.push(`### ${referenceLabel(note.surah, note.ayah)}`, '', String(note.text || ''), '');
  });

  lines.push(`## ${bookmarksTitle}`, '');
  if (!payload.bookmarks.length) lines.push(empty, '');
  payload.bookmarks.forEach((bookmark) => {
    lines.push(
      `- ${referenceLabel(bookmark.surah, bookmark.ayah)}${bookmark.label ? ` - ${bookmark.label}` : ''}`,
    );
  });
  return lines.join('\n');
}

function collectionsAsCsv(payload) {
  const rows = [['type', 'reference', 'surah', 'ayah', 'label', 'text', 'updatedAt']];
  payload.notes.forEach((note) => rows.push([
    'note',
    referenceLabel(note.surah, note.ayah),
    note.surah,
    note.ayah,
    '',
    note.text || '',
    note.updatedAt ? new Date(note.updatedAt).toISOString() : '',
  ]));
  payload.bookmarks.forEach((bookmark) => rows.push([
    'bookmark',
    referenceLabel(bookmark.surah, bookmark.ayah),
    bookmark.surah,
    bookmark.ayah,
    bookmark.label || '',
    '',
    bookmark.createdAt ? new Date(bookmark.createdAt).toISOString() : '',
  ]));
  return `\uFEFF${rows.map((row) => row.map(safeSpreadsheetCell).join(',')).join('\n')}`;
}

export async function exportCollections({
  includeBookmarks = true,
  includeNotes = true,
  format = 'json',
  lang = 'fr',
} = {}) {
  const safeFormat = COLLECTION_FORMATS.has(format) ? format : 'json';
  const [allBookmarks, allNotes] = await Promise.all([
    includeBookmarks ? getAllBookmarks() : [],
    includeNotes ? getAllNotes() : [],
  ]);
  const payload = buildCollectionsPayload(allBookmarks, allNotes);

  if (safeFormat === 'markdown') {
    return {
      content: collectionsAsMarkdown(payload, lang),
      mime: 'text/markdown;charset=utf-8',
      extension: 'md',
      payload,
    };
  }
  if (safeFormat === 'csv') {
    return {
      content: collectionsAsCsv(payload),
      mime: 'text/csv;charset=utf-8',
      extension: 'csv',
      payload,
    };
  }
  return {
    content: JSON.stringify(payload, null, 2),
    mime: 'application/json',
    extension: 'json',
    payload,
  };
}

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

export async function downloadCollections(options = {}) {
  const exported = await exportCollections(options);
  const date = new Date().toISOString().slice(0, 10);
  downloadBlob(
    exported.content,
    exported.mime,
    `mushafplus-notes-favoris-${date}.${exported.extension}`,
  );
  return {
    bookmarks: exported.payload.bookmarks.length,
    notes: exported.payload.notes.length,
  };
}

export async function shareCollections(options = {}) {
  const exported = await exportCollections(options);
  const date = new Date().toISOString().slice(0, 10);
  const filename = `mushafplus-notes-favoris-${date}.${exported.extension}`;
  const file = new File([exported.content], filename, { type: exported.mime });

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.share === 'function' &&
    (!navigator.canShare || navigator.canShare({ files: [file] }))
  ) {
    await navigator.share({
      title: 'MushafPlus',
      text: 'MushafPlus - notes et favoris',
      files: [file],
    });
    return { shared: true, downloaded: false };
  }

  downloadBlob(exported.content, exported.mime, filename);
  return { shared: false, downloaded: true };
}

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

  // Import settings (merge)
  if (data.settings && typeof data.settings === 'object' && !Array.isArray(data.settings)) {
    const current = getSettings();
    saveSettings({ ...current, ...data.settings });
  }

  return {
    bookmarks: importedBookmarks,
    notes: importedNotes,
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
