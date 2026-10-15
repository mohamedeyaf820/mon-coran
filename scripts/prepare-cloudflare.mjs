// Cloudflare rejects the Netlify-style `_redirects` (SPA rewrites read as loops, 404 status
// unsupported). The SPA fallback is handled by `not_found_handling` in wrangler.jsonc, so
// deploy a copy of dist/ without that file.
import { cpSync, rmSync } from "node:fs";

rmSync("dist-cloudflare", { recursive: true, force: true });
cpSync("dist", "dist-cloudflare", {
  recursive: true,
  filter: (src) => !src.replaceAll("\\", "/").endsWith("dist/_redirects"),
});
console.log("dist-cloudflare ready");
