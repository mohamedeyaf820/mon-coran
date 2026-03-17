// Wrapper utilitaire pour le chiffrement/déchiffrement avec CryptoJS
import CryptoJS from "crypto-js";

const SECRET_KEY = "mushafplus-2026"; // Peut être déplacé dans une config/env

export function encryptData(data) {
  try {
    const str = typeof data === "string" ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
  } catch {
    return "";
  }
}

export function decryptData(ciphertext) {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decrypted);
  } catch {
    return null;
  }
}
