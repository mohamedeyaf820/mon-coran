import { promises as fs } from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

const projectRoot = process.cwd();
const distAssetsDir = path.join(projectRoot, "dist", "assets");

async function listAssets() {
  try {
    const files = await fs.readdir(distAssetsDir);
    const stats = await Promise.all(
      files.map(async (file) => {
        const fullPath = path.join(distAssetsDir, file);
        const info = await fs.stat(fullPath);
        return {
          file,
          size: info.size,
          ext: path.extname(file).toLowerCase(),
        };
      }),
    );
    return stats.sort((a, b) => b.size - a.size);
  } catch {
    return [];
  }
}

function formatKb(bytes) {
  return `${(bytes / 1024).toFixed(1)} kB`;
}

async function probe(url, label, init = {}) {
  const startedAt = performance.now();
  try {
    const response = await fetch(url, init);
    const elapsed = performance.now() - startedAt;
    return {
      label,
      ok: response.ok,
      status: response.status,
      elapsedMs: Math.round(elapsed),
    };
  } catch (error) {
    return {
      label,
      ok: false,
      status: "ERR",
      elapsedMs: null,
      error: error?.message || "Unknown error",
    };
  }
}

async function main() {
  const assets = await listAssets();
  const cssAssets = assets.filter((asset) => asset.ext === ".css");
  const jsAssets = assets.filter((asset) => asset.ext === ".js");
  const totalCss = cssAssets.reduce((sum, asset) => sum + asset.size, 0);
  const totalJs = jsAssets.reduce((sum, asset) => sum + asset.size, 0);

  console.log("\n[perf-audit] Build asset summary");
  console.log(`- CSS total: ${formatKb(totalCss)}`);
  console.log(`- JS total: ${formatKb(totalJs)}`);
  for (const asset of assets.slice(0, 5)) {
    console.log(`- Largest asset: ${asset.file} (${formatKb(asset.size)})`);
  }

  if (totalCss > 500 * 1024) {
    console.warn("[perf-audit] Warning: CSS bundle is still above 500 kB.");
  }

  const probes = await Promise.all([
    probe("https://api.alquran.cloud/v1/meta", "API metadata"),
    probe("https://cdn.islamic.network/quran/audio/128/ar.alafasy/1.mp3", "Islamic CDN audio", {
      method: "HEAD",
    }),
    probe(
      "https://everyayah.com/data/Abdullah_Basfar_192kbps/001001.mp3",
      "EveryAyah CDN audio",
      { method: "HEAD" },
    ),
  ]);

  console.log("\n[perf-audit] Network probes");
  for (const result of probes) {
    if (result.elapsedMs == null) {
      console.log(`- ${result.label}: ${result.status} (${result.error})`);
    } else {
      console.log(`- ${result.label}: ${result.status} in ${result.elapsedMs} ms`);
    }
  }
}

await main();
