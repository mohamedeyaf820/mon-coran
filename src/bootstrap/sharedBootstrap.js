const CHUNK_RELOAD_KEY = "mushaf-plus:chunk-reload-once";
let chunkReloadTriggered = false;

function isChunkLoadErrorLike(errorLike) {
  const message = String(
    errorLike?.message ||
      errorLike?.reason?.message ||
      errorLike?.reason ||
      errorLike ||
      "",
  );
  return /Failed to fetch dynamically imported module|Importing a module script failed|ChunkLoadError|Loading chunk [\w-]+ failed/i.test(
    message,
  );
}

function tryRecoverFromChunkLoad(errorLike) {
  if (chunkReloadTriggered || !isChunkLoadErrorLike(errorLike)) return;
  chunkReloadTriggered = true;

  let alreadyReloaded = false;
  try {
    alreadyReloaded = sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1";
    if (!alreadyReloaded) sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
  } catch {
    // Session storage can be unavailable in privacy modes.
  }

  if (alreadyReloaded) return;

  Promise.all([
    "serviceWorker" in navigator
      ? navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(
              registrations.map((registration) => registration.unregister()),
            ),
          )
          .catch(() => null)
      : Promise.resolve(null),
    "caches" in window
      ? caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => key.startsWith("mushaf-plus"))
                .map((key) => caches.delete(key)),
            ),
          )
          .catch(() => null)
      : Promise.resolve(null),
  ]).finally(() => window.location.reload());
}

function installChunkRecovery() {
  if (!import.meta.env.PROD) return;

  window.addEventListener("error", (event) => {
    tryRecoverFromChunkLoad(event?.error || event?.message);
  });
  window.addEventListener("unhandledrejection", (event) => {
    tryRecoverFromChunkLoad(event?.reason);
  });
  window.setTimeout(() => {
    try {
      sessionStorage.removeItem(CHUNK_RELOAD_KEY);
    } catch {
      // No action required.
    }
  }, 10000);
}

function installServiceWorkerManagement() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", async () => {
    if (import.meta.env.PROD) {
      navigator.serviceWorker.register("/sw.js").catch(() => null);
      return;
    }

    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations
          .filter((registration) =>
            String(
              registration.active?.scriptURL ||
                registration.installing?.scriptURL ||
                "",
            ).match(/\/sw\.js|mushaf/),
          )
          .map((registration) => registration.unregister()),
      );
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith("mushaf-plus"))
            .map((key) => caches.delete(key)),
        );
      }
    } catch {
      // Development cleanup is best effort.
    }
  });
}

export function installSharedBootstrap() {
  installChunkRecovery();
  installServiceWorkerManagement();
}

export function renderRootFailure() {
  document.body.innerHTML = `
    <main style="padding:2rem;text-align:center;font-family:Georgia,serif">
      <h1>Erreur de chargement</h1>
      <p>L'application n'a pas pu demarrer.</p>
      <button type="button" onclick="location.reload()">Recharger</button>
    </main>
  `;
}
