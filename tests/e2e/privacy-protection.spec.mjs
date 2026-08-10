import { test, expect } from "@playwright/test";

const PASSPHRASE = "ma phrase secrete robuste 2026";
const NEXT_PASSPHRASE = "ma nouvelle phrase robuste 2026";

async function openSettings(page) {
  const directButton = page.locator(".mp-header__settings").first();
  if (await directButton.isVisible().catch(() => false)) {
    await directButton.click();
    return;
  }

  await page.locator(".mp-header__more").first().click();
  await page.locator('.mp-header-menu__item[data-key="settings"]').click();
}

async function openAdvancedProtection(page) {
  const disclosure = page.locator(".settings-advanced-disclosure").first();
  if (!(await disclosure.evaluate((element) => element.open))) {
    await disclosure.locator("summary").click();
  }
}

async function seedLegacyPrivateRecords(page) {
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("mushafplus", 3);
      request.onupgradeneeded = () => {
        const nextDb = request.result;
        if (!nextDb.objectStoreNames.contains("notes")) {
          nextDb.createObjectStore("notes", { keyPath: "id" });
        }
        if (!nextDb.objectStoreNames.contains("bookmarks")) {
          nextDb.createObjectStore("bookmarks", { keyPath: "id" });
        }
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const transaction = db.transaction(["notes", "bookmarks"], "readwrite");
    transaction.objectStore("notes").put({
      id: "1:1",
      surah: 1,
      ayah: 1,
      text: "private note",
      updatedAt: 1,
    });
    transaction.objectStore("bookmarks").put({
      id: "1:1",
      surah: 1,
      ayah: 1,
      label: "private bookmark",
      createdAt: 1,
    });
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    db.close();
  });
}

async function readRawPrivateRecords(page) {
  return page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("mushafplus", 3);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const transaction = db.transaction(["notes", "bookmarks"], "readonly");
    const read = (store) =>
      new Promise((resolve, reject) => {
        const request = transaction.objectStore(store).get("1:1");
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    const [note, bookmark] = await Promise.all([read("notes"), read("bookmarks")]);
    db.close();
    return { note, bookmark };
  });
}

test("privacy: protected mode migrates records and locks after reload", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "mushaf-plus-settings",
      JSON.stringify({
        lang: "fr",
        theme: "light",
        showHome: true,
        showDuas: false,
        riwaya: "hafs",
      }),
    );
  });
  await page.goto("/");
  await expect(page.locator(".app-view-home")).toBeVisible();
  await seedLegacyPrivateRecords(page);

  await openSettings(page);
  await expect(page.locator(".settings-drawer")).toBeVisible();
  await page.getByRole("tab", { name: "Confidentialit\u00e9" }).click();
  await openAdvancedProtection(page);
  await page.locator("#settings-protection-new").fill(PASSPHRASE);
  await page.locator("#settings-protection-confirm").fill(PASSPHRASE);
  await page.getByRole("button", { name: "Activer le mode prot\u00e9g\u00e9" }).click();
  await expect(page.getByText("Mode prot\u00e9g\u00e9 actif")).toBeVisible();

  const storageState = await page.evaluate(() => ({
    settings: localStorage.getItem("mushaf-plus-settings"),
    config: localStorage.getItem("mushafplus_crypto_config_v2"),
    deviceKey: localStorage.getItem("mushafplus_device_key_v1"),
  }));
  expect(storageState.settings).toMatch(/^mpenc:v2:/);
  expect(storageState.deviceKey).toBeNull();
  expect(JSON.parse(storageState.config)).toMatchObject({
    version: 2,
    kdf: "PBKDF2-HMAC-SHA256",
    iterations: 600000,
  });

  const rawRecords = await readRawPrivateRecords(page);
  expect(rawRecords.note).toMatchObject({
    id: "1:1",
    format: "mushafplus-encrypted-record-v2",
  });
  expect(rawRecords.bookmark).toMatchObject({
    id: "1:1",
    format: "mushafplus-encrypted-record-v2",
  });
  expect(rawRecords.note.text).toBeUndefined();
  expect(rawRecords.bookmark.label).toBeUndefined();

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "D\u00e9verrouiller MushafPlus" })).toBeVisible({ timeout: 15_000 });
  await page.locator("#privacy-unlock-passphrase").fill("phrase incorrecte assez longue");
  await page.getByRole("button", { name: "D\u00e9verrouiller" }).click();
  await expect(page.getByText("Phrase secr\u00e8te incorrecte.")).toBeVisible();

  await page.locator("#privacy-unlock-passphrase").fill(PASSPHRASE);
  await page.getByRole("button", { name: "D\u00e9verrouiller" }).click();
  await expect(page.locator(".app-view-home")).toBeVisible();

  await openSettings(page);
  await page.getByRole("tab", { name: "Confidentialit\u00e9" }).click();
  await openAdvancedProtection(page);
  await page.locator("#settings-protection-current").fill(PASSPHRASE);
  await page.locator("#settings-protection-replacement").fill(NEXT_PASSPHRASE);
  await page.locator("#settings-protection-replacement-confirm").fill(NEXT_PASSPHRASE);
  await page.getByRole("button", { name: "Modifier", exact: true }).click();
  await expect(page.getByText("Phrase secr\u00e8te modifi\u00e9e.")).toBeVisible();

  await page.reload();
  await page.locator("#privacy-unlock-passphrase").fill(PASSPHRASE);
  await page.getByRole("button", { name: "D\u00e9verrouiller" }).click();
  await expect(page.getByText("Phrase secr\u00e8te incorrecte.")).toBeVisible();
  await page.locator("#privacy-unlock-passphrase").fill(NEXT_PASSPHRASE);
  await page.getByRole("button", { name: "D\u00e9verrouiller" }).click();
  await expect(page.locator(".app-view-home")).toBeVisible();

  await openSettings(page);
  await page.getByRole("tab", { name: "Confidentialit\u00e9" }).click();
  await openAdvancedProtection(page);
  await page.locator("#settings-protection-disable").fill(NEXT_PASSPHRASE);
  await page.getByRole("button", { name: "D\u00e9sactiver le mode prot\u00e9g\u00e9" }).click();
  await expect(page.getByRole("button", { name: "Activer le mode prot\u00e9g\u00e9", exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("mushafplus_crypto_config_v2"))).toBeNull();
  const deviceEncryptedRecords = await readRawPrivateRecords(page);
  expect(deviceEncryptedRecords.note?.format).toBe("mushafplus-encrypted-record-v2");
  expect(deviceEncryptedRecords.bookmark?.format).toBe("mushafplus-encrypted-record-v2");

  await page.reload();
  await expect(page.locator(".app-view-home")).toBeVisible();
  await expect(page.locator(".privacy-lock")).toHaveCount(0);
});
