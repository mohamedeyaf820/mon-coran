// scratch: tiny static server with SPA fallback. Usage: node .scratch-diag/serve.mjs <dir> <port>
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = process.argv[2] || "dist";
const port = Number(process.argv[3] || 4294);
const TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".mjs": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain",
  ".mp3": "audio/mpeg",
  ".webmanifest": "application/manifest+json",
};

createServer(async (req, res) => {
  try {
    const url = decodeURIComponent(new URL(req.url, "http://x").pathname);
    let p = normalize(join(root, url));
    if (p.includes("..")) throw new Error("escape");
    let buf;
    try {
      buf = await readFile(p);
    } catch {
      buf = await readFile(join(root, "index.html"));
      p = join(root, "index.html");
    }
    res.writeHead(200, {
      "content-type": TYPES[extname(p).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(buf);
  } catch (e) {
    res.writeHead(500).end(String(e.message));
  }
}).listen(port, "127.0.0.1", () => console.log("serving", root, "on", port));
