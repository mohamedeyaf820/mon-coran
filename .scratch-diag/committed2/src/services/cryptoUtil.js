import CryptoJS from "crypto-js";

// The former application-wide key is retained only to migrate old installs.
const LEGACY_SECRET_KEY = String.fromCharCode(
  109, 117, 115, 104, 97, 102, 112, 108, 117, 115, 45, 50, 48, 50, 54,
);

const DEVICE_KEY_STORAGE_KEY = "mushafplus_device_key_v1";
const PROTECTION_CONFIG_KEY = "mushafplus_crypto_config_v2";
const LEGACY_PASSPHRASE_SALT_KEY = "mushafplus_crypto_salt_v1";
const LEGACY_PASSPHRASE_VERIFIER_KEY = "mushafplus_crypto_verifier_v1";
const ENVELOPE_PREFIX = "mpenc:v2:";
const PBKDF2_ITERATIONS = 600_000;

export const MIN_PASSPHRASE_LENGTH = 12;
export const MAX_PASSPHRASE_LENGTH = 256;

// Passphrase-derived keys exist only for the current page session.
let runtimeSecretKey = null;
let ephemeralDeviceKey = null;

function generateSecretKey() {
  if (typeof crypto === "undefined" || !crypto.getRandomValues) {
    throw new Error("Web Crypto random generation is unavailable");
  }
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function getOrCreateDeviceKey() {
  try {
    const stored = localStorage.getItem(DEVICE_KEY_STORAGE_KEY);
    if (/^[a-f0-9]{64,}$/i.test(stored || "")) return stored;
    const fresh = generateSecretKey();
    localStorage.setItem(DEVICE_KEY_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    if (!ephemeralDeviceKey) ephemeralDeviceKey = generateSecretKey();
    return ephemeralDeviceKey;
  }
}

function normalizeUiLanguage(value) {
  return ["fr", "en", "ar"].includes(value) ? value : "fr";
}

function readProtectionConfig() {
  try {
    const raw = localStorage.getItem(PROTECTION_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (
        parsed?.version === 2 &&
        parsed.kdf === "PBKDF2-HMAC-SHA256" &&
        Number.isInteger(parsed.iterations) &&
        parsed.iterations >= 120_000 &&
        typeof parsed.salt === "string" &&
        /^[a-f0-9]{64}$/i.test(parsed.salt) &&
        typeof parsed.verifier === "string" &&
        /^[a-f0-9]{64}$/i.test(parsed.verifier)
      ) {
        return {
          ...parsed,
          uiLang: normalizeUiLanguage(parsed.uiLang),
        };
      }
    }

    // Compatibility with the incomplete v1 protected-mode implementation.
    const salt = localStorage.getItem(LEGACY_PASSPHRASE_SALT_KEY);
    const verifier = localStorage.getItem(LEGACY_PASSPHRASE_VERIFIER_KEY);
    if (salt && verifier) {
      return {
        version: 1,
        kdf: "PBKDF2-HMAC-SHA256",
        iterations: 120_000,
        salt,
        verifier,
        uiLang: "fr",
      };
    }
  } catch {
    // Corrupt or unavailable storage is treated as an unconfigured mode.
  }
  return null;
}

function getActiveSecretKey() {
  if (readProtectionConfig()) {
    if (!runtimeSecretKey) {
      throw new Error("Protected storage is locked");
    }
    return runtimeSecretKey;
  }
  return getOrCreateDeviceKey();
}

function normalizePassphrase(passphrase) {
  return String(passphrase ?? "").normalize("NFKC");
}

function validatePassphrase(passphrase) {
  const normalized = normalizePassphrase(passphrase);
  if (normalized.trim().length < MIN_PASSPHRASE_LENGTH) {
    return { ok: false, error: "Passphrase too short" };
  }
  if (normalized.length > MAX_PASSPHRASE_LENGTH) {
    return { ok: false, error: "Passphrase too long" };
  }
  return { ok: true, value: normalized };
}

function bytesToHex(buffer) {
  return Array.from(new Uint8Array(buffer), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function deriveKeyFromPassphrase(passphrase, salt, iterations) {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("Web Crypto key derivation is unavailable");
  }
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: encoder.encode(salt),
      iterations,
    },
    keyMaterial,
    256,
  );
  return bytesToHex(bits);
}

function createVerifier(secret, version = 2) {
  if (version === 1) {
    return CryptoJS.SHA256(`${secret}|mushafplus-v1`).toString();
  }
  return CryptoJS.HmacSHA256(
    "mushafplus-protected-mode-verifier-v2",
    secret,
  ).toString();
}

function constantTimeEqual(left, right) {
  const a = String(left || "");
  const b = String(right || "");
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return difference === 0;
}

export function hasEncryptionPassphraseConfigured() {
  return Boolean(readProtectionConfig());
}

export function isEncryptionUnlocked() {
  return Boolean(runtimeSecretKey && readProtectionConfig());
}

export function isProtectedStorageLocked() {
  return hasEncryptionPassphraseConfigured() && !isEncryptionUnlocked();
}

export function getProtectionUiLanguage() {
  return readProtectionConfig()?.uiLang || "fr";
}

export function clearEncryptionSession() {
  runtimeSecretKey = null;
}

export function removePersistedDeviceKey() {
  try {
    localStorage.removeItem(DEVICE_KEY_STORAGE_KEY);
    ephemeralDeviceKey = null;
    return localStorage.getItem(DEVICE_KEY_STORAGE_KEY) === null;
  } catch {
    return false;
  }
}

export function snapshotEncryptionConfiguration() {
  try {
    return {
      config: localStorage.getItem(PROTECTION_CONFIG_KEY),
      legacySalt: localStorage.getItem(LEGACY_PASSPHRASE_SALT_KEY),
      legacyVerifier: localStorage.getItem(LEGACY_PASSPHRASE_VERIFIER_KEY),
    };
  } catch {
    return { config: null, legacySalt: null, legacyVerifier: null };
  }
}

export function restoreEncryptionConfiguration(snapshot = {}) {
  const restore = (key, value) => {
    if (typeof value === "string") localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  };
  try {
    restore(PROTECTION_CONFIG_KEY, snapshot.config);
    restore(LEGACY_PASSPHRASE_SALT_KEY, snapshot.legacySalt);
    restore(LEGACY_PASSPHRASE_VERIFIER_KEY, snapshot.legacyVerifier);
    runtimeSecretKey = null;
    return true;
  } catch {
    runtimeSecretKey = null;
    return false;
  }
}

export async function configureEncryptionPassphrase(passphrase, options = {}) {
  const validated = validatePassphrase(passphrase);
  if (!validated.ok) return validated;

  try {
    const salt = generateSecretKey();
    const secret = await deriveKeyFromPassphrase(
      validated.value,
      salt,
      PBKDF2_ITERATIONS,
    );
    const config = {
      version: 2,
      kdf: "PBKDF2-HMAC-SHA256",
      iterations: PBKDF2_ITERATIONS,
      salt,
      verifier: createVerifier(secret),
      uiLang: normalizeUiLanguage(options.uiLang),
    };
    localStorage.setItem(PROTECTION_CONFIG_KEY, JSON.stringify(config));
    localStorage.removeItem(LEGACY_PASSPHRASE_SALT_KEY);
    localStorage.removeItem(LEGACY_PASSPHRASE_VERIFIER_KEY);
    runtimeSecretKey = secret;
    return { ok: true };
  } catch {
    runtimeSecretKey = null;
    return { ok: false, error: "Storage unavailable" };
  }
}

export async function unlockEncryptionWithPassphrase(passphrase) {
  const input = normalizePassphrase(passphrase);
  if (!input || input.length > MAX_PASSPHRASE_LENGTH) return false;

  try {
    const config = readProtectionConfig();
    if (!config) return false;
    const secret = await deriveKeyFromPassphrase(
      input,
      config.salt,
      config.iterations,
    );
    if (!constantTimeEqual(createVerifier(secret, config.version), config.verifier)) {
      return false;
    }
    runtimeSecretKey = secret;
    return true;
  } catch {
    runtimeSecretKey = null;
    return false;
  }
}

export function removeEncryptionPassphrase() {
  let removed = false;
  try {
    localStorage.removeItem(PROTECTION_CONFIG_KEY);
    localStorage.removeItem(LEGACY_PASSPHRASE_SALT_KEY);
    localStorage.removeItem(LEGACY_PASSPHRASE_VERIFIER_KEY);
    removed =
      localStorage.getItem(PROTECTION_CONFIG_KEY) === null &&
      localStorage.getItem(LEGACY_PASSPHRASE_SALT_KEY) === null &&
      localStorage.getItem(LEGACY_PASSPHRASE_VERIFIER_KEY) === null;
  } catch {
    // The caller will report a migration failure if storage is unavailable.
  }
  runtimeSecretKey = null;
  return removed;
}

function deriveEnvelopeKeys(secret) {
  const material = CryptoJS.SHA512(`mushafplus-envelope-v2|${secret}`);
  return {
    encryptionKey: CryptoJS.lib.WordArray.create(material.words.slice(0, 8), 32),
    authenticationKey: CryptoJS.lib.WordArray.create(material.words.slice(8, 16), 32),
  };
}

function encodeEnvelope(envelope) {
  const json = JSON.stringify(envelope);
  return `${ENVELOPE_PREFIX}${CryptoJS.enc.Base64.stringify(
    CryptoJS.enc.Utf8.parse(json),
  )}`;
}

function decodeEnvelope(payload) {
  if (!payload.startsWith(ENVELOPE_PREFIX)) return null;
  try {
    const encoded = payload.slice(ENVELOPE_PREFIX.length);
    const json = CryptoJS.enc.Base64.parse(encoded).toString(CryptoJS.enc.Utf8);
    const parsed = JSON.parse(json);
    if (
      parsed?.version !== 2 ||
      parsed.algorithm !== "AES-256-CBC+HMAC-SHA256" ||
      typeof parsed.iv !== "string" ||
      typeof parsed.ciphertext !== "string" ||
      typeof parsed.mac !== "string"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function decryptEnvelope(payload, secret) {
  const envelope = decodeEnvelope(payload);
  if (!envelope) return null;
  const { encryptionKey, authenticationKey } = deriveEnvelopeKeys(secret);
  const authenticated = `${envelope.version}|${envelope.iv}|${envelope.ciphertext}`;
  const expectedMac = CryptoJS.HmacSHA256(
    authenticated,
    authenticationKey,
  ).toString();
  if (!constantTimeEqual(expectedMac, envelope.mac)) return null;

  try {
    const plaintext = CryptoJS.AES.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(envelope.ciphertext) },
      encryptionKey,
      {
        iv: CryptoJS.enc.Base64.parse(envelope.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      },
    ).toString(CryptoJS.enc.Utf8);
    return plaintext ? JSON.parse(plaintext) : null;
  } catch {
    return null;
  }
}

function decryptLegacyCiphertext(ciphertext, key) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  const plaintext = bytes.toString(CryptoJS.enc.Utf8);
  return plaintext ? JSON.parse(plaintext) : null;
}

/** Encrypts data with confidentiality and integrity; never returns plaintext. */
export function encryptData(data) {
  try {
    const plaintext = JSON.stringify(data);
    if (typeof plaintext !== "string") throw new Error("Data is not serializable");
    const secret = getActiveSecretKey();
    const { encryptionKey, authenticationKey } = deriveEnvelopeKeys(secret);
    const iv = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(plaintext, encryptionKey, {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });
    const envelope = {
      version: 2,
      algorithm: "AES-256-CBC+HMAC-SHA256",
      iv: CryptoJS.enc.Base64.stringify(iv),
      ciphertext: CryptoJS.enc.Base64.stringify(encrypted.ciphertext),
    };
    envelope.mac = CryptoJS.HmacSHA256(
      `${envelope.version}|${envelope.iv}|${envelope.ciphertext}`,
      authenticationKey,
    ).toString();
    return encodeEnvelope(envelope);
  } catch (error) {
    throw new Error("Encryption failed; refusing to store plaintext data", {
      cause: error,
    });
  }
}

/**
 * Reads current authenticated envelopes and migrates plaintext/legacy formats.
 * A configured but locked protected mode never falls back to the device key.
 */
export function decryptDataWithMeta(ciphertext) {
  const payload = typeof ciphertext === "string" ? ciphertext.trim() : "";
  const empty = {
    data: null,
    usedLegacy: false,
    needsMigration: false,
    locked: false,
  };
  if (!payload) return empty;
  if (isProtectedStorageLocked()) return { ...empty, locked: true };

  if (payload.startsWith("{") || payload.startsWith("[")) {
    try {
      return {
        ...empty,
        data: JSON.parse(payload),
        needsMigration: true,
      };
    } catch {
      // Continue with encrypted formats.
    }
  }

  try {
    const activeKey = getActiveSecretKey();
    if (payload.startsWith(ENVELOPE_PREFIX)) {
      const data = decryptEnvelope(payload, activeKey);
      return data === null ? empty : { ...empty, data };
    }
    const data = decryptLegacyCiphertext(payload, activeKey);
    if (data !== null) return { ...empty, data, needsMigration: true };
  } catch {
    // Try the public legacy migration key below.
  }

  try {
    const data = decryptLegacyCiphertext(payload, LEGACY_SECRET_KEY);
    if (data !== null) {
      return { ...empty, data, usedLegacy: true, needsMigration: true };
    }
  } catch {
    // Invalid, tampered or unreadable data.
  }
  return empty;
}

export function decryptData(ciphertext) {
  return decryptDataWithMeta(ciphertext).data;
}

export function migrateToDeviceKey(storageKey, decryptedData) {
  if (!storageKey || decryptedData == null || hasEncryptionPassphraseConfigured()) {
    return false;
  }
  try {
    localStorage.setItem(storageKey, encryptData(decryptedData));
    return true;
  } catch {
    return false;
  }
}
