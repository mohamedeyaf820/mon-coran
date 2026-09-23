import {
  buildAudioPlaylistForSurahs,
  expandAyahsToAudioFiles,
} from "../../src/utils/audioPlaylist.js";
import {
  buildUrlCandidates,
  normalizePlaylistAyahs,
  buildPlaylistSignature,
  withQuranComPrimary,
} from "../../src/services/audioUrlBuilder.js";

const all = [];
for (let i = 1; i <= 114; i++) all.push(i);

const time = (label, fn) => {
  const t = performance.now();
  const out = fn();
  console.log(label, +(performance.now() - t).toFixed(1) + "ms");
  return out;
};

const warsh = await time("build 6236 items", () =>
  buildAudioPlaylistForSurahs(all, "warsh"),
);
const expanded = time("expand", () => expandAyahsToAudioFiles(warsh, "everyayah"));
const prepared = time("normalize", () => normalizePlaylistAyahs(expanded, "everyayah"));
const sig = time("signature", () => buildPlaylistSignature(prepared, "ar.alafasy", "everyayah"));
const playlist = time("url candidates", () =>
  prepared.map((a) => {
    const urls = withQuranComPrimary(buildUrlCandidates("ar.alafasy", a, "everyayah"), null);
    return { surah: a.surah, ayah: a.ayah, urls, url: urls[0] };
  }),
);
const clones = time("source clones", () => warsh.map((a) => ({ ...a })));

console.log(
  JSON.stringify({
    warsh: warsh.length,
    expanded: expanded.length,
    prepared: prepared.length,
    sigKB: +(sig.length / 1024).toFixed(1),
    urls: playlist.reduce((n, p) => n + p.urls.length, 0),
    playlistKB: +(JSON.stringify(playlist).length / 1024).toFixed(1),
    itemKB: +(JSON.stringify(warsh[500]).length / 1024).toFixed(2),
    clonesKB: +(JSON.stringify(clones).length / 1024).toFixed(1),
  }),
);
