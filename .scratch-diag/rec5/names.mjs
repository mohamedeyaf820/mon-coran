import { foldSearchText } from "../../src/utils/searchIntelligence.js";
import SURAHS from "../../src/data/surahs.js";

const AR = /^\p{Script=Arabic}+$/u;
const KEYWORD_RE = /^(?:surah|sura|sourate|surate|سورة|سوره)s+/i;
const LATIN_ARTICLES = new Set(["al", "a", "az", "as", "ad", "ar", "ash", "au", "aw", "an", "the"]);
const FRENCH_ARTICLES = new Set(["la", "le", "les", "l", "un", "une", "des", "du"]);
const ALL = new Set([...LATIN_ARTICLES, ...FRENCH_ARTICLES]);

function loose(value) {
  return foldSearchText(String(value || ""))
    .replace(/['’]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function stripArticle(folded, script) {
  const articles = script === "latin" ? ALL : script === "arabic" ? new Set() : LATIN_ARTICLES;
  const words = folded.split(" ");
  if (words.length > 1 && articles.has(words[0])) return words.slice(1).join(" ");
  if (
    (script === "arabic" || script === "mixed") &&
    folded.startsWith("ال") &&
    folded.length > 3
  ) return folded.slice(2);
  return folded;
}
function scriptOf(value) {
  if (AR.test(value)) return "arabic";
  if (/\p{Script=Arabic}/u.test(value)) return "mixed";
  return "latin";
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
  if (exact && exact.size === 1) return [...exact];
  if (exact && exact.size > 1) return [...exact];
  const stripped = INDEX.get(stripArticle(trimmed, script)) || new Set();
  return [...stripped];
}

const collisions = [...INDEX].filter(([, s]) => s.size > 1);
console.log("index keys:", INDEX.size, "| colliding keys:", collisions.length);
for (const [k, s] of collisions) console.log("   COLLIDE", JSON.stringify(k), [...s].join(","));
const arAmbiguous = SURAHS.filter((s) => findSurahByName(s.ar).length !== 1).map((s) => `${s.n}:${s.ar}`);
const frAmbiguous = SURAHS.filter((s) => findSurahByName(s.fr).length !== 1).map((s) => `${s.n}:${s.fr}`);
const enAmbiguous = SURAHS.filter((s) => findSurahByName(s.en).length !== 1).map((s) => `${s.n}:${s.en}`);
console.log("ar names not uniquely reachable:", arAmbiguous.length, arAmbiguous.join(" "));
console.log("fr names not uniquely reachable:", frAmbiguous.length, frAmbiguous.join(" "));
console.log("en names not uniquely reachable:", enAmbiguous.length, enAmbiguous.join(" "));

const probes = [ "Nuh", "ta ha", "طه", "يس", "surate Marie", "sourate Yasin", "Al-Fatiha", "
  "البقرة", "بقرة", "sourate البقرة", "La Vache", "vache", "sourate La Vache", "سورة الإخلاص",
  "الإخلاص", "Ikhlas", "Ya Sin", "caverne", "La Caverne", "Fatiha", "al-fatiha", "L'Ouverture",
  "ouverture", "miséricorde", "الرحمن", "rahman", "Maryam", "Marie", "Yusuf", "Joseph", "Noé",
  "An-Nas", "les hommes", "Al-Ikhlas", "the cow", "Anfal", "butin", "التوبة", "repentir",
  "Nour", "lumière", "jumuah", "samedi", "Fatima", "Mariam", "Bakara", "Baqara", "issas",
];
const byN = new Map(SURAHS.map((s) => [s.n, s]));
for (const q of probes) {
  const hits = findSurahByName(q);
  console.log(`   ${JSON.stringify(q).padEnd(20)} -> ${hits.length === 1 ? `${hits[0]} ${byN.get(hits[0]).ar}/${byN.get(hits[0]).fr}` : hits.length ? "AMBIGUOUS " + hits.join(",") : "-"}`);
}
