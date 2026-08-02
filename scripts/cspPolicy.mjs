export function buildCspPolicy(mode = "production") {
  const isDev = mode !== "production";
  
  // Dev tooling needs eval for source maps/HMR. Production does not.
  const scriptSrc = isDev 
    ? "'self' 'unsafe-inline' 'unsafe-eval'" 
    : "'self'";
  
  // Connect sources - API endpoints and CDNs
  const connectSrc = isDev
    ? "'self' https://api.alquran.cloud https://api.quran.com https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cdn.islamic.network https://everyayah.com https://audio.qurancdn.com https://verses.quran.com https://*.mp3quran.net https://download.quranicaudio.com ws://localhost:* http://localhost:*"
    : "'self' https://api.alquran.cloud https://api.quran.com https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cdn.islamic.network https://everyayah.com https://audio.qurancdn.com https://verses.quran.com https://*.mp3quran.net https://download.quranicaudio.com";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSrc}`,
    `script-src-elem ${scriptSrc}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com https://verses.quran.foundation https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://static.qurancdn.com https://static-cdn.tarteel.ai",
    "img-src 'self' data: blob: https://static.qurancdn.com https://static.quran.com https://cdn.islamic.network https://www.assabile.com https://storage.googleapis.com https://static.suratmp3.com https://surahquran.com",
    `connect-src ${connectSrc}`,
    "media-src 'self' blob: https://cdn.islamic.network https://everyayah.com https://audio.qurancdn.com https://verses.quran.com https://*.mp3quran.net https://download.quranicaudio.com",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    isDev ? "" : "upgrade-insecure-requests",
  ].filter(Boolean).join("; ");
}
