let _audio = null;

export function playWordAudio(url) {
  if (!url) return;
  try {
    if (_audio) { _audio.pause(); _audio.src = ''; }
    _audio = new Audio(url);
    _audio.play().catch(() => {});
  } catch {}
}
