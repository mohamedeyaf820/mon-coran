// scratch: audit reciter biographies for attribution quality, name/riwaya mismatch,
// duplicated text, and staleness. Run: node .scratch-diag/bio-audit.mjs
import { readFileSync } from "node:fs";

const m = await import("../src/data/reciters.js");
const profiles = JSON.parse(readFileSync("public/data/reciter-profiles.json", "utf8"));
const all = [
  ...m.default.hafs.map((r) => ({ ...r, riwaya: "hafs" })),
  ...m.default.warsh.map((r) => ({ ...r, riwaya: "warsh" })),
];
const byId = new Map(all.map((r) => [r.id, r]));

const issues = [];
const seenBio = new Map();
const WEAK = [/api\.quranpedia\.net\/v1\/reciters$/, /assabile\.com\/?$/, /quran\.com\/reciters$/, /^$/];

for (const [id, p] of Object.entries(profiles)) {
  const r = byId.get(id);
  const tag = (msg) => issues.push(`${id}${r ? "" : " (aucune entrée récitateuse)"}: ${msg}`);
  if (!p.bio) {
    tag("aucun bio");
    continue;
  }
  const langs = ["fr", "en", "ar"].filter((l) => p.bio[l]);
  if (langs.length < 3) tag(`bio incomplète: ${langs.join("/") || "aucune"}`);

  for (const l of langs) {
    const text = String(p.bio[l]).trim();
    if (text.length < 120) tag(`bio ${l} trop courte (${text.length} car.)`);
    const key = text.toLowerCase().replace(/\s+/g, " ").trim().slice(0, 140);
    if (seenBio.has(key)) tag(`bio ${l} identique à celle de ${seenBio.get(key)}`);
    else seenBio.set(key, id);
  }

  // Attribution must point at a page that documents THIS reciter.
  const src = p.bioSource?.url || "";
  if (!src) tag("bioSource manquant");
  else if (WEAK.some((re) => re.test(src))) tag(`source non citante: ${src}`);
  else if (r) {
    const slug = `${r.nameEn || ""} ${r.nameFr || ""} ${src}`.toLowerCase();
    const latin = (r.nameEn || r.nameFr || "").toLowerCase();
    const tokens = latin.split(/[^a-z]+/).filter((w) => w.length > 3);
    const hit = tokens.filter((tk) => src.toLowerCase().includes(tk)).length;
    if (tokens.length && hit === 0)
      tag(`source probable d'un autre récitateur (aucun mot de «${latin}» dans ${src.split("/")[2] || src})`);
  }

  // Riwaya stated in the bio must match the entry it is attached to.
  if (r?.riwaya === "warsh" && !/warsh|ورش|ورشة|ورش عن نافع/i.test(JSON.stringify(p.bio)))
    tag("fiche Warsh sans mention de la riwaya Warsh");
  if (r?.riwaya === "hafs" && /Warsh ʿan Nāfiʿ|برواية ورش/i.test(JSON.stringify(p.bio)))
    tag("fiche Hafs qui annonce Warsh");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(p.reviewedAt || "")) tag(`reviewedAt absent ou invalide: ${p.reviewedAt}`);
}

const dates = Object.values(profiles).map((p) => p.reviewedAt).sort();
console.log(`profils: ${Object.keys(profiles).length} · récitateurs: ${all.length}`);
console.log(`reviewedAt: min ${dates[0]} max ${dates.at(-1)} · ${dates.filter((d) => d === dates[0]).length} à la date la plus ancienne`);
const noProfile = all.filter((r) => !profiles[r.id]).map((r) => r.id);
console.log(`récitateurs sans profil: ${noProfile.length ? noProfile.join(", ") : "aucun"}`);
console.log(`\n${issues.length} constat(s):`);
for (const i of issues) console.log(" - " + i);
