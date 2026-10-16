import { expect, test } from "@playwright/test";

test.use({ serviceWorkers: "block" });

/* When Quran.com is unreachable the reader falls back to another provider whose
   ayahs carry no surah number and whose first verse embeds the Basmala. The
   Basmala must never stay glued to verse 1 of a surah that has its own header. */
// The provider is mocked: the spec must not depend on a third-party service being
// reachable. Verse 1 carries the Basmala exactly as AlQuran Cloud serves it.
const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
const FIRST_VERSE_BODY = { 2: "الٓمٓ", 36: "يسٓ", 114: "قُلْ أَعُوذُ بِرَبِّ ٱلنَّاسِ" };

function fallbackSurah(surah) {
  const ayah = (n, text) => ({
    number: n, numberInSurah: n, text, juz: 1, manzil: 1, page: 1, ruku: 1, hizbQuarter: 1, sajda: false,
  });
  return {
    code: 200,
    status: "OK",
    data: {
      number: surah,
      numberOfAyahs: 2,
      ayahs: [ayah(1, `${BASMALA} ${FIRST_VERSE_BODY[surah]}`), ayah(2, "ذَٰلِكَ ٱلْكِتَٰبُ")],
    },
  };
}

for (const surah of [2, 36, 114]) {
  test(`fallback source: verse 1 of surah ${surah} does not start with the Basmala`, async ({ page }) => {
    await page.route("**/api.quran.com/**", (route) => route.abort());
    await page.route("**/api.alquran.cloud/v1/surah/*/quran-*", (route) =>
      route.fulfill({ json: fallbackSurah(surah) }),
    );
    await page.addInitScript(() => localStorage.setItem("mushaf-plus-settings", JSON.stringify({
      skipSplashAnimation: true, lang: "fr", showHome: false, riwaya: "hafs",
      displayMode: "surah", mushafLayout: "list", fontFamily: "qpc-hafs",
    })));
    await page.goto(`/surah/${surah}`);
    const firstVerse = page.locator("#ayah-1 .qc-ayah-text-ar, #ayah-1 .quran-arabic-text").first();
    await expect(firstVerse).toBeVisible({ timeout: 30_000 });
    await expect(firstVerse).not.toContainText("بِسْمِ");
    await expect(firstVerse).not.toContainText("ٱلرَّحِيمِ");
  });
}
