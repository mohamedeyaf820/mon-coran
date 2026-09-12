import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { installQuranNetworkFixtures } from './helpers/quran-network-fixtures.mjs';

test.beforeEach(async ({ page }) => {
  await installQuranNetworkFixtures(page);
  await page.addInitScript(() => {
    if (!localStorage.getItem('mushaf-plus-settings')) localStorage.setItem('mushaf-plus-settings', JSON.stringify({
      lang: 'fr', theme: 'light', riwaya: 'hafs', skipSplashAnimation: true,
      showHome: true, sidebarOpen: false, mushafLayout: 'list', showTranslation: true,
    }));
  });
});

async function openLibrary(page, tab = 'Notes') {
  await page.goto('/');
  await page.getByRole('button', { name: new RegExp(`^\\d+ ${tab}$`) }).click();
  const dialog = page.getByRole('dialog', { name: 'Bibliothèque', exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.library-loading')).toHaveCount(0);
  return dialog;
}

async function seedNote(page, text = 'Note QA conservée') {
  await page.evaluate(async (text) => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('mushafplus');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const tx = db.transaction('notes', 'readwrite');
    tx.objectStore('notes').put({ id: '1:1', surah: 1, ayah: 1, text, updatedAt: Date.now() });
    await new Promise((resolve, reject) => { tx.oncomplete = resolve; tx.onabort = () => reject(tx.error); });
    db.close();
  }, text);
}

async function failNoteWrites(page) {
  await page.evaluate(() => {
    const put = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      const request = put.apply(this, args);
      if (this.name === 'notes' && window.__qaFailNoteWrites) this.transaction.abort();
      return request;
    };
    window.__qaFailNoteWrites = true;
  });
}

