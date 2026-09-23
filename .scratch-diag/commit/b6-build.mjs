// scratch: build batch-6 blobs = HEAD content + only my edits
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const head = (p) => execFileSync("git", ["show", `HEAD:${p}`], { encoding: "buffer", maxBuffer: 64e6 }).toString("utf8");

const jobs = [
  {
    path: "src/styles/mushaf-page-polish.css",
    out: ".scratch-diag/commit/mp6-patched.css",
    reps: [
      [
        "  color: #d8c9a7 !important;\n  font-size: 0.54rem;\n",
        "  color: #d8c9a7 !important;\n  /* Rem-only scales fell to 8.1px on a phone (root is 15px while reading). */\n  font-size: clamp(max(0.62rem, 10px), 0.6rem + 0.12vw, 0.72rem);\n",
      ],
      [
        "  font-size: clamp(0.48rem, 0.4rem + 0.15vw, 0.6rem) !important;\n",
        "  /* Measured 7.2px on a phone: the reading root font-size is 15px, so this\n     rem-only clamp fell under the app's 10px legibility floor. */\n  font-size: clamp(max(0.62rem, 10px), 0.6rem + 0.12vw, 0.72rem) !important;\n",
      ],
    ],
  },
  {
    path: "src/styles/settings-enhanced.css",
    out: ".scratch-diag/commit/se6-patched.css",
    reps: [
      [
        "    text-align: center !important;\n  }\n}\n",
        "    text-align: center !important;\n  }\n}\n\n/* Four columns leave ~56-66px per tab on a narrow phone, which is shorter than\n   \"Confidentialité\" at the 10px floor: the label ellipsised and the tab became\n   unreadable. Two rows give every label its natural width; the sheet already\n   scrolls its body, so the extra strip height costs nothing reachable. */\n@media (max-width: 340px) {\n  .settings-qurancom .settings-drawer__tabs {\n    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;\n    min-height: 0 !important;\n    max-height: none !important;\n  }\n}\n",
      ],
    ],
  },
];

for (const j of jobs) {
  const nl = (() => {
    const w = readFileSync(j.path, "utf8");
    return w.includes("\r\n") ? "\r\n" : "\n";
  })();
  let s = head(j.path);
  const baseNl = s.includes("\r\n") ? "\r\n" : "\n";
  for (const [from, to] of j.reps) {
    const f = from.replaceAll("\n", baseNl);
    const t = to.replaceAll("\n", baseNl);
    const n = s.split(f).length - 1;
    if (n !== 1) throw new Error(`${j.path}: count ${n} for ${from.slice(0, 40)}`);
    s = s.replace(f, t);
  }
  writeFileSync(j.out, s, "utf8");
  writeFileSync(j.out + ".base", head(j.path), "utf8");
  console.log("built", j.out, "eol:", baseNl === "\r\n" ? "crlf" : "lf", "worktree eol:", nl === "\r\n" ? "crlf" : "lf");
}
