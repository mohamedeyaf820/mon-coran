let audioServicePromise = null;

export function loadAudioService() {
  if (!audioServicePromise) {
    audioServicePromise = import("./audioServiceEntry")
      .then(({ default: audioService }) => audioService)
      .catch((error) => {
        audioServicePromise = null;
        throw error;
      });
  }

  return audioServicePromise;
}
