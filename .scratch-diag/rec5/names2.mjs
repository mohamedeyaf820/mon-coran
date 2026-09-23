import { foldSearchText } from "../../src/utils/searchIntelligence.js";
import SURAHS from "../../src/data/surahs.js";

const AR = /^\p{Script=Arabic}+$/u;
const KEYWORD_RE =
  /^(?:surah|sura|sourate|surate|\u0633\u0648\u0631\u0629|\u0633\u0648\u0631\u0647)\s+/i;
const LATIN_ARTICLES = new Set(["al", "a", "az", "as", "ad", "ar", "ash", "au", "aw", "an", "the"]);
const FRENCH_ARTICLES = new Set(["la", "le", "les", "l", "un", "une", "des", "du"]);
const ALL = new Set([...LATIN_ARTICLES, ...FRENCH_ARTICLES]);

function loose(value) {
  return foldSearchText(String(value || ""))
    .replace(/['\u2019]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function scriptOf(value) {
  if (AR.test(value)) return "arabic";
  if (/\p{Script=Arabic}/u.test(value)) return "mixed";
  return "latin";
}
function stripArticle(folded, script) {
  const articles = script === "latin" ? ALL : script === "mixed" ? LATIN_ARTICLES : new Set();
  const words = folded.split(" ");
  if (words.length > 1 && articles.has(words[0])) return words.slice(1).join(" ");
  if (script !== "latin" && folded.startsWith("\u0627\u0644") && folded.length > 3) return folded.slice(2);
  return folded;
}

const INDEX = new Map();
for (const surah of SURAHS) {
  for (const name of [surah.ar, surah.en, surah.fr]) {
    const folded = loose(name);
    for (const key of new Set([folded, stripArticle(folded, scriptOf(name))])) {
      if (!INDEX.has(key)) INDEX.set(key, new Set());
      INDEX.get(key).add(surah.n);
    }
  }
}
function findSurahByName(query = "") {
  const trimmed = loose(String(query || "").replace(KEYWORD_RE, "").trim());
  const script = scriptOf(trimmed);
  if (trimmed.length < 2 || /^\d+$/.test(trimmed)) return [];
  const exact = INDEX.get(trimmed);
  if (exact) return [...exact];
  return [...(INDEX.get(stripArticle(trimmed, script)) || [])];
}

const collisions = [...INDEX].filter(([, s]) => s.size > 1);
console.log("index keys:", INDEX.size, "| colliding keys:", collisions.length);
for (const [k, s] of collisions) console.log("   COLLIDE", JSON.stringify(k), [...s].join(","));
for (const field of ["ar", "fr", "en"]) {
  const bad = SURAHS.filter((s) => findSurahByName(s[field]).length !== 1).map((s) => `${s.n}:${s[field]}`);
  console.log(`${field} names not uniquely reachable: ${bad.length}`, bad.join(" "));
}

const byN = new Map(SURAHS.map((s) => [s.n, s]));
const probes = [
  "Nuh", "ta ha", "surate Marie", "sourate Yasin", "Al-Fatiha", "sourate La Vache",
  "\u0627\u0644\u0628\u0642\u0631\u0629", "\u0628\u0642\u0631\u0629",
  "\u0633\u0648\u0631\u0629 \u0627\u0644\u0628\u0642\u0631\u0629",
  "La Vache", "vache", "\u0633\u0648\u0631\u0629 \u0627\u0644\u0625\u062e\u0644\u0627\u0635",
  "\u0627\u0644\u0625\u062e\u0644\u0627\u0635", "Ikhlas", "Ya Sin", "caverne", "La Caverne",
  "Fatiha", "al-fatiha", "L'Ouverture", "ouverture", "mis\u00E9ricorde",
  "\u0627\u0644\u0631\u062D\u0645\u0646", "rahman", "Maryam", "Marie", "Yusuf", "Joseph",
  "No\u00E9", "An-Nas", "les hommes", "Al-Ikhlas", "Anfal", "butin",
  "\u0627\u0644\u062A\u0648\u0628\u0629", "repentir", "Nour", " Lumi\u00E8re ", "jumuah",
  "Fatima", "Bakara", "Baqara", "issas", "aa", "\u0642", "\u0635",
];
for (const q of probes) {
  const hits = findSurahByName(q);
  const label = hits.length === 1 ? `${hits[0]} ${byN.get(hits[0]).ar}/${byN.get(hits[0]).fr}` : hits.length ? "AMBIGUOUS " + hits.join(",") : "-";
  console.log(`   ${JSON.stringify(q).padEnd(24)} -> ${label}`);
}
