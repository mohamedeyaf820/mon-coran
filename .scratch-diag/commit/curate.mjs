// Scratch commit helper. Not for commit.
// Builds a curated blob = HEAD content + ONLY the listed literal replacements,
// verifies each old string occurs exactly once in the HEAD baseline, prints the
// resulting HEAD->curated diff, and stages the blob in the index without
// touching the working tree.
// Usage: node .scratch-diag/commit/curate.mjs <plan.json> [--stage]
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const planPath = process.argv[2];
const stage = process.argv.includes("--stage");
if (!planPath) {
  console.error("usage: curate.mjs <plan.json> [--stage]");
  process.exit(2);
}
mkdirSync(".scratch-diag/commit/blobs", { recursive: true });
const plan = planPath.endsWith(".mjs")
  ? (await import(new URL(planPath, `file://${process.cwd()}/`)).then((m) => m.default))
  : JSON.parse(readFileSync(planPath, "utf8"));

for (const entry of plan.files) {
  const head = execFileSync("git", ["show", `HEAD:${entry.path}`], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  let out = head;
  for (const [i, pair] of entry.pairs.entries()) {
    const count = out.split(pair[0]).length - 1;
    if (count !== 1) {
      console.error(`REJECT ${entry.path} pair #${i}: old string occurs ${count}x\n  ${JSON.stringify(pair[0].slice(0, 90))}`);
      process.exit(1);
    }
    out = out.replace(pair[0], () => pair[1]);
  }
  const file = `.scratch-diag/commit/blobs/${entry.path.replaceAll("/", "__")}`;
  writeFileSync(file, out, { encoding: "utf8" });
  console.log(`\n===== ${entry.path} (${entry.pairs.length} replacements)`);
  if (head === out) console.log("  !! no change produced");
}
if (!stage) {
  console.log("\n(pas de staging — relancer avec --stage)");
  process.exit(0);
}
for (const entry of plan.files) {
  const file = `.scratch-diag/commit/blobs/${entry.path.replaceAll("/", "__")}`;
  const sha = execFileSync("git", ["hash-object", "-w", file], { encoding: "utf8" }).trim();
  execFileSync("git", ["update-index", "--cacheinfo", `100644,${sha},${entry.path}`]);
  console.log(`staged ${entry.path} -> ${sha.slice(0, 8)}`);
}
