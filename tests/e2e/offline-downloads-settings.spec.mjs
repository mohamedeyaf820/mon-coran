import fs from "node:fs";
import { expect, test } from "@playwright/test";
import { installQuranNetworkFixtures } from "./helpers/quran-network-fixtures.mjs";
import { openQuickMenuItem } from "./helpers/quick-menu.mjs";

const clip = [...fs.readFileSync("tests/fixtures/silent-2s.mp3")];
const cacheName = "mushafplus-audio-v2";

for (const lang of ["fr", "en", "ar"]) {
  test(`offline settings validate legacy downloads and delete them (${lang})`, async ({ page }) => {
    await page.setViewportSize({ width: lang === "en" ? 1280 : 390, height: 844 });
    await installQuranNetworkFixtures(page);
    await page.addInitScript(({ lang }) => {
      localStorage.setItem("mushaf-plus-settings", JSON.stringify({ lang, skipSplashAnimation: true, showHome: true, riwaya: "hafs", sidebarOpen: false }));
    }, { lang });
    await page.goto("/");
    await expect(page.locator(".app-view-home")).toBeVisible({ timeout: 30000 });
    await page.evaluate(async ({ clip, cacheName }) => {
      const cache = await caches.open(cacheName);
      for (let ayah = 1; ayah <= 7; ayah++) {
        await cache.put(`https://everyayah.com/data/Muhammad_Ayyoub_128kbps/001${String(ayah).padStart(3, "0")}.mp3`, new Response(new Uint8Array(clip), { headers: { "Content-Type": "audio/mpeg" } }));
      }
      localStorage.setItem("mushaf_offline_progress_v2", JSON.stringify({
        "hafs:muhammad_ayyoub:1": { key: "hafs:muhammad_ayyoub:1", reciterId: "muhammad_ayyoub", reciterName: "Muhammad Ayyoub", riwaya: "hafs", surahNum: 1, total: 7, downloaded: 7, status: "done", updatedAt: Date.now() },
      }));
    }, { clip, cacheName });
    await openQuickMenuItem(page, "settings");
    const title = { fr: "Téléchargements / Hors connexion", en: "Downloads / Offline", ar: "التنزيلات / دون اتصال" }[lang];
    await page.getByRole("tab", { name: title }).click();
    const section = page.getByTestId("offline-downloads");
    await expect(section).toHaveAttribute("aria-busy", "false");
    await expect(section).toContainText("Muhammad Ayyoub");
    await expect(section).toContainText("7/7");
    await expect(section).toContainText({ fr: "Disponible hors connexion", en: "Available offline", ar: "متاح دون اتصال" }[lang]);
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("mushaf_offline_progress_v2"))["hafs:muhammad_ayyoub:1"].validationVersion)).toBe(1);
    for (const button of await section.getByRole("button").all()) {
      const bounds = await button.boundingBox();
      expect(bounds.height).toBeGreaterThanOrEqual(44);
    }
    fs.mkdirSync(".codex-artifacts/offline-audio", { recursive: true });
    await page.screenshot({ path: `.codex-artifacts/offline-audio/settings-${lang}.png` });
    const deleteAll = { fr: "Supprimer tous les audios téléchargés", en: "Delete all downloaded audio", ar: "حذف جميع التلاوات المنزّلة" }[lang];
    await section.getByRole("button", { name: deleteAll, exact: true }).click();
    await page.getByRole("button", { name: { fr: "Annuler", en: "Cancel", ar: "إلغاء" }[lang], exact: true }).last().click();
    await expect(section).toContainText("7/7");
    await section.getByRole("button", { name: deleteAll, exact: true }).click();
    await page.getByRole("button", { name: { fr: "Confirmer", en: "Confirm", ar: "تأكيد" }[lang], exact: true }).click();
    await expect(section).not.toContainText("Muhammad Ayyoub");
    expect(await page.evaluate(cacheName => caches.has(cacheName), cacheName)).toBe(true);
    expect(await page.evaluate(async cacheName => (await (await caches.open(cacheName)).keys()).length, cacheName)).toBe(0);
  });
}
