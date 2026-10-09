import { fetchWithTimeout } from './fetchWithTimeout.js';
import { dbGet, dbSet } from './dbService.js';
import { registerWarshArchive, warshArchiveMeta } from '../utils/warshArchiveRules.js';
import { WARSH_ARCHIVE_SHA256 } from '../data/warshArchiveManifest.js';

const cacheKey = `warsh-tajweed-archive-${WARSH_ARCHIVE_SHA256}`;
let pending = null;
let lastAttempt = -Infinity;

// The archive is annotation data only. A missing/corrupt pack never blocks text.
export async function ensureWarshArchiveRules() {
  if (warshArchiveMeta) return true;
  if (pending) return pending;
  if (Date.now() - lastAttempt < 30000) return false;
  lastAttempt = Date.now();
  pending = (async () => {
    try {
      const cached = await dbGet('cache', cacheKey).catch(() => null);
      let raw = cached?.data;
      const digestOf = async text => {
        const digest = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
      };
      if (typeof raw === 'string' && await digestOf(raw) !== WARSH_ARCHIVE_SHA256) raw = null;
      if (typeof raw !== 'string') {
        const response = await fetchWithTimeout('/data/warsh-tajweed-archive.json', {}, 6000);
        if (!response.ok) return false;
        raw = await response.text();
      }
      const sha = await digestOf(raw);
      if (sha !== WARSH_ARCHIVE_SHA256) return false;
      const pack = JSON.parse(raw);
      registerWarshArchive(pack.rows, Object.freeze(pack.meta));
      await dbSet('cache', { key: cacheKey, data: raw }).catch(() => {});
      return true;
    } catch {
      return false;
    } finally {
      pending = null;
    }
  })();
  return pending;
}
