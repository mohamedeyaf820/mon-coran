import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { buildRootSecurityHeaders } from "./securityHeaders.mjs";

function readNetlifyRootHeaders(source) {
  const blocks = source.split(/\[\[headers\]\]/g).slice(1);
  const root = blocks.find((block) => /^\s*for\s*=\s*"\/\*"/m.test(block));
  if (!root) return {};
  return Object.fromEntries(
    [...root.matchAll(/^\s*([A-Za-z0-9-]+)\s*=\s*"([^"]*)"\s*$/gm)]
      .filter((match) => match[1] !== "for")
      .map((match) => [match[1], match[2]]),
  );
}

function readVercelRootHeaders(source) {
  const config = JSON.parse(source);
  const root = config.headers?.find((entry) => entry.source === "/(.*)");
  return Object.fromEntries(
    (root?.headers || []).map((header) => [header.key, header.value]),
  );
}

function readCloudflareRootHeaders(source) {
  const lines = source.split(/\r?\n/);
  const start = lines.findIndex((line) => line.trim() === "/*");
  const headers = {};
  for (let i = start + 1; start >= 0 && i < lines.length; i += 1) {
    if (lines[i] && !/^\s/.test(lines[i])) break;
    const match = lines[i].match(/^\s+([A-Za-z0-9-]+):\s*(.*)$/);
    if (match) headers[match[1]] = match[2].trim();
  }
  return headers;
}

function compareHeaders(provider, actual, expected) {
  const errors = [];
  for (const [name, value] of Object.entries(expected)) {
    if (actual[name] !== value) {
      errors.push(`${provider}: ${name} differs from the centralized policy`);
    }
  }
  for (const name of Object.keys(actual)) {
    if (!(name in expected)) {
      errors.push(`${provider}: unexpected root header ${name}`);
    }
  }
  return errors;
}

export function auditDeploymentSecurityHeaders() {
  const expected = buildRootSecurityHeaders("production");
  const netlify = readNetlifyRootHeaders(readFileSync("netlify.toml", "utf8"));
  const vercel = readVercelRootHeaders(readFileSync("vercel.json", "utf8"));
  const cloudflare = readCloudflareRootHeaders(
    readFileSync("public/_headers", "utf8"),
  );
  return [
    ...compareHeaders("Cloudflare", cloudflare, expected),
    ...compareHeaders("Netlify", netlify, expected),
    ...compareHeaders("Vercel", vercel, expected),
  ];
}

if (pathToFileURL(process.argv[1]).href === import.meta.url) {
  const errors = auditDeploymentSecurityHeaders();
  if (errors.length) {
    console.error(errors.join("\n"));
    process.exitCode = 1;
  } else {
    console.log("Security headers: Cloudflare, Netlify and Vercel match the centralized policy.");
  }
}
