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
