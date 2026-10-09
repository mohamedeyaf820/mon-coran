/**
 * Download the QUL Quran text datasets with the user's own signed-in session.
 *
 * QUL has no public text API and no anonymous download: every file sits behind
 * an account. Rather than have the user fetch files by hand, this opens a real
 * browser window, waits for them to sign in, and then saves the downloads into
 * vendor/qul/ under the names scripts/integrate-qul.mjs expects.
 *
 * The window is real on purpose: a headless session would need a copy of the
 * browser profile, and profile cookies are the one thing that does not survive
 * being copied reliably. Signing in once here is faster and touches nothing
 * outside qul.tarteel.ai.
 *
 * Resource slugs are discovered from the listing rather than hardcoded: the
 * slug naming for a given riwaya is not stable across QUL revisions, and a
 * hardcoded slug that quietly 404s would look like a successful empty run.
 *
 * Usage: npm run fetch:qul            (Warsh only, the default)
 *        npm run fetch:qul -- hafs    (add the Hafs resources)
 */

import { existsSync, mkdirSync, renameSync, readdirSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "vendor", "qul");
const PROFILE = join(process.env.TEMP, "qul-fetch-profile");
const WAIT_MS = 5 * 60 * 1000;
const BASE = "https://qul.tarteel.ai";

/**
 * Each riwaya has an ayah-by-ayah resource (the text the reader actually
 * shows) and a word-by-word one. A word-by-word file has one row per word, not
 * per verse, so it is fetched for cross-referencing but never counted as text.
 */
const RIWAYAS = {
  warsh: { query: "warsh", slugs: ["wpc-warsh-script-ayah", "wpc-warsh-script-wbw"] },
  hafs: { query: "hafs", slugs: ["qpc-hafs-script-ayah", "qpc-hafs-script-wbw"] },
};

const requested = process.argv.slice(2).filter((a) => a in RIWAYAS);
const riwayas = requested.length ? requested : ["warsh"];

// Signing in navigates, so an in-flight evaluate can land on a context that
// no longer exists. A race here is expected, not a failure: wait for the page
// to settle and ask again.
const signedIn = async (p) => {
  try {
    return await p.evaluate(() => {
      const t = document.body.innerText;
      return !/(^|\s)Login(\s|$)/i.test(t) && !/Sign in/i.test(t);
    });
  } catch {
    return false;
  }
};

const waitForSignIn = async (p, deadline) => {
  while (Date.now() < deadline) {
    await p.waitForLoadState("domcontentloaded").catch(() => {});
    if (await signedIn(p)) return true;
    await p.waitForTimeout(3000);
  }
  return signedIn(p);
};

mkdirSync(OUT, { recursive: true });
const ctx = await chromium.launchPersistentContext(PROFILE, {
  headless: false,
  acceptDownloads: true,
  args: ["--start-maximized"],
});
const page = ctx.pages()[0] ?? (await ctx.newPage());

await page.goto(`${BASE}/resources/?q=${RIWAYAS[riwayas[0]].query}`, {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});

if (!(await signedIn(page))) {
  console.log("[fetch:qul] a browser window is open — sign in to qul.tarteel.ai there.");
  console.log(`[fetch:qul] waiting up to ${WAIT_MS / 60000} minutes…`);
  if (!(await waitForSignIn(page, Date.now() + WAIT_MS))) {
    console.error("[fetch:qul] no sign-in detected; stopping without downloading.");
    await ctx.close();
    process.exit(1);
  }
}
console.log("[fetch:qul] signed in.");

// Resolve slugs against what the listing actually offers. A slug that has been
// renamed upstream must surface as "not found" here, not as a missing file the
// user discovers later.
const wanted = [];
for (const key of riwayas) {
  const r = RIWAYAS[key];
  await page.goto(`${BASE}/resources/?q=${r.query}`, {
    waitUntil: "domcontentloaded",
    timeout: 60_000,
  });
  const hrefs = await page.$$eval("a[href*='/resources/quran-script/']", (as) =>
    as.map((a) => a.getAttribute("href")),
  );
  for (const slug of r.slugs) {
    const hit = hrefs.find((h) => h?.endsWith(`/${slug}`));
    if (!hit) {
      console.error(`[fetch:qul] slug not in the "${r.query}" listing: ${slug} — skipping.`);
      continue;
    }
    wanted.push({
      label: `${key} ${slug.endsWith("wbw") ? "word-by-word" : "ayah"}`,
      url: new URL(hit, BASE).toString(),
      as: `${key}-${slug.endsWith("wbw") ? "wbw" : "ayah"}.json`,
    });
  }
}

if (!wanted.length) {
  console.error("[fetch:qul] no matching resources found; stopping without downloading.");
  await ctx.close();
  process.exit(1);
}

// Clear any half-written file from a previous run before we start.
for (const w of wanted) {
  const target = join(OUT, w.as);
  if (existsSync(target)) unlinkSync(target);
}

for (const w of wanted) {
  console.log(`[fetch:qul] ${w.label} …`);
  await page.goto(w.url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForTimeout(1500);

  const json = page.getByRole("link", { name: /^Download json$/i }).first();
  if (!(await json.count())) {
    console.error(`[fetch:qul] no "Download json" link on ${w.url}; skipping.`);
    continue;
  }

  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 120_000 }),
    json.click(),
  ]);

  const tmp = join(OUT, `.${w.as}.part`);
  await download.saveAs(tmp);
  renameSync(tmp, join(OUT, w.as));
  console.log(`[fetch:qul] saved vendor/qul/${w.as}`);
}

await ctx.close();

const got = readdirSync(OUT).filter((f) => f.endsWith(".json"));
console.log(`[fetch:qul] ${got.length} file(s) in vendor/qul/: ${got.join(", ") || "none"}`);
const missing = wanted.filter((w) => !existsSync(join(OUT, w.as)));
if (missing.length) {
  console.error(`[fetch:qul] incomplete: ${missing.map((m) => m.as).join(", ")}`);
  process.exit(1);
}
console.log("[fetch:qul] OK — next: npm run integrate:qul");
