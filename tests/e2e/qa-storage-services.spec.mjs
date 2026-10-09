import { expect, test } from '@playwright/test';
import { buildSync } from 'esbuild';
import { fileURLToPath } from 'node:url';

const moduleCode = buildSync({
  stdin: {
    contents: `export * from './src/services/playlistService.js'; export * from './src/services/exportService.js'; export * from './src/services/storageService.js'; export { getDB, dbSet } from './src/services/dbService.js'; export { enableProtectedMode } from './src/services/privacyProtectionService.js'; export { hasEncryptionPassphraseConfigured } from './src/services/cryptoUtil.js'; export { clearAllLocalAppData } from './src/services/localDataService.js';`,
    resolveDir: fileURLToPath(new URL('../../', import.meta.url)),
  },
  bundle: true, format: 'esm', platform: 'browser', write: false,
}).outputFiles[0].text;

test.beforeEach(async ({ page }) => {
  await page.route('**/qa-storage-module.js', route => route.fulfill({ body: moduleCode, contentType: 'text/javascript' }));
  await page.goto('/');
  await expect(page.locator('.app-view-home')).toBeVisible();
});

test('QA storage: concurrent playlist updates retain both verses and the new name', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const service = await import('/qa-storage-module.js');
    const playlist = await service.createPlaylist('QA initial');
    await Promise.all([
      service.addAyahToPlaylist(playlist.id, 1, 1),
      service.addAyahToPlaylist(playlist.id, 1, 2),
      service.renamePlaylist(playlist.id, 'QA renamed'),
    ]);
    const updated = await service.getPlaylist(playlist.id);
    await service.addAyahToPlaylist(playlist.id, 1, 1);
    const deduplicated = await service.getPlaylist(playlist.id);
    await service.removeAyahFromPlaylist(playlist.id, 1, 2);
    const removed = await service.getPlaylist(playlist.id);
    return { updated, deduplicated, removed };
  });
  expect(result.updated.name).toBe('QA renamed');
  expect(result.updated.ayahs.map(item => item.ayah).sort()).toEqual([1, 2]);
  expect(result.deduplicated.ayahs).toHaveLength(2);
  expect(result.removed.ayahs.map(item => item.ayah)).toEqual([1]);
});

test('QA storage: a complete backup restores notes, bookmarks and playlists', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const service = await import('/qa-storage-module.js');
    const playlist = await service.createPlaylist('QA sauvegarde');
    await service.addAyahToPlaylist(playlist.id, 2, 255, 'QA');
    await service.saveNote(1, 1, 'Note sauvegardée QA');
    await service.addBookmark(1, 2, 'Favori QA');
    const backup = await service.exportData();
    await service.clearAllPlaylists();
    await service.deleteNote(1, 1);
    await service.removeBookmark(1, 2);
    const counts = await service.importData(backup);
    return { backup: JSON.parse(backup), counts, playlist: await service.getPlaylist(playlist.id), note: await service.getNote(1, 1), bookmark: await service.isBookmarked(1, 2) };
  });
  expect(result.backup.playlists).toHaveLength(1);
  expect(result.counts).toMatchObject({ notes: 1, bookmarks: 1, playlists: 1 });
  expect(result.playlist.ayahs[0]).toMatchObject({ surah: 2, ayah: 255 });
  expect(result.note.text).toBe('Note sauvegardée QA');
  expect(result.bookmark).toBe(true);
});

test('QA storage: legacy backups remain valid and malformed records cannot overwrite another verse', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const service = await import('/qa-storage-module.js');
    await service.saveNote(1, 1, 'Original QA');
    const counts = await service.importData(JSON.stringify({ app: 'MushafPlus', version: 1, notes: [
      { id: '1:1', surah: 2, ayah: 255, text: 'Mauvaise référence QA', updatedAt: 1 },
    ], playlists: [{ id: 'pl-test', name: 'QA', createdAt: 1, updatedAt: 1, ayahs: [{ surah: 999, ayah: 1 }] }] }));
    return { counts, note: await service.getNote(1, 1), playlists: await service.getAllPlaylists() };
  });
  expect(result.counts).toMatchObject({ notes: 0, playlists: 0 });
  expect(result.note.text).toBe('Original QA');
  expect(result.playlists).toEqual([]);
});


test('QA storage: protection migration preserves notes when a database read fails', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const service = await import('/qa-storage-module.js');
    await service.saveNote(1, 1, 'Original before migration QA');
    const original = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (...args) {
      if (this.name === 'notes') throw new DOMException('QA read failure', 'UnknownError');
      return original.apply(this, args);
    };
    let migration;
    try {
      migration = await service.enableProtectedMode('QA-passphrase-2026');
    } finally {
      IDBObjectStore.prototype.getAll = original;
    }
    return { migration, note: await service.getNote(1, 1), protected: service.hasEncryptionPassphraseConfigured() };
  });
  expect(result.migration.ok).toBe(false);
  expect(result.protected).toBe(false);
  expect(result.note.text).toBe('Original before migration QA');
});

test('QA storage: failed deletion keeps data and resumes persistence', async ({ page }) => {
  const result = await page.evaluate(async () => {
    const service = await import('/qa-storage-module.js');
    await service.saveNote(1, 1, 'Note before failed deletion QA');
    const phases = [];
    window.addEventListener('mushafplus-local-data-deletion', event => phases.push(event.detail?.cancelled === true ? 'cancelled' : 'started'));
    const original = indexedDB.deleteDatabase;
    indexedDB.deleteDatabase = () => {
      const request = {};
      queueMicrotask(() => request.onerror?.());
      return request;
    };
    let error;
    try { await service.clearAllLocalAppData(); }
    catch (failure) { error = failure.message; }
    finally { indexedDB.deleteDatabase = original; }
    return { error, phases, note: await service.getNote(1, 1) };
  });
  expect(result.error).toContain('Unable to delete');
  expect(result.phases).toEqual(['started', 'cancelled']);
  expect(result.note.text).toBe('Note before failed deletion QA');
});
