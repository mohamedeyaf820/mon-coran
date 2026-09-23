// scratch: patch reciter-profiles.json — verified citation fixes only.
import { readFileSync, writeFileSync } from "node:fs";

const FILE = "public/data/reciter-profiles.json";
const TODAY = "2026-09-22";
const d = JSON.parse(readFileSync(FILE, "utf8"));

const set = (id, patch) => {
  if (!d[id]) throw new Error(`profil inconnu: ${id}`);
  Object.assign(d[id], patch);
};

// The visible "Sources vérifiées" link must land on a page that documents the
// reciter, not on a 300 kB API dump.
set("saad_almoqren", {
  bioSource: { provider: "MP3Quran", url: "https://www.mp3quran.net/saad" },
  reviewedAt: TODAY,
});
set("abdulbar_althubaity", {
  bioSource: { provider: "MP3Quran", url: "https://www.mp3quran.net/thubti" },
  reviewedAt: TODAY,
});
set("warsh_dagous", {
  bioSource: {
    provider: "QuranPedia",
    url: "https://quranpedia.net",
    apiUrl: "https://api.quranpedia.net/v1/reciters",
    record: 264,
  },
  reviewedAt: TODAY,
});
set("warsh_mohamed_abdulkarim", {
  bioSource: {
    provider: "QuranPedia",
    url: "https://quranpedia.net",
    apiUrl: "https://api.quranpedia.net/v1/reciters",
    record: 267,
  },
  reviewedAt: TODAY,
});
set("warsh_yassin", {
  verificationSources: [
    { provider: "MP3Quran", url: "https://www.mp3quran.net/qari" },
    { provider: "Assabile", url: "https://www.assabile.com/yassen-al-jazairi-37/yassen-al-jazairi.htm" },
  ],
  reviewedAt: TODAY,
});

writeFileSync(FILE, JSON.stringify(d, null, 2) + "\n", "utf8");
console.log("patché:", ["saad_almoqren", "abdulbar_althubaity", "warsh_dagous", "warsh_mohamed_abdulkarim", "warsh_yassin"].join(", "));
