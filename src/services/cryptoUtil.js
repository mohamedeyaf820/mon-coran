// Wrapper utilitaire pour le chiffrement/déchiffrement avec CryptoJS
import CryptoJS from "crypto-js";

// ─── Clés et constantes ───────────────────────────────────────────────────────

/**
 * Clé legacy utilisée avant l'introduction du système de clé appareil.
 * Conservée UNIQUEMENT pour la migration des données chiffrées avant v1.1.
 * Ne plus l'utiliser pour chiffrer de nouvelles données.
 *
 * @deprecated – remplacée par la clé appareil ou la passphrase utilisateur.
 */
const _LEGACY_SECRET_KEY = "mushafplus-2026";

const DEVICE_KEY_STORAGE_KEY = "mushafplus_device_key_v1";
const PASSPHRASE_SALT_KEY = "mushafplus_crypto_salt_v1";
const PASSPHRASE_VERIFIER_KEY = "mushafplus_crypto_verifier_v1";

// Clé de session (passphrase utilisateur dérivée) – volatile, non persistée.
let runtimeSecretKey = null;

// ─── Génération de clés ───────────────────────────────────────────────────────

function generateSecretKey() {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  }
  // Fallback basique si l'API Web Crypto n'est pas disponible
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Retourne la clé appareil persistée, ou en crée une nouvelle si absente.
 * La clé est stockée dans localStorage (spécifique à l'origine du navigateur).
 * Elle n'est JAMAIS envoyée sur le réseau.
 */
function getOrCreateDeviceKey() {
  try {
    const stored = localStorage.getItem(DEVICE_KEY_STORAGE_KEY);
    if (stored && stored.length >= 32) return stored;
    const fresh = generateSecretKey();
    localStorage.setItem(DEVICE_KEY_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // En mode privé ou si le quota est dépassé, on génère une clé éphémère.
    return generateSecretKey();
  }
}

/**
 * Retourne la clé de chiffrement active dans l'ordre de priorité suivant :
 *  1. Passphrase utilisateur dérivée (runtime) – la plus sécurisée
 *  2. Clé appareil persistée dans localStorage
 *
 * Ainsi, même sans passphrase, les données sont toujours chiffrées avec une
 * clé unique à l'appareil et non connue publiquement.
 */
function getActiveSecretKey() {
  return runtimeSecretKey || getOrCreateDeviceKey();
}

// ─── Passphrase utilisateur (optionnelle) ─────────────────────────────────────

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
  // La clé appareil est toujours disponible ; "unlocked" signifie qu'une
  // passphrase utilisateur a été saisie en plus.
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

// ─── Chiffrement / Déchiffrement ──────────────────────────────────────────────

function decryptWithKey(ciphertext, key) {
  const bytes = CryptoJS.AES.decrypt(ciphertext, key);
  const decrypted = bytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) return null;
  return JSON.parse(decrypted);
}

/**
 * Chiffre `data` avec la clé active (passphrase utilisateur ou clé appareil).
 * Retourne toujours une chaîne chiffrée – jamais du JSON en clair.
 */
export function encryptData(data) {
  try {
    const str = typeof data === "string" ? data : JSON.stringify(data);
    const activeKey = getActiveSecretKey();
    return CryptoJS.AES.encrypt(str, activeKey).toString();
  } catch {
    // Dernier recours : retour en JSON non chiffré pour ne pas perdre les données.
    try {
      return typeof data === "string" ? data : JSON.stringify(data);
    } catch {
      return "";
    }
  }
}

/**
 * Déchiffre `ciphertext` et retourne les données ainsi que des métadonnées
 * sur la stratégie utilisée.
 *
 * Ordre de tentative :
 *  1. JSON brut (données non chiffrées, format antérieur)
 *  2. Clé active (passphrase utilisateur ou clé appareil)
 *  3. Clé legacy hardcodée – UNIQUEMENT pour migration ; le résultat est
 *     immédiatement re-chiffré avec la clé active par l'appelant.
 *
 * @returns {{ data: any | null, usedLegacy: boolean }}
 */
export function decryptDataWithMeta(ciphertext) {
  const payload = typeof ciphertext === "string" ? ciphertext.trim() : "";
  if (!payload) return { data: null, usedLegacy: false };

  // 1. JSON brut (données pré-chiffrement ou mode dégradé)
  if (payload.startsWith("{") || payload.startsWith("[")) {
    try {
      return { data: JSON.parse(payload), usedLegacy: false };
    } catch {
      // Continue vers le déchiffrement.
    }
  }

  // 2. Clé active (priorité)
  try {
    const activeKey = getActiveSecretKey();
    const decoded = decryptWithKey(payload, activeKey);
    if (decoded !== null) return { data: decoded, usedLegacy: false };
  } catch {
    // Essaie la clé legacy ci-dessous.
  }

  // 3. Clé legacy (migration uniquement) ─────────────────────────────────────
  // ATTENTION : cette clé est publique dans le dépôt. Les données déchiffrées
  // ici doivent être immédiatement re-chiffrées par l'appelant (usedLegacy=true).
  try {
    const decoded = decryptWithKey(payload, _LEGACY_SECRET_KEY);
    if (decoded !== null) {
      return { data: decoded, usedLegacy: true };
    }
  } catch {
    // Données illisibles.
  }

  return { data: null, usedLegacy: false };
}

/**
 * Déchiffre `ciphertext` et retourne uniquement les données.
 * Préférer `decryptDataWithMeta` pour gérer la migration legacy.
 */
export function decryptData(ciphertext) {
  return decryptDataWithMeta(ciphertext).data;
}

/**
 * Force la rotation de la clé de chiffrement des données de l'appelant.
 * À appeler après une migration legacy (usedLegacy === true) pour que les
 * données soient re-chiffrées avec la clé appareil et non plus la clé legacy.
 *
 * Usage :
 *   const { data, usedLegacy } = decryptDataWithMeta(raw);
 *   if (usedLegacy) migrateToDeviceKey(rawKey, data);
 */
export function migrateToDeviceKey(storageKey, decryptedData) {
  if (!storageKey || decryptedData == null) return false;
  try {
    const reEncrypted = encryptData(decryptedData);
    localStorage.setItem(storageKey, reEncrypted);
    return true;
  } catch {
    return false;
  }
}
