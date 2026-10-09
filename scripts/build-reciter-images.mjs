/**
 * Build the local reciter portrait set.
 *
 * The catalogue hot-linked third-party photographs for avatars rendered at
 * 45-96 px: 28 of the 39 distinct files were over 60 kB, one was 451 kB, and
 * the audio hub pulled roughly 3 MB of images on a phone. This script fetches
 * each source once, crops it to a square around the reciter's own focus point,
 * and writes a 256 px WebP per reciter under public/images/reciters/, then
 * regenerates src/data/reciterPortraits.js with the file, its provenance and
 * the bytes it cost.
 *
 * The generated module is committed: it is the attribution record for every
 * face the app shows, and it keeps the portraits working offline.
 *
 * Usage: node scripts/build-reciter-images.mjs [--force] [--only=id1,id2]
 */
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";

import {
  RECITER_PHOTOS_MAP,
  getSourcePhotoFocus,
  getReciterPortraitSource,
} from "../src/data/reciters.js";

const pexec = promisify(execFile);

const SIDE = 256;
const QUALITY = 0.72;
const OUT_DIR = "public/images/reciters";
const SRC_DIR = ".cache/reciter-src";
const MANIFEST = "src/data/reciterPortraits.js";

const argv = process.argv.slice(2).reduce((acc, raw) => {
  const match = raw.match(/^--(\w+)(?:=(.*))?$/);
  if (match) acc[match[1]] = match[2] ?? true;
  return acc;
}, {});
const only = argv.only ? String(argv.only).split(",") : null;

async function download(url) {
  const name = createHash("sha1").update(url).digest("hex").slice(0, 16);
  const extension = url.match(/\.(jpe?g|png|webp)(?:$|[?#])/i)?.[0] || ".bin";
  const file = `${SRC_DIR}/${name}${extension.toLowerCase()}`;
  if (existsSync(file) && !argv.force) return file;
  const { stdout } = await pexec("curl", [
    "-sS", "-L", "--max-time", "40",
    "-A", "Mozilla/5.0 (MushafPlus reciter portrait build)",
    "-o", file, "-w", "%{http_code}\t%{content_type}", url,
  ]);
  const [status, type] = stdout.split("\t");
  if (status !== "200" || !/^image\//.test(type)) {
    throw new Error(`${url} → HTTP ${status} ${type}`);
  }
  return file;
}

/**
 * Square crop centred on the CSS object-position the app already used, so the
 * local file frames the face exactly like the remote one did.
 */
function cropOffset(width, height, focus) {
  const [xs = "50%", ys = "50%"] = String(focus).trim().split(/\s+/);
  const side = Math.min(width, height);
  const fx = Number.parseFloat(xs) / 100;
  const fy = Number.parseFloat(ys) / 100;
  return {
    side,
    x: Math.max(0, Math.round((width - side) * (Number.isFinite(fx) ? fx : 0.5))),
    y: Math.max(0, Math.round((height - side) * (Number.isFinite(fy) ? fy : 0.5))),
  };
}

function sniffMime(bytes, url) {
  const head = bytes.subarray(0, 12);
  if (head.toString("latin1", 0, 4) === "RIFF" && head.toString("latin1", 8, 12) === "WEBP") {
    return "image/webp";
  }
  if (head.toString("hex", 0, 8) === "89504e470d0a1a0a") return "image/png";
  if (head.toString("hex", 0, 3) === "ffd8ff") return "image/jpeg";
  throw new Error(`${url}: not a decodable image (${head.toString("hex", 0, 8)})`);
}

const ids = Object.keys(RECITER_PHOTOS_MAP).filter((id) => !only || only.includes(id));mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(SRC_DIR, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: SIDE, height: SIDE } });
await page.goto("about:blank");

// A --only run refreshes those portraits and keeps the rest of the record.
let manifest = {};
if (only && existsSync(MANIFEST)) {
  manifest = { ...(await import(`../${MANIFEST}`)).RECITER_PORTRAITS };
}
const report = [];

for (const id of ids) {
  const url = RECITER_PHOTOS_MAP[id];
  const file = await download(url);
  const sourceBytes = readFileSync(file);
  // Sniffed from the bytes, not the URL suffix: a mislabelled download would
  // otherwise decode as a blank canvas and ship an empty portrait.
  const local = `data:${sniffMime(sourceBytes, url)};base64,${sourceBytes.toString("base64")}`;
  const focus = getSourcePhotoFocus(id);
  const [naturalWidth, naturalHeight] = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  }, local);
  if (!naturalWidth || !naturalHeight) {
    throw new Error(`${url}: decoded to ${naturalWidth}x${naturalHeight}`);
  }
  const { side, x, y } = cropOffset(naturalWidth, naturalHeight, focus);
  const dataUrl = await page.evaluate(
    async ({ src, x, y, side, target, quality }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = target;
      canvas.height = target;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, x, y, side, side, 0, 0, target, target);
      return canvas.toDataURL("image/webp", quality);
    },
    { src: local, x, y, side, target: SIDE, quality: QUALITY },
  );

  const webp = Buffer.from(dataUrl.split(",")[1], "base64");
  const path = `${OUT_DIR}/${id}.webp`;
  writeFileSync(path, webp);
  const attribution = getReciterPortraitSource(id);
  if (!attribution) throw new Error(`${id}: no portrait source recorded`);
  manifest[id] = {
    src: `/images/reciters/${id}.webp`,
    provider: attribution.provider,
    sourcePage: attribution.url,
    sourceUrl: url,
    bytes: webp.byteLength,
  };
  report.push({
    id,
    kB: +(webp.byteLength / 1024).toFixed(1),
    crop: `${side}px @${x},${y}`,
    bytes: webp.byteLength,
  });
}

await browser.close();

const total = Object.values(manifest).reduce((sum, entry) => sum + entry.bytes, 0);
writeFileSync(
  MANIFEST,
  `/**
 * Generated by scripts/build-reciter-images.mjs — do not edit by hand.
 * ${Object.keys(manifest).length} local portraits, ${(total / 1024).toFixed(0)} kB total,
 * each ${SIDE}px WebP. Every entry keeps the page that names the reciter so a
 * face can be re-checked against its source.
 */

export const RECITER_PORTRAITS = ${JSON.stringify(manifest, null, 2)};
`,
  "utf8",
);

console.table(report.slice(0, 12));
const runBytes = report.reduce((sum, row) => sum + row.bytes, 0);
console.log(
  `${report.length} portraits écrits (${(runBytes / 1024).toFixed(0)} kB, moyenne ${(runBytes / report.length / 1024).toFixed(1)} kB) · ${
    Object.keys(manifest).length
  } dans ${MANIFEST} · total ${(total / 1024).toFixed(0)} kB`,
);
