// scratch: which raw files still show the home toolbar "Audio" tab clip
import { readFileSync, readdirSync } from "node:fs";
const dir = ".scratch-diag/resp";
for (const f of readdirSync(dir).filter((x) => x.startsWith("raw") && x.endsWith(".json"))) {
  const r = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
  const hits = [];
  for (const x of r) {
    for (const c of x.clipped || []) {
      if (c.ellipsis || c.axis === "y") continue;
      if (/relative\.flex\.items-center|settings-segmented__item|qc-list-card__reference|reciter-card__name/.test(c.el))
        hits.push(`${x.profile} ${x.view} @${x.w} -${c.lost}px ${c.el.slice(0, 46)} ${c.text || ""}`);
    }
  }
  console.log(`== ${f}  ${hits.length ? "\n  " + hits.join("\n  ") : "none"}`);
}
