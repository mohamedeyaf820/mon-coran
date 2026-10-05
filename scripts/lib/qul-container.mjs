/**
 * Decode the container a QUL download actually arrives in.
 *
 * The "Download json" button does not return json. Depending on the resource
 * it returns a zip, a gzip stream or a brotli stream, all under a `.json`
 * name, so anything parsing these files has to look at the magic bytes instead
 * of trusting the extension.
 *
 * The zip reader is deliberately minimal. A zip library would add a dependency
 * to a repo that tracks its own bundle budget, and the single-file case is
 * small: the local file header is fixed width and deflate is already in zlib.
 * Multi-entry archives and zip64 are not handled, and fail loudly.
 */

import { readFileSync } from "node:fs";
import { brotliDecompressSync, gunzipSync, inflateRawSync, inflateSync } from "node:zlib";

const ZIP_SIG = 0x04034b50;

function readFirstJsonEntry(buf) {
  if (buf.length < 30 || buf.readUInt32LE(0) !== ZIP_SIG) return null;
  const method = buf.readUInt16LE(8);
  const compressedSize = buf.readUInt32LE(18);
  const nameLen = buf.readUInt16LE(26);
  const extraLen = buf.readUInt16LE(28);
  const start = 30 + nameLen + extraLen;
  const name = buf.toString("utf8", 30, 30 + nameLen);
  if (!/\.json$/i.test(name)) return null;
  const data = buf.subarray(start, start + compressedSize);
  if (method === 0) return { name, body: data };
  if (method === 8) return { name, body: inflateRawSync(data) };
  return null;
}

/** @returns {{ body: Buffer, encoding: string }} `encoding` names the container
 * that was unwrapped, so a manifest can record what was really fetched. */
export function decodeContainer(buf) {
  if (buf.length > 2 && buf[0] === 0x1f && buf[1] === 0x8b) {
    return { body: gunzipSync(buf), encoding: "gzip" };
  }
  if (buf[0] === 0x42 && buf[1] === 0x5a) {
    return { body: brotliDecompressSync(buf), encoding: "br" };
  }
  if (buf.length > 4 && buf.readUInt32LE(0) === ZIP_SIG) {
    const entry = readFirstJsonEntry(buf);
    if (entry) return { body: entry.body, encoding: `zip:${entry.name}` };
  }
  if (buf[0] === 0x78) {
    return { body: inflateSync(buf), encoding: "deflate" };
  }
  return { body: buf, encoding: "identity" };
}

/** Read a downloaded file and parse it, unwrapping the container if needed. */
export function readJsonFile(path) {
  const { body, encoding } = decodeContainer(readFileSync(path));
  try {
    return { data: JSON.parse(body.toString("utf8")), encoding };
  } catch (e) {
    throw new Error(`${path} is not valid JSON (${encoding}): ${e.message}`, { cause: e });
  }
}