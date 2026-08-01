import { expect, test } from "@playwright/test";

async function openSettings(page) {
  const direct = page.locator(".mp-header__settings").first();
  if (await direct.isVisible().catch(() => false)) await direct.click();
  else {
    await page.locator(".mp-header__more").first().click();
    await page.locator('.mp-header-menu__item[data-key="settings"]').click();
  }
}

test("privacy control deletes settings, notes, bookmarks and caches", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({ lang: "fr", theme: "light", showHome: true, skipSplashAnimation: true }));
    localStorage.setItem("mushaf-reading-history", "seed");
  });
  await page.goto("/");
  await page.evaluate(async () => {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open("mushafplus", 2);
      request.onupgradeneeded = () => {
        const nextDb = request.result;
        for (const name of ["cache", "notes", "bookmarks", "wird", "history", "playlists"]) {
          if (!nextDb.objectStoreNames.contains(name)) nextDb.createObjectStore(name, { keyPath: name === "history" ? "id" : name === "wird" ? "date" : name === "cache" ? "key" : "id", autoIncrement: name === "history" });
        }
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
    const transaction = db.transaction(["notes", "bookmarks"], "readwrite");
    transaction.objectStore("notes").put({ id: "1:1", text: "private" });
    transaction.objectStore("bookmarks").put({ id: "1:1" });
    await new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
    db.close();
    const cache = await caches.open("mushafplus-test-cache");
    await cache.put("/seed", new Response("seed"));
  });

  await openSettings(page);
  await page.getByRole("tab", { name: "Confidentialité" }).click();
  await page.getByTestId("delete-local-data").click();
  await expect(page.getByText("Supprimer toutes les données ?")).toBeVisible();
  await page.getByRole("button", { name: "Tout supprimer" }).click();
  await page.waitForFunction(() => localStorage.length === 0);
  const state = await page.evaluate(async () => ({
    localKeys: Object.keys(localStorage),
    cacheNames: await caches.keys(),
    databases: typeof indexedDB.databases === "function" ? await indexedDB.databases() : [],
  }));
  expect(state.localKeys).toEqual([]);
  expect(state.cacheNames).not.toContain("mushafplus-test-cache");
  expect(state.databases.map((item) => item.name)).not.toContain("mushafplus");
});
