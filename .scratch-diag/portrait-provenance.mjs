/**
 * Cross-check every portrait against the page that names the reciter.
 *
 * For Assabile entries we fetch the reciter's own profile page and ask: does this
 * page actually reference the image file we shipped? If it references a different
 * person's file, or our file is hosted under another reciter's slug, the face is
 * misattributed. Quran.com entries are checked by name-slug instead.
 */
import { execFile } from "node:child_process";
import { writeFileSync } from "node:fs";

import {
  RECITER_PHOTOS_MAP,
  getRecitersByRiwaya,
} from "../src/data/reciters.js";
import { RECITER_PORTRAITS } from "../src/data/reciterPortraits.js";

const pexec = (args) =>
  new Promise((resolve, reject) => {
    execFile("curl", args, (err, stdout, stderr) =>
      err ? reject(new Error(stderr || err.message)) : resolve(stdout),
    );
  });

const byId = new Map([
  ...getRecitersByRiwaya("hafs"),
  ...getRecitersByRiwaya("warsh"),
].map((r) => [r.id, r]));

// RECITER_PROFILE_SOURCES is not exported; read the provider page from the manifest.
const rows = [];
const pageCache = new Map();

const fetchPage = async (url) => {
  if (!pageCache.has(url)) {
    pageCache.set(
      url,
      await pexec([
        "-sSL", "--max-time", "45",
        "-A", "Mozilla/5.0 (MushafPlus portrait provenance check)",
        url,
      ]),
    );
  }
  return pageCache.get(url);
};

for (const [id, entry] of Object.entries(RECITER_PORTRAITS)) {
  const reciter = byId.get(id);
  const sourceUrl = entry.sourceUrl;
  const file = sourceUrl.split("/").pop();

  if (entry.provider === "Assabile" && entry.sourcePage?.includes("assabile.com")) {
    let html = "";
    try {
      html = await fetchPage(entry.sourcePage);
    } catch (e) {
      rows.push({ id, verdict: "FETCH_FAIL", note: e.message.slice(0, 60) });
      continue;
    }
    const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) || [, ""])[1]
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();
    const embedded = [...html.matchAll(/(?:src|href|content)="([^"]*\/media\/[^"]+)"/g)].map((m) => m[1]);
    const referenced = embedded.some((u) => u.includes(file));
    const personSlugs = [...new Set(
      embedded.map((u) => (u.match(/\/media\/(?:person|photo)\/[^/]+\/([a-z0-9-]+?)\.(?:png|jpe?g|webp)/i) || [])[1]).filter(Boolean),
    )];
    rows.push({
      id,
      app: reciter?.nameEn || "",
      pageH1: h1.slice(0, 46),
      file,
      verdict: referenced ? "ok" : "NOT_ON_PAGE",
      pageFiles: personSlugs.slice(0, 4).join(","),
    });
  } else {
    rows.push({ id, app: reciter?.nameEn || "", file, verdict: "skip:" + entry.provider, pageH1: "", pageFiles: "" });
  }
}

writeFileSync(".scratch-diag/portrait-provenance.json", JSON.stringify(rows, null, 2), "utf8");
console.table(rows.filter((r) => r.verdict !== "skip:Quran.com" && r.verdict !== "skip:Way2Quran"));
console.log(
  "Assabile:",
  rows.filter((r) => r.verdict === "ok").length, "ok ·",
  rows.filter((r) => r.verdict === "NOT_ON_PAGE").length, "absent de la fiche ·",
  rows.filter((r) => r.verdict === "FETCH_FAIL").length, "échec",
);
