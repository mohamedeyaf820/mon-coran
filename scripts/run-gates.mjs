/**
 * Whole-chain gate runner.
 *
 * `build:ci` used to chain every check with `&&`, so the first failing gate
 * aborted the rest: a bundle-budget overrun silently hid the CSS-architecture
 * and security-header results, which are exactly the gates you need when the
 * build is already red. Each gate still decides pass/fail the same way; here we
 * only make sure they all get to report.
 */

import { spawnSync } from "node:child_process";

const GATES = [
  { name: "seo-output", args: ["scripts/check-seo-output.mjs"] },
  { name: "performance", args: ["scripts/audit-performance.mjs"] },
  { name: "screen-budget", args: ["scripts/check-screen-budget.mjs"] },
  { name: "bundle-budget", args: ["scripts/check-bundle-budget.mjs"] },
  { name: "css-architecture", args: ["scripts/audit-css-architecture.mjs", "--check"] },
  { name: "security-headers", args: ["scripts/check-security-headers.mjs"] },
];

const results = [];
for (const gate of GATES) {
  const run = spawnSync(process.execPath, gate.args, { stdio: "inherit" });
  results.push({ name: gate.name, code: run.status ?? 1 });
}

const failed = results.filter((r) => r.code !== 0);
console.log("\n[gates] " + results.map((r) => `${r.name}:${r.code === 0 ? "OK" : "FAIL(" + r.code + ")"}`).join("  "));
if (failed.length) {
  console.error(`[gates] ${failed.length}/${results.length} gate(s) failed: ${failed.map((f) => f.name).join(", ")}`);
  process.exit(1);
}
console.log(`[gates] all ${results.length} gates passed`);
