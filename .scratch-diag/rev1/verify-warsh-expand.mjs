import SURAHS from "../../src/data/surahs.js";
import { getReciter } from "../../src/data/reciters.js";
import { buildSurahAudioPlaylist } from "../../src/utils/audioPlaylist.js";
import { normalizePlaylistAyahs } from "../../src/services/audioUrlBuilder.js";

const fileOf = (url) => url.match(/\/(\d{3})(\d{3})\.mp3$/)?.slice(1);
const EVERYAYAH = "Abu_Bakr_Ash-Shaatree_128kbps";
const buildUrl = (cdn, a) => `https://everyayah.com/data/${cdn}/${String(a.hafsNumber).padStart(3, "0")}`;

let problems = [];
let totalItems = 0, totalFiles = 0;
for (let s = 1; s <= 114; s++) {
  const hafsTotal = SURAHS[s - 1].ayahs;
  const raw = buildSurahAudioPlaylist(s, "warsh");
  const norm = normalizePlaylistAyahs(raw, "everyayah");
  totalItems += norm.length;
  const files = norm.map((x) => x.hafsNumber);
  const set = new Set(files);
  const expected = s === 1 ? hafsTotal - 1 : hafsTotal; // Al-Fatiha basmala has no numbered Warsh counterpart
  if (files.length !== set.size) problems.push(`s${s}: duplicate file`);
  if (set.size !== expected) problems.push(`s${s}: ${set.size} distinct files, expected ${expected} (raw items ${raw.length})`);
  for (const it of norm) {
    if (!(it.ayah >= 1 && it.ayah <= 122 + 164)) problems.push(`s${s}: bad warsh number ${it.ayah}`);
    if (it.number !== getHafsGlobal(s, it.hafsNumber)) problems.push(`s${s}:h${it.hafsNumber} global ${it.number}`);
  }
  totalFiles += set.size;
}
function getHafsGlobal(surah, h) {
  let start = 1;
  for (let i = 1; i < surah; i++) start += SURAHS[i - 1].ayahs;
  return start + h - 1;
}
console.log("everyayah warsh:", { totalItems, totalFiles, problems: problems.length });
console.log(problems.slice(0, 10).join("\n"));

// unchanged paths
const qp = getReciter("warsh_hussary", "warsh");
const s2q = normalizePlaylistAyahs(buildSurahAudioPlaylist(2, "warsh"), "quranpedia");
console.log("quranpedia s2 length", s2q.length, "(raw", buildSurahAudioPlaylist(2, "warsh").length, ")");
const hafs = normalizePlaylistAyahs(buildSurahAudioPlaylist(2, "hafs"), "everyayah");
console.log("hafs s2 length", hafs.length, "identity", hafs === buildSurahAudioPlaylist(2, "hafs") || "copy");
const stream = normalizePlaylistAyahs(buildSurahAudioPlaylist(2, "warsh"), "mp3quran-surah");
console.log("surah-stream length", stream.length);
// Al-Fatiha detail
console.log("s1 warsh raw:", buildSurahAudioPlaylist(1, "warsh").map((x) => `${x.ayah}->${x.hafsNumbers}`).join(" "));
console.log("s1 warsh norm:", normalizePlaylistAyahs(buildSurahAudioPlaylist(1, "warsh"), "everyayah").map((x) => `${x.ayah}->${x.hafsNumber}`).join(" "));
console.log("s2 warsh norm head:", normalizePlaylistAyahs(buildSurahAudioPlaylist(2, "warsh"), "everyayah").slice(0, 4).map((x) => `w${x.ayah}->h${x.hafsNumber}/g${x.number}`).join(" "));
