/**
 * Unified Database Service
 * Centralizes IndexedDB logic using the 'idb' library.
 */

import { openDB } from 'idb';

const DB_NAME = 'mushafplus';
const DB_VERSION = 2;
export const APP_DB_NAME = DB_NAME;

let dbPromise = null;
const maintenanceLastRun = new Map();

function devWarn(...args) {
    if (import.meta.env?.DEV && typeof console !== 'undefined') {
        console.warn(...args);
    }
}

/**
 * Get (or initialize) the IndexedDB instance.
 */
export function getDB() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion) {
                // v1: basic stores
                if (oldVersion < 1) {
                    if (!db.objectStoreNames.contains('cache')) {
                        db.createObjectStore('cache', { keyPath: 'key' });
                    }
                    if (!db.objectStoreNames.contains('notes')) {
                        db.createObjectStore('notes', { keyPath: 'id' });
                    }
                    if (!db.objectStoreNames.contains('bookmarks')) {
                        db.createObjectStore('bookmarks', { keyPath: 'id' });
                    }
                }
                // v2: specialized stores
                if (oldVersion < 2) {
                    if (!db.objectStoreNames.contains('wird')) {
                        db.createObjectStore('wird', { keyPath: 'date' });
                    }
                    if (!db.objectStoreNames.contains('history')) {
                        const hStore = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
                        hStore.createIndex('date', 'date', { unique: false });
                    }
                    if (!db.objectStoreNames.contains('playlists')) {
                        db.createObjectStore('playlists', { keyPath: 'id' });
                    }
                }
            },
        });
    }
    return dbPromise;
}

/**
 * Generic GET from a store.
 */
export async function dbGet(storeName, key) {
    try {
        const db = await getDB();
        return db.get(storeName, key);
    } catch (err) {
        devWarn(`DB read error in ${storeName}:`, err);
        return undefined;
    }
}

/**
 * Generic SET in a store.
 */
export async function dbSet(storeName, value) {
    try {
        const db = await getDB();
        return db.put(storeName, value);
    } catch (err) {
        if (err?.name === 'QuotaExceededError') {
            devWarn(`IndexedDB quota exceeded in ${storeName}`);
            return undefined;
        }
        devWarn(`DB write error in ${storeName}:`, err);
    }
}

/**
 * Generic DELETE from a store.
 */
export async function dbDelete(storeName, key) {
    try {
        const db = await getDB();
        return db.delete(storeName, key);
    } catch (err) {
        devWarn(`DB delete error in ${storeName}:`, err);
    }
}

/**
 * Generic GET ALL from a store.
 */
export async function dbGetAll(storeName) {
    try {
        const db = await getDB();
        return db.getAll(storeName);
    } catch (err) {
        devWarn(`DB getAll error in ${storeName}:`, err);
        return [];
    }
}

/**
 * Remove expired records and keep only the newest records for one cache prefix.
 * Maintenance is throttled so navigation never pays this cost repeatedly.
 */
export async function dbPruneByPrefix(
    storeName,
    prefix,
    { maxEntries = 900, maxAgeMs = 30 * 24 * 60 * 60 * 1000, throttleMs = 30 * 60 * 1000 } = {},
) {
    const maintenanceKey = `${storeName}:${prefix}`;
    const now = Date.now();
    if (now - (maintenanceLastRun.get(maintenanceKey) || 0) < throttleMs) return;
    maintenanceLastRun.set(maintenanceKey, now);

    try {
        const db = await getDB();
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const retained = [];
        let cursor = await store.openCursor();
        while (cursor) {
            const key = String(cursor.key || '');
            if (key.startsWith(prefix)) {
                const timestamp = Number(cursor.value?.ts || 0);
                const expiryAt = Number(cursor.value?.expiryAt || 0);
                const expired =
                    (expiryAt > 0 && expiryAt <= now) ||
                    (timestamp > 0 && now - timestamp > maxAgeMs);
                if (expired) await cursor.delete();
                else retained.push({ key: cursor.key, timestamp });
            }
            cursor = await cursor.continue();
        }

        retained
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(Math.max(0, maxEntries))
            .forEach(({ key }) => store.delete(key));
        await transaction.done;
    } catch (err) {
        maintenanceLastRun.delete(maintenanceKey);
        devWarn(`DB cache maintenance error in ${storeName}:`, err);
    }
}

/** Clear one store and report whether the operation really completed. */
export async function dbClear(storeName) {
    try {
        const db = await getDB();
        await db.clear(storeName);
        return true;
    } catch (err) {
        devWarn(`DB clear error in ${storeName}:`, err);
        return false;
    }
}

/** Atomically replaces multiple stores in one IndexedDB transaction. */
export async function dbReplaceStores(recordsByStore) {
    const storeNames = Object.keys(recordsByStore || {});
    if (!storeNames.length) return true;
    try {
        const db = await getDB();
        const transaction = db.transaction(storeNames, 'readwrite');
        for (const storeName of storeNames) {
            const store = transaction.objectStore(storeName);
            await store.clear();
            for (const record of recordsByStore[storeName] || []) {
                await store.put(record);
            }
        }
        await transaction.done;
        return true;
    } catch (err) {
        devWarn('DB atomic store replacement failed:', err);
        return false;
    }
}

/** Close and forget the shared connection before deleting all local user data. */
export async function closeAppDatabase() {
    if (!dbPromise) return;
    try {
        const db = await dbPromise;
        db.close();
    } finally {
        dbPromise = null;
        maintenanceLastRun.clear();
    }
}

export default {
    getDB,
    dbGet,
    dbSet,
    dbPruneByPrefix,
    dbDelete,
    dbGetAll,
    dbClear,
    dbReplaceStores,
    closeAppDatabase,
};
