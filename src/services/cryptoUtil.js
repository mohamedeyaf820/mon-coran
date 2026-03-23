// Wrapper utilitaire pour le chiffrement/déchiffrement avec CryptoJS
import CryptoJS from "crypto-js";

const LEGACY_SECRET_KEY = "mushafplus-2026";
const PASSPHRASE_SALT_KEY = "mushafplus_crypto_salt_v1";
const PASSPHRASE_VERIFIER_KEY = "mushafplus_crypto_verifier_v1";

let runtimeSecretKey = null;

function generateSecretKey() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function deriveKeyFromPassphrase(passphrase, salt) {
  return CryptoJS.PBKDF2(String(passphrase || ""), String(salt || ""), {
    keySize: 256 / 32,
    iterations: 120000,
    hasher: CryptoJS.algo.SHA256,
  }).toString();
}

function createVerifier(secret) {
  return CryptoJS.SHA256(`${String(secret || "")}|mushafplus-v1`).toString();
}

function getActiveSecretKey() {
  if (runtimeSecretKey) return runtimeSecretKey;
  return LEGACY_SECRET_KEY;
}

export function hasEncryptionPassphraseConfigured() {
  try {
    const salt = localStorage.getItem(PASSPHRASE_SALT_KEY);
    const verifier = localStorage.getItem(PASSPHRASE_VERIFIER_KEY);
    return Boolean(salt && verifier);
  } catch {
    return false;
  }
}

export function isEncryptionUnlocked() {
  return Boolean(runtimeSecretKey);
}

export function clearEncryptionSession() {
  runtimeSecretKey = null;
}

export function configureEncryptionPassphrase(passphrase) {
  const input = String(passphrase || "").trim();
  if (input.length < 6) {
    return { ok: false, error: "Passphrase too short" };
  }

  try {
    const salt = generateSecretKey();
    const secret = deriveKeyFromPassphrase(input, salt);
    const verifier = createVerifier(secret);
    localStorage.setItem(PASSPHRASE_SALT_KEY, salt);
    localStorage.setItem(PASSPHRASE_VERIFIER_KEY, verifier);
    runtimeSecretKey = secret;
    return { ok: true };
  } catch {
    return { ok: false, error: "Storage unavailable" };
  }
}

export function unlockEncryptionWithPassphrase(passphrase) {
  const input = String(passphrase || "").trim();
  if (!input) return false;

  try {
    const salt = localStorage.getItem(PASSPHRASE_SALT_KEY);
    const verifier = localStorage.getItem(PASSPHRASE_VERIFIER_KEY);
    if (!salt || !verifier) return false;

    const secret = deriveKeyFromPassphrase(input, salt);
    if (createVerifier(secret) !== verifier) return false;
    runtimeSecretKey = secret;
    return true;
  } catch {
    return false;
  }
}

export function removeEncryptionPassphrase() {
  try {
    localStorage.removeItem(PASSPHRASE_SALT_KEY);
    localStorage.removeItem(PASSPHRASE_VERIFIER_KEY);
  } catch {
    // Ignore storage cleanup failure.
  }
  runtimeSecretKey = null;
}

function decryptWithKey(ciphertext, key) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) return null;
  return JSON.parse(decrypted);
}

export function encryptData(data) {
  try {
    const str = typeof data === "string" ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(str, getActiveSecretKey()).toString();
  } catch {
    return "";
  }
}

export function decryptData(ciphertext) {
  try {
    const currentKey = getActiveSecretKey();
    const decoded = decryptWithKey(ciphertext, currentKey);
    if (decoded !== null) return decoded;
  } catch {
    // Try legacy fallback below.
  }

  try {
    // Backward compatibility for entries encrypted before passphrase rollout.
    return decryptWithKey(ciphertext, LEGACY_SECRET_KEY);
  } catch {
    return null;
  }
}
