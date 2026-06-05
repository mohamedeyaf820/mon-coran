/**
 * Unified Database Service
 * Centralizes IndexedDB logic using the 'idb' library.
 */

import { openDB } from 'idb';

const DB_NAME = 'mushafplus';
const DB_VERSION = 2;

let dbPromise = null;

function devWarn(...args) {
    if (import.meta.env.DEV && typeof console !== 'undefined') {
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

export default {
    getDB,
    dbGet,
    dbSet,
    dbDelete,
    dbGetAll,
};
