import { chromium } from "playwright";
import fs from "node:fs";

const BASE = "http://127.0.0.1:4173";
const OUT = ".scratch-diag/captures/translit";
fs.mkdirSync(OUT, { recursive: true });

const dataset = new Map();
const surahDoc = (surah) => {
  if (!dataset.has(surah)) {
    const file = `public/data/transliteration-en/${String(surah).padStart(3, "0")}.json`;
    dataset.set(surah, new Map(JSON.parse(fs.readFileSync(file, "utf8")).ayahs.map((a) => [a.ayah_number, a.text])));
  }
  return dataset.get(surah);
};

const browser = await chromium.launch();

async function run(label, seed, path, { mustMatchDataset, kursiTo = null }) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript((value) => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify(value));
  }, seed);
  const page = await ctx.newPage();
  const assetRequests = [];
  page.on("request", (request) => {
    if (request.url().includes("transliteration-en")) assetRequests.push(request.url());
  });
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error.message)));

  await page.goto(`${BASE}${path}`, { waitUntil: "domcontentloaded" });
  if (await page.locator(".splash-screen").count()) {
    const skip = page.locator(".splash-screen button", { hasText: /Passer|Skip|تخطّي/ });
    await skip.first().click().catch(() => {});
    await page.waitForSelector(".splash-screen", { state: "detached", timeout: 10000 }).catch(() => {});
  }
  await page.waitForSelector(".qc-verse-card", { timeout: 25000 });
  await page.waitForTimeout(2000);

  const readRendered = () =>
    page.evaluate(() => {
      const map = {};
      for (const node of document.querySelectorAll("[data-surah-number][data-ayah-number]")) {
        const line = node.querySelector(".qc-ayah-transliteration")?.textContent?.trim();
        if (line) map[`${node.dataset.surahNumber}:${node.dataset.ayahNumber}`] = line;
      }
      return map;
    });

  let rendered = await readRendered();
  if (kursiTo) {
    await page.evaluate((ayah) => {
      document
        .querySelector(`[data-ayah-number="${ayah}"]`)
        ?.scrollIntoView({ block: "center" });
    }, kursiTo);
    await page.waitForTimeout(2500);
    rendered = await readRendered();
  }

  await page.screenshot({ path: `${OUT}/${label}.png` });

  const failures = [];
  const keys = Object.keys(rendered);
  for (const key of keys) {
    const [surah, ayah] = key.split(":").map(Number);
    const pinned = surahDoc(surah).get(ayah);
    if (mustMatchDataset && rendered[key] !== pinned) {
      failures.push(`${key} shown=${JSON.stringify(rendered[key].slice(0, 60))} pinned=${JSON.stringify(pinned?.slice(0, 60))}`);
    }
    if (!mustMatchDataset && rendered[key] === pinned) {
      failures.push(`${key} warsh line equals the hafs pinned line`);
    }
  }
  if (!keys.length) failures.push("no transliteration line rendered");
  if (mustMatchDataset && !assetRequests.length) failures.push("the offline dataset was never read");
  if (!mustMatchDataset && assetRequests.length) failures.push("warsh fetched the hafs dataset");
  if (errors.length) failures.push(`page errors: ${errors.join(", ")}`);
  if (kursiTo && !rendered[`2:${kursiTo}`]) failures.push(`verse ${kursiTo} never entered the window`);

  console.log(`\n── ${label} (${seed.riwaya} ${path})`);
  console.log(`   ${keys.length} lines rendered; dataset requests: ${assetRequests.length}`);
  console.log(`   sample: ${JSON.stringify(keys.slice(0, 3).map((k) => [k, rendered[k].slice(0, 46)]))}`);
  if (kursiTo) console.log(`   2:${kursiTo} = ${JSON.stringify(rendered[`2:${kursiTo}`]?.slice(0, 60))}`);
  console.log(failures.length ? `   FAIL: ${failures.slice(0, 4).join(" | ")}` : "   OK");
  await ctx.close();
  return failures.length;
}

const base = {
  displayMode: "surah",
  mushafLayout: "list",
  showTranslation: false,
  showTransliteration: true,
  showTajwid: false,
  showHome: false,
  lang: "fr",
  currentSurah: 2,
};

let bad = 0;
bad += await run("hafs-surah-list", { ...base, riwaya: "hafs" }, "/surah/2", {
  mustMatchDataset: true,
  kursiTo: 255,
});
bad += await run("hafs-page-list", { ...base, riwaya: "hafs", displayMode: "page", currentPage: 2 }, "/page/2", {
  mustMatchDataset: true,
});
bad += await run("hafs-juz-list", { ...base, riwaya: "hafs", displayMode: "juz", currentJuz: 1 }, "/juz/1", {
  mustMatchDataset: true,
});
bad += await run("hafs-surah-fatiha", { ...base, riwaya: "hafs", currentSurah: 1 }, "/surah/1", {
  mustMatchDataset: true,
});
bad += await run("warsh-surah-list", { ...base, riwaya: "warsh" }, "/surah/2", {
  mustMatchDataset: false,
});

await browser.close();
console.log(bad ? `\n${bad} failing checks` : "\nall checks passed");
