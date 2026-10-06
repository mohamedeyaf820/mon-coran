/**
 * Unified Database Service
 * Centralizes IndexedDB logic using the 'idb' library.
 */

import { openDB } from 'idb';

const DB_NAME = 'mushafplus';
const DB_VERSION = 4;
export const APP_DB_NAME = DB_NAME;

let dbPromise = null;
const maintenanceLastRun = new Map();

function devWarn(...args) {
    if (import.meta.env?.DEV && typeof console !== 'undefined') {
        console.warn(...args);
    }
}

function observeTransaction(transaction) {
    const done = transaction.done;
    // A request can reject before its caller reaches `transaction.done`.
    // Observe it immediately to avoid leaking an unhandled AbortError.
    void done.catch(() => {});
    return done;
}

/**
 * Get (or initialize) the IndexedDB instance.
 */
export function getDB() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion, _newVersion, transaction) {
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
                    if (!db.objectStoreNames.contains('playlists')) {
                        db.createObjectStore('playlists', { keyPath: 'id' });
                    }
                }
                // v3: remove stores belonging to retired product features.
                if (oldVersion < 3) {
                    if (db.objectStoreNames.contains('wird')) db.deleteObjectStore('wird');
                    if (db.objectStoreNames.contains('history')) db.deleteObjectStore('history');
                }
                // v4: index the cache metadata. Pruning used to open every cached
                // payload (hundreds of kilobytes each) just to read its timestamp.
                if (oldVersion < 4) {
                    // A database left without its cache store (an interrupted first
                    // upgrade) gets it back here instead of aborting the upgrade.
                    const cache = db.objectStoreNames.contains('cache')
                        ? transaction.objectStore('cache')
                        : db.createObjectStore('cache', { keyPath: 'key' });
                    if (!cache.indexNames.contains('ts')) cache.createIndex('ts', 'ts');
                    if (!cache.indexNames.contains('expiryAt')) cache.createIndex('expiryAt', 'expiryAt');
                }
            },
        }).catch((error) => {
            dbPromise = null;
            throw error;
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
        return await db.get(storeName, key);
    } catch (err) {
        devWarn(`DB read error in ${storeName}:`, err);
        return undefined;
    }
}

/**
 * Generic SET in a store.
 */
export async function dbSet(storeName, value) {
    let transactionDone;
    try {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readwrite');
        transactionDone = observeTransaction(tx);
        const key = await tx.store.put(value);
        await transactionDone;
        return key;
    } catch (err) {
        await transactionDone?.catch(() => {});
        if (err?.name === 'QuotaExceededError') {
            devWarn(`IndexedDB quota exceeded in ${storeName}`);
            return undefined;
        }
        devWarn(`DB write error in ${storeName}:`, err);
    }
}

/** Replace a record only when it has not changed since it was read. */
export async function dbCompareAndSet(storeName, key, expected, value) {
    let transactionDone;
    try {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readwrite');
        transactionDone = observeTransaction(tx);
        const current = await tx.store.get(key);
        if (JSON.stringify(current) !== JSON.stringify(expected)) {
            await transactionDone;
            return false;
        }
        await tx.store.put(value);
        await transactionDone;
        return true;
    } catch (err) {
        await transactionDone?.catch(() => {});
        devWarn(`DB conditional write error in ${storeName}:`, err);
        return false;
    }
}

/**
 * Generic DELETE from a store.
 */
export async function dbDelete(storeName, key) {
    let transactionDone;
    try {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readwrite');
        transactionDone = observeTransaction(tx);
        await tx.store.delete(key);
        await transactionDone;
        return true;
    } catch (err) {
        await transactionDone?.catch(() => {});
        devWarn(`DB delete error in ${storeName}:`, err);
        return false;
    }
}

/**
 * Generic GET ALL from a store.
 */
export async function dbGetAll(storeName, { strict = false } = {}) {
    try {
        const db = await getDB();
        return await db.getAll(storeName);
    } catch (err) {
        if (strict) throw err;
        devWarn(`DB getAll error in ${storeName}:`, err);
        return [];
    }
}

/**
 * Deletes expired records of a prefix and returns the others, oldest information
 * read from the key-only indexes: no cached payload is deserialised.
 */
async function collectRetainedFromIndexes(store, prefix, now, maxAgeMs) {
    const expiredKeys = new Set();
    let expiring = await store.index('expiryAt').openKeyCursor(IDBKeyRange.upperBound(now));
    while (expiring) {
        if (String(expiring.primaryKey).startsWith(prefix)) expiredKeys.add(expiring.primaryKey);
        expiring = await expiring.continue();
    }

    const retained = [];
    let cursor = await store.index('ts').openKeyCursor();
    while (cursor) {
        const key = cursor.primaryKey;
        if (String(key).startsWith(prefix) && !expiredKeys.has(key)) {
            const timestamp = Number(cursor.key || 0);
            if (timestamp > 0 && now - timestamp > maxAgeMs) expiredKeys.add(key);
            else retained.push({ key, timestamp });
        }
        cursor = await cursor.continue();
    }

    expiredKeys.forEach((key) => store.delete(key));
    return retained;
}

/** Fallback for a connection that predates the v4 indexes: reads every value. */
async function collectRetainedByScan(store, prefix, now, maxAgeMs) {
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
    return retained;
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
        const retained = store.indexNames.contains('ts') && store.indexNames.contains('expiryAt')
            ? await collectRetainedFromIndexes(store, prefix, now, maxAgeMs)
            : await collectRetainedByScan(store, prefix, now, maxAgeMs);

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
    let transactionDone;
    try {
        const db = await getDB();
        const tx = db.transaction(storeName, 'readwrite');
        transactionDone = observeTransaction(tx);
        await tx.store.clear();
        await transactionDone;
        return true;
    } catch (err) {
        await transactionDone?.catch(() => {});
        devWarn(`DB clear error in ${storeName}:`, err);
        return false;
    }
}

/** Atomically replaces multiple stores in one IndexedDB transaction. */
export async function dbReplaceStores(recordsByStore) {
    const storeNames = Object.keys(recordsByStore || {});
    if (!storeNames.length) return true;
    let transactionDone;
    try {
        const db = await getDB();
        const transaction = db.transaction(storeNames, 'readwrite');
        transactionDone = observeTransaction(transaction);
        for (const storeName of storeNames) {
            const store = transaction.objectStore(storeName);
            await store.clear();
            for (const record of recordsByStore[storeName] || []) {
                await store.put(record);
            }
        }
        await transactionDone;
        return true;
    } catch (err) {
        await transactionDone?.catch(() => {});
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
    dbCompareAndSet,
    dbPruneByPrefix,
    dbDelete,
    dbGetAll,
    dbClear,
    dbReplaceStores,
    closeAppDatabase,
};
