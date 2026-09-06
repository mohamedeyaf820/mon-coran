function ownsRegistration(registration) {
  const scriptUrl = String(
    registration?.active?.scriptURL ||
      registration?.installing?.scriptURL ||
      registration?.waiting?.scriptURL ||
      "",
  );
  const scope = String(registration?.scope || "");
  return scriptUrl.includes("/sw.js") || /mushaf/i.test(`${scriptUrl} ${scope}`);
}

const QURAN_CACHE_SCHEMA_KEY = "mushaf-plus:quran-cache-schema";
const QURAN_CACHE_SCHEMA_VERSION = "2026-08-integrity-v2";

/**
 * Isolate new Quran payloads from caches created by older application builds.
 * Audio downloads are intentionally preserved: only API caches and their IDB
 * records are migrated.
 */
export async function migrateQuranRuntimeCaches() {
  let currentVersion = null;
  try {
    currentVersion = localStorage.getItem(QURAN_CACHE_SCHEMA_KEY);
  } catch {
    // Private browsing may make localStorage unavailable.
  }
  if (currentVersion === QURAN_CACHE_SCHEMA_VERSION) return false;

  const [{ clearCache }, { clearQuranComCache }] = await Promise.all([
    import("./quranAPI.js"),
    import("./quranComAPI.js"),
  ]);

  await Promise.allSettled([
    clearCache(),
    clearQuranComCache(),
    typeof caches !== "undefined"
      ? caches.keys().then((keys) =>
          Promise.all(
            keys
              .filter((key) => String(key).startsWith("mushaf-plus-api"))
              .map((key) => caches.delete(key)),
          ),
        )
      : null,
  ]);

  try {
    localStorage.setItem(QURAN_CACHE_SCHEMA_KEY, QURAN_CACHE_SCHEMA_VERSION);
  } catch {
    // Versioned IDB keys still isolate legacy content for this session.
  }
  return true;
}

export async function clearMushafRuntimeCaches() {
  await Promise.all([
    typeof navigator !== "undefined" && "serviceWorker" in navigator
      ? navigator.serviceWorker
          .getRegistrations()
          .then((registrations) =>
            Promise.all(
              registrations
                .filter(ownsRegistration)
                .map((registration) => registration.unregister()),
            ),
          )
          .catch(() => null)
      : null,
    typeof caches !== "undefined"
      ? caches
          .keys()
          .then((keys) =>
            Promise.all(
              keys
                .filter((key) => String(key).startsWith("mushaf-plus"))
                .map((key) => caches.delete(key)),
            ),
          )
          .catch(() => null)
      : null,
  ]);
}
