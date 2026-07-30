import test from "node:test";
import assert from "node:assert/strict";

import {
  clearEncryptionSession,
  configureEncryptionPassphrase,
  decryptDataWithMeta,
  encryptData,
  hasEncryptionPassphraseConfigured,
  isProtectedStorageLocked,
  MIN_PASSPHRASE_LENGTH,
  removePersistedDeviceKey,
  removeEncryptionPassphrase,
  unlockEncryptionWithPassphrase,
} from "../src/services/cryptoUtil.js";
import { getSettings, saveSettings } from "../src/services/storageService.js";

function createMockStorage() {
  const map = new Map();
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
  };
}

test("crypto: authenticated device envelopes reject tampering", () => {
  globalThis.localStorage = createMockStorage();
  removeEncryptionPassphrase();

  const ciphertext = encryptData({ note: "private" });
  assert.match(ciphertext, /^mpenc:v2:/);
  assert.deepEqual(decryptDataWithMeta(ciphertext).data, { note: "private" });

  const last = ciphertext.at(-1);
  const tampered = `${ciphertext.slice(0, -1)}${last === "A" ? "B" : "A"}`;
  assert.equal(decryptDataWithMeta(tampered).data, null);
});

test("crypto: protected migrations can purge the persisted fallback device key", () => {
  globalThis.localStorage = createMockStorage();
  localStorage.setItem("mushafplus_device_key_v1", "a".repeat(64));
  assert.equal(removePersistedDeviceKey(), true);
  assert.equal(localStorage.getItem("mushafplus_device_key_v1"), null);
});

test("crypto: protected mode locks the key and validates the passphrase", async () => {
  globalThis.localStorage = createMockStorage();
  removeEncryptionPassphrase();
  const passphrase = "correct horse battery staple";

  const configured = await configureEncryptionPassphrase(passphrase, {
    uiLang: "en",
  });
  assert.deepEqual(configured, { ok: true });
  assert.equal(hasEncryptionPassphraseConfigured(), true);

  const ciphertext = encryptData({ settings: { lang: "fr" } });
  clearEncryptionSession();
  assert.equal(isProtectedStorageLocked(), true);
  assert.equal(decryptDataWithMeta(ciphertext).locked, true);
  assert.equal(await unlockEncryptionWithPassphrase("wrong passphrase value"), false);
  assert.equal(await unlockEncryptionWithPassphrase(passphrase), true);
  assert.deepEqual(decryptDataWithMeta(ciphertext).data, {
    settings: { lang: "fr" },
  });
});

test("crypto: passphrases enforce a meaningful minimum and plaintext migrates", async () => {
  globalThis.localStorage = createMockStorage();
  removeEncryptionPassphrase();

  const short = await configureEncryptionPassphrase(
    "x".repeat(MIN_PASSPHRASE_LENGTH - 1),
  );
  assert.equal(short.ok, false);
  assert.equal(hasEncryptionPassphraseConfigured(), false);

  const legacy = decryptDataWithMeta(JSON.stringify({ legacy: true }));
  assert.deepEqual(legacy.data, { legacy: true });
  assert.equal(legacy.needsMigration, true);
});

test("crypto: locked settings cannot be overwritten by defaults", async () => {
  globalThis.localStorage = createMockStorage();
  removeEncryptionPassphrase();
  const passphrase = "another unique protected phrase";
  assert.equal((await configureEncryptionPassphrase(passphrase)).ok, true);
  assert.equal(saveSettings({ lang: "en", theme: "dark" }), true);
  const protectedSettings = localStorage.getItem("mushaf-plus-settings");

  clearEncryptionSession();
  assert.equal(saveSettings({ lang: "fr", theme: "light" }), false);
  assert.equal(localStorage.getItem("mushaf-plus-settings"), protectedSettings);

  assert.equal(await unlockEncryptionWithPassphrase(passphrase), true);
  assert.equal(getSettings().lang, "en");
  assert.equal(getSettings().theme, "dark");
});