test('QA: library notes can be edited, searched and restored after reload', async ({ page }) => {
  await openLibrary(page);
  await seedNote(page);
  let dialog = await openLibrary(page);
  await dialog.getByRole('button', { name: 'Modifier', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Modifier', exact: true }).fill('Note QA modifiée');
  await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(dialog.getByRole('textbox', { name: 'Modifier', exact: true })).toHaveCount(0);
  await expect(dialog.getByText('Note QA modifiée', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.locator('.app-view-home')).toBeVisible();
  await expect(page.getByRole('button', { name: /^1 Notes$/ })).toBeVisible();
  await page.getByRole('button', { name: /^\d+ Notes$/ }).click();
  dialog = page.getByRole('dialog', { name: 'Bibliothèque', exact: true });
  await expect(dialog.locator('.library-loading')).toHaveCount(0);
  await expect(dialog.getByText('Note QA modifiée', { exact: true })).toBeVisible();
  await dialog.getByRole('searchbox').fill('introuvable');
  await expect(dialog.locator('.library-row')).toHaveCount(0);
  await dialog.getByRole('searchbox').fill('modifiée');
  await expect(dialog.locator('.library-row')).toHaveCount(1);
});

test('QA: library retains an unsaved note and allows retry after an aborted write', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await openLibrary(page);
  await seedNote(page);
  const dialog = await openLibrary(page);
  await dialog.getByRole('button', { name: 'Modifier', exact: true }).click();
  const editor = dialog.getByRole('textbox', { name: 'Modifier', exact: true });
  await editor.fill('Brouillon QA à conserver');
  await failNoteWrites(page);
  await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(dialog.getByRole('alert')).toBeVisible();
  await expect(editor).toHaveValue('Brouillon QA à conserver');
  await page.evaluate(() => { window.__qaFailNoteWrites = false; });
  await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(editor).toHaveCount(0);
  await expect(dialog.getByText('Brouillon QA à conserver', { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test('QA: reader never announces a note saved when the database transaction aborts', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/surah/1');
  await page.locator('.ayah-action--options').first().click();
  await page.getByRole('menuitem', { name: 'Ajouter une note', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Ecrire sur cette ayah', exact: true });
  const editor = dialog.getByRole('textbox', { name: 'Note personnelle sur ce verset' });
  await editor.fill('Brouillon lecteur QA');
  await failNoteWrites(page);
  await dialog.getByRole('button', { name: /Enregistrer/ }).click();
  await expect(page.locator('.toast-notification')).toContainText(/Impossible/);
  await expect(editor).toHaveValue('Brouillon lecteur QA');
  expect(errors).toEqual([]);
});

test('QA: library shows a retryable storage error instead of an empty collection', async ({ page }) => {
  await page.addInitScript(() => {
    const getAll = IDBObjectStore.prototype.getAll;
    IDBObjectStore.prototype.getAll = function (...args) {
      if (this.name === 'playlists' && !window.__qaRecovered) throw new DOMException('Test database unavailable', 'InvalidStateError');
      return getAll.apply(this, args);
    };
  });
  const dialog = await openLibrary(page);
  await expect(dialog.getByRole('alert')).toBeVisible();
  await page.evaluate(() => { window.__qaRecovered = true; });
  await dialog.getByRole('button', { name: /Réessayer/ }).click();
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await expect(dialog.getByText('Aucune note personnelle pour le moment.')).toBeVisible();
});

test('QA: library playlists can be created, renamed and persisted', async ({ page }) => {
  let dialog = await openLibrary(page, 'Listes');
  await dialog.getByPlaceholder('Nouvelle liste').fill('Liste QA');
  await dialog.getByRole('button', { name: 'Créer', exact: true }).click();
  await expect(dialog.getByText('Liste QA', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Modifier', exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Modifier', exact: true }).fill('Liste QA renommée');
  await dialog.getByRole('button', { name: 'Enregistrer', exact: true }).click();
  await expect(dialog.getByRole('textbox', { name: 'Modifier', exact: true })).toHaveCount(0);
  dialog = await openLibrary(page, 'Listes');
  await expect(dialog.getByText('Liste QA renommée', { exact: true })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Écouter', exact: true })).toBeDisabled();
});

test('QA: library tabs expose accessible relationships and keyboard navigation', async ({ page }) => {
  const dialog = await openLibrary(page);
  const tablist = dialog.getByRole('tablist');
  await expect(tablist).toBeVisible();
  const notes = tablist.getByRole('tab', { name: /Notes/ });
  await notes.focus();
  await page.keyboard.press('ArrowRight');
  await expect(tablist.getByRole('tab', { name: /Listes audio/ })).toBeFocused();
  await expect(dialog.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', /library-tab-playlists/);
  const axe = await new AxeBuilder({ page }).include('.library-modal').withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(axe.violations.filter(v => ['serious', 'critical'].includes(v.impact))).toEqual([]);
});

test('QA: footer accessible reference follows the rotating verse', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  const verse = page.locator('.mp-footer-v2__verse');
  await expect(verse).toHaveAttribute('aria-label', await page.locator('.mp-footer-v2__verse-ref').innerText());
  await page.clock.fastForward(30_000);
  const reference = await page.locator('.mp-footer-v2__verse-ref').innerText();
  await expect(verse).toHaveAttribute('aria-label', reference);
});

test('QA: denied clipboard access on duas gives feedback without crashing', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: () => Promise.reject(new DOMException('Permission denied', 'NotAllowedError')),
    } });
  });
  await page.goto('/duas');
  await page.getByRole('button', { name: /Copier/ }).first().click();
  await expect(page.locator('.toast-notification')).toContainText(/Impossible/);
  expect(errors).toEqual([]);
});

test('QA: a late initial note read never replaces text already being edited', async ({ page }) => {
  await page.addInitScript(() => {
    const addListener = IDBRequest.prototype.addEventListener;
    window.__qaNoteReads = [];
    IDBRequest.prototype.addEventListener = function (type, listener, ...options) {
      if (type === 'success' && this.source?.name === 'notes') {
        return addListener.call(this, type, (event) => {
          window.__qaNoteReads.push(() => listener.call(this, event));
        }, ...options);
      }
      return addListener.call(this, type, listener, ...options);
    };
  });
  await page.goto('/surah/1');
  await page.locator('.ayah-action--options').first().click();
  await page.getByRole('menuitem', { name: 'Ajouter une note', exact: true }).click();
  const editor = page.getByRole('textbox', { name: 'Note personnelle sur ce verset' });
  await editor.fill('Brouillon avant fin du chargement QA');
  await expect.poll(() => page.evaluate(() => window.__qaNoteReads.length)).toBeGreaterThan(0);
  await page.evaluate(() => window.__qaNoteReads.splice(0).forEach(release => release()));
  await expect(editor).toHaveValue('Brouillon avant fin du chargement QA');
});
