import { validateSyncPayload, MAX_SYNC_TOKEN_LENGTH } from "./qrSyncValidation.js";
import qrcode from "qrcode-generator";
import { ensureReciterForRiwaya } from "../data/reciters.js";
import {
  getAllBookmarks,
  getAllNotes,
  getSettings,
  mergePrivateSyncRecords,
} from "./storageService.js";

/**
 * UTF-8 safe base64url encoder.
 */
export function toBase64Url(str) {
  if (typeof str !== "string") return "";
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * UTF-8 safe base64url decoder.
 */
export function fromBase64Url(base64UrlStr) {
  if (!base64UrlStr || typeof base64UrlStr !== "string" || base64UrlStr.length > MAX_SYNC_TOKEN_LENGTH || !/^[A-Za-z0-9_-]+$/.test(base64UrlStr)) {
    throw new Error("Invalid base64 string");
  }
  let b64 = base64UrlStr.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) {
    b64 += "=";
  }
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("Invalid base64 string");
  }
}

/**
 * Generates an SVG string representation of a QR Code.
 *
 * @param {string} text - The content to encode in the QR code.
 * @param {Object} [options]
 * @param {number} [options.cellMargin=2] - Margin around QR modules.
 * @param {'L'|'M'|'Q'|'H'} [options.errorCorrectionLevel='M']
 * @returns {string} Clean SVG markup.
 */
export function generateQrSvg(text, options = {}) {
  const ecLevel = options.errorCorrectionLevel || "M";
  const margin = Number.isFinite(options.cellMargin) ? options.cellMargin : 2;
  const qr = qrcode(0, ecLevel);
  qr.addData(text);
  qr.make();
  return qr.createSvgTag({ scalable: true, margin });
}

/**
 * Builds a compact sync payload object from current local state.
 */
export async function buildSyncPayload({ includeNotes = false } = {}) {
  const settings = getSettings();
  const bookmarks = await getAllBookmarks();
  const notes = includeNotes ? await getAllNotes() : [];

  const pos = settings.lastPosition || { surah: 1, ayah: 1, page: 1, juz: 1 };

  return {
    app: "MushafPlus",
    v: 1,
    t: Date.now(),
    pos: {
      s: Number(pos.surah) || 1,
      a: Number(pos.ayah) || 1,
      p: Number(pos.page) || 1,
      j: Number(pos.juz) || 1,
    },
    rw: settings.riwaya || "hafs",
    th: settings.theme || "light",
    rc: settings.reciter || "ar.alafasy",
    fs: settings.quranFontSize || settings.fontSize || 25,
    dm: settings.displayMode || "surah",
    bm: (Array.isArray(bookmarks) ? bookmarks : []).map((b) => ({
      s: Number(b.surah),
      a: Number(b.ayah),
      l: String(b.label || ""),
      t: Number(b.createdAt) || 0,
    })),
    nt: (Array.isArray(notes) ? notes : []).map((n) => ({
      s: Number(n.surah),
      a: Number(n.ayah),
      t: String(n.text || ""),
      u: Number(n.updatedAt) || 0,
    })),
  };
}

/**
 * Encodes sync payload into a compact base64url token.
 */
export function encodeSyncToken(payload) {
  const json = JSON.stringify(validateSyncPayload(payload));
  return toBase64Url(json);
}

/**
 * Builds the full direct Sync URL with #sync=<token>.
 */
export function buildSyncUrl(token) {
  if (typeof window !== "undefined" && window.location) {
    const origin = window.location.origin || "";
    const pathname = window.location.pathname || "/";
    return `${origin}${pathname}#sync=${token}`;
  }
  return `#sync=${token}`;
}

/**
 * Decodes and validates a sync token or full sync URL.
 */
export function decodeSyncToken(tokenOrUrl) {
  if (!tokenOrUrl || typeof tokenOrUrl !== "string") {
    throw new Error("Token must be a non-empty string");
  }

  let rawToken = tokenOrUrl.trim();
  const hashIndex = rawToken.indexOf("#sync=");
  if (hashIndex !== -1) {
    rawToken = rawToken.slice(hashIndex + 6);
  } else if (rawToken.startsWith("sync=")) {
    rawToken = rawToken.slice(5);
  }

  const jsonStr = fromBase64Url(rawToken);
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error("Invalid sync token payload");
  }

  if (!parsed || typeof parsed !== "object" || parsed.app !== "MushafPlus") {
    throw new Error("Unsupported or unrecognized MushafPlus sync data");
  }

  return validateSyncPayload(parsed);
}

/**
 * Applies a validated sync payload to the local device storage.
 */
export async function applySyncPayload(input) {
  const payload = validateSyncPayload(input);
  const current = getSettings();
  const nextSettings = {
    ...current,
    lastPosition: { surah: payload.pos.s, ayah: payload.pos.a, page: payload.pos.p, juz: payload.pos.j },
    riwaya: payload.rw,
    theme: payload.th,
    reciter: ensureReciterForRiwaya(payload.rc, payload.rw),
    quranFontSize: payload.fs,
    displayMode: payload.dm,
  };
  const counts = await mergePrivateSyncRecords({
    bookmarks: payload.bm.map(b => ({ id: b.s + ":" + b.a, surah: b.s, ayah: b.a, label: b.l, createdAt: b.t })),
    notes: payload.nt.map(n => ({ id: n.s + ":" + n.a, surah: n.s, ayah: n.a, text: n.t, updatedAt: n.u })),
    settings: nextSettings,
  });
  return { ...counts, position: nextSettings.lastPosition, riwaya: nextSettings.riwaya };
}
