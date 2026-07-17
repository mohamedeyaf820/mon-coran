import {
  clearEncryptionSession,
  configureEncryptionPassphrase,
  hasEncryptionPassphraseConfigured,
  removeEncryptionPassphrase,
  restoreEncryptionConfiguration,
  snapshotEncryptionConfiguration,
  unlockEncryptionWithPassphrase,
} from "./cryptoUtil.js";
import {
  readPrivateDataSnapshot,
  readRawPrivateDataSnapshot,
  restoreRawPrivateDataSnapshot,
  rewritePrivateDataSnapshot,
} from "./storageService.js";
import {
  PRIVACY_BEFORE_LOCK_EVENT,
  PRIVACY_BEFORE_ROTATION_EVENT,
  PRIVACY_LOCK_EVENT,
} from "./privacyEvents.js";

function flushPendingSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PRIVACY_BEFORE_ROTATION_EVENT));
  }
}

async function rollbackRotation(rawSnapshot, configuration, passphrase = null) {
  const dataRestored = await restoreRawPrivateDataSnapshot(rawSnapshot);
  const configRestored = restoreEncryptionConfiguration(configuration);
  if (passphrase && configRestored) {
    await unlockEncryptionWithPassphrase(passphrase);
  }
  return dataRestored && configRestored;
}

async function captureRotationState() {
  return {
    logical: await readPrivateDataSnapshot(),
    raw: await readRawPrivateDataSnapshot(),
    configuration: snapshotEncryptionConfiguration(),
  };
}

export async function enableProtectedMode(passphrase, uiLang = "fr") {
  if (hasEncryptionPassphraseConfigured()) {
    return { ok: false, error: "Protection already configured" };
  }

  let snapshot;
  try {
    flushPendingSettings();
    snapshot = await captureRotationState();
    const configured = await configureEncryptionPassphrase(passphrase, { uiLang });
    if (!configured.ok) {
      await rollbackRotation(snapshot.raw, snapshot.configuration);
      return configured;
    }
    await rewritePrivateDataSnapshot(snapshot.logical);
    return { ok: true };
  } catch (error) {
    if (snapshot) {
      await rollbackRotation(snapshot.raw, snapshot.configuration);
    } else {
      removeEncryptionPassphrase();
    }
    return { ok: false, error: error?.message || "Protection migration failed" };
  }
}

export async function changeProtectedModePassphrase(
  currentPassphrase,
  nextPassphrase,
  uiLang = "fr",
) {
  if (!hasEncryptionPassphraseConfigured()) {
    return { ok: false, error: "Protection is not configured" };
  }
  if (!(await unlockEncryptionWithPassphrase(currentPassphrase))) {
    return { ok: false, error: "Current passphrase is invalid" };
  }

  let snapshot;
  try {
    flushPendingSettings();
    snapshot = await captureRotationState();
    const configured = await configureEncryptionPassphrase(nextPassphrase, {
      uiLang,
    });
    if (!configured.ok) {
      await rollbackRotation(
        snapshot.raw,
        snapshot.configuration,
        currentPassphrase,
      );
      return configured;
    }
    await rewritePrivateDataSnapshot(snapshot.logical);
    return { ok: true };
  } catch (error) {
    if (snapshot) {
      await rollbackRotation(
        snapshot.raw,
        snapshot.configuration,
        currentPassphrase,
      );
    }
    return { ok: false, error: error?.message || "Passphrase rotation failed" };
  }
}

export async function disableProtectedMode(passphrase) {
  if (!hasEncryptionPassphraseConfigured()) return { ok: true };
  if (!(await unlockEncryptionWithPassphrase(passphrase))) {
    return { ok: false, error: "Current passphrase is invalid" };
  }

  let snapshot;
  try {
    flushPendingSettings();
    snapshot = await captureRotationState();
    if (!removeEncryptionPassphrase()) {
      throw new Error("Unable to remove protected-mode metadata");
    }
    await rewritePrivateDataSnapshot(snapshot.logical);
    return { ok: true };
  } catch (error) {
    if (snapshot) {
      await rollbackRotation(snapshot.raw, snapshot.configuration, passphrase);
    }
    return { ok: false, error: error?.message || "Protection removal failed" };
  }
}

export function lockProtectedModeNow() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PRIVACY_BEFORE_LOCK_EVENT));
  }
  clearEncryptionSession();
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(PRIVACY_LOCK_EVENT));
  }
}
