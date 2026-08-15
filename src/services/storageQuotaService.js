const MIB = 1024 * 1024;
export const MIN_STORAGE_RESERVE_BYTES = 24 * MIB;

function getStorageManager() {
  return typeof navigator !== "undefined" ? navigator.storage : null;
}

export async function getStorageSnapshot() {
  const storage = getStorageManager();
  if (!storage?.estimate) {
    return {
      supported: false,
      usage: null,
      quota: null,
      available: null,
      usageRatio: null,
      persisted: false,
    };
  }

  try {
    const [estimate, persisted] = await Promise.all([
      storage.estimate(),
      storage.persisted?.().catch(() => false) || false,
    ]);
    const usage = Number.isFinite(estimate?.usage) ? estimate.usage : 0;
    const quota = Number.isFinite(estimate?.quota) ? estimate.quota : 0;
    return {
      supported: true,
      usage,
      quota,
      available: Math.max(0, quota - usage),
      usageRatio: quota > 0 ? usage / quota : null,
      persisted: Boolean(persisted),
    };
  } catch {
    return {
      supported: false,
      usage: null,
      quota: null,
      available: null,
      usageRatio: null,
      persisted: false,
    };
  }
}

export async function requestPersistentStorage() {
  const storage = getStorageManager();
  if (!storage?.persist) return false;
  try {
    return Boolean(await storage.persist());
  } catch {
    return false;
  }
}

export async function ensureStorageCapacity({
  estimatedAdditionalBytes = 0,
  reserveBytes = MIN_STORAGE_RESERVE_BYTES,
} = {}) {
  const snapshot = await getStorageSnapshot();
  if (!snapshot.supported || snapshot.quota <= 0) {
    return { allowed: true, reason: "unknown", snapshot };
  }

  const required = Math.max(0, estimatedAdditionalBytes) + reserveBytes;
  const allowed = snapshot.available >= required && snapshot.usageRatio < 0.94;
  return {
    allowed,
    reason: allowed ? "available" : "quota",
    required,
    snapshot,
  };
}

export function estimateAudioDownloadBytes(itemCount, isSurahStream = false) {
  if (isSurahStream) return Math.max(1, Number(itemCount) || 1) * 24 * MIB;
  return Math.max(1, Number(itemCount) || 1) * 384 * 1024;
}
