import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

/* Security headers are declared twice (Netlify and Vercel). A drift would leave
   one host with a weaker policy, so both must carry the same values. */

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), "utf8");

function netlifyCatchAll() {
  const block = read("netlify.toml").split("[[headers]]").find((part) => /for = "\/\*"/.test(part));
  assert.ok(block, "netlify.toml needs a /* header block");
  return Object.fromEntries([...block.matchAll(/^\s+([A-Za-z-]+) = "(.*)"$/gm)].map(([, key, value]) => [key, value]));
}

function vercelCatchAll() {
  const rule = JSON.parse(read("vercel.json")).headers.find((entry) => entry.source === "/(.*)");
  assert.ok(rule, "vercel.json needs a /(.*) header rule");
  return Object.fromEntries(rule.headers.map(({ key, value }) => [key, value]));
}

test("Netlify and Vercel serve the same security headers", () => {
  const netlify = netlifyCatchAll();
  const vercel = vercelCatchAll();
  for (const name of [
    "Content-Security-Policy", "Strict-Transport-Security", "X-Frame-Options",
    "X-Content-Type-Options", "Referrer-Policy", "Permissions-Policy", "Cross-Origin-Opener-Policy",
  ]) {
    assert.ok(netlify[name], `netlify.toml lacks ${name}`);
    assert.equal(netlify[name], vercel[name], `${name} differs between netlify.toml and vercel.json`);
  }
});
