const urls = [
  // per-ayah quranpedia (riwaya-numbered)
  "https://files.quranpedia.net/recitations/266/001001.mp3",
  "https://files.quranpedia.net/recitations/266/067001.mp3",
  "https://files.quranpedia.net/recitations/266/114006.mp3",
  "https://files.quranpedia.net/recitations/266/002253.mp3",
  // mp3quran surah streams
  "https://server9.mp3quran.net/omar_warsh/001.mp3",
  "https://server9.mp3quran.net/omar_warsh/067.mp3",
  "https://server9.mp3quran.net/omar_warsh/114.mp3",
  "https://server11.mp3quran.net/qari/067.mp3",
  "https://server11.mp3quran.net/qari/114.mp3",
  "https://server16.mp3quran.net/m_sayed/Rewayat-Warsh-A-n-Nafi/001.mp3",
  "https://server16.mp3quran.net/m_sayed/Rewayat-Warsh-A-n-Nafi/114.mp3",
  "https://server16.mp3quran.net/deban/Rewayat-Warsh-A-n-Nafi-Men-Tariq-Alazraq/001.mp3",
  "https://server16.mp3quran.net/deban/Rewayat-Warsh-A-n-Nafi-Men-Tariq-Alazraq/114.mp3",
  // timing zips (word-by-word) for future use
  "https://quranpedia.net/data/timings/168.zip",
  "https://quranpedia.net/data/timings/296.zip",
];
for (const u of urls) {
  try {
    const r = await fetch(u, { method: "HEAD", headers: { "user-agent": "MushafPlus/1.0" } });
    console.log(r.status, u, "|", r.headers.get("content-length") || "?", "B");
  } catch (e) { console.log("ERR", u, e.message); }
}
