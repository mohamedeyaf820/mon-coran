// Deterministic before/after timing of "time to first verse" on a long surah.
//
//   node .claude/skills/app-full-review/scripts/reader-ab.mjs http://127.0.0.1:4181 http://127.0.0.1:4182
//
// Live API latency makes raw runs useless (a 10 s spread between two identical
// runs is normal), so the Quran APIs are answered from a recorded copy through a
// simulated shared link (FIFO bandwidth + latency) with the CPU throttled by CDP.
// Build both trees with a plain `vite build --outDir <dir>` and serve each one
// with `vite preview`. Reports the median of 7 interleaved runs per scenario.
import { chromium } from "playwright";

const bases = process.argv.slice(2);
if (bases.length < 1) throw new Error("usage: reader-ab.mjs <baseA> [baseB]");
const SCENARIOS = { slow: { latency: 150, kbps: 200 }, fast: { latency: 80, kbps: 1000 } };
const GZIP_RATIO = 0.13; // measured on the Quran.com verse payloads
const cache = new Map();

async function run(browser, base, scenario, cpu, warm) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: "block" });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    localStorage.setItem("mushaf-plus-settings", JSON.stringify({ skipSplashAnimation: true, lang: "fr", riwaya: "hafs" }));
  });
  if (cpu > 1) await (await ctx.newCDPSession(page)).send("Emulation.setCPUThrottlingRate", { rate: cpu });
  let linkFree = 0;
  const started = Date.now();
  await page.route(/https:\/\/(api\.quran\.com|api\.alquran\.cloud)\//, async (route) => {
    const url = route.request().url();
    // Keep neighbour prefetch out of the measure.
    if (!(url.includes("by_chapter/2?") || url.includes("surah/2/"))) return route.abort();
    let body = cache.get(url);
    if (!body) {
      const real = await route.fetch();
      body = {
        status: real.status(),
        headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
        body: await real.body(),
      };
      cache.set(url, body);
    }
    if (warm) return route.fulfill(body);
    const now = Date.now();
    const start = Math.max(now + scenario.latency, linkFree);
    const finish = start + (body.body.length * GZIP_RATIO) / scenario.kbps;
    linkFree = finish;
    await new Promise((resolve) => setTimeout(resolve, finish - now));
    return route.fulfill(body);
  });
  await page.goto(base + "/surah/2", { waitUntil: "load" });
  await page.waitForSelector("[data-ayah-number]", { timeout: 90000 });
  const elapsed = Date.now() - started;
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await ctx.close();
  return elapsed;
}

const browser = await chromium.launch();
for (const base of bases) await run(browser, base, SCENARIOS.fast, 1, true); // record the payloads once
const RUNS = 7;
for (const [name, scenario] of Object.entries(SCENARIOS)) {
  for (const cpu of [1, 4]) {
    // Interleaved (A B A B ... then B A ...): a machine that drifts during the
    // measure otherwise favours whichever build ran last.
    const times = Object.fromEntries(bases.map((base) => [base, []]));
    for (let i = 0; i < RUNS; i += 1) {
      const order = i % 2 ? [...bases].reverse() : bases;
      for (const base of order) times[base].push(await run(browser, base, scenario, cpu, false));
    }
    for (const base of bases) {
      const sorted = [...times[base]].sort((x, y) => x - y);
      console.log(`${name.padEnd(5)} cpu${cpu}x ${base}  median ${sorted[Math.floor(RUNS / 2)]} ms  [${sorted.join(", ")}]`);
    }
  }
}
await browser.close();
