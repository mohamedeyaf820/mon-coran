/**
 * Emergency Cache Clear Script
 * Run this in the browser console to clear all caches and reload
 */

async function emergencyClear() {
  console.log('🧹 Starting emergency cache clear...');
  
  // Clear localStorage
  try {
    localStorage.clear();
    console.log('✅ localStorage cleared');
  } catch (e) {
    console.error('❌ localStorage clear failed:', e);
  }
  
  // Clear sessionStorage
  try {
    sessionStorage.clear();
    console.log('✅ sessionStorage cleared');
  } catch (e) {
    console.error('❌ sessionStorage clear failed:', e);
  }
  
  // Clear IndexedDB
  try {
    const databases = await window.indexedDB.databases();
    for (const db of databases) {
      if (db.name) {
        await new Promise((resolve, reject) => {
          const request = indexedDB.deleteDatabase(db.name);
          request.onsuccess = () => {
            console.log(`✅ IndexedDB "${db.name}" deleted`);
            resolve(null);
          };
          request.onerror = () => reject(request.error);
        });
      }
    }
  } catch (e) {
    console.error('❌ IndexedDB clear failed:', e);
  }
  
  // Clear Cache API
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
        console.log(`✅ Cache "${name}" deleted`);
      }
    } catch (e) {
      console.error('❌ Cache API clear failed:', e);
    }
  }
  
  // Unregister service workers
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
        console.log('✅ Service worker unregistered');
      }
    } catch (e) {
      console.error('❌ Service worker unregister failed:', e);
    }
  }
  
  console.log('🎉 Cache clear complete! Reloading page...');
  
  // Force reload without cache
  window.location.reload(true);
}

// Run it
emergencyClear();
