let _audioInstance = null;
let _warshFallbackNoticeShown = false;

export function resetWarshFallbackNotice() {
  _warshFallbackNoticeShown = false;
}

function activeRiwayaIsWarsh() {
  if (typeof document === "undefined") return false;
  const root = document.querySelector("[data-riwaya]");
  return root?.getAttribute("data-riwaya") === "warsh";
}

// The qurancdn /wbw/ library is keyed on Hafs surah/ayah/word numbers, so a
// Warsh word tap always recites the neighbouring Hafs recording. Keep the
// playback, but disclose once per session that it is not Warsh audio.
function notifyWarshWordAudioFallback() {
  if (_warshFallbackNoticeShown) return;
  _warshFallbackNoticeShown = true;
  Promise.all([import("../i18n/index.js"), import("../lib/utils.js")])
    .then(([{ t }, { toast }]) => {
      const lang = document.documentElement?.getAttribute("lang") || "fr";
      toast(t("errors.warshWordAudioHafs", lang), "info");
    })
    .catch(() => {});
}

function releaseAudioElement(audio) {
  if (!audio) return;
  try {
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
  } catch {
    // Best effort: the element may already be idle.
  }
}

// One shared element with error/ended handlers that release its decoder
// resources after each playback, so repeated word taps (including offline
// rejections) never accumulate media elements.
function getOrCreateAudio() {
  if (typeof window === "undefined" || typeof Audio === "undefined") return null;
  if (!_audioInstance) {
    _audioInstance = new Audio();
    _audioInstance.preload = "auto";
    const onSettled = () => releaseAudioElement(_audioInstance);
    _audioInstance.addEventListener("ended", onSettled);
    _audioInstance.addEventListener("error", onSettled);
    // The singleton must not outlive the page and keep a decoder alive.
    _onPageHide = () => releaseAudioElement(_audioInstance);
    window.addEventListener("pagehide", _onPageHide);
  }
  return _audioInstance;
}

let _onPageHide = null;

// Reset the shared instance so tests and long sessions start clean.
export function resetWordAudio() {
  releaseAudioElement(_audioInstance);
  if (_onPageHide && typeof window !== "undefined") {
    window.removeEventListener("pagehide", _onPageHide);
  }
  _onPageHide = null;
  _audioInstance = null;
}

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

  if (activeRiwayaIsWarsh()) notifyWarshWordAudioFallback();

  try {
    const audio = getOrCreateAudio();
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    audio.src = url;
    const promise = audio.play();
    if (promise !== undefined) {
      promise.catch(() => {
        // The initial play() was rejected (autoplay block, offline, or a
        // transient decode failure). Retry on the same shared element instead
        // of allocating a fresh Audio per failure, which used to accumulate
        // unreleased media elements offline.
        try {
          audio.currentTime = 0;
          const retry = audio.play();
          retry?.catch(() => {});
        } catch {
          // Swallow: word playback is best-effort.
        }
      });
    }
  } catch (err) {
    console.warn("Word audio playback failure:", err);
  }
}

