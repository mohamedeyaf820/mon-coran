import { expect, test } from "@playwright/test";

const SETTINGS_KEY = "mushaf-plus-settings";

async function prepareHome(page, extraStorage = {}) {
  await page.addInitScript(({ settingsKey, storage }) => {
    window.localStorage.setItem(settingsKey, JSON.stringify({
      lang: "fr",
      theme: "light",
      riwaya: "hafs",
      reciter: "ar.alafasy",
      showHome: true,
    }));
    Object.entries(storage).forEach(([key, value]) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    });
  }, { settingsKey: SETTINGS_KEY, storage: extraStorage });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Voir tout" })).toBeVisible({
    timeout: 20_000,
  });
}

async function openFutureHub(page, toolName) {
  await page.getByRole("button", { name: "Voir tout" }).click();
  const toolsDialog = page.getByRole("dialog", { name: "Espace outils spirituels" });
  await expect(toolsDialog).toBeVisible();
  await toolsDialog.getByRole("button", { name: toolName }).click();
  await expect(page.getByRole("dialog", { name: "Bibliothèque personnelle" })).toBeVisible();
}

test("phase 7: le gestionnaire offline restaure et affiche son registre", async ({ page }) => {
  const entry = {
    key: "hafs:ar.alafasy:1",
    status: "done",
    surahNum: 1,
    reciterId: "ar.alafasy",
    reciterName: "Mishary Alafasy",
    riwaya: "hafs",
    total: 7,
    downloaded: 7,
    failedCount: 0,
    updatedAt: Date.now(),
  };
  await prepareHome(page, { mushaf_offline_progress_v2: { [entry.key]: entry } });
  await openFutureHub(page, "Bibliothèque offline");

  const dialog = page.getByRole("dialog", { name: "Bibliothèque personnelle" });
  await expect(dialog.getByRole("tab", { name: "Offline" })).toHaveAttribute("aria-selected", "true");
  await expect(dialog.getByRole("listitem").getByText("L'Ouverture", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Prêt")).toBeVisible();
  await expect(dialog.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100");
});

test("phase 7: un parcours de mémorisation propose une séance et ouvre le lecteur", async ({ page }) => {
  await prepareHome(page);
  await openFutureHub(page, "Parcours de mémorisation");

  const dialog = page.getByRole("dialog", { name: "Bibliothèque personnelle" });
  await dialog.getByRole("button", { name: "Al-Fatiha 1 sourate(s)" }).click();
  await dialog.getByRole("button", { name: "Créer mon parcours" }).click();

  await expect(dialog.getByText("Parcours actif")).toBeVisible();
  await expect(dialog.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  await dialog.getByRole("button", { name: "L'Ouverture · 1:1 0/5" }).click();

  await expect(page).toHaveURL(/\/surah\/1$/);
  await expect(page.locator(".app-root")).toHaveClass(/is-memorizing/);
});

test("phase 7: l'index thématique filtre puis navigue vers une référence", async ({ page }) => {
  await prepareHome(page);
  await openFutureHub(page, "Index thématique");

  const dialog = page.getByRole("dialog", { name: "Bibliothèque personnelle" });
  const search = dialog.getByRole("searchbox", { name: "Rechercher un thème" });
  await search.fill("justice");
  await expect(dialog.getByRole("heading", { name: "Justice et équité" })).toBeVisible();
  await expect(dialog.getByRole("heading", { name: "Miséricorde" })).toHaveCount(0);
  await dialog.getByRole("button", { name: "Les Femmes 4:58" }).click();

  await expect(page).toHaveURL(/\/surah\/4\/58$/);
});

test("phase 7: le cloud reste bloqué tant que le consentement n'est pas donné", async ({ page }) => {
  await prepareHome(page);
  await openFutureHub(page, "Données portables");

  const dialog = page.getByRole("dialog", { name: "Bibliothèque personnelle" });
  await dialog.getByRole("tab", { name: "Cloud" }).click();
  const share = dialog.getByRole("button", { name: "Choisir une destination" });
  await expect(share).toBeDisabled();
  await dialog.getByRole("checkbox", { name: /Je comprends que le fichier contient/ }).check();
  await expect(share).toBeEnabled();
});

test("phase 7: l'export ciblé produit le format lisible choisi", async ({ page }) => {
  await prepareHome(page);
  await openFutureHub(page, "Données portables");

  const dialog = page.getByRole("dialog", { name: "Bibliothèque personnelle" });
  await dialog.getByRole("button", { name: "MD" }).click();
  const downloadPromise = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Créer l’export" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^mushafplus-notes-favoris-\d{4}-\d{2}-\d{2}\.md$/);
});

test("phase 7: le centre reste contenu sur mobile et ses onglets suivent le clavier", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await prepareHome(page);
  await openFutureHub(page, "Bibliothèque offline");

  const dialog = page.getByRole("dialog", { name: "Bibliothèque personnelle" });
  const box = await dialog.boundingBox();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(390);

  const offlineTab = dialog.getByRole("tab", { name: "Offline" });
  await offlineTab.focus();
  await offlineTab.press("ArrowRight");
  await expect(dialog.getByRole("tab", { name: "Exports" })).toHaveAttribute("aria-selected", "true");

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
});
