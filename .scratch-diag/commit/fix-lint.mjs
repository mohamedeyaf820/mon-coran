// Scratch commit helper — not for commit.
// Cures the two lint errors my own earlier commits left on HEAD:
//  - public/sw.js: 59e9fcd removed the only call site of cacheQuranUrls().
//  - tests/warsh-marker-integrity.test.mjs: f212bee4 destructured an unused `surah`.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const deadFn = `/**
 * Met en cache une liste d'URLs API de façon asynchrone (best effort).
 * Utilisée par l'app pour mettre en cache les sourates récemment visitées.
 */
async function cacheQuranUrls(urls) {
  if (!urls.length) return;
  try {
    const apiCache = await caches.open(API_CACHE_NAME);
    await Promise.allSettled(
      urls
        .filter((u) => {
          try {
            const parsed = new URL(u);
            return parsed.hostname === "api.alquran.cloud" || parsed.hostname === "api.quran.com";
          } catch {
            return false;
          }
        })
        .map(async (url) => {
          const existing = await apiCache.match(url);
          if (existing) return; // Déjà en cache, inutile de re-télécharger
          const res = await fetch(url, {
            headers: { Accept: "application/json" },
          });
          if (res.ok) await putBounded(apiCache, url, res, API_CACHE_NAME);
        }),
    );
    await trimCache(apiCache, CACHE_LIMITS[API_CACHE_NAME]);
  } catch {
    // Silencieux – le cache API n'est pas critique
  }
}

`;

const plan = [
  { path: "public/sw.js", pairs: [[deadFn, ""]] },
  {
    path: "tests/warsh-marker-integrity.test.mjs",
    pairs: [
      [
        "  const [surah, ayah, body] = legacyAyahs.find(([, a]) => a === 1)",
        "  const [, ayah, body] = legacyAyahs.find(([, a]) => a === 1)",
      ],
    ],
  },
];

mkdirSync(".scratch-diag/commit/apply/tests", { recursive: true });
mkdirSync(".scratch-diag/commit/apply/public", { recursive: true });
for (const entry of plan) {
  const head = execFileSync("git", ["show", `HEAD:${entry.path}`], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  let out = head;
  for (const [i, [oldS, newS]] of entry.pairs.entries()) {
    const count = out.split(oldS).length - 1;
    if (count !== 1) {
      console.error(`REJECT ${entry.path} pair #${i}: occurs ${count}x`);
      process.exit(1);
    }
    out = out.replace(oldS, () => newS);
  }
  const file = `.scratch-diag/commit/apply/${entry.path.replace("/", "/")}`;
  writeFileSync(file, out, { encoding: "utf8" });
  if (out.includes("cacheQuranUrls") && entry.path === "public/sw.js") {
    console.error("REJECT: cacheQuranUrls still present");
    process.exit(1);
  }
  const sha = execFileSync("git", ["hash-object", "-w", file], { encoding: "utf8" }).trim();
  execFileSync("git", ["update-index", "--cacheinfo", `100644,${sha},${entry.path}`]);
  console.log(`staged ${entry.path} -> ${sha.slice(0, 8)}`);
}
