import { APP_DB_NAME, closeAppDatabase } from "./dbService";

const LEGACY_DATABASES = ["MushafPlusDB"];

function deleteDatabase(name) {
  return new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(false);
      return;
    }
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve(true);
    request.onerror = () => resolve(false);
    request.onblocked = () => resolve(false);
  });
}

export async function clearAllLocalAppData() {
  await closeAppDatabase();
  const databases = [APP_DB_NAME, ...LEGACY_DATABASES];
  const databaseResults = await Promise.all(databases.map(deleteDatabase));

  if (typeof caches !== "undefined") {
    const names = await caches.keys().catch(() => []);
    await Promise.all(names.map((name) => caches.delete(name)));
  }

  localStorage.clear();
  sessionStorage.clear();

  return {
    databasesDeleted: databaseResults.filter(Boolean).length,
    localStorageCleared: localStorage.length === 0,
  };
}

export default clearAllLocalAppData;
