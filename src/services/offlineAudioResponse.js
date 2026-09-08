/** Only complete, inspectable media can be advertised as downloaded. */
export async function verifyAudioResponse(response) {
  if (!response || response.status !== 200 || !response.ok) return null;
  const blob = await response.clone().blob();
  if (!blob.size) return null;
  const bytes = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  const ascii = String.fromCharCode(...bytes);
  const media = ascii.startsWith("ID3") ||
    (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) ||
    (ascii.startsWith("RIFF") && ascii.slice(8, 12) === "WAVE") ||
    ascii.startsWith("OggS") || ascii.slice(4, 8) === "ftyp";
  if (!media) return null;
  const headers = new Headers(response.headers);
  headers.delete("Content-Encoding");
  headers.delete("Content-Range");
  headers.set("Content-Length", String(blob.size));
  headers.set("X-Mushaf-Audio-Verified", "1");
  return new Response(blob, { status: 200, headers });
}

export function isVerifiedAudioResponse(response) {
  return response?.status === 200 && response.headers.get("X-Mushaf-Audio-Verified") === "1" && Number(response.headers.get("Content-Length")) > 0;
}

export async function fetchVerifiedAudio(url, signal) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener("abort", abort, { once: true });
  if (signal?.aborted) abort();
  const timer = setTimeout(abort, 120000);
  try {
    const response = await fetch(url, { mode: "cors", credentials: "omit", signal: controller.signal });
    return await verifyAudioResponse(response);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}
