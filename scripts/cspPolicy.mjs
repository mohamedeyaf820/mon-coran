export function buildCspPolicy(mode = "production") {
  const isDev = mode !== "production";
  const scriptSrc = isDev ? "'self' 'unsafe-inline'" : "'self'";
  const connectSrc = isDev
    ? "'self' https://api.alquran.cloud https://api.quran.com https://*.quran.com https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cdn.islamic.network https://everyayah.com https://audio.qurancdn.com https://verses.quran.com https://*.mp3quran.net https://ia800304.us.archive.org ws://localhost:* http://localhost:*"
    : "'self' https://api.alquran.cloud https://api.quran.com https://*.quran.com https://raw.githubusercontent.com https://cdn.jsdelivr.net https://cdn.islamic.network https://everyayah.com https://audio.qurancdn.com https://verses.quran.com https://*.mp3quran.net https://ia800304.us.archive.org";

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
    "style-src-attr 'unsafe-inline'",
    "font-src 'self' https://fonts.gstatic.com https://fonts.quranwbw.com https://quran.com https://*.quran.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com data:",
    "img-src 'self' data: blob: https:",
    `connect-src ${connectSrc}`,
    "media-src 'self' blob: https://cdn.islamic.network https://everyayah.com https://audio.qurancdn.com https://verses.quran.com https://*.mp3quran.net",
  ].join("; ");
}
