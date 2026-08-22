let _audio = null;

export function getWordAudioUrl(surah, ayah, wordPosition) {
  if (!surah || !ayah || !wordPosition) return null;
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  const w = String(wordPosition).padStart(3, "0");
  return `https://audio.qurancdn.com/wbw/${s}_${a}_${w}.mp3`;
}

export function playWordAudio(input, ayah = null, wordPosition = null) {
  let url = null;
  if (typeof input === "string" && input.startsWith("http")) {
    url = input;
  } else if (typeof input === "string" && input.includes(":")) {
    const parts = input.split(":").map(Number);
    if (parts.length >= 3) {
      url = getWordAudioUrl(parts[0], parts[1], parts[2]);
    }
  } else if (typeof input === "number" && ayah && wordPosition) {
    url = getWordAudioUrl(input, ayah, wordPosition);
  } else if (input && typeof input === "object") {
    url = input.audioUrl || getWordAudioUrl(input.surah, input.ayah, input.position);
  }

  if (!url) return;
  try {
    if (_audio) {
      _audio.pause();
      _audio.currentTime = 0;
      _audio.src = "";
    }
    _audio = new Audio(url);
    _audio.play().catch(() => {});
  } catch {}
}

